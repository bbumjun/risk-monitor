"use client";

import { CompositeSnapshot } from "@/types/indicator";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface HistoryChartProps {
  data: CompositeSnapshot[];
}

export function HistoryChart({ data }: HistoryChartProps) {
  const chartData = data.map((snapshot) => ({
    date: new Date(snapshot.timestamp).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    }),
    score: snapshot.score,
    status: snapshot.status,
  }));

  const getGradientColor = (value: number) => {
    if (value < 40) return "#22c55e";
    if (value < 70) return "#eab308";
    return "#ef4444";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-6">종합 리스크 추이 (1년)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#71717a"
            tick={{ fill: "#71717a", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#71717a"
            tick={{ fill: "#71717a", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "#a1a1aa", fontSize: 12 }}
            itemStyle={{ color: "#f4f4f5", fontSize: 14, fontWeight: 600 }}
            formatter={(value: number | undefined) => [value?.toFixed(1) ?? "—", "리스크 점수"]}
            cursor={{ stroke: "#3f3f46", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#scoreGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6", stroke: "#18181b", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-zinc-400">정상 (0-40)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-zinc-400">경계 (40-70)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-zinc-400">위험 (70-100)</span>
        </div>
      </div>
    </div>
  );
}
