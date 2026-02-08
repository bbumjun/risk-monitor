import type { IndicatorSnapshot } from "@/types/indicator";
import { fetchLatestFred } from "@/lib/sources/fred";
import { fetchQuotes, fetchHistoricalPrices, fetchSP500BreadthData } from "@/lib/sources/yahoo";
import { fetchFearAndGreed } from "@/lib/sources/cnn";
import { calculateVIX, calculateFearGreed, calculateSKEW } from "@/lib/indicators/sentiment";
import { calculateBreadthIndicators } from "@/lib/indicators/breadth";
import { calculateHYOAS, calculateYieldCurve, calculateMOVE, calculateSTLFSI } from "@/lib/indicators/credit";
import { calculateDXY, calculateCopperGoldRatio, calculateRSI } from "@/lib/indicators/macro";
import { calculateCompositeScore } from "@/lib/risk/composite";
import sp500Tickers from "@/data/sp500.json";

export interface IngestionResult {
  snapshots: IndicatorSnapshot[];
  errors: { indicatorId: string; error: string }[];
  timestamp: string;
  composite: {
    score: number;
    status: "normal" | "warning" | "danger";
    breakdown: {
      category: string;
      score: number;
      weight: number;
    }[];
  };
}

export async function runIngestion(): Promise<IngestionResult> {
  const timestamp = new Date().toISOString().split("T")[0];
  const snapshots: IndicatorSnapshot[] = [];
  const errors: { indicatorId: string; error: string }[] = [];

  const [fredResults, yahooQuotes, spxHistorical, sp500Breadth, fearGreedData] = await Promise.allSettled([
    Promise.all([
      fetchLatestFred("BAMLH0A0HYM2"),
      fetchLatestFred("T10Y2Y"),
      fetchLatestFred("STLFSI4"),
    ]),
    fetchQuotes(["^VIX", "^SKEW", "^MOVE", "DX-Y.NYB", "HG=F", "GC=F"]),
    fetchHistoricalPrices("^GSPC", 30),
    fetchSP500BreadthData(sp500Tickers),
    fetchFearAndGreed(),
  ]);

  const fredData = fredResults.status === "fulfilled" ? fredResults.value : [null, null, null];
  const quotes = yahooQuotes.status === "fulfilled" ? yahooQuotes.value : new Map();
  const spxPrices = spxHistorical.status === "fulfilled" ? spxHistorical.value : [];
  const breadthData = sp500Breadth.status === "fulfilled" ? sp500Breadth.value : [];
  const fearGreed = fearGreedData.status === "fulfilled" ? fearGreedData.value : null;

  try {
    const vixQuote = quotes.get("^VIX");
    if (vixQuote) {
      snapshots.push(calculateVIX(vixQuote.price, timestamp));
    } else {
      errors.push({ indicatorId: "vix", error: "Failed to fetch VIX quote" });
    }
  } catch (error) {
    errors.push({ indicatorId: "vix", error: String(error) });
  }

  try {
    const skewQuote = quotes.get("^SKEW");
    if (skewQuote) {
      snapshots.push(calculateSKEW(skewQuote.price, timestamp));
    } else {
      errors.push({ indicatorId: "skew", error: "Failed to fetch SKEW quote" });
    }
  } catch (error) {
    errors.push({ indicatorId: "skew", error: String(error) });
  }

  try {
    if (fearGreed) {
      snapshots.push(calculateFearGreed(fearGreed.score, timestamp));
    } else {
      errors.push({ indicatorId: "fear-greed", error: "Failed to fetch Fear & Greed data" });
    }
  } catch (error) {
    errors.push({ indicatorId: "fear-greed", error: String(error) });
  }

  try {
    if (breadthData.length > 0) {
      const breadthSnapshots = calculateBreadthIndicators({ stocks: breadthData }, timestamp);
      snapshots.push(...breadthSnapshots);
    } else {
      errors.push({ indicatorId: "breadth", error: "Failed to fetch S&P 500 breadth data" });
    }
  } catch (error) {
    errors.push({ indicatorId: "breadth", error: String(error) });
  }

  try {
    const [hyOAS, yieldCurve, stlfsi] = fredData;
    if (hyOAS) {
      snapshots.push(calculateHYOAS(hyOAS.value, timestamp));
    } else {
      errors.push({ indicatorId: "hy-oas", error: "Failed to fetch HY OAS from FRED" });
    }
  } catch (error) {
    errors.push({ indicatorId: "hy-oas", error: String(error) });
  }

  try {
    const [, yieldCurve] = fredData;
    if (yieldCurve) {
      snapshots.push(calculateYieldCurve(yieldCurve.value, timestamp));
    } else {
      errors.push({ indicatorId: "yield-curve-10y2y", error: "Failed to fetch Yield Curve from FRED" });
    }
  } catch (error) {
    errors.push({ indicatorId: "yield-curve-10y2y", error: String(error) });
  }

  try {
    const moveQuote = quotes.get("^MOVE");
    if (moveQuote) {
      snapshots.push(calculateMOVE(moveQuote.price, timestamp));
    } else {
      errors.push({ indicatorId: "move-index", error: "Failed to fetch MOVE quote" });
    }
  } catch (error) {
    errors.push({ indicatorId: "move-index", error: String(error) });
  }

  try {
    const [, , stlfsi] = fredData;
    if (stlfsi) {
      snapshots.push(calculateSTLFSI(stlfsi.value, timestamp));
    } else {
      errors.push({ indicatorId: "stlfsi", error: "Failed to fetch STLFSI from FRED" });
    }
  } catch (error) {
    errors.push({ indicatorId: "stlfsi", error: String(error) });
  }

  try {
    const dxyQuote = quotes.get("DX-Y.NYB");
    if (dxyQuote) {
      snapshots.push(calculateDXY(dxyQuote.price, timestamp));
    } else {
      errors.push({ indicatorId: "dxy", error: "Failed to fetch DXY quote" });
    }
  } catch (error) {
    errors.push({ indicatorId: "dxy", error: String(error) });
  }

  try {
    const copperQuote = quotes.get("HG=F");
    const goldQuote = quotes.get("GC=F");
    if (copperQuote && goldQuote) {
      snapshots.push(calculateCopperGoldRatio(copperQuote.price, goldQuote.price, timestamp));
    } else {
      errors.push({ indicatorId: "copper-gold-ratio", error: "Failed to fetch Copper or Gold quotes" });
    }
  } catch (error) {
    errors.push({ indicatorId: "copper-gold-ratio", error: String(error) });
  }

  try {
    if (spxPrices.length >= 15) {
      snapshots.push(calculateRSI(spxPrices, timestamp));
    } else {
      errors.push({ indicatorId: "rsi-spx", error: "Insufficient historical data for RSI calculation" });
    }
  } catch (error) {
    errors.push({ indicatorId: "rsi-spx", error: String(error) });
  }

  const composite = calculateCompositeScore(snapshots, timestamp);

  return {
    snapshots,
    errors,
    timestamp,
    composite,
  };
}
