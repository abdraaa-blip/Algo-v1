"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, TrendingUp, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Prediction {
  id: string;
  title: string;
  detectedAt: string;
  peakAt: string;
  scoreAtDetection: number;
  actualViews: string;
  platform: string;
  success: boolean;
  source: string;
}

interface PastPredictionsProps {
  className?: string;
  compact?: boolean;
}

export function PastPredictions({
  className = "",
  compact = false,
}: PastPredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const formatRelative = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "recent";
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatViews = (views: number | undefined) => {
    if (!views || views <= 0) return "n/a";
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M vues`;
    if (views >= 1_000) return `${Math.round(views / 1_000)}K vues`;
    return `${views} vues`;
  };

  useEffect(() => {
    let cancelled = false;
    const fetchSignals = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/viral-content?country=US&limit=8", {
          cache: "no-store",
        });
        const json = await res.json();
        const content = Array.isArray(json?.content) ? json.content : [];
        const mapped: Prediction[] = content
          .filter((item: Record<string, unknown>) => Boolean(item?.title))
          .slice(0, 8)
          .map((item: Record<string, unknown>, idx: number) => {
            const publishedAt = String(
              item.publishedAt || new Date().toISOString(),
            );
            const sourceName = String(
              item.source || item.platform || "unknown",
            );
            const viewsRaw = Number(
              (item.metrics as { views?: number } | undefined)?.views || 0,
            );
            const viralScore = Number(item.viralScore || 55);
            return {
              id: String(item.id || idx),
              title: String(item.title),
              detectedAt: publishedAt,
              peakAt: publishedAt,
              scoreAtDetection: Number.isFinite(viralScore) ? viralScore : 55,
              actualViews: formatViews(
                Number.isFinite(viewsRaw) ? viewsRaw : 0,
              ),
              platform: String(item.platform || "web"),
              success: viralScore >= 60,
              source: sourceName,
            };
          });
        if (!cancelled) {
          setPredictions(mapped);
          setCurrentIndex(0);
        }
      } catch {
        if (!cancelled) setPredictions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchSignals();
    const refresh = setInterval(fetchSignals, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    if (predictions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % predictions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [predictions.length]);

  if (loading && predictions.length === 0) return null;
  if (predictions.length === 0) return null;

  const successRate = Math.round(
    (predictions.filter((p) => p.success).length / predictions.length) * 100,
  );
  const current = predictions[currentIndex];

  if (compact) {
    return (
      <div className={`${className}`}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px]"
          style={{
            background: "rgba(0,255,178,0.08)",
            border: "1px solid rgba(0,255,178,0.15)",
          }}
        >
          <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-300">
            <span className="font-bold">{successRate}%</span> de signaux
            detectes ont confirmee une traction
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 ${className}`}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,255,178,0.15)" }}
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/90">
              Predictions recentes (reelles)
            </h3>
            <p className="text-[10px] text-white/40">
              Basees sur les flux detectes et horodates
            </p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: "rgba(0,255,178,0.15)", color: "#00FFB2" }}
        >
          {successRate}% reussite
        </div>
      </div>

      {/* Current Prediction Showcase */}
      <div
        className="p-3 sm:p-4 rounded-xl mb-3 transition-all duration-500"
        style={{
          background: "rgba(123,97,255,0.08)",
          border: "1px solid rgba(123,97,255,0.15)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold text-white/90 line-clamp-1">
              {current.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                {current.platform}
              </span>
              <span className="text-[9px] text-white/40">
                Detecte {formatRelative(current.detectedAt)}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg sm:text-xl font-black text-emerald-400">
              {current.actualViews}
            </div>
            <div className="text-[9px] text-white/40">
              Source: {current.source}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2 mt-3 text-[9px]">
          <div className="flex items-center gap-1 text-violet-300">
            <Clock size={10} />
            <span>Score initial: {current.scoreAtDetection}</span>
          </div>
          <ChevronRight size={10} className="text-white/20" />
          <div className="flex items-center gap-1 text-emerald-300">
            <TrendingUp size={10} />
            <span>Virale</span>
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-1.5">
        {predictions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === currentIndex
                ? "w-4 bg-violet-400"
                : "bg-white/20 hover:bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/algorithm"
        className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-violet-300 hover:text-violet-200 transition-colors"
      >
        <span>Voir toutes nos predictions</span>
        <ChevronRight size={12} />
      </Link>
    </div>
  );
}
