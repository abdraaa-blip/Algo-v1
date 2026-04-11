"use client";

import { useState, useRef, useMemo } from "react";
import { TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveTrends } from "@/hooks/useAlgoData";

interface TrendingItem {
  keyword: string;
  volume?: number;
  change?: number;
}

interface TrendingTickerProps {
  className?: string;
}

function stableMetricFromKeyword(
  keyword: string,
  min: number,
  range: number,
): number {
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) {
    hash = (hash * 31 + keyword.charCodeAt(i)) % 1_000_003;
  }
  return min + (hash % range);
}

export function TrendingTicker({ className }: TrendingTickerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);
  const { trends: rawTrends } = useLiveTrends();

  // Transform trends to display format
  const trends = useMemo<TrendingItem[]>(() => {
    if (!rawTrends.length) return [];
    return rawTrends
      .slice(0, 20)
      .map(
        (t: {
          title?: string;
          name?: string;
          keyword?: string;
          score?: number;
        }) => ({
          keyword: t.title || t.name || t.keyword || "Trending",
          volume: stableMetricFromKeyword(
            t.title || t.name || t.keyword || "Trending",
            10_000,
            500_000,
          ),
          change: stableMetricFromKeyword(
            t.title || t.name || t.keyword || "Trending",
            10,
            200,
          ),
        }),
      );
  }, [rawTrends]);

  if (trends.length === 0) return null;

  // Duplicate trends for seamless loop
  const duplicatedTrends = [...trends, ...trends];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800/50",
        className,
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-900 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-900 to-transparent z-10" />

      {/* Label - honest labeling */}
      <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-500/20 rounded-full">
        <Zap className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-amber-400" />
        <span className="text-[8px] sm:text-[10px] font-bold text-amber-300 tracking-wider">
          TENDANCES
        </span>
      </div>

      {/* Ticker content */}
      <div
        ref={tickerRef}
        className={cn(
          "flex items-center gap-4 sm:gap-8 py-1.5 sm:py-2 pl-24 sm:pl-40",
          isPaused ? "" : "animate-ticker",
        )}
        style={{
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {duplicatedTrends.map((trend, i) => (
          <div
            key={`${trend.keyword}-${i}`}
            className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
          >
            <TrendingUp className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-emerald-400" />
            <span className="text-xs sm:text-sm text-zinc-300 whitespace-nowrap">
              {trend.keyword}
            </span>
            {trend.change && (
              <span className="text-[8px] sm:text-[10px] text-emerald-400 font-medium">
                +{trend.change}%
              </span>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker 60s linear infinite;
        }
      `}</style>
    </div>
  );
}
