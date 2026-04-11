"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Zap, Crown, Trophy } from "lucide-react";
import {
  getLocalStreak,
  calculateLevelProgress,
  LEVEL_NAMES,
  type UserStreak,
} from "@/lib/gamification/streak-system";

interface LevelBadgeProps {
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  showXP?: boolean;
  animate?: boolean;
}

const LEVEL_COLORS: Record<
  number,
  { primary: string; secondary: string; glow: string }
> = {
  1: {
    primary: "#6B7280",
    secondary: "#374151",
    glow: "rgba(107,114,128,0.3)",
  },
  2: { primary: "#10B981", secondary: "#059669", glow: "rgba(16,185,129,0.3)" },
  3: { primary: "#3B82F6", secondary: "#2563EB", glow: "rgba(59,130,246,0.3)" },
  4: { primary: "#8B5CF6", secondary: "#7C3AED", glow: "rgba(139,92,246,0.3)" },
  5: { primary: "#EC4899", secondary: "#DB2777", glow: "rgba(236,72,153,0.3)" },
  6: { primary: "#F59E0B", secondary: "#D97706", glow: "rgba(245,158,11,0.3)" },
  7: { primary: "#EF4444", secondary: "#DC2626", glow: "rgba(239,68,68,0.3)" },
  8: { primary: "#06B6D4", secondary: "#0891B2", glow: "rgba(6,182,212,0.3)" },
  9: { primary: "#F97316", secondary: "#EA580C", glow: "rgba(249,115,22,0.3)" },
  10: { primary: "#FFD700", secondary: "#FFA500", glow: "rgba(255,215,0,0.5)" },
};

const LEVEL_ICONS: Record<number, typeof Star> = {
  1: Star,
  2: Star,
  3: Star,
  4: Zap,
  5: Zap,
  6: Zap,
  7: Crown,
  8: Crown,
  9: Crown,
  10: Trophy,
};

export function LevelBadge({
  size = "md",
  showProgress = false,
  showXP = false,
  animate = true,
}: LevelBadgeProps) {
  const [streak, setStreak] = useState<UserStreak | null>(null);

  useEffect(() => {
    setStreak(getLocalStreak());
  }, []);

  if (!streak) return null;

  const level = streak.level;
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS[1];
  const Icon = LEVEL_ICONS[level] || Star;
  const levelName = LEVEL_NAMES[level - 1] || "Debutant";
  const progress = calculateLevelProgress(streak.xp);

  const sizes = {
    sm: { badge: "w-8 h-8", icon: "w-4 h-4", text: "text-xs", progress: "h-1" },
    md: {
      badge: "w-12 h-12",
      icon: "w-6 h-6",
      text: "text-sm",
      progress: "h-1.5",
    },
    lg: {
      badge: "w-16 h-16",
      icon: "w-8 h-8",
      text: "text-base",
      progress: "h-2",
    },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* Level Badge */}
      <motion.div
        initial={animate ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        className={`relative ${s.badge} rounded-full flex items-center justify-center`}
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
      >
        {level === 10 && animate && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${colors.primary}, transparent)`,
              opacity: 0.5,
            }}
          />
        )}
        <Icon className={`${s.icon} text-white relative z-10`} />
        <span
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
          style={{ background: colors.secondary, border: "2px solid #0a0a0f" }}
        >
          {level}
        </span>
      </motion.div>

      {/* Level Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-white ${s.text}`}>{levelName}</span>
          {level >= 7 && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
              style={{
                background: `${colors.primary}33`,
                color: colors.primary,
              }}
            >
              Elite
            </span>
          )}
        </div>

        {showXP && (
          <p className="text-xs text-white/40">
            {streak.xp.toLocaleString()} XP total
          </p>
        )}

        {showProgress && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-white/30">
                {progress.current} / {progress.required} XP
              </span>
              <span className="text-[10px] text-white/50">
                {progress.percentage}%
              </span>
            </div>
            <div
              className={`${s.progress} rounded-full bg-white/10 overflow-hidden`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for navbar
 */
export function LevelBadgeCompact() {
  const [streak, setStreak] = useState<UserStreak | null>(null);

  useEffect(() => {
    setStreak(getLocalStreak());
  }, []);

  if (!streak) return null;

  const level = streak.level;
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS[1];
  const Icon = LEVEL_ICONS[level] || Star;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full cursor-pointer hover:bg-white/5 transition-colors"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
        }}
      >
        <Icon className="w-3 h-3 text-white" />
      </div>
      <span className="text-xs font-bold text-white">{level}</span>
    </motion.div>
  );
}
