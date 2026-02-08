"use client";

import { IndicatorCategory, IndicatorWithSnapshot } from "@/types/indicator";
import { IndicatorCard } from "./indicator-card";

interface CategorySectionProps {
  category: IndicatorCategory;
  label: string;
  averageRisk: number;
  indicators: IndicatorWithSnapshot[];
}

export function CategorySection({ label, averageRisk, indicators }: CategorySectionProps) {
  const activeIndicators = indicators.filter((ind) => ind.snapshot !== null);
  const unavailableCount = indicators.length - activeIndicators.length;

  const getRiskColor = () => {
    if (activeIndicators.length === 0) return "text-zinc-500 bg-zinc-800/50 border-zinc-700/50";
    if (averageRisk < 40) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (averageRisk < 70) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{label}</h2>
        <div className={`px-2.5 py-1 rounded-full border text-xs font-medium tabular-nums ${getRiskColor()}`}>
          {activeIndicators.length === 0 ? "—" : averageRisk.toFixed(1)}
        </div>
        {unavailableCount > 0 && (
          <span className="text-xs text-zinc-600">
            +{unavailableCount}개 미수집
          </span>
        )}
      </div>

      {activeIndicators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeIndicators.map((indicator) => (
            <IndicatorCard key={indicator.id} indicator={indicator} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 text-center">
          <p className="text-sm text-zinc-600">
            무료 데이터 소스 제한으로 해당 카테고리의 지표를 수집하지 못했습니다
          </p>
        </div>
      )}
    </div>
  );
}
