"use client";
// REBUILD: 2026-04-05T06:15 - Simplified with pure CSS animations

import { cn } from "@/lib/utils";

interface AlgoHeartbeatProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

// Fixed dimensions using Tailwind classes only - no JS calculations
const sizeConfig = {
  sm: { text: "text-2xl", container: "w-36 h-14" },
  md: { text: "text-4xl", container: "w-52 h-20" },
  lg: { text: "text-6xl", container: "w-80 h-28" },
  xl: { text: "text-8xl", container: "w-[420px] h-40" },
};

export function AlgoHeartbeat({
  className,
  size = "lg",
  showTagline = false,
}: AlgoHeartbeatProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center justify-center overflow-hidden",
        config.container,
        showTagline && "pb-8",
        className,
      )}
      aria-label="ALGO - L'algorithme des algorithmes"
    >
      {/* Glow effect - CSS only */}
      <div
        className="absolute inset-0 blur-2xl opacity-30 animate-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.6) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Pulsing ring - CSS animation */}
      <div
        className="absolute inset-4 rounded-full border-2 border-violet-500/40 animate-ping"
        style={{ animationDuration: "2s" }}
        aria-hidden="true"
      />

      {/* Second ring */}
      <div
        className="absolute inset-6 rounded-full border border-cyan-400/30 animate-pulse"
        style={{ animationDuration: "1.5s" }}
        aria-hidden="true"
      />

      {/* Logo text */}
      <span
        className={cn(
          "relative z-10 font-black tracking-tighter",
          "bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent",
          "animate-pulse",
          config.text,
        )}
        style={{ animationDuration: "2s" }}
      >
        ALGO
      </span>

      {/* Tagline */}
      {showTagline && (
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-white/40 whitespace-nowrap font-light tracking-wider"
          aria-hidden="true"
        >
          L&apos;algorithme des algorithmes
        </span>
      )}
    </div>
  );
}

// Named export for memo compatibility
export default AlgoHeartbeat;
