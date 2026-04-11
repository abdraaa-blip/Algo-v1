"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";
import {
  DAILY_CHALLENGES,
  calculateProgress,
  type Challenge,
} from "@/lib/viral/challenge-system";

interface DailyChallengeWidgetProps {
  className?: string;
  compact?: boolean;
}

export function DailyChallengeWidget({
  className,
  compact = false,
}: DailyChallengeWidgetProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(
    null,
  );
  const [timeLeft, setTimeLeft] = useState("");
  const { trigger } = useHaptic();

  // Initialize challenges with mock participant data
  useEffect(() => {
    const withParticipants = DAILY_CHALLENGES.map((c) => ({
      ...c,
      participantCount: Math.floor(Math.random() * 50000) + 10000,
      completionRate: Math.floor(Math.random() * 40) + 20,
    }));
    setChallenges(withParticipants);
    setActiveChallenge(withParticipants[0] || null);
  }, []);

  // Update time remaining
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleChallengeClick = (challenge: Challenge) => {
    trigger("light");
    setActiveChallenge(challenge);
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl",
          "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10",
          "border border-orange-500/20",
          className,
        )}
      >
        <div className="flex items-center justify-center size-10 rounded-xl bg-orange-500/20">
          <Trophy className="size-5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {challenges.length} Defis du jour
          </p>
          <p className="text-xs text-white/50">{timeLeft} restant</p>
        </div>
        <ChevronRight className="size-5 text-white/30" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-[#1a1a1f] to-[#0f0f12]",
        "border border-[var(--color-border)]",
        className,
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Trophy className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Defis du jour
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Clock className="size-3" />
                <span>{timeLeft} restant</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">
            <Zap className="size-3" />
            <span className="text-xs font-medium">
              +{challenges.reduce((sum, c) => sum + c.xpReward, 0)} XP
            </span>
          </div>
        </div>
      </div>

      {/* Challenge list */}
      <div className="p-2">
        {challenges.map((challenge) => {
          const progress = calculateProgress(challenge.requirements);
          const isActive = activeChallenge?.id === challenge.id;

          return (
            <button
              key={challenge.id}
              onClick={() => handleChallengeClick(challenge)}
              className={cn(
                "w-full p-3 rounded-xl text-left transition-all duration-200",
                isActive
                  ? "bg-[var(--color-card-hover)] ring-1 ring-[var(--color-border)]"
                  : "hover:bg-[var(--color-card)]",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{challenge.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white truncate">
                      {challenge.title}
                    </h4>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 text-[10px] font-medium rounded",
                        challenge.difficulty === "easy" &&
                          "bg-emerald-500/20 text-emerald-400",
                        challenge.difficulty === "medium" &&
                          "bg-amber-500/20 text-amber-400",
                        challenge.difficulty === "hard" &&
                          "bg-red-500/20 text-red-400",
                        challenge.difficulty === "legendary" &&
                          "bg-violet-500/20 text-violet-400",
                      )}
                    >
                      {challenge.difficulty === "easy"
                        ? "facile"
                        : challenge.difficulty === "medium"
                          ? "moyen"
                          : challenge.difficulty === "hard"
                            ? "difficile"
                            : "legendaire"}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
                    {challenge.description}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[var(--color-card-hover)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/40 tabular-nums">
                      {progress}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Sparkles className="size-3" />
                    <span className="text-xs font-medium">
                      +{challenge.xpReward}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-white/30">
                    <Users className="size-3" />
                    <span className="text-[10px]">
                      {(challenge.participantCount / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <button
          className={cn(
            "w-full py-2.5 rounded-xl",
            "bg-gradient-to-r from-orange-500 to-amber-500",
            "text-white text-sm font-semibold",
            "hover:from-orange-400 hover:to-amber-400",
            "transition-all duration-200",
            "shadow-lg shadow-orange-500/20",
          )}
        >
          Voir tous les defis
        </button>
      </div>
    </div>
  );
}
