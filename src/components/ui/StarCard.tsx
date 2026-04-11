"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BadgeCheck,
  Music,
  Mic,
  Laugh,
  Camera,
  Gamepad2,
  Trophy,
  Film,
  Globe,
  Video,
  Play,
  ExternalLink,
  Sparkles,
  Flame,
  Zap,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViralScoreRing } from "@/components/ui/ViralScoreRing";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

interface RisingStar {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  cover_url?: string;
  category:
    | "rapper"
    | "singer"
    | "comedian"
    | "influencer"
    | "creator"
    | "athlete"
    | "actor";
  country_code: string;
  platforms: string[];
  social_links?: { platform: string; url: string; username: string }[];
  total_followers: number;
  follower_growth_24h: number;
  follower_growth_7d: number;
  viral_score: number;
  momentum: "exploding" | "rising" | "peaked" | "steady" | "cooling";
  trending_content:
    | { title: string; type: string; url: string; views: number }[]
    | string[];
  best_video?: {
    title: string;
    url: string;
    thumbnail: string;
    views: number;
    platform: string;
  };
  buzz_keywords: string[];
  sentiment_score: number;
  mention_count_24h: number;
  verified: boolean;
  top_platforms: {
    platform: string;
    followers: number;
    growth: number;
    url?: string;
  }[];
  bio?: string;
  is_future_star?: boolean;
  algo_prediction?: string;
}

interface StarCardProps {
  star: RisingStar;
  rank?: number;
  variant?: "featured" | "compact" | "list";
  showPrediction?: boolean;
  className?: string;
}

const categoryIcons: Record<string, LucideIcon> = {
  rapper: Mic,
  singer: Music,
  comedian: Laugh,
  influencer: Camera,
  creator: Gamepad2,
  athlete: Trophy,
  actor: Film,
};

const categoryLabels: Record<string, string> = {
  rapper: "Rappeur",
  singer: "Chanteur",
  comedian: "Comédien",
  influencer: "Influenceur",
  creator: "Créateur",
  athlete: "Athlète",
  actor: "Acteur",
};

const categoryColors: Record<string, string> = {
  rapper: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  singer: "bg-pink-500/15 text-pink-400 border-pink-500/25",
  comedian: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  influencer: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  creator: "bg-green-500/15 text-green-400 border-green-500/25",
  athlete: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  actor: "bg-red-500/15 text-red-400 border-red-500/25",
};

const momentumConfig: Record<
  string,
  { label: string; icon: LucideIcon; cls: string }
> = {
  exploding: {
    label: "EXPLOSION",
    icon: Flame,
    cls: "bg-orange-500/15 text-orange-400 border-orange-500/30 animate-pulse",
  },
  rising: {
    label: "En hausse",
    icon: TrendingUp,
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  peaked: {
    label: "Au sommet",
    icon: Zap,
    cls: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  },
  steady: {
    label: "Stable",
    icon: Sparkles,
    cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  },
  cooling: {
    label: "En baisse",
    icon: TrendingDown,
    cls: "bg-white/5 text-white/40 border-white/10",
  },
};

const platformIcons: Record<string, LucideIcon> = {
  instagram: Camera,
  youtube: Video,
  twitter: Globe,
  x: Globe,
  tiktok: Music,
  spotify: Music,
  twitch: Gamepad2,
};

const platformColors: Record<string, string> = {
  instagram: "hover:bg-pink-500/20 hover:text-pink-400",
  youtube: "hover:bg-red-500/20 hover:text-red-400",
  tiktok: "hover:bg-white/20 hover:text-white",
  spotify: "hover:bg-green-500/20 hover:text-green-400",
  twitch: "hover:bg-violet-500/20 hover:text-violet-400",
  twitter: "hover:bg-blue-500/20 hover:text-blue-400",
  x: "hover:bg-white/20 hover:text-white",
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatGrowth(num: number): string {
  const sign = num >= 0 ? "+" : "";
  return `${sign}${formatNumber(num)}`;
}

export function StarCard({
  star,
  rank,
  variant = "compact",
  className,
}: StarCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const CategoryIcon = categoryIcons[star.category] || Camera;
  const momentum = momentumConfig[star.momentum] || momentumConfig.steady;
  const MomentumIcon = momentum.icon;

  if (variant === "featured") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-gradient-to-br",
          "from-white/[0.04] to-transparent border-white/10",
          "transition-all duration-300",
          "hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10",
          star.is_future_star && "ring-2 ring-orange-500/30",
          className,
        )}
      >
        {/* Future Star Badge */}
        {star.is_future_star && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold text-center py-1">
            FUTURE STAR - A SUIVRE
          </div>
        )}

        {/* Cover Image */}
        {star.cover_url && (
          <div className="relative h-24 overflow-hidden">
            <ImageWithFallback
              src={star.cover_url}
              alt=""
              fill
              className="object-cover opacity-60"
              containerClassName="h-24"
              fallbackType="thumbnail"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
        )}

        <div
          className={cn(
            "p-5",
            star.cover_url && "-mt-10 relative",
            star.is_future_star && !star.cover_url && "pt-8",
          )}
        >
          {/* Rank badge */}
          {rank && rank <= 3 && (
            <div
              className={cn(
                "absolute top-3 end-3 size-8 rounded-xl flex items-center justify-center font-black text-sm",
                rank === 1 &&
                  "bg-gradient-to-br from-yellow-400 to-orange-500 text-black",
                rank === 2 &&
                  "bg-gradient-to-br from-gray-300 to-gray-400 text-black",
                rank === 3 &&
                  "bg-gradient-to-br from-orange-600 to-orange-700 text-white",
              )}
            >
              #{rank}
            </div>
          )}

          {/* Header */}
          <div className="flex gap-4">
            {/* Avatar with viral score */}
            <div className="relative shrink-0">
              <ImageWithFallback
                src={star.avatar_url}
                alt={star.name}
                width={64}
                height={64}
                fallbackType="avatar"
                userName={star.name}
                className="rounded-2xl object-cover ring-2 ring-white/10"
                containerClassName="size-16 rounded-2xl bg-white/5"
              />
              <div className="absolute -bottom-2 -end-2">
                <ViralScoreRing value={star.viral_score} size="xs" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-lg truncate">
                  {star.name}
                </h3>
                {star.verified && (
                  <BadgeCheck size={16} className="text-violet-400 shrink-0" />
                )}
              </div>
              <p className="text-white/50 text-sm">{star.handle}</p>

              {/* Category badge */}
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold mt-2",
                  categoryColors[star.category],
                )}
              >
                <CategoryIcon size={10} />
                {categoryLabels[star.category]}
              </div>
            </div>
          </div>

          {/* Bio */}
          {star.bio && (
            <p className="text-white/60 text-xs mt-3 line-clamp-2">
              {star.bio}
            </p>
          )}

          {/* ALGO Prediction */}
          {star.algo_prediction && (
            <div className="mt-3 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-[10px] text-violet-400 font-semibold flex items-center gap-1">
                <Sparkles size={10} />
                ALGO Prediction
              </p>
              <p className="text-white/70 text-xs mt-1">
                {star.algo_prediction}
              </p>
            </div>
          )}

          {/* Momentum badge */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold mt-4",
              momentum.cls,
            )}
          >
            <MomentumIcon size={12} />
            {momentum.label}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-2 rounded-xl bg-white/[0.03]">
              <p className="text-white font-bold text-sm">
                {formatNumber(star.total_followers)}
              </p>
              <p className="text-white/40 text-[10px]">Followers</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/[0.03]">
              <p
                className={cn(
                  "font-bold text-sm",
                  star.follower_growth_24h > 0
                    ? "text-emerald-400"
                    : "text-white/40",
                )}
              >
                {formatGrowth(star.follower_growth_24h)}
              </p>
              <p className="text-white/40 text-[10px]">24h</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/[0.03]">
              <p className="text-white font-bold text-sm">
                {formatNumber(star.mention_count_24h)}
              </p>
              <p className="text-white/40 text-[10px]">Mentions</p>
            </div>
          </div>

          {/* Best Video */}
          {star.best_video && (
            <div className="mt-4">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                Meilleure video
              </p>
              <a
                href={star.best_video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative rounded-xl overflow-hidden group"
              >
                <div className="relative h-32">
                  <ImageWithFallback
                    src={star.best_video.thumbnail}
                    alt={star.best_video.title}
                    fill
                    platform={star.best_video.platform || "youtube"}
                    fallbackType="platform"
                    className="object-cover"
                    containerClassName="h-32"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Play size={24} className="text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-xs font-medium truncate">
                    {star.best_video.title}
                  </p>
                  <p className="text-white/60 text-[10px] flex items-center gap-1">
                    <Eye size={10} />
                    {formatNumber(star.best_video.views)} vues
                  </p>
                </div>
              </a>
            </div>
          )}

          {/* Buzz keywords */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {star.buzz_keywords.slice(0, 4).map((kw, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/60"
              >
                #{kw}
              </span>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2 mt-4">
            {star.top_platforms.slice(0, 4).map((p, i) => {
              const Icon = platformIcons[p.platform] || ExternalLink;
              const colorClass =
                platformColors[p.platform] || "hover:bg-white/10";
              return (
                <a
                  key={i}
                  href={p.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 bg-white/5 rounded-lg transition-colors",
                    colorClass,
                  )}
                >
                  <Icon size={12} className="text-white/40" />
                  <span className="text-white/70 text-[10px] font-medium">
                    {formatNumber(p.followers)}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-semibold",
                      p.growth > 0 ? "text-emerald-400" : "text-white/30",
                    )}
                  >
                    {p.growth > 0 ? "+" : ""}
                    {p.growth.toFixed(1)}%
                  </span>
                </a>
              );
            })}
          </div>

          {/* Follow button */}
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={cn(
              "w-full mt-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200",
              isFollowing
                ? "bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400"
                : "bg-violet-500 text-white hover:bg-violet-600",
            )}
          >
            {isFollowing ? "Suivi" : "Suivre"}
          </button>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border",
        "bg-white/[0.02] border-white/8",
        "transition-all duration-200",
        "hover:bg-white/[0.04] hover:border-white/14",
        star.is_future_star && "ring-1 ring-orange-500/30",
        className,
      )}
    >
      {/* Rank */}
      {rank && (
        <span
          className={cn(
            "shrink-0 w-6 text-center font-bold text-sm",
            rank <= 3 ? "text-violet-400" : "text-white/30",
          )}
        >
          {rank}
        </span>
      )}

      {/* Avatar */}
      <ImageWithFallback
        src={star.avatar_url}
        alt={star.name}
        width={40}
        height={40}
        fallbackType="avatar"
        userName={star.name}
        className="rounded-xl object-cover"
        containerClassName="size-10 rounded-xl bg-white/5 shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-semibold text-sm truncate">
            {star.name}
          </span>
          {star.verified && (
            <BadgeCheck size={12} className="text-violet-400 shrink-0" />
          )}
          {star.is_future_star && (
            <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[8px] font-bold rounded">
              FUTUR
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border",
              categoryColors[star.category],
            )}
          >
            <CategoryIcon size={8} />
            {categoryLabels[star.category]}
          </span>
          <span className="text-white/40 text-[10px]">
            {formatNumber(star.total_followers)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0 text-end">
        <ViralScoreRing value={star.viral_score} size="xs" />
      </div>

      {/* Growth */}
      <div
        className={cn(
          "shrink-0 flex items-center gap-1 text-xs font-semibold",
          star.follower_growth_24h > 0 ? "text-emerald-400" : "text-white/30",
        )}
      >
        {star.follower_growth_24h > 0 ? (
          <TrendingUp size={12} />
        ) : (
          <TrendingDown size={12} />
        )}
        {formatGrowth(star.follower_growth_24h)}
      </div>
    </div>
  );
}

export default StarCard;
