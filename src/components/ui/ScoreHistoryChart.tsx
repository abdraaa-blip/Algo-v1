"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DataPoint {
  timestamp: string | Date;
  score: number;
}

interface ScoreHistoryChartProps {
  data: DataPoint[];
  height?: number;
  showLabels?: boolean;
  showGrid?: boolean;
  color?: "violet" | "emerald" | "amber" | "red";
  className?: string;
}

const COLORS = {
  violet: {
    stroke: "#7B61FF",
    fill: "rgba(123, 97, 255, 0.1)",
    gradient: "from-violet-500/20",
  },
  emerald: {
    stroke: "#00FFB2",
    fill: "rgba(0, 255, 178, 0.1)",
    gradient: "from-emerald-500/20",
  },
  amber: {
    stroke: "#FFB800",
    fill: "rgba(255, 184, 0, 0.1)",
    gradient: "from-amber-500/20",
  },
  red: {
    stroke: "#FF4D4D",
    fill: "rgba(255, 77, 77, 0.1)",
    gradient: "from-red-500/20",
  },
};

export function ScoreHistoryChart({
  data,
  height = 120,
  showLabels = true,
  showGrid = true,
  color = "violet",
  className,
}: ScoreHistoryChartProps) {
  const colorScheme = COLORS[color];

  const { path, area, stats, points } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: "", area: "", stats: null, points: [] };
    }

    const scores = data.map((d) => d.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore || 1;

    const padding = 10;
    const chartWidth = 100; // percentage
    const chartHeight = height - padding * 2;

    const pointsData = data.map((point, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y =
        padding +
        chartHeight -
        ((point.score - minScore) / range) * chartHeight;
      return { x, y, ...point };
    });

    // Create smooth curve path using quadratic bezier
    let pathD = `M ${pointsData[0].x} ${pointsData[0].y}`;
    let areaD = `M ${pointsData[0].x} ${height} L ${pointsData[0].x} ${pointsData[0].y}`;

    for (let i = 1; i < pointsData.length; i++) {
      const prev = pointsData[i - 1];
      const curr = pointsData[i];
      const cpX = (prev.x + curr.x) / 2;

      pathD += ` Q ${cpX} ${prev.y} ${curr.x} ${curr.y}`;
      areaD += ` Q ${cpX} ${prev.y} ${curr.x} ${curr.y}`;
    }

    areaD += ` L ${pointsData[pointsData.length - 1].x} ${height} Z`;

    // Calculate stats
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const change = lastScore - firstScore;
    const changePercent = ((change / firstScore) * 100).toFixed(1);
    const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";

    return {
      path: pathD,
      area: areaD,
      stats: {
        min: minScore,
        max: maxScore,
        change,
        changePercent,
        trend,
        current: lastScore,
      },
      points: pointsData,
    };
  }, [data, height]);

  if (!data || data.length < 2) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-white/30 text-sm",
          className,
        )}
        style={{ height }}
      >
        Not enough data
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Stats header */}
      {showLabels && stats && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {stats.current}
            </span>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                stats.trend === "up" && "bg-emerald-500/10 text-emerald-400",
                stats.trend === "down" && "bg-red-500/10 text-red-400",
                stats.trend === "stable" && "bg-white/5 text-white/40",
              )}
            >
              {stats.trend === "up" && <TrendingUp size={12} />}
              {stats.trend === "down" && <TrendingDown size={12} />}
              {stats.trend === "stable" && <Minus size={12} />}
              {stats.trend !== "stable" && (
                <span>
                  {stats.trend === "up" ? "+" : ""}
                  {stats.changePercent}%
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-white/30">
            <span>High: {stats.max}</span>
            <span className="mx-2">|</span>
            <span>Low: {stats.min}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient
            id={`gradient-${color}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={colorScheme.stroke}
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor={colorScheme.stroke}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid && (
          <g className="text-white/5">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={10 + (height - 20) * ratio}
                x2="100"
                y2={10 + (height - 20) * ratio}
                stroke="currentColor"
                strokeDasharray="2,2"
              />
            ))}
          </g>
        )}

        {/* Area fill */}
        <path
          d={area}
          fill={`url(#gradient-${color})`}
          className="transition-all duration-500"
        />

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={colorScheme.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-500"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i} className="group">
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill="#0a0a0f"
              stroke={colorScheme.stroke}
              strokeWidth="1.5"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
            {/* Tooltip */}
            <title>{`Score: ${point.score}`}</title>
          </g>
        ))}

        {/* Current value indicator */}
        <circle
          cx={points[points.length - 1]?.x || 0}
          cy={points[points.length - 1]?.y || 0}
          r="4"
          fill={colorScheme.stroke}
          className="animate-pulse"
        />
      </svg>

      {/* Time labels */}
      {showLabels && data.length > 0 && (
        <div className="flex justify-between mt-2 text-[10px] text-white/30">
          <span>{formatTime(data[0].timestamp)}</span>
          <span>{formatTime(data[data.length - 1].timestamp)}</span>
        </div>
      )}
    </div>
  );
}

function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
