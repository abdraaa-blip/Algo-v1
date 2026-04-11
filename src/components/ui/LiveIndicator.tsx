"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

// Inline helper to avoid importing from real-data-service
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface LiveIndicatorProps {
  fetchedAt: string | null;
  source: "live" | "cached" | "fallback" | "error";
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
  compact?: boolean;
}

export function LiveIndicator({
  fetchedAt,
  source,
  onRefresh,
  isRefreshing = false,
  className = "",
  compact = false,
}: LiveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (!fetchedAt) return;

    const update = () => setTimeAgo(formatRelativeTime(fetchedAt));
    update();

    const interval = setInterval(update, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [fetchedAt]);

  // Honest status labels - no fake "LIVE" unless truly real-time
  const statusConfig = {
    live: {
      color: "bg-amber-500",
      textColor: "text-amber-400",
      label: "ACTIF",
      icon: Wifi,
    },
    cached: {
      color: "bg-zinc-500",
      textColor: "text-zinc-400",
      label: "CACHE",
      icon: Wifi,
    },
    fallback: {
      color: "bg-orange-500",
      textColor: "text-orange-400",
      label: "SECOURS",
      icon: WifiOff,
    },
    error: {
      color: "bg-red-500",
      textColor: "text-red-400",
      label: "ERREUR",
      icon: WifiOff,
    },
  };

  const config = statusConfig[source];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span
          className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}
        />
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${config.color} ${source === "live" ? "animate-pulse" : ""}`}
        />
        <Icon size={12} className={config.textColor} />
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {timeAgo && <span className="text-xs text-white/40">{timeAgo}</span>}

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="Refresh data"
        >
          <RefreshCw
            size={12}
            className={`text-white/60 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      )}
    </div>
  );
}

// Smaller badge variant for cards
export function LiveBadge({
  source,
  className = "",
}: {
  source: "live" | "cached" | "fallback" | "error";
  className?: string;
}) {
  // Honest color and label mapping
  const colors = {
    live: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    cached: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    fallback: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const labels = {
    live: "ACTIF",
    cached: "CACHE",
    fallback: "SECOURS",
    error: "ERREUR",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border ${colors[source]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${source === "live" ? "bg-amber-400" : source === "cached" ? "bg-zinc-400" : "bg-orange-400"}`}
      />
      {labels[source]}
    </span>
  );
}
