"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, Database, Newspaper, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataSourceStatus {
  name: string;
  status: "live" | "cached" | "offline" | "loading";
  lastUpdate?: string;
  count?: number;
}

export function LiveDataStatus() {
  const [sources, setSources] = useState<DataSourceStatus[]>([
    { name: "NewsAPI", status: "loading" },
    { name: "YouTube", status: "loading" },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        // Check news
        const newsRes = await fetch("/api/live-news?country=us", {
          signal: AbortSignal.timeout(5000),
        });
        const newsData = await newsRes.json();

        // Check videos
        const videosRes = await fetch("/api/live-videos?region=US", {
          signal: AbortSignal.timeout(5000),
        });
        const videosData = await videosRes.json();

        setSources([
          {
            name: "NewsAPI",
            status:
              newsData.source === "live"
                ? "live"
                : newsData.source === "cache"
                  ? "cached"
                  : "offline",
            lastUpdate: newsData.fetchedAt,
            count: newsData.count || 0,
          },
          {
            name: "YouTube",
            status:
              videosData.source === "live"
                ? "live"
                : videosData.source === "cache"
                  ? "cached"
                  : "offline",
            lastUpdate: videosData.fetchedAt,
            count: videosData.count || 0,
          },
        ]);
      } catch {
        setSources([
          { name: "NewsAPI", status: "offline" },
          { name: "YouTube", status: "offline" },
        ]);
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const allLive = sources.every((s) => s.status === "live");
  const anyOffline = sources.some((s) => s.status === "offline");

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full",
          "bg-black/80 backdrop-blur-sm border",
          "transition-all duration-200",
          allLive
            ? "border-green-500/30"
            : anyOffline
              ? "border-red-500/30"
              : "border-yellow-500/30",
        )}
      >
        {allLive ? (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-amber-400">Actif</span>
          </>
        ) : anyOffline ? (
          <>
            <WifiOff size={14} className="text-red-400" />
            <span className="text-xs font-medium text-red-400">Partial</span>
          </>
        ) : (
          <>
            <Wifi size={14} className="text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Cached</span>
          </>
        )}
      </button>

      {isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 rounded-xl bg-[color-mix(in_srgb,var(--color-bg-secondary)_92%,transparent)] backdrop-blur-sm border border-[var(--color-border)]">
          <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
            <Database size={12} />
            Data Sources
          </h4>

          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {source.name === "NewsAPI" ? (
                    <Newspaper
                      size={14}
                      className="text-[var(--color-text-tertiary)]"
                    />
                  ) : (
                    <Video
                      size={14}
                      className="text-[var(--color-text-tertiary)]"
                    />
                  )}
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {source.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {source.count !== undefined && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">
                      {source.count} items
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      source.status === "live"
                        ? "bg-amber-500/20 text-amber-400"
                        : source.status === "cached"
                          ? "bg-zinc-500/20 text-zinc-400"
                          : source.status === "loading"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-red-500/20 text-red-400",
                    )}
                  >
                    {source.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-[var(--color-border)]">
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Data refreshes every 15 minutes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
