"use client";

import { useEffect, useState } from "react";
import { DashboardData, CompositeSnapshot } from "@/types/indicator";
import { CompositeScore } from "@/components/dashboard/composite-score";
import { CategorySection } from "@/components/dashboard/category-section";
import { HistoryChart } from "@/components/dashboard/history-chart";

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [historyData, setHistoryData] = useState<CompositeSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashboardRes, historyRes] = await Promise.all([
          fetch("/api/dashboard/current"),
          fetch("/api/dashboard/composite-history?days=365"),
        ]);

        if (!dashboardRes.ok) {
          throw new Error(`Dashboard API error: ${dashboardRes.status}`);
        }
        if (!historyRes.ok) {
          throw new Error(`History API error: ${historyRes.status}`);
        }

        const dashboard = await dashboardRes.json();
        const history = await historyRes.json();

        setDashboardData(dashboard);
        setHistoryData(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-96 bg-zinc-800 rounded animate-pulse" />
            </div>

            <div className="h-48 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-40 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-6xl">⚠</div>
          <h1 className="text-2xl font-bold">오류 발생</h1>
          <p className="text-zinc-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-bold">리스크 모니터</h1>
            <p className="text-sm text-zinc-400">
              미국 주식시장 리스크 지표 실시간 모니터링 대시보드
            </p>
          </header>

          <CompositeScore
            score={dashboardData.compositeScore}
            status={dashboardData.compositeStatus}
            updatedAt={dashboardData.updatedAt}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {dashboardData.categories.map((cat) => {
              const hasActiveIndicators = cat.indicators.some((ind) => ind.snapshot !== null);

              const getRiskColor = () => {
                if (!hasActiveIndicators) return "bg-zinc-800/50 border-zinc-700/50 text-zinc-500";
                if (cat.averageRisk < 40) return "bg-green-500/10 border-green-500/20 text-green-500";
                if (cat.averageRisk < 70) return "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
                return "bg-red-500/10 border-red-500/20 text-red-500";
              };

              return (
                <div
                  key={cat.category}
                  className={`border rounded-lg p-3 ${getRiskColor()}`}
                >
                  <div className="text-xs font-medium opacity-80">{cat.label}</div>
                  <div className="text-xl font-bold tabular-nums mt-1">
                    {hasActiveIndicators ? cat.averageRisk.toFixed(1) : "—"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-8">
            {dashboardData.categories.map((cat) => (
              <CategorySection
                key={cat.category}
                category={cat.category}
                label={cat.label}
                averageRisk={cat.averageRisk}
                indicators={cat.indicators}
              />
            ))}
          </div>

          {historyData.length >= 7 ? (
            <HistoryChart data={historyData} />
          ) : historyData.length > 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">종합 리스크 추이 (1년)</h2>
              <p className="text-sm text-zinc-500">
                데이터 수집 중입니다 ({historyData.length}일 / 최소 7일 필요)
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
