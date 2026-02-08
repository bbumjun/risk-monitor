import { NextResponse } from "next/server";
import { getLatestSnapshots } from "@/lib/db/queries";
import { INDICATORS } from "@/data/indicators";
import { CATEGORY_LABELS, type DashboardData, type IndicatorCategory, type IndicatorWithSnapshot } from "@/types/indicator";
import { calculateCompositeScore } from "@/lib/risk/composite";

export async function GET(): Promise<NextResponse> {
  try {
    const latestSnapshots = await getLatestSnapshots();

    const snapshotMap = new Map(
      latestSnapshots.map((row) => [
        row.indicator_id,
        {
          indicatorId: row.indicator_id,
          value: row.value,
          normalizedRisk: row.normalized_risk,
          status: row.status,
          timestamp: row.timestamp,
        },
      ])
    );

    const indicatorsWithSnapshots: IndicatorWithSnapshot[] = INDICATORS.map((indicator) => ({
      ...indicator,
      snapshot: snapshotMap.get(indicator.id) || null,
    }));

    const categoryMap = new Map<IndicatorCategory, IndicatorWithSnapshot[]>();
    for (const indicator of indicatorsWithSnapshots) {
      const existing = categoryMap.get(indicator.category) || [];
      existing.push(indicator);
      categoryMap.set(indicator.category, existing);
    }

    const validSnapshots = Array.from(snapshotMap.values());
    const latestTimestamp = validSnapshots.length > 0
      ? validSnapshots.reduce((latest, snap) => snap.timestamp > latest ? snap.timestamp : latest, validSnapshots[0].timestamp)
      : new Date().toISOString();

    const composite = validSnapshots.length > 0
      ? calculateCompositeScore(validSnapshots, latestTimestamp)
      : { score: 0, status: "normal" as const, timestamp: latestTimestamp, breakdown: [] };

    const categories = Array.from(categoryMap.entries()).map(([category, indicators]) => {
      const categorySnapshots = indicators
        .map((ind) => ind.snapshot)
        .filter((snap) => snap !== null);

      const averageRisk = categorySnapshots.length > 0
        ? categorySnapshots.reduce((sum, snap) => sum + snap.normalizedRisk, 0) / categorySnapshots.length
        : 0;

      return {
        category,
        label: CATEGORY_LABELS[category],
        averageRisk,
        indicators,
      };
    });

    const dashboardData: DashboardData = {
      compositeScore: composite.score,
      compositeStatus: composite.status,
      updatedAt: latestTimestamp,
      categories,
    };

    return NextResponse.json(dashboardData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
