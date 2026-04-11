"use client";

import { useRouter } from "next/navigation";
import { Clock, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "./Badge";
import { ViralScoreRing } from "./ViralScoreRing";
import { MomentumPill } from "./MomentumPill";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import LiveBadge from "@/components/ui/LiveBadge";

// Estimate window based on growth rate
function estimateWindow(growthRate: number, isExploding: boolean): string {
  if (isExploding || growthRate > 200) return "3h";
  if (growthRate > 100) return "6h";
  if (growthRate > 50) return "12h";
  if (growthRate > 20) return "24h";
  return "48h";
}

// Estimate saturation level
function estimateSaturation(
  views: number,
  growthRate: number,
): {
  level: "low" | "medium" | "high" | "saturated";
  label: string;
  color: string;
} {
  const saturationScore = (views / 1000000) * (100 / Math.max(growthRate, 10));
  if (saturationScore < 0.5)
    return { level: "low", label: "Opportunite", color: "#00FFB2" };
  if (saturationScore < 1.5)
    return { level: "medium", label: "Bon timing", color: "#00D1FF" };
  if (saturationScore < 3)
    return { level: "high", label: "Agis vite", color: "#FFC107" };
  return { level: "saturated", label: "Saturation proche", color: "#FF4D6D" };
}

// Helper to construct correct content URLs
function getContentHref(content: { id: string; platform?: string }): string {
  const id = content.id;
  // Already prefixed - use as-is
  if (
    id.startsWith("youtube-") ||
    id.startsWith("yt-") ||
    id.startsWith("tmdb-") ||
    id.startsWith("lastfm-") ||
    id.startsWith("news-")
  ) {
    return `/content/${id}`;
  }
  // Raw YouTube ID (11 chars, alphanumeric with - and _)
  if (content.platform === "YouTube" && !id.startsWith("c") && id.length >= 8) {
    return `/content/youtube-${id}`;
  }
  // Mock content or other
  return `/content/${id}`;
}

interface Content {
  id: string;
  title: string;
  thumbnail?: string;
  platform?: string;
  category?: string;
  viralScore?: number;
  score?: number;
  growthRate?: number;
  rate?: number;
  growthTrend?: "up" | "down" | "stable";
  trend?: "up" | "down" | "stable";
  views?: number;
  isExploding?: boolean;
  badge?: "Viral" | "Early" | "Breaking" | "Trend" | "AlmostViral";
  updatedAt?: string;
}

interface ContentCardProps {
  content: Content;
  onClick?: (content: Content) => void;
}

export function ContentCard({ content, onClick }: ContentCardProps) {
  const router = useRouter();
  const isExploding =
    content.isExploding === true ||
    (typeof content.growthRate === "number" && content.growthRate > 200);

  const handleClick = () => {
    if (onClick) {
      onClick(content);
    } else {
      router.push(getContentHref(content));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };
  const btype = isExploding
    ? "Breaking"
    : content.growthTrend === "down"
      ? "AlmostViral"
      : content.badge || "Trend";
  const blabel = isExploding
    ? "En explosion"
    : content.growthTrend === "down"
      ? "En declin"
      : btype === "Viral"
        ? "Viral"
        : btype === "Early"
          ? "Signal precoce"
          : btype === "Breaking"
            ? "Breaking"
            : "Tendance";

  const score = content.viralScore || content.score || 75;
  const rate = Math.abs(content.growthRate || content.rate || 0);
  const trend = content.growthTrend || content.trend || "up";
  const saturation = estimateSaturation(content.views || 0, rate);

  const formatViews = (views: number) => {
    if (views >= 1e6) return (views / 1e6).toFixed(1) + "M";
    if (views >= 1e3) return Math.floor(views / 1e3) + "K";
    return views.toString();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      data-exploding={isExploding ? "true" : "false"}
      aria-label={`${content.title} - Score viral: ${score}${isExploding ? " - En explosion" : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`algo-card-hit rounded-2xl overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] ${isExploding ? "algo-exploding" : ""}`}
    >
      {/* Thumbnail - aspect ratio container with positioned child - uses contain for CLS prevention */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          paddingBottom: "56.25%",
          background:
            "linear-gradient(135deg, rgba(123,97,255,0.12), rgba(0,209,255,0.06))",
          contain: "layout paint",
        }}
      >
        <div className="absolute inset-0">
          <ImageWithFallback
            src={content.thumbnail}
            alt={content.title}
            fill
            className="object-cover object-top"
            containerClassName="w-full h-full"
            platform={content.platform || "default"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        {/* Badges positioned over thumbnail */}
        <div className="absolute top-2 left-2 z-10">
          <Badge type={btype} label={blabel} />
        </div>
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          {content.updatedAt && (
            <LiveBadge fetchedAt={content.updatedAt} showText={false} />
          )}
          {content.platform && (
            <div
              className="text-[9px] font-bold px-[7px] py-0.5 rounded-full"
              style={{
                color: "rgba(240,240,248,0.5)",
                background: "rgba(0,0,0,0.5)",
              }}
            >
              {content.platform}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2">
        <p
          className="text-[13px] font-bold leading-[1.4] line-clamp-2"
          style={{ color: "rgba(240,240,248,0.62)" }}
        >
          {content.title}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ViralScoreRing score={score} size={40} />
            {/* Window urgency badge */}
            {(() => {
              const window = estimateWindow(rate, isExploding);
              const isUrgent = window === "3h" || window === "6h";
              return (
                <div
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${isUrgent ? "animate-pulse" : ""}`}
                  style={{
                    background: isUrgent
                      ? "rgba(255,77,109,0.15)"
                      : "rgba(255,255,255,0.05)",
                    color: isUrgent ? "#FF4D6D" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <Clock size={8} />
                  <span>{window}</span>
                </div>
              );
            })()}
          </div>
          <MomentumPill value={rate} trend={trend} />
        </div>

        {/* Saturation & Urgency Indicator */}
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-bold"
          style={{
            background: `${saturation.color}10`,
            border: `1px solid ${saturation.color}30`,
          }}
        >
          {saturation.level === "low" && (
            <TrendingUp size={10} style={{ color: saturation.color }} />
          )}
          {saturation.level === "medium" && (
            <Zap size={10} style={{ color: saturation.color }} />
          )}
          {saturation.level === "high" && (
            <Clock size={10} style={{ color: saturation.color }} />
          )}
          {saturation.level === "saturated" && (
            <AlertTriangle size={10} style={{ color: saturation.color }} />
          )}
          <span style={{ color: saturation.color }}>{saturation.label}</span>
          <span className="text-white/30">•</span>
          <span className="text-white/50">
            {(() => {
              const window = estimateWindow(rate, isExploding);
              return `Fenetre: ${window}`;
            })()}
          </span>
        </div>

        <div
          className="flex items-center gap-[10px] text-[10px]"
          style={{ color: "rgba(240,240,248,0.2)" }}
        >
          {content.views && <span>{formatViews(content.views)} vues</span>}
          {content.category && (
            <span className="ml-auto">{content.category}</span>
          )}
        </div>

        {/* Quick Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Navigate to creator mode with this trend
            router.push(
              `/creator-mode?trend=${encodeURIComponent(content.title)}`,
            );
          }}
          className="w-full mt-1 py-2 rounded-lg text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(135deg, rgba(123,97,255,0.2), rgba(0,209,255,0.1))",
            border: "1px solid rgba(123,97,255,0.3)",
            color: "#a78bfa",
          }}
        >
          Créer avec cette tendance
        </button>
      </div>
    </article>
  );
}
