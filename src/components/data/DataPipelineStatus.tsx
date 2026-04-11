"use client";

/**
 * DataPipelineStatus - Unified data status display component
 *
 * Shows honest, transparent information about data freshness:
 * - When data was fetched
 * - How often it refreshes
 * - Current status (active, delayed, static, error)
 * - Optional refresh button
 */

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DataPipeline,
  type DataStatus,
  type DataSourceConfig,
} from "@/lib/data-pipeline";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataPipelineStatusProps {
  sourceId: string;
  fetchedAt: string | Date | null;
  status?: DataStatus;
  variant?: "badge" | "pill" | "full" | "minimal";
  showTimestamp?: boolean;
  showRefreshInterval?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

// ─── Status Colors ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  DataStatus,
  { bg: string; text: string; dot: string }
> = {
  active: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  delayed: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  static: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    dot: "bg-zinc-400",
  },
  error: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },
  loading: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DataPipelineStatus({
  sourceId,
  fetchedAt,
  status: statusOverride,
  variant = "badge",
  showTimestamp = true,
  showRefreshInterval = true,
  onRefresh,
  isRefreshing = false,
  className,
}: DataPipelineStatusProps) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  const config = DataPipeline.sources[sourceId];

  // Determine actual status
  const status: DataStatus =
    statusOverride ||
    (fetchedAt
      ? DataPipeline.determineStatus(
          fetchedAt,
          config ||
            ({
              refreshIntervalMs: 15 * 60 * 1000,
              maxAgeMs: 60 * 60 * 1000,
            } as DataSourceConfig),
        )
      : "loading");

  const styles = STATUS_STYLES[status];
  const statusLabel = DataPipeline.getStatusLabel(status);

  // Update relative time every minute
  useEffect(() => {
    if (!fetchedAt) return;

    const updateTime = () => {
      setRelativeTime(DataPipeline.formatRelativeTime(fetchedAt));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [fetchedAt]);

  const refreshIntervalLabel = config
    ? DataPipeline.getRefreshIntervalLabel(config.refreshIntervalMs)
    : "15 min";

  // ─── Badge Variant ────────────────────────────────────────────────────────────

  if (variant === "badge") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border",
            styles.bg,
            styles.text,
            `border-${DataPipeline.getStatusColor(status)}-500/20`,
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />
          {statusLabel}
        </span>

        {showTimestamp && relativeTime && (
          <span className="text-[10px] text-white/30">{relativeTime}</span>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw
              size={12}
              className={cn(isRefreshing && "animate-spin")}
            />
          </button>
        )}
      </div>
    );
  }

  // ─── Pill Variant ─────────────────────────────────────────────────────────────

  if (variant === "pill") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          styles.bg,
          "border",
          `border-${DataPipeline.getStatusColor(status)}-500/20`,
          className,
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", styles.dot)} />

        <div className="flex flex-col">
          <span className={cn("text-xs font-medium", styles.text)}>
            {config?.name || sourceId}
          </span>
          <span className="text-[10px] text-white/40">
            {showRefreshInterval && `MAJ ${refreshIntervalLabel}`}
            {showRefreshInterval && showTimestamp && relativeTime && " · "}
            {showTimestamp && relativeTime}
          </span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "ml-auto p-1.5 rounded-full transition-colors disabled:opacity-50",
              styles.bg,
              `hover:bg-${DataPipeline.getStatusColor(status)}-500/20`,
            )}
            title="Actualiser"
          >
            <RefreshCw
              size={14}
              className={cn(styles.text, isRefreshing && "animate-spin")}
            />
          </button>
        )}
      </div>
    );
  }

  // ─── Full Variant ─────────────────────────────────────────────────────────────

  if (variant === "full") {
    return (
      <div
        className={cn(
          "p-3 rounded-xl border",
          styles.bg,
          `border-${DataPipeline.getStatusColor(status)}-500/20`,
          className,
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {status === "active" ? (
              <CheckCircle size={16} className={styles.text} />
            ) : status === "error" ? (
              <AlertCircle size={16} className={styles.text} />
            ) : status === "loading" ? (
              <RefreshCw
                size={16}
                className={cn(styles.text, "animate-spin")}
              />
            ) : (
              <Clock size={16} className={styles.text} />
            )}
            <span className={cn("text-sm font-medium", styles.text)}>
              {config?.name || sourceId}
            </span>
          </div>

          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
              styles.bg,
              styles.text,
            )}
          >
            {status}
          </span>
        </div>

        <div className="space-y-1 text-xs text-white/50">
          {showTimestamp && fetchedAt && (
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>Mis a jour {relativeTime}</span>
            </div>
          )}

          {showRefreshInterval && (
            <div className="flex items-center gap-2">
              <RefreshCw size={12} />
              <span>Actualisation toutes les {refreshIntervalLabel}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {status === "error" ? <WifiOff size={12} /> : <Wifi size={12} />}
            <span>{statusLabel}</span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50",
              styles.bg,
              styles.text,
              `hover:bg-${DataPipeline.getStatusColor(status)}-500/20`,
            )}
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Actualisation..." : "Actualiser maintenant"}
          </button>
        )}
      </div>
    );
  }

  // ─── Minimal Variant ──────────────────────────────────────────────────────────

  return (
    <div className={cn("flex items-center gap-1.5 text-[10px]", className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />
      <span className={styles.text}>{statusLabel}</span>
      {showTimestamp && relativeTime && (
        <span className="text-white/30">({relativeTime})</span>
      )}
    </div>
  );
}

// ─── Multi-Source Status ──────────────────────────────────────────────────────

interface MultiSourceStatusProps {
  sources: Array<{
    id: string;
    fetchedAt: string | null;
    status?: DataStatus;
  }>;
  className?: string;
}

export function MultiSourceStatus({
  sources,
  className,
}: MultiSourceStatusProps) {
  const activeCount = sources.filter(
    (s) =>
      s.status === "active" ||
      (s.fetchedAt &&
        DataPipeline.determineStatus(
          s.fetchedAt,
          DataPipeline.sources[s.id] ||
            ({
              refreshIntervalMs: 900000,
              maxAgeMs: 3600000,
            } as DataSourceConfig),
        ) === "active"),
  ).length;

  const totalCount = sources.length;
  const allActive = activeCount === totalCount;

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          allActive
            ? "bg-amber-400"
            : activeCount > 0
              ? "bg-yellow-400"
              : "bg-red-400",
        )}
      />
      <span
        className={
          allActive
            ? "text-amber-400"
            : activeCount > 0
              ? "text-yellow-400"
              : "text-red-400"
        }
      >
        {activeCount}/{totalCount} sources actives
      </span>
    </div>
  );
}

// ─── Fallback Message ─────────────────────────────────────────────────────────

interface FallbackMessageProps {
  sourceId: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function FallbackMessage({
  sourceId,
  onRetry,
  isRetrying = false,
  className,
}: FallbackMessageProps) {
  const config = DataPipeline.sources[sourceId];

  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-amber-500/10 border border-amber-500/20",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-300 font-medium">
            Données temporairement indisponibles
          </p>
          <p className="text-xs text-amber-300/70 mt-1">
            Les données de {config?.name || sourceId} ne sont pas disponibles.
            Les dernières données valides sont affichées.
          </p>

          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={isRetrying ? "animate-spin" : ""}
              />
              {isRetrying ? "Nouvelle tentative…" : "Réessayer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataPipelineStatus;
