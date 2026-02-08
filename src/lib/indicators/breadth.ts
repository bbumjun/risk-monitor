import type { IndicatorSnapshot } from "@/types/indicator";
import { INDICATORS } from "@/data/indicators";
import { normalizeRisk } from "@/lib/risk/normalize";

interface BreadthInput {
  stocks: {
    symbol: string;
    price: number;
    twoHundredDayAverage: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    change: number;
    volume: number;
    averageVolume: number;
  }[];
}

export function calculateBreadthIndicators(
  input: BreadthInput,
  timestamp: string
): IndicatorSnapshot[] {
  const { stocks } = input;
  const total = stocks.length;

  if (total === 0) {
    return [];
  }

  const snapshots: IndicatorSnapshot[] = [];

  const advancingCount = stocks.filter((s) => s.change > 0).length;
  const decliningCount = stocks.filter((s) => s.change < 0).length;
  const advDeclValue = (advancingCount - decliningCount) / total;

  const advDeclIndicator = INDICATORS.find((ind) => ind.id === "adv-decl-line");
  if (advDeclIndicator) {
    const { normalizedRisk, status } = normalizeRisk(advDeclValue, advDeclIndicator);
    snapshots.push({
      indicatorId: "adv-decl-line",
      value: advDeclValue,
      normalizedRisk,
      status,
      timestamp,
    });
  }

  const above200MACount = stocks.filter((s) => s.price > s.twoHundredDayAverage).length;
  const pctAbove200MA = (above200MACount / total) * 100;

  const pctAbove200MAIndicator = INDICATORS.find((ind) => ind.id === "pct-above-200ma");
  if (pctAbove200MAIndicator) {
    const { normalizedRisk, status } = normalizeRisk(pctAbove200MA, pctAbove200MAIndicator);
    snapshots.push({
      indicatorId: "pct-above-200ma",
      value: pctAbove200MA,
      normalizedRisk,
      status,
      timestamp,
    });
  }

  const newHighsCount = stocks.filter((s) => s.price >= s.fiftyTwoWeekHigh * 0.98).length;
  const newLowsCount = stocks.filter((s) => s.price <= s.fiftyTwoWeekLow * 1.02).length;
  const newHighsLowsValue = newHighsCount - newLowsCount;

  const newHighsLowsIndicator = INDICATORS.find((ind) => ind.id === "new-highs-lows");
  if (newHighsLowsIndicator) {
    const { normalizedRisk, status } = normalizeRisk(newHighsLowsValue, newHighsLowsIndicator);
    snapshots.push({
      indicatorId: "new-highs-lows",
      value: newHighsLowsValue,
      normalizedRisk,
      status,
      timestamp,
    });
  }

  const advancingIssues = stocks.filter((s) => s.change > 0).length;
  const decliningIssues = stocks.filter((s) => s.change < 0).length;
  const advancingVolume = stocks.filter((s) => s.change > 0).reduce((sum, s) => sum + s.volume, 0);
  const decliningVolume = stocks.filter((s) => s.change < 0).reduce((sum, s) => sum + s.volume, 0);

  let trinValue = 1.0;
  if (decliningIssues > 0 && decliningVolume > 0 && advancingIssues > 0 && advancingVolume > 0) {
    trinValue = (advancingIssues / decliningIssues) / (advancingVolume / decliningVolume);
  }

  const trinIndicator = INDICATORS.find((ind) => ind.id === "trin");
  if (trinIndicator) {
    const { normalizedRisk, status } = normalizeRisk(trinValue, trinIndicator);
    snapshots.push({
      indicatorId: "trin",
      value: trinValue,
      normalizedRisk,
      status,
      timestamp,
    });
  }

  return snapshots;
}
