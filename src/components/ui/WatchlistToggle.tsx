"use client";

import { Radar } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchlistToggleProps {
  trendId: string;
  isFollowing: boolean;
  onToggle: (trendId: string) => void;
  followLabel: string;
  unfollowLabel: string;
  size?: "sm" | "md";
  className?: string;
}

export function WatchlistToggle({
  trendId,
  isFollowing,
  onToggle,
  followLabel,
  unfollowLabel,
  size = "md",
  className,
}: WatchlistToggleProps) {
  return (
    <button
      onClick={() => onToggle(trendId)}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? unfollowLabel : followLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        "transition-all duration-[250ms] outline-none",
        "focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#07070f]",
        size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        isFollowing
          ? "bg-[rgba(123,97,255,0.18)] border border-[rgba(123,97,255,0.32)] text-violet-300"
          : [
              "bg-white/4 border border-white/9 text-white/40",
              "hover:bg-white/8 hover:text-white/65 hover:border-white/18",
            ].join(" "),
        className,
      )}
    >
      <Radar
        size={size === "sm" ? 10 : 12}
        strokeWidth={isFollowing ? 2.2 : 1.6}
        className={isFollowing ? "text-violet-400" : "text-white/30"}
        aria-hidden
      />
      {isFollowing ? unfollowLabel : followLabel}
    </button>
  );
}
