"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  TrendingUp,
  Filter,
  RefreshCw,
  Flame,
  Crown,
  Mic,
  Music,
  Laugh,
  Camera,
  Gamepad2,
  User,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/BackButton";
import { StarCard } from "@/components/ui/StarCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LivingPulse } from "@/components/ui/LivingPulse";
import { LiveCurve } from "@/components/ui/LiveCurve";
import { useScope } from "@/hooks/useScope";
import { scopeToCountryCode } from "@/types";

// Interface synchronisee avec l'API
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
  social_links: { platform: string; url: string; username: string }[];
  total_followers: number;
  follower_growth_24h: number;
  follower_growth_7d: number;
  viral_score: number;
  momentum: "exploding" | "rising" | "peaked" | "steady" | "cooling";
  trending_content: {
    title: string;
    type: "video" | "post" | "sound";
    url: string;
    views: number;
  }[];
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
  breakout_date: string | null;
  top_platforms: {
    platform: string;
    followers: number;
    growth: number;
    url: string;
  }[];
  bio: string;
  is_future_star: boolean;
  algo_prediction?: string;
}

interface I18n {
  title: string;
  subtitle: string;
  filterAll: string;
  filterRapper: string;
  filterSinger: string;
  filterComedian: string;
  filterInfluencer: string;
  filterCreator: string;
  sortViralScore: string;
  sortGrowth: string;
  sortMentions: string;
  sortSentiment: string;
  loading: string;
  emptyTitle: string;
  emptySubtitle: string;
}

interface RisingStarsClientShellProps {
  i18n: I18n;
}

const categoryFilters = [
  { key: "all", icon: Sparkles, label: "Tous" },
  { key: "rapper", icon: Mic, label: "Rappeurs" },
  { key: "singer", icon: Music, label: "Chanteurs" },
  { key: "comedian", icon: Laugh, label: "Humoristes" },
  { key: "influencer", icon: Camera, label: "Influenceurs" },
  { key: "creator", icon: Gamepad2, label: "Createurs" },
  { key: "actor", icon: User, label: "Acteurs" },
  { key: "athlete", icon: Trophy, label: "Athletes" },
];

// TMDB Celebrity type
interface TMDBCelebrity {
  id: string;
  name: string;
  profileUrl: string;
  department: string;
  popularity: number;
  knownFor: string[];
  type: "person";
  fetchedAt: string;
}

export default function RisingStarsClientShell({
  i18n,
}: RisingStarsClientShellProps) {
  const { scope } = useScope();
  const [stars, setStars] = useState<RisingStar[]>([]);
  const [celebrities, setCelebrities] = useState<TMDBCelebrity[]>([]);
  const [celebLoading, setCelebLoading] = useState(true);
  const [celebFetchedAt, setCelebFetchedAt] = useState<string | null>(null);
  const [celebSource, setCelebSource] = useState<"live" | "cache" | "fallback">(
    "live",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "viral_score" | "growth" | "mentions" | "sentiment"
  >("viral_score");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch real trending celebrities from TMDB
  const fetchCelebrities = useCallback(async () => {
    try {
      setCelebLoading(true);
      const res = await fetch("/api/live-celebrities");
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setCelebrities(data.data);
        setCelebFetchedAt(data.fetchedAt);
        setCelebSource(data.source);
      }
    } catch (err) {
      console.error("[ALGO Celebrities] Fetch failed:", err);
    } finally {
      setCelebLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCelebrities();
    // Auto-refresh every 30 seconds for live data
    const interval = setInterval(fetchCelebrities, 30000);
    return () => clearInterval(interval);
  }, [fetchCelebrities]);

  const fetchStars = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (category && category !== "all") {
          params.set("category", category);
        }
        const countryCode = scopeToCountryCode(scope);
        if (countryCode) {
          params.set("country", countryCode);
        }
        params.set("sort", sortBy);
        params.set("limit", "20");

        const res = await fetch(`/api/rising-stars?${params}`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const response = await res.json();

        // API returns { success: true, data: RisingStar[] }
        // Extract stars array from response - handle all possible formats
        let starsArray: RisingStar[] = [];

        if (response?.data && Array.isArray(response.data)) {
          starsArray = response.data;
        } else if (response?.stars && Array.isArray(response.stars)) {
          starsArray = response.stars;
        } else if (Array.isArray(response)) {
          starsArray = response;
        }

        setStars(starsArray);
        setLastUpdate(new Date());
      } catch (err) {
        console.error("[ALGO Rising Stars] Fetch failed:", err);
        setError("Impossible de charger les stars. Réessaie.");
        setStars([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, sortBy, scope],
  );

  useEffect(() => {
    fetchStars();
  }, [fetchStars]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStars(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchStars]);

  // Separate future stars and current stars
  const futureStars = stars.filter((s) => s.is_future_star);
  const currentStars = stars.filter((s) => !s.is_future_star);
  const explodingStars = currentStars.filter((s) => s.momentum === "exploding");
  const risingStars = currentStars.filter((s) => s.momentum === "rising");
  const otherStars = currentStars.filter(
    (s) => !["exploding", "rising"].includes(s.momentum),
  );

  const topStar = explodingStars[0] || currentStars[0];
  const remainingExploding = explodingStars.slice(1);

  return (
    <div className="relative min-h-screen">
      {/* Background avec nouvelles animations */}
      <LiveCurve
        growthRate={topStar?.viral_score || 50}
        showShootingStars={true}
        showECGLine={true}
        opacity={0.12}
      />

      <div className="relative z-10 px-4 py-5 max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <BackButton fallbackHref="/" />

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles size={24} className="text-violet-400" />
              <LivingPulse
                intensity={75}
                compact
                className="absolute -inset-1"
              />
            </div>
            <h1 className="text-white font-black text-2xl tracking-tight">
              {i18n.title}
            </h1>
            {stars.length > 0 && (
              <span className="ml-auto text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                MAJ recente
              </span>
            )}
          </div>
          <p className="text-white/50 text-sm">{i18n.subtitle}</p>
        </div>

        {/* TMDB Trending Celebrities - Real Live Data */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-yellow-400" />
              <h2 className="text-white font-bold text-sm">
                Celebrites Tendance Monde
              </h2>
              <span className="text-[9px] text-white/30">via TMDB</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              {celebSource === "live" ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-amber-400">Données récentes</span>
                </>
              ) : (
                <span className="text-zinc-400">Cache (30 min)</span>
              )}
              {celebFetchedAt && (
                <span className="text-white/30">
                  {formatTimeAgo(new Date(celebFetchedAt))}
                </span>
              )}
            </div>
          </div>

          {celebLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-24 h-32 bg-white/5 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : celebrities.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {celebrities.slice(0, 10).map((celeb, i) => (
                <div
                  key={`tmdb-${celeb.id}-${i}`}
                  className="shrink-0 w-24 group cursor-pointer"
                >
                  <div className="relative w-24 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500/20 to-pink-500/20 mb-2">
                    <ImageWithFallback
                      src={
                        celeb.profileUrl && !celeb.profileUrl.includes("null")
                          ? celeb.profileUrl
                          : null
                      }
                      alt={celeb.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackType="avatar"
                      userName={celeb.name}
                      sizes="96px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-[9px] text-violet-300 bg-violet-500/30 px-1.5 py-0.5 rounded">
                        {celeb.department}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-[8px] font-bold px-1 py-0.5 rounded">
                      #{i + 1}
                    </div>
                  </div>
                  <p className="text-xs text-white/80 font-semibold line-clamp-1 text-center group-hover:text-white transition-colors">
                    {celeb.name}
                  </p>
                  {celeb.knownFor.length > 0 && (
                    <p className="text-[9px] text-white/40 line-clamp-1 text-center">
                      {celeb.knownFor[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* Filters */}
        <div className="space-y-3">
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categoryFilters.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold",
                  "transition-all duration-200",
                  category === key
                    ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70",
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Sort & refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-white/40" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              >
                <option value="viral_score">{i18n.sortViralScore}</option>
                <option value="growth">{i18n.sortGrowth}</option>
                <option value="mentions">{i18n.sortMentions}</option>
                <option value="sentiment">{i18n.sortSentiment}</option>
              </select>
            </div>

            <button
              onClick={() => fetchStars(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <RefreshCw
                size={12}
                className={cn(refreshing && "animate-spin")}
              />
              {refreshing
                ? "Actualisation..."
                : `Mis a jour ${formatTimeAgo(lastUpdate)}`}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonLoader variant="card" />
            <div className="grid gap-2">
              <SkeletonLoader variant="row" count={5} />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <Sparkles size={32} className="text-red-400" />
            </div>
            <p className="text-white/70 font-semibold mb-2">Signal perdu</p>
            <p className="text-white/40 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchStars()}
              className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 text-sm font-medium hover:bg-violet-500/30 transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : stars.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles size={48} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/50 font-semibold">{i18n.emptyTitle}</p>
            <p className="text-white/30 text-sm mt-1">{i18n.emptySubtitle}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured top star */}
            {topStar && (
              <section>
                <SectionHeader
                  title="Star du moment"
                  subtitle="Le talent qui fait le plus parler"
                  trailing={
                    <span className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 animate-pulse">
                      <Crown size={10} />
                      #1 Trending
                    </span>
                  }
                />
                <StarCard
                  star={topStar}
                  rank={1}
                  variant="featured"
                  className="mt-3"
                />
              </section>
            )}

            {/* Exploding stars */}
            {remainingExploding.length > 0 && (
              <section>
                <SectionHeader
                  title="En explosion"
                  subtitle={`${remainingExploding.length} talents en feu`}
                  trailing={
                    <span className="flex items-center gap-1 text-[10px] text-red-400">
                      <Flame size={10} className="animate-pulse" />
                    </span>
                  }
                />
                <div className="space-y-2 mt-3">
                  {remainingExploding.map((star, index) => (
                    <StarCard
                      key={star.id}
                      star={star}
                      rank={index + 2}
                      variant="compact"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Rising stars */}
            {risingStars.length > 0 && (
              <section>
                <SectionHeader
                  title="En pleine ascension"
                  subtitle={`${risingStars.length} talents a suivre`}
                  trailing={
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <TrendingUp size={10} />
                    </span>
                  }
                />
                <div className="space-y-2 mt-3">
                  {risingStars.map((star, index) => (
                    <StarCard
                      key={star.id}
                      star={star}
                      rank={remainingExploding.length + index + 2}
                      variant="compact"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Future stars - Les pepites */}
            {futureStars.length > 0 && (
              <section>
                <SectionHeader
                  title="Futures pepites"
                  subtitle="ALGO Prediction: talents a suivre avant l'explosion"
                  trailing={
                    <span className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                      <Sparkles size={10} />
                      ALGO Pick
                    </span>
                  }
                />
                <div className="space-y-2 mt-3">
                  {futureStars.map((star, index) => (
                    <StarCard
                      key={star.id}
                      star={star}
                      rank={index + 1}
                      variant="compact"
                      showPrediction
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Other stars */}
            {otherStars.length > 0 && (
              <section>
                <SectionHeader
                  title="Autres talents"
                  subtitle={`${otherStars.length} profils`}
                />
                <div className="space-y-2 mt-3">
                  {otherStars.map((star, index) => (
                    <StarCard
                      key={star.id}
                      star={star}
                      rank={
                        remainingExploding.length +
                        risingStars.length +
                        index +
                        2
                      }
                      variant="compact"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  if (diffSecs < 60) return "a l'instant";
  if (diffMins < 60) return `il y a ${diffMins}m`;
  return `il y a ${Math.floor(diffMins / 60)}h`;
}
