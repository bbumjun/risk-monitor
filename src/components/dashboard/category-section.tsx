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
  const getRiskColor = () => {
    if (averageRisk < 40) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (averageRisk < 70) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{label}</h2>
        <div className={`px-2.5 py-1 rounded-full border text-xs font-medium tabular-nums ${getRiskColor()}`}>
          {averageRisk.toFixed(1)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {indicators.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>
    </div>
  );
}
