import type { IndicatorSnapshot } from "@/types/indicator";
import { INDICATORS } from "@/data/indicators";
import { normalizeRisk } from "@/lib/risk/normalize";

export function calculateDXY(value: number, timestamp: string): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "dxy");
  if (!indicator) throw new Error("DXY indicator definition not found");

  const { normalizedRisk, status } = normalizeRisk(value, indicator);

  return {
    indicatorId: "dxy",
    value,
    normalizedRisk,
    status,
    timestamp,
  };
}

export function calculateCopperGoldRatio(
  copperPrice: number,
  goldPrice: number,
  timestamp: string
): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "copper-gold-ratio");
  if (!indicator) throw new Error("Copper/Gold Ratio indicator definition not found");

  const value = copperPrice / goldPrice;
  const { normalizedRisk, status } = normalizeRisk(value, indicator);

  return {
    indicatorId: "copper-gold-ratio",
    value,
    normalizedRisk,
    status,
    timestamp,
  };
}

export function calculateRSI(
  prices: { close: number }[],
  timestamp: string
): IndicatorSnapshot {
  const indicator = INDICATORS.find((ind) => ind.id === "rsi-spx");
  if (!indicator) throw new Error("RSI indicator definition not found");

  if (prices.length < 15) {
    throw new Error("RSI calculation requires at least 15 price points");
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i].close - prices[i - 1].close);
  }

  const gains: number[] = changes.map((c) => (c > 0 ? c : 0));
  const losses: number[] = changes.map((c) => (c < 0 ? Math.abs(c) : 0));

  let avgGain = gains.slice(0, 14).reduce((sum, g) => sum + g, 0) / 14;
  let avgLoss = losses.slice(0, 14).reduce((sum, l) => sum + l, 0) / 14;

  for (let i = 14; i < changes.length; i++) {
    avgGain = (avgGain * 13 + gains[i]) / 14;
    avgLoss = (avgLoss * 13 + losses[i]) / 14;
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  const { normalizedRisk, status } = normalizeRisk(rsi, indicator);

  return {
    indicatorId: "rsi-spx",
    value: rsi,
    normalizedRisk,
    status,
    timestamp,
  };
}
