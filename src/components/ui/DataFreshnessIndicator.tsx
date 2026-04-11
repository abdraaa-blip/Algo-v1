"use client";

import { useDataFreshness } from "@/hooks/useAlgoSystem";
import type { CacheSource } from "@/services/AlgoCache";
import { cn } from "@/lib/utils";

interface DataFreshnessIndicatorProps {
  source: CacheSource;
  showLabel?: boolean;
  className?: string;
}

/**
 * Shows a colored dot indicating data freshness
 * - Green: Under 15 minutes old
 * - Yellow: 15 minutes to 1 hour old
 * - Red: Over 1 hour old
 */
export function DataFreshnessIndicator({
  source,
  showLabel = false,
  className,
}: DataFreshnessIndicatorProps) {
  const { freshness, age, indicatorColor } = useDataFreshness(source);

  const formatAge = () => {
    if (age < 60 * 1000) return "À l'instant";
    if (age < 60 * 60 * 1000) return `Il y a ${Math.floor(age / 60000)} min`;
    return `Il y a ${Math.floor(age / 3600000)}h`;
  };

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      title={`Données ${freshness === "fresh" ? "fraîches" : freshness === "stale" ? "récentes" : "anciennes"} - ${formatAge()}`}
    >
      <div className="relative">
        <div className={cn("size-2 rounded-full", indicatorColor)} />
        {freshness === "fresh" && (
          <div
            className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-75",
              indicatorColor,
            )}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-[10px] text-white/50">{formatAge()}</span>
      )}
    </div>
  );
}
