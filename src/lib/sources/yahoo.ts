import yahooFinance from "yahoo-finance2";

export interface YahooQuote {
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  twoHundredDayAverage: number;
}

interface RawQuote {
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  twoHundredDayAverage?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
}

export async function fetchQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    const result = (await yahooFinance.quote(symbol)) as unknown as RawQuote;

    if (
      !result.regularMarketPrice ||
      !result.regularMarketPreviousClose ||
      !result.fiftyTwoWeekHigh ||
      !result.fiftyTwoWeekLow ||
      !result.twoHundredDayAverage
    ) {
      console.warn(`Incomplete data for ${symbol}`);
      return null;
    }

    const changePercent =
      ((result.regularMarketPrice - result.regularMarketPreviousClose) /
        result.regularMarketPreviousClose) *
      100;

    return {
      symbol,
      price: result.regularMarketPrice,
      previousClose: result.regularMarketPreviousClose,
      changePercent,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
      twoHundredDayAverage: result.twoHundredDayAverage,
    };
  } catch (error) {
    console.warn(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

export async function fetchQuotes(
  symbols: string[]
): Promise<Map<string, YahooQuote>> {
  const results = await Promise.allSettled(
    symbols.map((symbol) => fetchQuote(symbol))
  );

  const quoteMap = new Map<string, YahooQuote>();

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      quoteMap.set(symbols[index], result.value);
    }
  });

  return quoteMap;
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

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSP500BreadthData(
  tickers: string[]
): Promise<SP500StockData[]> {
  const batchSize = 50;
  const allData: SP500StockData[] = [];

  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (symbol) => {
        try {
          const result = (await yahooFinance.quote(symbol)) as unknown as RawQuote;

          if (
            !result.regularMarketPrice ||
            !result.regularMarketPreviousClose ||
            !result.twoHundredDayAverage ||
            !result.fiftyTwoWeekHigh ||
            !result.fiftyTwoWeekLow ||
            result.regularMarketVolume === undefined ||
            !result.averageDailyVolume3Month
          ) {
            return null;
          }

          return {
            symbol,
            price: result.regularMarketPrice,
            twoHundredDayAverage: result.twoHundredDayAverage,
            fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: result.fiftyTwoWeekLow,
            change: result.regularMarketPrice - result.regularMarketPreviousClose,
            volume: result.regularMarketVolume,
            averageVolume: result.averageDailyVolume3Month,
          };
        } catch (error) {
          console.warn(`Failed to fetch ${symbol}:`, error);
          return null;
        }
      })
    );

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        allData.push(result.value);
      }
    });

    if (i + batchSize < tickers.length) {
      await delay(500);
    }
  }

  return allData;
}

interface RawChartResult {
  quotes: { date?: Date; close?: number | null }[];
}

export async function fetchHistoricalPrices(
  symbol: string,
  days: number
): Promise<{ date: string; close: number }[]> {
  try {
    const period2 = new Date();
    const period1 = new Date();
    period1.setDate(period1.getDate() - days);

    const result = (await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: "1d",
    })) as unknown as RawChartResult;

    if (!result.quotes || result.quotes.length === 0) {
      console.warn(`No historical data for ${symbol}`);
      return [];
    }

    return result.quotes
      .filter(
        (quote): quote is { date: Date; close: number } =>
          quote.date != null && quote.close != null
      )
      .map((quote) => ({
        date: quote.date.toISOString(),
        close: quote.close,
      }));
  } catch (error) {
    console.warn(`Failed to fetch historical prices for ${symbol}:`, error);
    return [];
  }
}
