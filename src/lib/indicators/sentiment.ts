import type { IndicatorSnapshot } from "@/types/indicator";
import { INDICATORS } from "@/data/indicators";
import { normalizeRisk } from "@/lib/risk/normalize";

export function calculateVIX(vixValue: number, timestamp: string): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "vix");
  if (!indicator) throw new Error("VIX indicator definition not found");

  const { normalizedRisk, status } = normalizeRisk(vixValue, indicator);

  return {
    indicatorId: "vix",
    value: vixValue,
    normalizedRisk,
    status,
    timestamp,
  };
}

export function calculatePutCallRatio(pcrValue: number, timestamp: string): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "put-call-ratio");
  if (!indicator) throw new Error("Put/Call Ratio indicator definition not found");

  const { normalizedRisk, status } = normalizeRisk(pcrValue, indicator);

  return {
    indicatorId: "put-call-ratio",
    value: pcrValue,
    normalizedRisk,
    status,
    timestamp,
  };
}

export function calculateFearGreed(fgScore: number, timestamp: string): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "fear-greed");
  if (!indicator) throw new Error("Fear & Greed indicator definition not found");

  const { normalizedRisk, status } = normalizeRisk(fgScore, indicator);

  return {
    indicatorId: "fear-greed",
    value: fgScore,
    normalizedRisk,
    status,
    timestamp,
  };
}

export function calculateSKEW(skewValue: number, timestamp: string): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "skew");
  if (!indicator) throw new Error("SKEW indicator definition not found");

  const { normalizedRisk, status } = normalizeRisk(skewValue, indicator);

  return {
    indicatorId: "skew",
    value: skewValue,
    normalizedRisk,
    status,
    timestamp,
  };
}
