"use client";

import { useState } from "react";
import {
  X,
  Zap,
  TrendingUp,
  Clock,
  Target,
  Copy,
  Sparkles,
  ChevronRight,
  Play,
  Users,
  Globe2,
  BarChart3,
  CheckCircle,
  Timer,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViralScoreRing } from "./ViralScoreRing";
import { MomentumPill } from "./MomentumPill";
import { LiveIndicator } from "./LivingPulse";
import type { RealTimeTrend } from "@/hooks/useRealTimeTrends";

interface TrendDetailModalProps {
  trend: RealTimeTrend;
  onClose: () => void;
  onCopyHook?: (hook: string) => void;
}

export function TrendDetailModal({
  trend,
  onClose,
  onCopyHook,
}: TrendDetailModalProps) {
  const [copiedHook, setCopiedHook] = useState<number | null>(null);
  const [renderTimestamp] = useState(() => Date.now());

  // Guard against null trend or missing required properties
  if (!trend || !trend.score) {
    return null;
  }

  // Ensure score breakdown exists with defaults
  const scoreBreakdown = trend.score.breakdown || {
    volume: 50,
    velocity: 50,
    engagement: 50,
    growth: 50,
  };

  const actionConfig = {
    post_now: {
      color: "orange",
      icon: Zap,
      label: "POST MAINTENANT",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-400",
    },
    prepare: {
      color: "violet",
      icon: Clock,
      label: "PREPARER",
      bg: "bg-violet-500/10",
      border: "border-violet-500/30",
      text: "text-violet-400",
    },
    wait: {
      color: "blue",
      icon: Timer,
      label: "ATTENDRE",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-400",
    },
    too_late: {
      color: "slate",
      icon: Timer,
      label: "FENETRE PASSEE",
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
      text: "text-slate-400",
    },
  };

  // Safely get prediction with fallback
  const prediction = trend.prediction || {
    recommendedAction: "prepare" as const,
    optimalWindow: ["2h", "4h", "Demain"],
    probability: 0.5,
    windowDuration: 120,
    peakTime: renderTimestamp + 7200000,
  };

  const config =
    actionConfig[prediction.recommendedAction] || actionConfig.prepare;
  const ActionIcon = config.icon;

  // Generate AI hooks based on trend
  const suggestedHooks = [
    `POV: Tu decouvres ${trend.keyword} pour la premiere fois`,
    `Ce que personne ne te dit sur ${trend.keyword}`,
    `${trend.keyword} mais en 15 secondes`,
    `Le secret derriere ${trend.keyword} (thread)`,
  ];

  async function handleCopyHook(hook: string, index: number) {
    await navigator.clipboard.writeText(hook);
    setCopiedHook(index);
    onCopyHook?.(hook);
    setTimeout(() => setCopiedHook(null), 2000);
  }

  // Calculate posting windows with fallback
  const windows = prediction.optimalWindow || ["Maintenant", "30min", "1h"];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-[#12121a] to-[#0a0a12] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-5 border-b border-white/5 bg-[#12121a]/95 backdrop-blur-md rounded-t-3xl">
          <div className="flex items-start gap-4">
            <ViralScoreRing value={trend.score.overall} size="lg" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-white">
                  {trend.keyword}
                </h2>
                <LiveIndicator className="scale-90" />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MomentumPill
                  value={
                    trend.velocity > 0
                      ? `+${trend.velocity}%`
                      : `${trend.velocity}%`
                  }
                  trend={trend.velocity > 0 ? "up" : "down"}
                />
                <span className="text-white/40">{trend.platform}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Recommendation Card */}
          <div
            className={cn("p-4 rounded-2xl border", config.bg, config.border)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2 rounded-xl", config.bg)}>
                <ActionIcon size={20} className={config.text} />
              </div>
              <div>
                <p
                  className={cn(
                    "text-xs font-bold tracking-wider",
                    config.text,
                  )}
                >
                  {config.label}
                </p>
                <p className="text-[11px] text-white/40">
                  Confiance: {Math.round((prediction.probability ?? 0.5) * 100)}
                  %
                </p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              {prediction.reasoning?.[0] ?? "Trend en cours d'analyse"}
            </p>
          </div>

          {/* Optimal Timing */}
          {windows && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-violet-400" />
                <h3 className="text-sm font-bold text-white">
                  Fenetres optimales
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {windows.map((window, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-xl border text-center",
                      i === 0
                        ? "bg-violet-500/10 border-violet-500/30"
                        : "bg-white/5 border-white/10",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-bold",
                        i === 0 ? "text-violet-400" : "text-white/70",
                      )}
                    >
                      {window}
                    </p>
                    {i === 0 && (
                      <p className="text-[10px] text-violet-400/60 mt-1">
                        IDEAL
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-[#00D1FF]" />
              <h3 className="text-sm font-bold text-white">
                Decomposition du score
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ScoreBar
                label="Volume"
                value={scoreBreakdown.volume}
                max={100}
                color="violet"
              />
              <ScoreBar
                label="Velocite"
                value={scoreBreakdown.velocity}
                max={100}
                color="cyan"
              />
              <ScoreBar
                label="Engagement"
                value={scoreBreakdown.engagement}
                max={100}
                color="orange"
              />
              <ScoreBar
                label="Croissance"
                value={scoreBreakdown.growth}
                max={100}
                color="green"
              />
            </div>
          </div>

          {/* AI Suggested Hooks */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-yellow-400" />
              <h3 className="text-sm font-bold text-white">
                Hooks suggeres par l&apos;IA
              </h3>
            </div>
            <div className="space-y-2">
              {suggestedHooks.map((hook, i) => (
                <button
                  key={i}
                  onClick={() => handleCopyHook(hook, i)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 p-3 rounded-xl",
                    "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10",
                    "text-left transition-all group",
                  )}
                >
                  <span className="text-sm text-white/70 group-hover:text-white/90">
                    {hook}
                  </span>
                  {copiedHook === i ? (
                    <CheckCircle
                      size={16}
                      className="text-green-400 shrink-0"
                    />
                  ) : (
                    <Copy
                      size={16}
                      className="text-white/30 group-hover:text-white/60 shrink-0"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Related Sounds */}
          {trend.relatedSounds && trend.relatedSounds.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Play size={14} className="text-pink-400" />
                <h3 className="text-sm font-bold text-white">Sons associes</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trend.relatedSounds.map((sound, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs text-pink-300"
                  >
                    🎵 {sound}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/5">
            <StatBox
              icon={Users}
              label="Createurs"
              value={formatNumber(trend.volume)}
            />
            <StatBox
              icon={TrendingUp}
              label="Velocite"
              value={`${trend.velocity > 0 ? "+" : ""}${trend.velocity}%`}
            />
            <StatBox
              icon={Globe2}
              label="Region"
              value={trend.region || "Global"}
            />
            <StatBox
              icon={BarChart3}
              label="Duree"
              value={prediction.duration || "2-4h"}
            />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 p-4 border-t border-white/5 bg-[#0a0a12]/95 backdrop-blur-md rounded-b-3xl">
          <button
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
              "font-bold text-sm transition-all",
              prediction.recommendedAction === "post_now"
                ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
                : "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30",
            )}
          >
            <Sparkles size={16} />
            <span>
              {prediction.recommendedAction === "post_now"
                ? "Generer un contenu maintenant"
                : "Programmer pour plus tard"}
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ─────────────────────────────────────────────────────

interface ScoreBarProps {
  label: string;
  value: number;
  max: number;
  color: "violet" | "cyan" | "orange" | "green";
}

function ScoreBar({ label, value, max, color }: ScoreBarProps) {
  const colorMap = {
    violet: "from-violet-500 to-purple-500",
    cyan: "from-cyan-400 to-blue-500",
    orange: "from-orange-400 to-red-500",
    green: "from-green-400 to-emerald-500",
  };

  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="p-2 rounded-xl bg-white/5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/40">{label}</span>
        <span className="text-[10px] font-bold text-white/70">
          {Math.round(value)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            colorMap[color],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface StatBoxProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function StatBox({ icon: Icon, label, value }: StatBoxProps) {
  return (
    <div className="p-3 rounded-xl bg-white/5 text-center">
      <Icon size={14} className="mx-auto text-white/40 mb-1" />
      <p className="text-xs font-bold text-white/80">{value}</p>
      <p className="text-[9px] text-white/30">{label}</p>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
