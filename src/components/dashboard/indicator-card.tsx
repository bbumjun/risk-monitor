"use client";

import { IndicatorWithSnapshot } from "@/types/indicator";

interface IndicatorCardProps {
  indicator: IndicatorWithSnapshot;
}

export function IndicatorCard({ indicator }: IndicatorCardProps) {
  const { snapshot } = indicator;

  const getStatusText = () => {
    if (!snapshot) return "—";
    if (snapshot.status === "normal") return "정상";
    if (snapshot.status === "warning") return "경계";
    return "위험";
  };

  const getStatusColor = () => {
    if (!snapshot) return "text-zinc-500 bg-zinc-800/50";
    if (snapshot.status === "normal") return "text-green-500 bg-green-500/10";
    if (snapshot.status === "warning") return "text-yellow-500 bg-yellow-500/10";
    return "text-red-500 bg-red-500/10";
  };

  const getRiskBarColor = () => {
    if (!snapshot) return "bg-zinc-700";
    if (snapshot.status === "normal") return "bg-green-500";
    if (snapshot.status === "warning") return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatValue = (value: number): string => {
    const id = indicator.id;

    switch (id) {
      case "vix":
      case "skew":
      case "move-index":
      case "rsi-spx":
        return value.toFixed(1);
      case "put-call-ratio":
      case "adv-decl-line":
      case "trin":
      case "hy-oas":
      case "yield-curve-10y2y":
      case "stlfsi":
      case "dxy":
        return value.toFixed(2);
      case "fear-greed":
        return Math.round(value).toString();
      case "new-highs-lows":
        return value >= 0 ? `+${Math.round(value)}` : Math.round(value).toString();
      case "pct-above-200ma":
        return `${value.toFixed(1)}%`;
      case "copper-gold-ratio":
        return value.toFixed(6);
      default:
        return value.toFixed(2);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-400">{indicator.nameKo}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          {snapshot ? (
            <>
              <span className="text-2xl font-bold tabular-nums">
                {formatValue(snapshot.value)}
              </span>
              {indicator.unit && (
                <span className="text-sm text-zinc-500">{indicator.unit}</span>
              )}
            </>
          ) : (
            <span className="text-2xl font-bold text-zinc-600">—</span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">리스크</span>
            {snapshot && (
              <span className="text-zinc-400 tabular-nums">{snapshot.normalizedRisk.toFixed(0)}/100</span>
            )}
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            {snapshot && (
              <div
                className={`h-full ${getRiskBarColor()} transition-all duration-500`}
                style={{ width: `${snapshot.normalizedRisk}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
