import { NextRequest, NextResponse } from "next/server";
import { getCompositeHistory } from "@/lib/db/queries";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 365;

    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        { error: "Invalid days parameter" },
        { status: 400 }
      );
    }

    const history = await getCompositeHistory(days);

    const snapshots = history.map((row) => ({
      score: row.score,
      status: row.status,
      timestamp: row.timestamp,
      breakdown: row.breakdown,
    }));

    return NextResponse.json(snapshots, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Failed to fetch composite history:", error);
    return NextResponse.json(
      { error: "Failed to fetch composite history" },
      { status: 500 }
    );
  }
}
