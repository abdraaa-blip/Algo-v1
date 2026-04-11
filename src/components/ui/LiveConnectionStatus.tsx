"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { WifiOff, RefreshCw, Check, AlertCircle } from "lucide-react";

// =============================================================================
// ALGO V1 · Live Connection Status Component
// Shows real-time connection status to data sources
// =============================================================================

export interface DataSource {
  name: string;
  status: "connected" | "error" | "loading" | "offline";
  lastUpdate?: Date | string;
  itemCount?: number;
}

interface LiveConnectionStatusProps {
  sources?: DataSource[];
  isLive?: boolean;
  isLoading?: boolean;
  lastUpdate?: Date | string;
  onRefresh?: () => void;
  variant?: "minimal" | "compact" | "detailed";
  className?: string;
}

export function LiveConnectionStatus({
  sources = [],
  isLive = false,
  isLoading = false,
  lastUpdate,
  onRefresh,
  variant = "compact",
  className,
}: LiveConnectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Count connected sources
  const connectedCount = sources.filter((s) => s.status === "connected").length;
  const totalCount = sources.length;
  const hasErrors = sources.some((s) => s.status === "error");

  // Format last update time
  const formatTime = (date: Date | string | undefined) => {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Minimal variant - just a dot
  if (variant === "minimal") {
    return (
      <span className={cn("relative flex size-2", className)}>
        {isLoading ? (
          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
        ) : isLive ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </>
        ) : (
          <span className="size-2 rounded-full bg-red-500" />
        )}
      </span>
    );
  }

  // Compact variant - dot + label + optional refresh
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1.5">
          {isLoading ? (
            <>
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] text-amber-400 font-medium">
                Connexion...
              </span>
            </>
          ) : isLive ? (
            <>
              <span className="size-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-amber-400 font-medium">
                Connecte
              </span>
              {sources.length > 0 && (
                <span className="text-[9px] text-white/30">
                  {connectedCount}/{totalCount} sources
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff size={10} className="text-red-400" />
              <span className="text-[10px] text-red-400 font-medium">
                Hors ligne
              </span>
            </>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw
              size={12}
              className={cn("text-white/40", isLoading && "animate-spin")}
            />
          </button>
        )}

        {lastUpdate && (
          <span className="text-[9px] text-white/25">
            {formatTime(lastUpdate)}
          </span>
        )}
      </div>
    );
  }

  // Detailed variant - full breakdown
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.02]",
        className,
      )}
    >
      {/* Header */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <>
              <span className="size-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs text-amber-400 font-medium">
                Connexion en cours...
              </span>
            </>
          ) : isLive ? (
            <>
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-xs text-amber-400 font-medium">
                Sources actives
              </span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-400" />
              <span className="text-xs text-red-400 font-medium">
                Connexion perdue
              </span>
            </>
          )}

          {sources.length > 0 && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-bold",
                hasErrors
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-white/10 text-white/50",
              )}
            >
              {connectedCount}/{totalCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-[10px] text-white/30">
              Mis a jour : {formatTime(lastUpdate)}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              disabled={isLoading}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={cn("text-white/50", isLoading && "animate-spin")}
              />
            </button>
          )}
        </div>
      </button>

      {/* Sources breakdown */}
      {showDetails && sources.length > 0 && (
        <div className="border-t border-white/5 p-3 space-y-2">
          {sources.map((source, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {source.status === "connected" && (
                  <Check size={12} className="text-emerald-400" />
                )}
                {source.status === "loading" && (
                  <RefreshCw
                    size={12}
                    className="text-amber-400 animate-spin"
                  />
                )}
                {source.status === "error" && (
                  <AlertCircle size={12} className="text-red-400" />
                )}
                {source.status === "offline" && (
                  <WifiOff size={10} className="text-white/30" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    source.status === "connected"
                      ? "text-white/70"
                      : source.status === "error"
                        ? "text-red-300"
                        : "text-white/40",
                  )}
                >
                  {source.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/30">
                {source.itemCount !== undefined && (
                  <span>{source.itemCount} elements</span>
                )}
                {source.lastUpdate && (
                  <span>{formatTime(source.lastUpdate)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple status indicator for headers - HONEST: no fake "live" labels
export function LiveIndicator({
  isLive = true,
  label,
  className,
}: {
  isLive?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {isLive ? (
        <>
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
            {label || "Actif"}
          </span>
        </>
      ) : (
        <>
          <span className="size-2 rounded-full bg-white/20" />
          <span className="text-[10px] text-white/40 font-medium">
            Hors ligne
          </span>
        </>
      )}
    </div>
  );
}

export default LiveConnectionStatus;
