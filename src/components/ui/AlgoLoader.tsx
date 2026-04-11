"use client";

import { cn } from "@/lib/utils";
import { ALGO_UI_LOADING } from "@/lib/copy/ui-strings";

type LoaderSize = "sm" | "md" | "lg";

const sizeCfg: Record<LoaderSize, { dot: string; gap: string; text: string }> =
  {
    sm: { dot: "size-1.5", gap: "gap-1", text: "text-xs" },
    md: { dot: "size-2", gap: "gap-1.5", text: "text-sm" },
    lg: { dot: "size-2.5", gap: "gap-2", text: "text-sm" },
  };

interface AlgoLoaderProps {
  message?: string;
  size?: LoaderSize;
  fullScreen?: boolean;
  className?: string;
}

export function AlgoLoader({
  message,
  size = "md",
  fullScreen,
  className,
}: AlgoLoaderProps) {
  const { dot, gap, text } = sizeCfg[size];

  return (
    <div
      role="status"
      aria-label={message ?? ALGO_UI_LOADING.root}
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center",
        fullScreen && "min-h-48",
        className,
      )}
    >
      {/* 3 points séquentiels */}
      <div className={cn("flex items-center", gap)} aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("rounded-full bg-violet-500 shrink-0", dot)}
            style={{
              animation: `algo-dot-seq 1.2s ease-in-out infinite`,
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>

      {/* Message i18n · fourni par le parent */}
      {message && (
        <p className={cn("mt-3 text-white/35 font-medium tracking-wide", text)}>
          {message}
        </p>
      )}
    </div>
  );
}
