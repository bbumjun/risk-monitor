export type RiskStatus = "normal" | "warning" | "danger";

export type IndicatorCategory =
  | "sentiment"
  | "breadth"
  | "credit"
  | "macro"
  | "technical";

export const CATEGORY_LABELS: Record<IndicatorCategory, string> = {
  sentiment: "심리",
  breadth: "시장폭",
  credit: "신용",
  macro: "매크로",
  technical: "기술적",
};

/** "above" = danger when value > threshold, "below" = value < threshold, "outside" = outside [low,high] range */
export type ThresholdType = "above" | "below" | "outside" | "divergence";

export interface IndicatorDefinition {
  id: string;
  name: string;
  nameKo: string;
  category: IndicatorCategory;
  description: string;
  unit: string;
  source: "fred" | "yahoo" | "cnn" | "calculated";
  sourceKey: string;
  thresholdType: ThresholdType;
  warningThreshold: number | [number, number];
  dangerThreshold: number | [number, number];
  weight: number;
  higherIsDangerous: boolean;
  frequency: "realtime" | "daily" | "weekly";
}

export interface IndicatorSnapshot {
  indicatorId: string;
  value: number;
  /** 0-100, higher = more risk */
  normalizedRisk: number;
  status: RiskStatus;
  timestamp: string;
}

export interface DashboardData {
  compositeScore: number;
  compositeStatus: RiskStatus;
  updatedAt: string;
  categories: {
    category: IndicatorCategory;
    label: string;
    averageRisk: number;
    indicators: IndicatorWithSnapshot[];
  }[];
}

export interface IndicatorWithSnapshot extends IndicatorDefinition {
  snapshot: IndicatorSnapshot | null;
  history?: IndicatorSnapshot[];
}

export interface CompositeSnapshot {
  score: number;
  status: RiskStatus;
  timestamp: string;
  breakdown: {
    category: IndicatorCategory;
    score: number;
    weight: number;
  }[];
}
