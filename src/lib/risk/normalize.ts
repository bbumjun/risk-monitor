import type { IndicatorDefinition, RiskStatus } from "@/types/indicator";

export function normalizeRisk(
  value: number,
  indicator: IndicatorDefinition
): { normalizedRisk: number; status: RiskStatus } {
  const { thresholdType, warningThreshold, dangerThreshold } = indicator;

  let normalizedRisk = 0;

  if (thresholdType === "above") {
    const warning = warningThreshold as number;
    const danger = dangerThreshold as number;

    if (value <= warning) {
      normalizedRisk = (value / warning) * 40;
    } else if (value < danger) {
      normalizedRisk = 40 + ((value - warning) / (danger - warning)) * 30;
    } else {
      normalizedRisk = 70 + Math.min(((value - danger) / danger) * 30, 30);
    }
  } else if (thresholdType === "below") {
    const warning = warningThreshold as number;
    const danger = dangerThreshold as number;

    if (value >= warning) {
      normalizedRisk = 40 - ((value - warning) / warning) * 40;
    } else if (value > danger) {
      normalizedRisk = 40 + ((warning - value) / (warning - danger)) * 30;
    } else {
      normalizedRisk = 70 + Math.min(((danger - value) / Math.abs(danger || 1)) * 30, 30);
    }
  } else if (thresholdType === "outside") {
    const [warningLow, warningHigh] = warningThreshold as [number, number];
    const [dangerLow, dangerHigh] = dangerThreshold as [number, number];

    if (value >= warningLow && value <= warningHigh) {
      const center = (warningLow + warningHigh) / 2;
      const distance = Math.abs(value - center);
      const maxDistance = (warningHigh - warningLow) / 2;
      normalizedRisk = (distance / maxDistance) * 40;
    } else if (value >= dangerLow && value <= dangerHigh) {
      if (value < warningLow) {
        normalizedRisk = 40 + ((warningLow - value) / (warningLow - dangerLow)) * 30;
      } else {
        normalizedRisk = 40 + ((value - warningHigh) / (dangerHigh - warningHigh)) * 30;
      }
    } else {
      if (value < dangerLow) {
        normalizedRisk = 70 + Math.min(((dangerLow - value) / Math.abs(dangerLow || 1)) * 30, 30);
      } else {
        normalizedRisk = 70 + Math.min(((value - dangerHigh) / dangerHigh) * 30, 30);
      }
    }
  } else if (thresholdType === "divergence") {
    const danger = dangerThreshold as number;

    if (value > 0) {
      normalizedRisk = Math.max(0, 40 - (value / 0.1) * 40);
    } else if (value > danger) {
      normalizedRisk = 40 + ((0 - value) / (0 - danger)) * 30;
    } else {
      normalizedRisk = 70 + Math.min(((danger - value) / Math.abs(danger || 1)) * 30, 30);
    }
  }

  normalizedRisk = Math.max(0, Math.min(100, normalizedRisk));

  const status = getStatusFromScore(normalizedRisk);

  return { normalizedRisk, status };
}

export function getStatusFromScore(score: number): RiskStatus {
  if (score < 40) return "normal";
  if (score < 70) return "warning";
  return "danger";
}
