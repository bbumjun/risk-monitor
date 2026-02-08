import type {
  IndicatorSnapshot,
  CompositeSnapshot,
  IndicatorCategory,
} from "@/types/indicator";
import { INDICATORS } from "@/data/indicators";
import { getStatusFromScore } from "./normalize";

export function calculateCompositeScore(
  snapshots: IndicatorSnapshot[],
  timestamp: string
): CompositeSnapshot {
  const snapshotMap = new Map<string, IndicatorSnapshot>();
  snapshots.forEach((snap) => snapshotMap.set(snap.indicatorId, snap));

  let totalWeightedRisk = 0;
  let totalWeight = 0;

  const categoryScores = new Map<
    IndicatorCategory,
    { totalRisk: number; totalWeight: number }
  >();

  INDICATORS.forEach((indicator) => {
    const snapshot = snapshotMap.get(indicator.id);
    if (!snapshot) return;

    totalWeightedRisk += snapshot.normalizedRisk * indicator.weight;
    totalWeight += indicator.weight;

    const categoryData = categoryScores.get(indicator.category) || {
      totalRisk: 0,
      totalWeight: 0,
    };
    categoryData.totalRisk += snapshot.normalizedRisk * indicator.weight;
    categoryData.totalWeight += indicator.weight;
    categoryScores.set(indicator.category, categoryData);
  });

  const score = totalWeight > 0 ? totalWeightedRisk / totalWeight : 0;
  const status = getStatusFromScore(score);

  const breakdown: CompositeSnapshot["breakdown"] = [];
  categoryScores.forEach((data, category) => {
    const categoryScore = data.totalWeight > 0 ? data.totalRisk / data.totalWeight : 0;
    breakdown.push({
      category,
      score: categoryScore,
      weight: data.totalWeight,
    });
  });

  return {
    score,
    status,
    timestamp,
    breakdown,
  };
}
