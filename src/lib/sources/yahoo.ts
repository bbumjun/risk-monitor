/**
 * Yahoo Finance data source — direct v8 chart API fetch.
 *
 * Uses https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
 * instead of the yahoo-finance2 npm package, which fails on Vercel
 * serverless due to cookie/crumb persistence issues.
 */

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ─── Types ───────────────────────────────────────────────────────────

export interface YahooQuote {
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  twoHundredDayAverage: number;
}

export interface SP500StockData {
  symbol: string;
  price: number;
  twoHundredDayAverage: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  change: number;
  volume: number;
  averageVolume: number;
}

/** Shape returned by Yahoo v8 chart API → chart.result[0].meta */
interface ChartMeta {
  symbol?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  twoHundredDayAverage?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
}

interface ChartQuoteIndicator {
  open?: (number | null)[];
  high?: (number | null)[];
  low?: (number | null)[];
  close?: (number | null)[];
  volume?: (number | null)[];
}

interface ChartResult {
  meta: ChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: ChartQuoteIndicator[];
  };
}

interface ChartResponse {
  chart: {
    result?: ChartResult[] | null;
    error?: { code: string; description: string } | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

export const yahooLogs: string[] = [];

async function fetchChart(
  symbol: string,
  params: Record<string, string> = {}
): Promise<ChartResult | null> {
  const url = new URL(`${YAHOO_BASE}/${encodeURIComponent(symbol)}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const startMs = Date.now();
  const log = (msg: string) => { console.log(msg); yahooLogs.push(msg); };

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(url.toString(), {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startMs;

      if (response.status === 429) {
        const waitMs = Math.min(2000 * Math.pow(2, attempt), 10_000);
        log(`[yahoo] 429 for ${symbol}, retry ${attempt + 1}/3 after ${waitMs}ms`);
        await delay(waitMs);
        continue;
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "(unreadable)");
        log(`[yahoo] HTTP ${response.status} for ${symbol} (${elapsed}ms): ${body.slice(0, 200)}`);
        return null;
      }

      const data: ChartResponse = await response.json();

      if (data.chart.error) {
        log(`[yahoo] API error for ${symbol} (${elapsed}ms): ${data.chart.error.code} — ${data.chart.error.description}`);
        return null;
      }

      if (!data.chart.result || data.chart.result.length === 0) {
        log(`[yahoo] No result for ${symbol} (${elapsed}ms)`);
        return null;
      }

      return data.chart.result[0];
    } catch (error) {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startMs;
      if (error instanceof Error && error.name === "AbortError") {
        log(`[yahoo] Timeout ${symbol} after ${elapsed}ms`);
      } else {
        const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        log(`[yahoo] FAILED ${symbol} (${elapsed}ms): ${msg}`);
      }
      return null;
    }
  }

  log(`[yahoo] Exhausted retries for ${symbol}`);
  return null;
}

function getPreviousClose(meta: ChartMeta): number | undefined {
  return meta.chartPreviousClose ?? meta.previousClose;
}

// ─── Public API ──────────────────────────────────────────────────────

export async function fetchPrice(symbol: string): Promise<number | null> {
  const result = await fetchChart(symbol, { interval: "1d", range: "1d" });
  if (!result) return null;
  return result.meta.regularMarketPrice ?? null;
}

export async function fetchQuote(
  symbol: string
): Promise<YahooQuote | null> {
  const result = await fetchChart(symbol, { interval: "1d", range: "1d" });
  if (!result) return null;

  const meta = result.meta;
  const price = meta.regularMarketPrice;
  const prevClose = getPreviousClose(meta);

  if (
    !price ||
    !prevClose ||
    !meta.fiftyTwoWeekHigh ||
    !meta.fiftyTwoWeekLow ||
    !meta.twoHundredDayAverage
  ) {
    console.warn(
      `[yahoo] Incomplete meta for ${symbol}:`,
      JSON.stringify({
        price,
        prevClose,
        high52w: meta.fiftyTwoWeekHigh,
        low52w: meta.fiftyTwoWeekLow,
        avg200d: meta.twoHundredDayAverage,
      })
    );
    return null;
  }

  return {
    symbol,
    price,
    previousClose: prevClose,
    changePercent: ((price - prevClose) / prevClose) * 100,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    twoHundredDayAverage: meta.twoHundredDayAverage,
  };
}

export async function fetchQuotes(
  symbols: string[]
): Promise<Map<string, YahooQuote>> {
  const results = await Promise.allSettled(
    symbols.map((s) => fetchQuote(s))
  );

  const quoteMap = new Map<string, YahooQuote>();
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      quoteMap.set(symbols[i], r.value);
    }
  });

  return quoteMap;
}

// ─── S&P 500 Breadth ────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSP500BreadthData(
  tickers: string[]
): Promise<SP500StockData[]> {
  const batchSize = 15;
  const allData: SP500StockData[] = [];

  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (symbol) => {
        const result = await fetchChart(symbol, {
          interval: "1d",
          range: "1d",
        });
        if (!result) return null;

        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const prevClose = getPreviousClose(meta);

        if (
          !price ||
          !prevClose ||
          !meta.twoHundredDayAverage ||
          !meta.fiftyTwoWeekHigh ||
          !meta.fiftyTwoWeekLow ||
          meta.regularMarketVolume === undefined ||
          !meta.averageDailyVolume3Month
        ) {
          return null;
        }

        return {
          symbol,
          price,
          twoHundredDayAverage: meta.twoHundredDayAverage,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
          change: price - prevClose,
          volume: meta.regularMarketVolume,
          averageVolume: meta.averageDailyVolume3Month,
        };
      })
    );

    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value) {
        allData.push(r.value);
      }
    });

    if (i + batchSize < tickers.length) {
      await delay(1500);
    }
  }

  yahooLogs.push(`[yahoo] Breadth: fetched ${allData.length}/${tickers.length} tickers`);
  return allData;
}

// ─── Historical Prices ──────────────────────────────────────────────

export async function fetchHistoricalPrices(
  symbol: string,
  days: number
): Promise<{ date: string; close: number }[]> {
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - days * 86400;

  const result = await fetchChart(symbol, {
    period1: period1.toString(),
    period2: period2.toString(),
    interval: "1d",
  });

  if (!result) return [];

  const timestamps = result.timestamp;
  const closes = result.indicators?.quote?.[0]?.close;

  if (!timestamps || !closes) {
    console.warn(`[yahoo] No OHLCV data for ${symbol}`);
    return [];
  }

  const prices: { date: string; close: number }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i];
    if (c != null) {
      prices.push({
        date: new Date(timestamps[i] * 1000).toISOString(),
        close: c,
      });
    }
  }

  return prices;
}
