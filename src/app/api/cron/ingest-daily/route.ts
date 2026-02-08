import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingestion/pipeline";
import { upsertSnapshot, upsertComposite, logIngestionRun } from "@/lib/db/queries";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("Authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  try {
    const result = await runIngestion();

    for (const snapshot of result.snapshots) {
      try {
        await upsertSnapshot({
          indicatorId: snapshot.indicatorId,
          value: snapshot.value,
          normalizedRisk: snapshot.normalizedRisk,
          status: snapshot.status,
          timestamp: snapshot.timestamp,
        });
      } catch (error) {
        console.error(`Failed to upsert snapshot for ${snapshot.indicatorId}:`, error);
        result.errors.push({
          indicatorId: snapshot.indicatorId,
          error: `Database upsert failed: ${String(error)}`,
        });
      }
    }

    try {
      await upsertComposite({
        score: result.composite.score,
        status: result.composite.status,
        breakdown: result.composite.breakdown,
        timestamp: result.timestamp,
      });
    } catch (error) {
      console.error("Failed to upsert composite:", error);
      result.errors.push({
        indicatorId: "composite",
        error: `Composite upsert failed: ${String(error)}`,
      });
    }

    const completedAt = new Date().toISOString();

    try {
      await logIngestionRun({
        startedAt,
        completedAt,
        status: result.errors.length > 0 ? "partial" : "success",
        indicatorsUpdated: result.snapshots.length,
        errors: result.errors,
      });
    } catch (error) {
      console.error("Failed to log ingestion run:", error);
    }

    return NextResponse.json({
      success: true,
      timestamp: result.timestamp,
      indicatorsUpdated: result.snapshots.length,
      indicatorIds: result.snapshots.map((s) => s.indicatorId),
      errors: result.errors,
      compositeScore: result.composite.score,
    }, { status: 200 });
  } catch (error) {
    const completedAt = new Date().toISOString();

    try {
      await logIngestionRun({
        startedAt,
        completedAt,
        status: "failed",
        indicatorsUpdated: 0,
        errors: [{ error: String(error) }],
      });
    } catch (logError) {
      console.error("Failed to log ingestion run:", logError);
    }

    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
