import type { IndicatorSnapshot } from "@/types/indicator";
import { fetchLatestFred, fetchFredSeries } from "@/lib/sources/fred";
import { fetchFearAndGreed } from "@/lib/sources/cnn";
import { calculateVIX, calculateFearGreed } from "@/lib/indicators/sentiment";
import { calculateHYOAS, calculateYieldCurve, calculateSTLFSI } from "@/lib/indicators/credit";
import { calculateDXY, calculateRSI, calculateCopperGoldRatio } from "@/lib/indicators/macro";
import { calculateCompositeScore } from "@/lib/risk/composite";

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

  const [
    fredVIX, fredHYOAS, fredYieldCurve, fredSTLFSI, fredDXY, fredSPX,
    fearGreedData, fredCopper, fredGold,
  ] = await Promise.allSettled([
    fetchLatestFred("VIXCLS"),
    fetchLatestFred("BAMLH0A0HYM2"),
    fetchLatestFred("T10Y2Y"),
    fetchLatestFred("STLFSI4"),
    fetchLatestFred("DTWEXBGS"),
    fetchFredSeries("SP500", { limit: 30 }),
    fetchFearAndGreed(),
    fetchLatestFred("PCOPPUSDM"),
    fetchLatestFred("GOLDAMGBD228NLBM"),
  ]);

  const resolve = <T>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;

  const vixData = resolve(fredVIX);
  const hyOASData = resolve(fredHYOAS);
  const yieldCurveData = resolve(fredYieldCurve);
  const stlfsiData = resolve(fredSTLFSI);
  const dxyData = resolve(fredDXY);
  const spxSeries = resolve(fredSPX) ?? [];
  const fearGreed = resolve(fearGreedData);
  const copperData = resolve(fredCopper);
  const goldData = resolve(fredGold);

  const tryPush = (id: string, errMsg: string, fn: () => IndicatorSnapshot | null) => {
    try {
      const snap = fn();
      if (snap) snapshots.push(snap);
      else errors.push({ indicatorId: id, error: errMsg });
    } catch (error) {
      errors.push({ indicatorId: id, error: String(error) });
    }
  };

  tryPush("vix", "No VIX data from FRED", () => vixData ? calculateVIX(vixData.value, timestamp) : null);
  tryPush("fear-greed", "No Fear & Greed data", () => fearGreed ? calculateFearGreed(fearGreed.score, timestamp) : null);
  tryPush("hy-oas", "No HY OAS from FRED", () => hyOASData ? calculateHYOAS(hyOASData.value, timestamp) : null);
  tryPush("yield-curve-10y2y", "No Yield Curve from FRED", () => yieldCurveData ? calculateYieldCurve(yieldCurveData.value, timestamp) : null);
  tryPush("stlfsi", "No STLFSI from FRED", () => stlfsiData ? calculateSTLFSI(stlfsiData.value, timestamp) : null);
  tryPush("dxy", "No DXY from FRED", () => dxyData ? calculateDXY(dxyData.value, timestamp) : null);
  tryPush("rsi-spx", "Insufficient SPX data for RSI", () => {
    const prices = spxSeries.map((o) => ({ close: o.value })).reverse();
    return prices.length >= 15 ? calculateRSI(prices, timestamp) : null;
  });
  tryPush("copper-gold-ratio", "No Copper or Gold data from FRED", () => {
    if (!copperData || !goldData) return null;
    const copperPerLb = copperData.value / 2204.62;
    return calculateCopperGoldRatio(copperPerLb, goldData.value, timestamp);
  });

  // Indicators requiring Yahoo (disabled — Yahoo rate limits on serverless)
  const yahooDisabled = ["skew", "put-call-ratio", "move-index", "adv-decl-line", "pct-above-200ma", "new-highs-lows", "trin"];
  for (const id of yahooDisabled) {
    errors.push({ indicatorId: id, error: "Data source unavailable (Yahoo rate-limited)" });
  }

  const composite = calculateCompositeScore(snapshots, timestamp);

  return {
    snapshots,
    errors,
    timestamp,
    composite,
  };
}
