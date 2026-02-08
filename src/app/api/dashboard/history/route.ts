import { NextRequest, NextResponse } from "next/server";
import { getIndicatorHistory } from "@/lib/db/queries";
import { INDICATORS } from "@/data/indicators";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const indicator = searchParams.get("indicator");
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 365;

    if (!indicator) {
      return NextResponse.json(
        { error: "Missing required parameter: indicator" },
        { status: 400 }
      );
    }

    const indicatorDef = INDICATORS.find((ind) => ind.id === indicator);
    if (!indicatorDef) {
      return NextResponse.json(
        { error: `Invalid indicator: ${indicator}` },
        { status: 400 }
      );
    }

    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        { error: "Invalid days parameter" },
        { status: 400 }
      );
    }

    const history = await getIndicatorHistory(indicator, days);

    const snapshots = history.map((row) => ({
      indicatorId: row.indicator_id,
      value: row.value,
      normalizedRisk: row.normalized_risk,
      status: row.status,
      timestamp: row.timestamp,
    }));

    return NextResponse.json(snapshots, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Failed to fetch indicator history:", error);
    return NextResponse.json(
      { error: "Failed to fetch indicator history" },
      { status: 500 }
    );
  }
}
