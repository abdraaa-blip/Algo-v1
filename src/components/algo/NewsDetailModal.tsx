"use client";

import { useState } from "react";
import {
  X,
  ExternalLink,
  Clock,
  Target,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { TrendLevelBadge, getTrendLevel } from "./TrendLevelBadge";
import { Button } from "@/components/ui/Button";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  source: { id?: string; name: string } | string;
  author?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  country: string;
}

interface NewsDetailModalProps {
  article: NewsArticle;
  onClose: () => void;
  onGenerateIdea?: () => void;
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR");
}

export function NewsDetailModal({
  article,
  onClose,
  onGenerateIdea,
}: NewsDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [renderTimestamp] = useState(() => Date.now());
  const randomCreatorPercent = 5 + (article.id.length % 15);

  // Calculate scores based on recency
  const hoursAgo =
    (renderTimestamp - new Date(article.publishedAt).getTime()) / 3600000;
  const viralScore = Math.max(10, Math.min(100, Math.round(90 - hoursAgo * 5)));
  const timeRemaining =
    viralScore >= 85
      ? "6h"
      : viralScore >= 70
        ? "12h"
        : viralScore >= 50
          ? "24h"
          : "48h";
  const isUrgent = viralScore >= 75;

  const sourceName =
    typeof article.source === "string"
      ? article.source
      : article.source?.name || "News";
  const hasImage =
    article.urlToImage && !imageError && !article.urlToImage.includes("null");

  // Determine emotion based on keywords (simplified)
  const title = article.title.toLowerCase();
  const emotion =
    title.includes("scandal") ||
    title.includes("choc") ||
    title.includes("colere")
      ? "colere"
      : title.includes("victoire") || title.includes("succes")
        ? "joie"
        : title.includes("mort") || title.includes("deces")
          ? "tristesse"
          : "surprise";

  const emotionLabels: Record<string, string> = {
    colere: "Colere",
    joie: "Joie",
    tristesse: "Tristesse",
    surprise: "Surprise",
  };

  useBodyScrollLock(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(20,20,30,0.98), rgba(15,15,25,0.98))",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Details de news: ${article.title}`}
      >
        {/* Header Image */}
        {hasImage && (
          <div className="relative h-48 w-full">
            <ImageWithFallback
              src={article.urlToImage || ""}
              alt={article.title}
              fill
              className="object-cover"
              platform="news"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent" />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
          aria-label="Fermer la fenetre"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <TrendLevelBadge level={getTrendLevel(viralScore)} size="md" />
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(123,97,255,0.15)", color: "#7b61ff" }}
            >
              {sourceName}
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(0,209,255,0.12)", color: "#00d1ff" }}
            >
              {article.country}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white/90 leading-tight">
            {article.title}
          </h2>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-white/40">
            <Clock size={12} />
            <span>{formatRelativeTime(article.publishedAt)}</span>
            {article.author && (
              <>
                <span>•</span>
                <span>{article.author}</span>
              </>
            )}
          </div>

          {/* Description */}
          {article.description && (
            <p className="text-sm text-white/60 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Score & Timing Panel */}
          <div
            className="rounded-xl p-4"
            style={{
              background: isUrgent
                ? "linear-gradient(135deg, rgba(255,77,109,0.1), rgba(123,97,255,0.05))"
                : "rgba(123,97,255,0.08)",
              border: isUrgent
                ? "1px solid rgba(255,77,109,0.3)"
                : "1px solid rgba(123,97,255,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-violet-400">
                  {viralScore}
                </span>
                <div>
                  <p className="text-[10px] text-white/40 uppercase">
                    Score viral
                  </p>
                  <p className="text-xs text-white/60">
                    Confiance {viralScore >= 70 ? "elevee" : "moyenne"}
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: isUrgent
                    ? "rgba(255,77,109,0.2)"
                    : "rgba(255,193,7,0.15)",
                  color: isUrgent ? "#ff4d6d" : "#ffc107",
                }}
              >
                <Clock size={12} />
                {timeRemaining} restantes
              </div>
            </div>

            {/* Quick info */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                style={{ background: "rgba(255,193,7,0.12)", color: "#ffc107" }}
              >
                Emotion: {emotionLabels[emotion]}
              </span>
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                style={{ background: "rgba(0,209,255,0.12)", color: "#00d1ff" }}
              >
                Format: Reaction / Analyse
              </span>
            </div>

            {/* Action */}
            <div
              className="rounded-lg p-3"
              style={{
                background: "rgba(123,97,255,0.1)",
                border: "1px solid rgba(123,97,255,0.15)",
              }}
            >
              <div className="flex items-start gap-2">
                <Target
                  size={14}
                  className="text-violet-400 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-[11px] font-bold text-white/70 mb-1">
                    Action immediate:
                  </p>
                  <ul className="space-y-1 text-[10px] text-white/50">
                    <li className="flex items-center gap-1">
                      <ChevronRight size={10} className="text-violet-400" />
                      Créer une vidéo réaction (30–60 s)
                    </li>
                    <li className="flex items-center gap-1">
                      <ChevronRight size={10} className="text-violet-400" />
                      Hook: &quot;Cette actu va tout changer...&quot;
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Psychological pressure */}
          {viralScore >= 70 && (
            <p
              className="text-[10px] px-3 py-2 rounded-lg"
              style={{
                background: "rgba(255,193,7,0.08)",
                color: "rgba(255,193,7,0.7)",
                border: "1px solid rgba(255,193,7,0.15)",
              }}
            >
              {randomCreatorPercent} % des créateurs ont déjà traité ce sujet
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              className="flex-1"
              onClick={onGenerateIdea}
            >
              Générer une idée
            </Button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Lire l&apos;article
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
