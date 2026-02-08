"use client";

import { RiskStatus } from "@/types/indicator";
import { RiskGauge } from "./risk-gauge";

interface CompositeScoreProps {
  score: number;
  status: RiskStatus;
  updatedAt: string;
}

export function CompositeScore({ score, status, updatedAt }: CompositeScoreProps) {
  const getStatusText = () => {
    if (status === "normal") return "정상";
    if (status === "warning") return "경계";
    return "위험";
  };

  const getStatusColor = () => {
    if (status === "normal") return "text-green-500 bg-green-500/10 border-green-500/20";
    if (status === "warning") return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center lg:items-start gap-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            종합 리스크 점수
          </h2>
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-bold tabular-nums">{score.toFixed(1)}</span>
            <span className="text-2xl text-zinc-500">/100</span>
          </div>
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          <p className="text-xs text-zinc-500">
            업데이트: {formatDate(updatedAt)}
          </p>
        </div>

        <div className="flex items-center justify-center">
          <RiskGauge score={score} status={status} />
        </div>
      </div>
    </div>
  );
}
