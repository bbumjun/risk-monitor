"use client";

import { RiskStatus } from "@/types/indicator";

interface RiskGaugeProps {
  score: number;
  status: RiskStatus;
}

export function RiskGauge({ score, status }: RiskGaugeProps) {
  const radius = 80;
  const strokeWidth = 12;
  const center = 100;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = () => {
    if (status === "normal") return "#22c55e";
    if (status === "warning") return "#eab308";
    return "#ef4444";
  };

  const getGradientStops = () => {
    return [
      { offset: "0%", color: "#22c55e" },
      { offset: "40%", color: "#22c55e" },
      { offset: "40%", color: "#eab308" },
      { offset: "70%", color: "#eab308" },
      { offset: "70%", color: "#ef4444" },
      { offset: "100%", color: "#ef4444" },
    ];
  };

  const angle = -90 + (score / 100) * 180;

  return (
    <div className="relative w-[200px] h-[120px]">
      <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {getGradientStops().map((stop, i) => (
              <stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>

        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />

        <line
          x1={center}
          y1={center}
          x2={center}
          y2={center - radius + strokeWidth / 2}
          stroke={getColor()}
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${angle} ${center} ${center})`}
          className="transition-transform duration-700 ease-out"
        />

        <circle cx={center} cy={center} r="6" fill={getColor()} />
      </svg>

      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-zinc-500">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
