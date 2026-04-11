"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Clock, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppScope } from "@/types";
import { formatRelativeScopeTime } from "@/lib/geo/time-format";
import {
  getScopeCountryCode,
  getTimeZoneForCountry,
} from "@/lib/geo/country-profile";

const GLOBAL_SCOPE: AppScope = { type: "global" };

function getShortTimeZoneLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date());
    return (
      parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone
    );
  } catch {
    return timeZone;
  }
}

interface LastUpdatedProps {
  timestamp: Date | null;
  scope?: AppScope;
  showTimeZone?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  error?: boolean;
  className?: string;
}

/**
 * Last Updated Indicator
 * Shows when content was last refreshed with auto-updating relative time
 */
export function LastUpdated({
  timestamp,
  scope = GLOBAL_SCOPE,
  showTimeZone = true,
  isRefreshing = false,
  onRefresh,
  error = false,
  className,
}: LastUpdatedProps) {
  const [relativeTime, setRelativeTime] = useState("");
  const timeZone = getTimeZoneForCountry(getScopeCountryCode(scope));
  const shortTimeZone = getShortTimeZoneLabel(timeZone);

  // Update relative time every minute
  useEffect(() => {
    const updateTime = () => {
      if (!timestamp) {
        setRelativeTime("");
        return;
      }
      setRelativeTime(formatRelativeScopeTime(timestamp, scope));
    };

    updateTime();
    const interval = setInterval(updateTime, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [timestamp, scope]);

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      title={showTimeZone ? `Fuseau: ${timeZone}` : undefined}
    >
      {/* Status indicator */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg",
          "bg-[var(--color-card)] border border-[var(--color-border)]",
          "text-xs text-[var(--color-text-secondary)]",
        )}
      >
        {isRefreshing ? (
          <>
            <RefreshCw size={12} className="animate-spin text-violet-400" />
            <span className="text-violet-400">Actualisation...</span>
          </>
        ) : error ? (
          <>
            <AlertCircle size={12} className="text-red-400" />
            <span className="text-red-400">Erreur</span>
          </>
        ) : (
          <>
            {relativeTime.includes("now") ||
            relativeTime.includes("instant") ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Clock size={12} />
            )}
            <span>{relativeTime || "Jamais"}</span>
            {showTimeZone && relativeTime && (
              <span className="text-[var(--color-text-muted)]">
                [{shortTimeZone}]
              </span>
            )}
          </>
        )}
      </div>

      {/* Refresh button */}
      {onRefresh && !isRefreshing && (
        <button
          onClick={onRefresh}
          className={cn(
            "p-1.5 rounded-lg",
            "bg-[var(--color-card)] border border-[var(--color-border)]",
            "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)]",
            "transition-all duration-150",
          )}
          title="Actualiser"
        >
          <RefreshCw size={12} />
        </button>
      )}
    </div>
  );
}

/**
 * Live pulse indicator for real-time data
 */
export function LiveIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
        Live
      </span>
    </div>
  );
}

/**
 * Compact refresh status for headers
 */
export function RefreshStatus({
  lastUpdate,
  isRefreshing,
  className,
}: {
  lastUpdate: Date | null;
  isRefreshing: boolean;
  className?: string;
}) {
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  if (isRefreshing) {
    return (
      <div className={cn("flex items-center gap-1 text-violet-400", className)}>
        <RefreshCw size={10} className="animate-spin" />
        <span className="text-[10px] font-medium">Actualisation</span>
      </div>
    );
  }

  if (!lastUpdate) return null;

  const seconds = Math.floor((nowTs - lastUpdate.getTime()) / 1000);
  const isRecent = seconds < 60;

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        isRecent ? "text-emerald-400" : "text-[var(--color-text-muted)]",
        className,
      )}
    >
      {isRecent ? <Check size={10} /> : <Clock size={10} />}
      <span className="text-[10px] font-medium">
        {isRecent ? "A jour" : `${Math.floor(seconds / 60)}min`}
      </span>
    </div>
  );
}
