"use client";

import { Flame, TrendingUp, Zap } from "lucide-react";

type TrendLevel = "hot" | "rising" | "early";

interface TrendLevelBadgeProps {
  level: TrendLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

const LEVEL_CONFIG: Record<
  TrendLevel,
  {
    icon: typeof Flame;
    label: string;
    labelFr: string;
    bg: string;
    border: string;
    text: string;
    glow: string;
  }
> = {
  hot: {
    icon: Flame,
    label: "Hot Now",
    labelFr: "Explose",
    bg: "linear-gradient(135deg, rgba(255,77,109,0.25), rgba(255,140,0,0.2))",
    border: "rgba(255,77,109,0.5)",
    text: "#ff4d6d",
    glow: "0 0 12px rgba(255,77,109,0.4)",
  },
  rising: {
    icon: TrendingUp,
    label: "Rising",
    labelFr: "Monte",
    bg: "linear-gradient(135deg, rgba(255,193,7,0.2), rgba(255,140,0,0.15))",
    border: "rgba(255,193,7,0.4)",
    text: "#ffc107",
    glow: "0 0 10px rgba(255,193,7,0.3)",
  },
  early: {
    icon: Zap,
    label: "Early Signal",
    labelFr: "Opportunite",
    bg: "linear-gradient(135deg, rgba(0,209,255,0.2), rgba(123,97,255,0.15))",
    border: "rgba(0,209,255,0.4)",
    text: "#00d1ff",
    glow: "0 0 10px rgba(0,209,255,0.3)",
  },
};

const SIZE_CONFIG = {
  sm: {
    padding: "px-1.5 py-0.5",
    text: "text-[8px]",
    icon: 10,
    gap: "gap-0.5",
  },
  md: { padding: "px-2 py-1", text: "text-[10px]", icon: 12, gap: "gap-1" },
  lg: { padding: "px-3 py-1.5", text: "text-xs", icon: 14, gap: "gap-1.5" },
};

export function TrendLevelBadge({
  level,
  size = "md",
  showLabel = true,
  animated = true,
}: TrendLevelBadgeProps) {
  // Fallback to 'early' if level is invalid or undefined
  const safeLevel = LEVEL_CONFIG[level] ? level : "early";
  const config = LEVEL_CONFIG[safeLevel];
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding} rounded-full font-bold ${sizeConfig.text} ${animated && level === "hot" ? "animate-pulse" : ""}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        boxShadow: config.glow,
      }}
    >
      <Icon size={sizeConfig.icon} />
      {showLabel && <span>{config.labelFr}</span>}
    </div>
  );
}

// Helper to determine trend level from score
export function getTrendLevel(
  viralScore: number,
  growthRate?: number,
): TrendLevel {
  if (viralScore >= 85 || (growthRate && growthRate > 300)) return "hot";
  if (viralScore >= 65 || (growthRate && growthRate > 100)) return "rising";
  return "early";
}
