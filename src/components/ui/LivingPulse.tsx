"use client";
// Build timestamp: 2026-04-05T06:10 - Exports: LivingPulse, LiveIndicator, DataFlowVisualizer

import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

interface LivingPulseProps {
  className?: string;
  intensity?: number; // 0-100
  showStats?: boolean;
  compact?: boolean;
}

/**
 * LivingPulse · Un indicateur visuel que l'algorithme est actif et connecté au monde
 * Uses pure CSS animations to avoid hydration mismatches
 */
export function LivingPulse({
  className,
  intensity = 50,
  showStats = true,
  compact = false,
}: LivingPulseProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative size-3 flex items-center justify-center">
          <div className="size-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-3 rounded-full bg-violet-400/50 animate-ping" />
          </div>
        </div>
        <span className="text-[10px] text-violet-400/70 font-mono">ACTIF</span>
      </div>
    );
  }

  const safeIntensity = Number.isFinite(intensity) ? intensity : 50;
  const glowIntensity = 0.3 + safeIntensity / 200;
  const animationDuration = `${3 - safeIntensity / 50}s`;

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 p-3 rounded-2xl",
        "bg-gradient-to-r from-[#0f0f1a]/80 to-[#0a0a12]/80",
        "border border-white/5",
        "backdrop-blur-xl",
        "z-10",
        className,
      )}
    >
      {/* Pulse Circle - Fixed 60px container */}
      <div className="relative flex items-center justify-center w-[60px] h-[60px]">
        {/* Glow background - CSS animation */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, rgba(123, 97, 255, ${glowIntensity}) 0%, transparent 70%)`,
            animationDuration,
          }}
        />

        {/* Outer ring - CSS spin animation */}
        <div
          className="absolute inset-1 rounded-full border border-violet-500/30 border-dashed animate-spin"
          style={{ animationDuration: "8s" }}
        />

        {/* Middle pulse ring */}
        <div
          className="absolute inset-2 rounded-full border-2 border-[#00D1FF]/50 animate-pulse"
          style={{ animationDuration }}
        />

        {/* Center icon */}
        <div className="relative z-10 flex items-center justify-center size-6 rounded-full bg-gradient-to-br from-violet-500 to-[#00D1FF]">
          <Activity size={14} className="text-white" strokeWidth={2.5} />
        </div>

        {/* Orbiting dots - CSS animation */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute size-1.5 rounded-full bg-[#00D1FF] animate-spin"
            style={{
              animationDuration: "4s",
              transformOrigin: "center center",
              left: "50%",
              top: "50%",
              marginLeft: "-3px",
              marginTop: "-3px",
              transform: `rotate(${i * 120}deg) translateX(26px)`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Stats */}
      {showStats && (
        <div className="flex flex-col gap-1.5">
          {/* Status line */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-0.5 rounded-full",
                    i <= 3 ? "bg-violet-400" : "bg-white/10",
                  )}
                  style={{ height: 4 + i * 3 }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-violet-400 tracking-wider">
              ALGO ACTIF
            </span>
          </div>

          {/* Data flow indicator */}
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-violet-500/60 rounded-sm animate-pulse"
                  style={{
                    height: 8 + (i % 3) * 4,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
            <span>streaming</span>
          </div>

          {/* Activity counter */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="size-1 rounded-full bg-[#00D1FF] animate-pulse" />
            <span className="text-white/50 font-mono">
              {safeIntensity}% intensite
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Activity indicator export for other components
// NOTE: This does NOT mean real-time data - it just shows the system is active
export function LiveIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="relative flex items-center justify-center size-2">
        <div className="size-2 rounded-full bg-amber-500" />
        <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
      </div>
      <span className="text-[10px] font-medium text-amber-400">
        MAJ recente
      </span>
    </div>
  );
}

// Data flow visualizer - animated bars showing data streaming
interface DataFlowVisualizerProps {
  className?: string;
  particleCount?: number;
}

export function DataFlowVisualizer({
  className,
  particleCount = 20,
}: DataFlowVisualizerProps) {
  const barCount = Math.min(particleCount, 30);

  return (
    <div className={cn("flex items-end justify-center gap-0.5 h-8", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-gradient-to-t from-violet-600 to-cyan-400 rounded-full animate-pulse"
          style={{
            height: `${20 + (i % 5) * 15}%`,
            animationDelay: `${i * 0.05}s`,
            animationDuration: "0.8s",
            opacity: 0.4 + (i % 3) * 0.2,
          }}
        />
      ))}
    </div>
  );
}
