"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Music,
  Mic2,
  Play,
  ExternalLink,
  RefreshCw,
  Users,
  Headphones,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { BackButton } from "@/components/ui/BackButton";
import { DataQualityChip } from "@/components/ui/DataQualityChip";
import { EXTENDED_MUSIC_COUNTRIES } from "@/lib/geo/global-presets";
import { useScope } from "@/hooks/useScope";
import {
  formatRelativeScopeTime,
  formatScopeDateTime,
} from "@/lib/geo/time-format";
import { mapUserFacingApiError } from "@/lib/copy/api-error-fr";

interface Track {
  id: string;
  name: string;
  artist: string;
  artistUrl: string;
  url: string;
  imageUrl: string;
  listeners: number;
  playcount: number;
  rank: number;
  fetchedAt: string;
}

interface Artist {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  listeners: number;
  playcount: number;
  rank: number;
  fetchedAt: string;
}

const COUNTRIES = [...EXTENDED_MUSIC_COUNTRIES];

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

export function MusicClientShell() {
  const { scope } = useScope();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [activeTab, setActiveTab] = useState<"tracks" | "artists">("tracks");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [source, setSource] = useState<"live" | "cache" | "fallback" | "mixed">(
    "live",
  );
  const [chartsMetaNote, setChartsMetaNote] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ type: "all" });
      if (selectedCountry) params.set("country", selectedCountry);

      const res = await fetch(`/api/live-music?${params}`);
      if (!res.ok) throw new Error("Échec du chargement des données musicales");

      const data = await res.json();

      if (data.success) {
        setTracks(data.tracks || []);
        setArtists(data.artists || []);
        setSource(data.source || "live");
        const meta =
          data.meta && typeof data.meta === "object" ? data.meta : null;
        setChartsMetaNote(typeof meta?.note === "string" ? meta.note : null);
        const at =
          typeof data.fetchedAt === "string"
            ? new Date(data.fetchedAt)
            : new Date();
        setLastUpdate(Number.isNaN(at.getTime()) ? new Date() : at);
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (err) {
      console.error("Failed to fetch music:", err);
      setError(
        mapUserFacingApiError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les classements musicaux",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => {
    void fetchData();

    // Aligné sur le cache serveur Last.fm (~15 min) : évite requêtes inutiles toutes les 30 s.
    const interval = setInterval(
      () => {
        if (
          typeof document !== "undefined" &&
          document.visibilityState !== "visible"
        )
          return;
        void fetchData();
      },
      15 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen px-4 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <BackButton fallbackHref="/" />

      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
            <Music size={24} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Classements Musique
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Last.fm · rafraîchissement auto ~15 min (cache serveur)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Honest status indicator */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              source === "live"
                ? "bg-amber-500/20 text-amber-400"
                : source === "cache"
                  ? "bg-zinc-500/20 text-zinc-400"
                  : source === "mixed"
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-slate-500/20 text-slate-300",
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                source === "live"
                  ? "bg-amber-400"
                  : source === "cache"
                    ? "bg-zinc-400"
                    : source === "mixed"
                      ? "bg-violet-400"
                      : "bg-slate-400",
              )}
            />
            {source === "live"
              ? "Données récentes"
              : source === "cache"
                ? "Cache (15 min)"
                : source === "mixed"
                  ? "Mixte"
                  : "Mode démo"}
          </div>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all disabled:opacity-50"
            title="Actualiser les classements"
          >
            <RefreshCw size={18} className={cn(isLoading && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Country Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {COUNTRIES.map((country) => (
          <button
            key={country.code}
            onClick={() => setSelectedCountry(country.code)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              selectedCountry === country.code
                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                : "bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)] border border-transparent",
            )}
          >
            <span>{country.flag}</span>
            <span>{country.name}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <DataQualityChip
          source={
            selectedCountry ? `lastfm:${selectedCountry}` : "lastfm:global"
          }
          freshness={
            lastUpdate ? formatRelativeScopeTime(lastUpdate, scope) : "pending"
          }
          confidence={
            source === "live"
              ? "high"
              : source === "cache"
                ? "medium"
                : source === "mixed"
                  ? "medium"
                  : "low"
          }
        />
        {chartsMetaNote && (
          <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed max-w-3xl">
            {chartsMetaNote}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-card)] w-fit">
        {(["tracks", "artists"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-emerald-500/30 text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
            )}
          >
            {tab === "tracks" ? <Headphones size={16} /> : <Mic2 size={16} />}
            {tab === "tracks" ? "Top Titres" : "Top Artistes"}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-[var(--color-card)] rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {activeTab === "tracks" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tracks.map((track, index) => (
                <TrackCard key={`track-${track.id}-${index}`} track={track} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {artists.map((artist, index) => (
                <ArtistCard
                  key={`artist-${artist.id}-${index}`}
                  artist={artist}
                />
              ))}
            </div>
          )}

          {/* Empty state with honest messaging */}
          {((activeTab === "tracks" && tracks.length === 0) ||
            (activeTab === "artists" && artists.length === 0)) && (
            <div className="text-center py-12">
              <Radio
                size={48}
                className="mx-auto mb-4 text-[var(--color-text-muted)]"
              />
              <p className="text-[var(--color-text-secondary)] mb-2">
                Aucune donnee musicale disponible
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Les classements seront disponibles des que Last.fm repondra
              </p>
              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Last update with honest messaging */}
      <div className="text-center space-y-1 pt-4 border-t border-[var(--color-border)]">
        {lastUpdate && (
          <p
            className="text-xs text-[var(--color-text-tertiary)]"
            title={formatScopeDateTime(lastUpdate, scope)}
          >
            Mis à jour {formatRelativeScopeTime(lastUpdate, scope)}
          </p>
        )}
        <p className="text-[10px] text-[var(--color-text-muted)]">
          {source === "live" || source === "cache"
            ? "Classement basé sur les écoutes Last.fm en temps réel"
            : "Classement basé sur les dernières données disponibles"}
        </p>
      </div>
    </div>
  );
}

function TrackCard({ track }: { track: Track }) {
  return (
    <a
      href={track.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-[var(--color-border)] hover:border-emerald-500/30 transition-all"
    >
      {/* Rank */}
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-sm">
        {track.rank}
      </div>

      {/* Image */}
      <div className="relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-lg overflow-hidden bg-[var(--color-card-hover)] flex-shrink-0">
        <ImageWithFallback
          src={track.imageUrl}
          alt={track.name}
          fill
          className="object-cover"
          fallbackType="thumbnail"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={16} className="text-white" fill="white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
          {track.name}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] truncate">
          {track.artist}
        </p>
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
          <Users size={12} />
          {formatNumber(track.listeners)}
        </div>
      </div>
    </a>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <a
      href={artist.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-[var(--color-border)] hover:border-cyan-500/30 transition-all"
    >
      {/* Rank */}
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm">
        {artist.rank}
      </div>

      {/* Image */}
      <div className="relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-full overflow-hidden bg-[var(--color-card-hover)] flex-shrink-0">
        <ImageWithFallback
          src={artist.imageUrl}
          alt={artist.name}
          fill
          className="object-cover"
          fallbackType="avatar"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
          {artist.name}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {formatNumber(artist.playcount)} plays
        </p>
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
          <Users size={12} />
          {formatNumber(artist.listeners)}
        </div>
      </div>

      <ExternalLink
        size={14}
        className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-tertiary)]"
      />
    </a>
  );
}
