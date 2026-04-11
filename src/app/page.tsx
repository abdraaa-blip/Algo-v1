"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LiveCurve } from "@/components/algo/LiveCurve";
import { ContentCard } from "@/components/algo/ContentCard";
import { AlgoLoader } from "@/components/algo/AlgoLoader";
import { Badge } from "@/components/algo/Badge";
import { MomentumPill } from "@/components/algo/MomentumPill";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { PulsingCard } from "@/components/ui/PulsingCard";
import { TrendingTicker } from "@/components/algo/TrendingTicker";
import { BreakingNewsBanner } from "@/components/algo/BreakingNewsBanner";
import { SignalSweep } from "@/components/algo/SignalSweep";
import { MissedTrendsAlert } from "@/components/algo/MissedTrendsAlert";
import { DataQualityChip } from "@/components/ui/DataQualityChip";
import {
  CORE_NEWS_REGIONS,
  CORE_TREND_REGIONS,
} from "@/lib/geo/global-presets";
import { getSyncedRegionByIndex } from "@/lib/geo/rotation-sync";
import {
  MorningBriefingCard,
  type BriefingSignal,
} from "@/components/algo/MorningBriefingCard";
import { AlgoSignalShareCard } from "@/components/algo/AlgoSignalShareCard";
import { HomeFirstMoments } from "@/components/home/HomeFirstMoments";
import { ALGO_UI_LOADING } from "@/lib/copy/ui-strings";

const PastPredictions = dynamic(
  () =>
    import("@/components/algo/PastPredictions").then((m) => m.PastPredictions),
  { loading: () => <div className="h-24 rounded-xl bg-[var(--color-card)]" /> },
);
const LiveNewsSection = dynamic(
  () =>
    import("@/components/algo/LiveNewsSection").then((m) => m.LiveNewsSection),
  {
    loading: () => (
      <div className="h-64 rounded-xl bg-[var(--color-card)] mx-3 sm:mx-4" />
    ),
  },
);

interface TrendItem {
  id: string;
  title: string;
  score: number;
  badge: "Viral" | "Early" | "Breaking" | "Trend" | "AlmostViral";
  category: string;
  growthRate?: number;
  growthTrend?: "up" | "down" | "stable";
}

interface ContentItem {
  id: string;
  title: string;
  thumbnail?: string;
  platform?: string;
  category?: string;
  viralScore?: number;
  growthRate?: number;
  growthTrend?: "up" | "down" | "stable";
  views?: number;
  isExploding?: boolean;
  badge?: "Viral" | "Early" | "Breaking" | "Trend" | "AlmostViral";
  updatedAt?: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url?: string;
}

const TREND_REGIONS = [...CORE_TREND_REGIONS];
const NEWS_REGIONS = [...CORE_NEWS_REGIONS];

export default function HomePage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyHook, setDailyHook] = useState({
    viral: {
      id: "pending-viral",
      title: "Signaux en cours de collecte",
      score: 0,
      badge: "Trend" as const,
      category: "Live",
      growthRate: 0,
      growthTrend: "stable" as const,
    },
    early: {
      id: "pending-early",
      title: "Detection des signaux precoces en cours",
      score: 0,
      badge: "Early" as const,
      category: "Live",
      growthRate: 0,
      growthTrend: "stable" as const,
    },
  });
  const [dataSource, setDataSource] = useState<{
    news: "live" | "cached" | "fallback" | "error";
    content: "live" | "cached" | "fallback" | "error";
    fetchedAt: string | null;
  }>({ news: "fallback", content: "fallback", fetchedAt: null });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    let newsSource: "live" | "cached" | "fallback" | "error" = "fallback";
    let contentSource: "live" | "cached" | "fallback" | "error" = "fallback";

    // Safe JSON parser that handles empty responses
    const safeJson = async (res: Response) => {
      const text = await res.text();
      if (!text || text.trim() === "") return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    try {
      const syncedTrendRegion = getSyncedRegionByIndex(
        "home-trends",
        TREND_REGIONS,
      );
      const syncedNewsRegion = getSyncedRegionByIndex(
        "home-news",
        NEWS_REGIONS,
      );
      const [trendsRes, newsRes, youtubeRes] = await Promise.all([
        fetch(`/api/live-trends?region=${syncedTrendRegion}`),
        fetch(`/api/live-news?country=${syncedNewsRegion}`),
        fetch(`/api/youtube?country=${syncedTrendRegion}`),
      ]);
      const viralContentRes = await fetch(
        "/api/viral-content?country=US&limit=12",
      );

      // Process trends
      if (trendsRes.ok) {
        const trendsData = await safeJson(trendsRes);
        if (trendsData?.data?.length) {
          const mapped = trendsData.data
            .slice(0, 6)
            .filter((t: Record<string, unknown>) => Boolean(t.title || t.name))
            .map((t: Record<string, unknown>, i: number) => ({
              id: String(i),
              title: String(t.title || t.name),
              score: Number(t.score) || 60,
              badge: i === 0 ? "Viral" : i < 3 ? "Early" : "Trend",
              category: String(t.category || "Tendance"),
              growthRate: Number(t.growthRate) || 0,
              growthTrend: (String(t.growthTrend || "stable") === "up"
                ? "up"
                : String(t.growthTrend) === "down"
                  ? "down"
                  : "stable") as "up" | "down" | "stable",
            }));
          if (mapped.length > 0) {
            setDailyHook({
              viral: mapped[0],
              early:
                mapped.find((t: TrendItem) => t.badge === "Early") ||
                mapped[Math.min(1, mapped.length - 1)],
            });
          }
        }
      }

      // Process news from NewsAPI (ne jamais return ici : le reste du chargement home doit continuer)
      if (newsRes.ok) {
        const newsData = await safeJson(newsRes);
        if (newsData) {
          newsSource = newsData.source || "live";
          if (newsData.data?.length) {
            setNews(
              newsData.data
                .slice(0, 5)
                .map((n: Record<string, unknown>, i: number) => {
                  const sourceObj = n.source as
                    | { id?: string | null; name?: string }
                    | string
                    | undefined;
                  const sourceName =
                    typeof sourceObj === "string"
                      ? sourceObj
                      : (sourceObj?.name ?? "Source");

                  return {
                    id: String(n.id ?? i),
                    title: String(n.title || "Sans titre"),
                    source: String(sourceName),
                    publishedAt: String(n.publishedAt || "Recemment"),
                    url: n.url as string | undefined,
                  };
                }),
            );
          }
        }
      }

      // Process YouTube videos as main content
      const fetchTime = new Date().toISOString();
      let unifiedContent: ContentItem[] = [];
      if (youtubeRes.ok) {
        const youtubeData = await safeJson(youtubeRes);
        contentSource = "live";
        if (youtubeData?.length) {
          unifiedContent = youtubeData
            .slice(0, 6)
            .map((v: Record<string, unknown>) => ({
              id: String(v.id),
              title: String(v.title || "Sans titre"),
              thumbnail: String(v.thumbnail || ""),
              platform: "YouTube",
              category: String(v.category || "Culture"),
              viralScore: Number(v.viralScore) || 80,
              growthRate: Number(v.growthRate) || 50,
              growthTrend: "up" as const,
              views: Number(v.views) || 0,
              badge: (v.badge as ContentItem["badge"]) || "Trend",
              isExploding: Boolean(v.isExploding),
              updatedAt: fetchTime,
            }));
        }
      }
      if (viralContentRes.ok) {
        const viralContent = await safeJson(viralContentRes);
        const extra = Array.isArray(viralContent?.content)
          ? viralContent.content
              .filter((item: Record<string, unknown>) => Boolean(item.title))
              .slice(0, 8)
              .map((item: Record<string, unknown>) => ({
                id: String(item.id),
                title: String(item.title),
                thumbnail: String(item.thumbnail || ""),
                platform: String(item.platform || "web"),
                category: String(item.type || "global"),
                viralScore: Number(item.viralScore) || 55,
                growthRate: 0,
                growthTrend: "stable" as const,
                views: Number(
                  (item.metrics as { views?: number } | undefined)?.views || 0,
                ),
                badge: (Number(item.viralScore) >= 80
                  ? "Viral"
                  : Number(item.viralScore) >= 65
                    ? "Early"
                    : "Trend") as ContentItem["badge"],
                isExploding: Number(item.viralScore) >= 85,
                updatedAt: fetchTime,
              }))
          : [];
        const dedup = new Map<string, ContentItem>();
        for (const item of [...unifiedContent, ...extra]) {
          if (!dedup.has(item.title.toLowerCase())) {
            dedup.set(item.title.toLowerCase(), item);
          }
        }
        unifiedContent = Array.from(dedup.values()).slice(0, 9);
      }
      setContent(unifiedContent);

      setDataSource({
        news: newsSource,
        content: contentSource,
        fetchedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[ALGO] Failed to fetch home data:", e);
      setDataSource((prev) => ({ ...prev, news: "error", content: "error" }));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    // Content refreshes every 10 minutes automatically
    const interval = setInterval(
      () => {
        void fetchData();
      },
      10 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleContentClick = (item: ContentItem) => {
    window.location.href = `/content/${item.id}`;
  };

  const briefingSignals = useMemo((): BriefingSignal[] => {
    const list: BriefingSignal[] = [
      {
        label: "Tendance",
        title: dailyHook.viral.title,
        href: "/trends",
        meta:
          dailyHook.viral.score > 0
            ? `score ${Math.round(dailyHook.viral.score)}`
            : dailyHook.viral.category,
        icon: "radar",
      },
    ];
    if (news[0]) {
      const n0 = news[0];
      list.push({
        label: "Actu",
        title: n0.title,
        href: `/news/${encodeURIComponent(n0.id)}`,
        meta: n0.source,
        icon: "news",
      });
    }
    if (content[0]) {
      const c0 = content[0];
      list.push({
        label: "Format",
        title: c0.title,
        href: `/content/${c0.id}`,
        meta: c0.platform
          ? `${c0.platform}${c0.viralScore ? ` · ${Math.round(c0.viralScore)}` : ""}`
          : undefined,
        icon: "video",
      });
    }
    return list;
  }, [dailyHook, news, content]);

  return (
    <div className="min-h-screen">
      {/* Signal Sweep - once per session violet line scan effect */}
      <SignalSweep />

      {/* Breaking News Banner - appears automatically */}
      <BreakingNewsBanner />

      {/* Trending Ticker - scrolling live trends */}
      <TrendingTicker className="sticky top-0 z-40" />

      {/* Hero Section - responsive padding */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <LiveCurve rate={80} color="violet" opacity={0.08} />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-8 sm:pb-12">
          <HomeFirstMoments
            trendTitle={dailyHook.viral.title}
            trendScore={dailyHook.viral.score}
            dataReady={!loading && dailyHook.viral.id !== "pending-viral"}
          />

          {/* Live Status Bar - responsive */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 algo-s2">
            {/* Main Live Indicator with refresh */}
            <LiveIndicator
              fetchedAt={dataSource.fetchedAt}
              source={
                dataSource.content === "live" && dataSource.news === "live"
                  ? "live"
                  : dataSource.content === "error"
                    ? "error"
                    : "cached"
              }
              onRefresh={fetchData}
              isRefreshing={isRefreshing}
            />
            <DataQualityChip
              source={
                dataSource.content === "live"
                  ? "live multi-region feeds"
                  : dataSource.content
              }
              freshness={dataSource.fetchedAt ? "active refresh" : "warming up"}
              confidence={
                dataSource.content === "live" && dataSource.news !== "error"
                  ? "high"
                  : "medium"
              }
            />
          </div>

          <MorningBriefingCard
            className="algo-s3"
            signals={briefingSignals}
            action={{
              label: "Passer à l’action · mode créateur",
              href: "/creator-mode",
            }}
          />

          {/* Daily Hook - Pulses when fresh - responsive padding */}
          <PulsingCard
            updatedAt={dataSource.fetchedAt}
            intensity="high"
            className="mb-6 sm:mb-8 algo-s4"
          >
            <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 animate-breathe algo-surface">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Hot Now - Urgent */}
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="relative flex-shrink-0">
                    <span className="text-lg sm:text-xl">🔥</span>
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#FF4D6D" }}
                      >
                        Explose maintenant
                      </p>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                        6h restantes
                      </span>
                    </div>
                    <p
                      className="text-xs sm:text-sm font-semibold line-clamp-2"
                      style={{ color: "rgba(240,240,248,0.8)" }}
                    >
                      {dailyHook.viral.title}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                      <Badge
                        type={dailyHook.viral.badge}
                        label={dailyHook.viral.badge}
                      />
                      <MomentumPill
                        value={dailyHook.viral.growthRate || 0}
                        trend={dailyHook.viral.growthTrend || "up"}
                      />
                    </div>
                  </div>
                </div>
                {/* Early Signal - Opportunity */}
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl flex-shrink-0">⚡</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#00FFB2" }}
                      >
                        Signal precoce
                      </p>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        Avant tout le monde
                      </span>
                    </div>
                    <p
                      className="text-xs sm:text-sm font-semibold line-clamp-2"
                      style={{ color: "rgba(240,240,248,0.8)" }}
                    >
                      {dailyHook.early.title}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                      <Badge type="Early" label="Opportunite" />
                      <MomentumPill
                        value={dailyHook.early.growthRate || 0}
                        trend={dailyHook.early.growthTrend || "up"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/35 mb-2">
                  Partage ton avantage
                </p>
                <AlgoSignalShareCard
                  headline={dailyHook.viral.title}
                  score={dailyHook.viral.score}
                  badgeLabel={dailyHook.viral.badge}
                  subtitle="Meta-radar ALGO : avant que le feed ne sature."
                />
              </div>
            </div>
          </PulsingCard>

          {/* CTA Buttons - action-oriented with urgency */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 algo-s5">
            <Link
              href="/creator-mode"
              className="algo-interactive inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl text-sm font-bold text-white transition-[transform,box-shadow] duration-200 active:scale-[0.98] animate-pulse-subtle"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-violet) 0%, color-mix(in srgb, var(--color-violet) 78%, white) 100%)",
                boxShadow:
                  "0 0 32px color-mix(in srgb, var(--color-violet) 28%, transparent)",
              }}
            >
              Transformer ce signal en idée
            </Link>
            <Link
              href="/trends"
              className="algo-interactive algo-surface inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-bold text-[var(--color-text-secondary)] transition-[transform,background-color] duration-200 active:scale-[0.98] hover:bg-[var(--color-card-hover)]"
            >
              Carte des tendances
            </Link>
          </div>

          {/* Missed Trends Alert - creates urgency */}
          <MissedTrendsAlert className="mt-4 sm:mt-6 algo-s6" />

          {/* Compact credibility badge */}
          <PastPredictions compact className="mt-3 sm:mt-4 algo-s6" />
        </div>
      </section>

      {/* News Strip - responsive */}
      <section className="py-2 sm:py-4 overflow-hidden border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-red-alert)_7%,var(--color-bg-primary))]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">
            <span className="flex-shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase bg-[color-mix(in_srgb,var(--color-red-alert)_18%,transparent)] text-[var(--color-red-alert)]">
              Urgent
            </span>
            {news.map((item, i) => (
              <a
                key={item.id}
                href={item.url || `/content/${item.id}`}
                target={item.url ? "_blank" : undefined}
                rel={item.url ? "noopener noreferrer" : undefined}
                className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-colors hover:text-white algo-s${i + 1}`}
                style={{ color: "rgba(240,240,248,0.6)" }}
              >
                <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-[var(--color-red-alert)] animate-pulse" />
                <span className="max-w-[180px] sm:max-w-[280px] truncate">
                  {item.title}
                </span>
                <span
                  className="text-[9px] sm:text-[10px] hidden sm:inline"
                  style={{ color: "rgba(240,240,248,0.3)" }}
                >
                  {item.source}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content Grid - responsive padding and spacing */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
              Contenus à fort potentiel
            </h2>
            <p className="text-[10px] sm:text-xs text-white/40 mt-0.5">
              Signaux multi-sources : fenêtre avant saturation estimée 24–48h
            </p>
          </div>
          <Link
            href="/trends"
            className="algo-interactive text-[10px] sm:text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] transition-colors duration-200"
          >
            Tout voir
          </Link>
        </div>
        <div className="mb-3">
          <DataQualityChip
            source="youtube + global viral-content"
            freshness={
              dataSource.fetchedAt
                ? `updated ${new Date(dataSource.fetchedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : "pending"
            }
            confidence={
              content.length >= 6
                ? "high"
                : content.length > 0
                  ? "medium"
                  : "low"
            }
          />
        </div>

        {loading ? (
          <AlgoLoader message={ALGO_UI_LOADING.homeSignals} />
        ) : content.length === 0 ? (
          <div className="algo-surface rounded-xl p-6 text-sm text-[var(--color-text-tertiary)]">
            Aucun signal contenu reel disponible pour le moment.
            Rafraichissement automatique actif.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {content.map((item, i) => (
              <PulsingCard
                key={item.id}
                updatedAt={item.updatedAt || dataSource.fetchedAt}
                intensity={item.isExploding ? "high" : "medium"}
                className={`algo-s${Math.min(i + 1, 6)} animate-content-enter`}
              >
                <ContentCard
                  content={{
                    ...item,
                    updatedAt:
                      item.updatedAt || dataSource.fetchedAt || undefined,
                  }}
                  onClick={handleContentClick}
                />
              </PulsingCard>
            ))}
          </div>
        )}
      </section>

      {/* Live News Section - Real-time news with images and video links */}
      <LiveNewsSection />

      {/* Past Predictions - Credibility section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10 border-t border-[var(--color-border)]">
        <PastPredictions />
      </section>

      {/* Quick Links - responsive grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10 border-t border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 sm:mb-4">
          Explorer
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
          {[
            { href: "/movies", label: "Films", icon: "🎬", color: "#FF4D6D" },
            { href: "/music", label: "Musique", icon: "🎵", color: "#00FFB2" },
            {
              href: "/news",
              label: "Actualites",
              icon: "📰",
              color: "#FFD166",
            },
            { href: "/ai", label: "ALGO AI", icon: "🤖", color: "#6ee7ff" },
            {
              href: "/viral-analyzer",
              label: "Analyseur",
              icon: "📊",
              color: "#00D1FF",
            },
            {
              href: "/intelligence",
              label: "Radar IA",
              icon: "🧠",
              color: "#9F7AEA",
            },
            {
              href: "/intelligence#algo-core",
              label: "Core IA",
              icon: "⚡",
              color: "#c4b5fd",
            },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="algo-interactive algo-surface flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl transition-[transform,background-color,border-color] duration-200 active:scale-[0.98] hover:border-[color-mix(in_srgb,var(--color-violet)_22%,transparent)]"
            >
              <span className="text-xl sm:text-2xl">{link.icon}</span>
              <span className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
