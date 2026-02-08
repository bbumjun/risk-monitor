import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  results.env = {
    FRED_API_KEY: process.env.FRED_API_KEY ? `${process.env.FRED_API_KEY.slice(0, 4)}...${process.env.FRED_API_KEY.slice(-4)} (len=${process.env.FRED_API_KEY.length})` : "MISSING",
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
    SUPABASE_ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
    SUPABASE_SERVICE: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
    CRON_SECRET: process.env.CRON_SECRET ? `len=${process.env.CRON_SECRET.length}` : "MISSING",
  };

  try {
    const yahooRes = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }
    );
    if (yahooRes.ok) {
      const data = await yahooRes.json();
      const meta = data?.chart?.result?.[0]?.meta;
      results.yahoo_vix = {
        status: yahooRes.status,
        price: meta?.regularMarketPrice,
        symbol: meta?.symbol,
      };
    } else {
      const body = await yahooRes.text().catch(() => "");
      results.yahoo_vix = {
        status: yahooRes.status,
        statusText: yahooRes.statusText,
        body: body.slice(0, 500),
      };
    }
  } catch (e) {
    results.yahoo_vix = { error: e instanceof Error ? e.message : String(e) };
  }

  const fredKey = process.env.FRED_API_KEY;
  if (fredKey) {
    try {
      const fredRes = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=BAMLH0A0HYM2&api_key=${fredKey}&file_type=json&sort_order=desc&limit=1`
      );
      if (fredRes.ok) {
        const data = await fredRes.json();
        results.fred_hyoas = {
          status: fredRes.status,
          observation: data?.observations?.[0],
        };
      } else {
        const body = await fredRes.text().catch(() => "");
        results.fred_hyoas = {
          status: fredRes.status,
          statusText: fredRes.statusText,
          body: body.slice(0, 500),
        };
      }
    } catch (e) {
      results.fred_hyoas = { error: e instanceof Error ? e.message : String(e) };
    }
  } else {
    results.fred_hyoas = { error: "No FRED_API_KEY" };
  }

  return NextResponse.json(results, { status: 200 });
}
