import type { IndicatorSnapshot } from "@/types/indicator";
import { INDICATORS } from "@/data/indicators";
import { normalizeRisk } from "@/lib/risk/normalize";

export function calculateHYOAS(value: number, timestamp: string): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "hy-oas");
  if (!indicator) throw new Error("HY OAS indicator definition not found");

  const { normalizedRisk, status } = normalizeRisk(value, indicator);

  return {
    indicatorId: "hy-oas",
    value,
    normalizedRisk,
    status,
    timestamp,
  };
}

export function calculateYieldCurve(value: number, timestamp: string): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "yield-curve-10y2y");
  if (!indicator) throw new Error("Yield Curve indicator definition not found");

  const { normalizedRisk, status } = normalizeRisk(value, indicator);

  return {
    indicatorId: "yield-curve-10y2y",
    value,
    normalizedRisk,
    status,
    timestamp,
  };
}

export function calculateMOVE(value: number, timestamp: string): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "move-index");
  if (!indicator) throw new Error("MOVE Index indicator definition not found");

  const { normalizedRisk, status } = normalizeRisk(value, indicator);

  return {
    indicatorId: "move-index",
    value,
    normalizedRisk,
    status,
    timestamp,
  };
}

export function calculateSTLFSI(value: number, timestamp: string): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "stlfsi");
  if (!indicator) throw new Error("STLFSI indicator definition not found");

  const { normalizedRisk, status } = normalizeRisk(value, indicator);

  return {
    indicatorId: "stlfsi",
    value,
    normalizedRisk,
    status,
    timestamp,
  };
}
