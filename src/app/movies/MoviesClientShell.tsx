'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { 
  Film, Tv, Play, Star, TrendingUp, Users, Award,
  ChevronRight, ExternalLink, Flame, Lightbulb, Sparkles, X, 
  Video, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ViralScoreRing } from '@/components/ui/ViralScoreRing'
import { BackButton } from '@/components/ui/BackButton'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ImageWithFallback, AvatarWithFallback } from '@/components/ui/ImageWithFallback'
import { ActionPanel } from '@/components/algo/ActionPanel'
import { TrendLevelBadge, getTrendLevel } from '@/components/algo/TrendLevelBadge'
import { DataQualityChip } from '@/components/ui/DataQualityChip'
import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Movie {
  id: string
  title: string
  type: 'movie' | 'series' | 'documentary'
  year: number
  poster: string
  backdrop: string
  rating: number
  viralScore: number
  momentum: 'exploding' | 'rising' | 'stable' | 'declining'
  genre: string[]
  runtime?: number
  seasons?: number
  description: string
  director?: string
  creator?: string
  cast: Array<{ name: string; character: string; photo: string }>
  platforms: Array<{ name: string; url: string; type: string; price?: string }>
  trailer?: string
  trendingReason?: string
  buzzKeywords: string[]
  socialMentions: number
  awards?: string
}

interface MoviesClientShellProps {
  locale: string
  labels: Record<string, unknown>
}

const MOMENTUM_CONFIG = {
  exploding: { label: 'Explose', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  rising: { label: 'Monte', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  stable: { label: 'Stable', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  declining: { label: 'Baisse', color: 'text-[var(--color-text-tertiary)]', bg: 'bg-[var(--color-card-hover)]' },
}

export function MoviesClientShell({ locale, labels }: MoviesClientShellProps) {
  void locale
  void labels
  const [activeType, setActiveType] = useState<'all' | 'movie' | 'series'>('all')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [sortBy, setSortBy] = useState<'viralScore' | 'rating' | 'socialMentions'>('viralScore')

  const { data, isLoading } = useSWR<{ movies: Movie[] }>(
    `/api/movies?type=${activeType}`,
    fetcher,
    { refreshInterval: 60000 }
  )

  const movies = data?.movies?.sort((a, b) => {
    if (sortBy === 'viralScore') return b.viralScore - a.viralScore
    if (sortBy === 'rating') return b.rating - a.rating
    return b.socialMentions - a.socialMentions
  }) || []

  // Featured movie (highest viral score)
  const featuredMovie = movies[0]

  return (
    <div className="min-h-screen px-4 py-6 space-y-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <BackButton fallbackHref="/" />
      
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
            <Film size={24} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Films & Series</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Ce qui fait le buzz en ce moment</p>
          </div>
        </div>
        <DataQualityChip
          source="tmdb + movie intelligence"
          freshness={isLoading ? 'refreshing' : 'active'}
          confidence={movies.length >= 12 ? 'high' : movies.length >= 5 ? 'medium' : 'low'}
        />
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type Filter */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
          {(['all', 'movie', 'series'] as const).map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeType === type
                  ? 'bg-violet-500/30 text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)]'
              )}
            >
              {type === 'all' ? 'Tout' : type === 'movie' ? 'Films' : 'Series'}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[var(--color-text-tertiary)]">Trier par:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-lg algo-input-field text-sm min-w-0"
          >
            <option value="viralScore">Score Viral</option>
            <option value="rating">Note</option>
            <option value="socialMentions">Mentions</option>
          </select>
        </div>
      </div>

      {/* Featured Movie */}
      {featuredMovie && (
        <section className="relative rounded-2xl overflow-hidden border border-[var(--color-border)]">
          {/* Backdrop */}
          <div className="absolute inset-0">
            <ImageWithFallback
              src={featuredMovie.backdrop || featuredMovie.poster}
              alt=""
              fill
              fallbackType="platform"
              platform="movie"
              className="object-cover opacity-30"
              containerClassName="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-primary)] via-[color-mix(in_srgb,var(--color-bg-primary)_80%,transparent)] to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-primary)] via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6">
            {/* Poster */}
            <div className="shrink-0 w-40 md:w-48 aspect-[2/3]">
              <ImageWithFallback
                src={featuredMovie.poster}
                alt={featuredMovie.title}
                fill
                fallbackType="platform"
                platform="movie"
                className="rounded-xl shadow-2xl object-cover"
                containerClassName="w-full h-full rounded-xl"
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                      MOMENTUM_CONFIG[featuredMovie.momentum].bg,
                      MOMENTUM_CONFIG[featuredMovie.momentum].color
                    )}>
                      <Flame size={10} className="inline mr-1" />
                      {MOMENTUM_CONFIG[featuredMovie.momentum].label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] text-[10px] uppercase">
                      {featuredMovie.type === 'movie' ? 'Film' : 'Serie'}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">{featuredMovie.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-text-secondary)]">
                    <span>{featuredMovie.year}</span>
                    <span>•</span>
                    <span>{featuredMovie.genre.slice(0, 2).join(', ')}</span>
                    {featuredMovie.runtime && (
                      <>
                        <span>•</span>
                        <span>{Math.floor(featuredMovie.runtime / 60)}h {featuredMovie.runtime % 60}min</span>
                      </>
                    )}
                    {featuredMovie.seasons && (
                      <>
                        <span>•</span>
                        <span>{featuredMovie.seasons} saison{featuredMovie.seasons > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
                <ViralScoreRing value={featuredMovie.viralScore} size="lg" />
              </div>

              <p className="text-[var(--color-text-secondary)] text-sm line-clamp-3">{featuredMovie.description}</p>

              {/* Why Trending */}
              {featuredMovie.trendingReason && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <TrendingUp size={14} className="text-orange-400" />
                  <span className="text-sm text-orange-300">{featuredMovie.trendingReason}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[var(--color-text-primary)] font-medium">{featuredMovie.rating}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                  <Users size={14} />
                  <span>{(featuredMovie.socialMentions / 1000000).toFixed(1)}M mentions</span>
                </div>
                {featuredMovie.awards && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Award size={14} />
                    <span className="text-xs">{featuredMovie.awards}</span>
                  </div>
                )}
              </div>

              {/* Cast */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {featuredMovie.cast.slice(0, 4).map(actor => (
                  <div key={actor.name} className="flex items-center gap-2 shrink-0 px-2 py-1 rounded-full bg-[var(--color-card)] border border-[var(--color-border)]">
                    <AvatarWithFallback
                      src={actor.photo}
                      name={actor.name}
                      size={24}
                      className="bg-[var(--color-card-hover)]"
                    />
                    <span className="text-xs text-[var(--color-text-secondary)]">{actor.name}</span>
                  </div>
                ))}
              </div>

              {/* Platforms */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--color-text-tertiary)]">Disponible sur:</span>
                {featuredMovie.platforms.map(platform => (
                  <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      platform.type === 'cinema' 
                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                        : platform.type === 'streaming'
                        ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                        : 'bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] border border-[var(--color-border)]'
                    )}
                  >
                    {platform.name}
                    {platform.price && <span className="text-[var(--color-text-tertiary)]">({platform.price})</span>}
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                {featuredMovie.trailer ? (
                  <a
                    href={featuredMovie.trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    <Play size={16} className="fill-white" />
                    Bande-annonce
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-tertiary)] text-sm">
                    <Video size={16} />
                    Bande-annonce indisponible
                  </span>
                )}
                <button
                  onClick={() => setSelectedMovie(featuredMovie)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/20 text-violet-300 font-medium text-sm hover:bg-violet-500/30 transition-colors border border-violet-500/20"
                >
                  Plus de details
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <section>
        <SectionHeader title="Trending maintenant" className="mb-4" />
        
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-[var(--color-card)]" />
                <div className="mt-2 h-4 rounded bg-[var(--color-card)] w-3/4" />
                <div className="mt-1 h-3 rounded bg-[var(--color-card)] w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && movies.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.slice(1).map((movie, index) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                rank={index + 2}
                onClick={() => setSelectedMovie(movie)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  )
}


function MovieCard({ movie, rank, onClick }: { movie: Movie; rank: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 rounded-xl"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--color-card)]">
        <ImageWithFallback
          src={movie.poster}
          alt={movie.title}
          fill
          fallbackType="platform"
          platform="movie"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          containerClassName="w-full h-full"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Rank Badge */}
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <span className="text-xs font-bold text-white">{rank}</span>
        </div>

        {/* Score */}
        <div className="absolute top-2 right-2">
          <ViralScoreRing value={movie.viralScore} size="xs" />
        </div>

        {/* Trend Level Badge */}
        <div className="absolute bottom-2 left-2">
          <TrendLevelBadge 
            level={getTrendLevel(movie.viralScore)} 
            size="sm" 
            animated={movie.momentum === 'exploding'}
          />
        </div>

        {/* Type Badge */}
        <div className="absolute bottom-2 right-2">
          {movie.type === 'series' && (
            <div className="w-6 h-6 rounded-full bg-blue-500/80 backdrop-blur-sm flex items-center justify-center">
              <Tv size={12} className="text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2">
        <h3 className="font-medium text-[var(--color-text-primary)] text-sm truncate group-hover:text-violet-300 transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span>{movie.year}</span>
          <span>•</span>
          <div className="flex items-center gap-0.5">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span>{movie.rating}</span>
          </div>
        </div>
        {/* CTA - Voir les details */}
        <div 
          className="mt-2 text-[9px] text-center py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ 
            background: 'rgba(123,97,255,0.15)',
            color: 'rgba(123,97,255,0.9)'
          }}
        >
          Voir les details
        </div>
      </div>
    </button>
  )
}

interface MovieDetailsData {
  id: string
  title: string
  overview: string
  posterUrl: string
  backdropUrl: string
  releaseDate?: string
  runtime?: number
  seasons?: number
  episodes?: number
  rating: number
  genres: string[]
  tagline?: string
  director?: string
  creator?: string
  cast: Array<{ name: string; character: string; photo: string }>
  trailerKey?: string
  trailerUrl?: string
  platforms: Array<{ name: string; url: string; type: string }>
  contentIdeas?: string[]
  type: 'movie' | 'series'
}

function MovieDetailModal({ movie, onClose }: { movie: Movie; onClose: () => void }) {
  const [showTrailer, setShowTrailer] = useState(false)
  const [trailerError, setTrailerError] = useState(false)
  
  // Fetch detailed data (with trailer and content ideas)
  const { data: detailsData, error: detailsError, isLoading: detailsLoading } = useSWR<{ success: boolean; data: MovieDetailsData }>(
    `/api/movies/${movie.id}`,
    fetcher,
    { revalidateOnFocus: false }
  )
  
  const details = detailsData?.data
  const hasTrailer = details?.trailerKey || movie.trailer
  const trailerKey = details?.trailerKey || (movie.trailer?.includes('youtube.com') ? movie.trailer.split('v=')[1]?.split('&')[0] : null)
  const contentIdeas = details?.contentIdeas || []
  const cast = details?.cast?.length ? details.cast : movie.cast
  
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      
      <div 
        className="relative w-full sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle for mobile */}
        <div className="sm:hidden sticky top-0 z-20 flex justify-center py-2 bg-[var(--color-bg-secondary)]">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        
        {/* Backdrop Header with Trailer Button */}
        <div className="relative h-48 sm:h-64 md:h-80">
          {showTrailer && trailerKey && !trailerError ? (
            // Embedded YouTube Trailer
            <div className="absolute inset-0 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={`Bande-annonce de ${movie.title}`}
                onError={() => setTrailerError(true)}
              />
              {/* Close trailer button */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowTrailer(false) }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors z-20"
                aria-label="Fermer la bande-annonce"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <>
              <ImageWithFallback
                src={movie.backdrop || movie.poster}
                alt=""
                fill
                fallbackType="platform"
                platform="movie"
                className="object-cover"
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-secondary)] via-[color-mix(in_srgb,var(--color-bg-secondary)_50%,transparent)] to-transparent" />
              
              {/* Play Trailer Button - Centered */}
              {hasTrailer && trailerKey && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTrailer(true) }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/90 backdrop-blur-md border border-[var(--color-border-strong)] text-white font-bold text-sm hover:bg-red-500 hover:scale-105 transition-all z-10"
                  aria-label={`Voir la bande-annonce de ${movie.title}`}
                >
                  <Play size={20} fill="white" />
                  Bande-annonce
                </button>
              )}
              
              {/* No trailer available indicator - clean, intentional design */}
              {!hasTrailer && !detailsLoading && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-black/60 backdrop-blur-md border border-[var(--color-border)]">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-card)] flex items-center justify-center">
                    <Video size={20} className="text-[var(--color-text-muted)]" />
                  </div>
                  <span className="text-sm text-[var(--color-text-secondary)] text-center">Bande-annonce indisponible pour ce film</span>
                </div>
              )}
            </>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 -mt-16 sm:-mt-20 relative space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Poster - centered on mobile */}
            <div className="shrink-0 w-24 sm:w-32 md:w-40 aspect-[2/3] mx-auto sm:mx-0">
              <ImageWithFallback
                src={movie.poster}
                alt={movie.title}
                fill
                fallbackType="platform"
                platform="movie"
                className="rounded-xl shadow-2xl object-cover"
                containerClassName="w-full h-full rounded-xl"
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2 sm:space-y-3 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">{movie.title}</h2>
              
              {/* Tagline */}
              {details?.tagline && (
                <p className="text-sm italic text-violet-300">&quot;{details.tagline}&quot;</p>
              )}
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="text-[var(--color-text-secondary)]">{movie.year}</span>
                {(details?.runtime || movie.runtime) && (
                  <span className="text-[var(--color-text-secondary)]">{details?.runtime || movie.runtime} min</span>
                )}
                {(details?.seasons || movie.seasons) && (
                  <span className="text-[var(--color-text-secondary)]">{details?.seasons || movie.seasons} saisons</span>
                )}
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[var(--color-text-primary)] font-medium">{movie.rating}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-2">
                {movie.genre.map(g => (
                  <span key={g} className="px-2 py-0.5 sm:py-1 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] text-[10px] sm:text-xs text-[var(--color-text-secondary)]">
                    {g}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3">
                <ViralScoreRing value={movie.viralScore} size="md" />
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)]">Score ALGO</div>
                  <div className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)]">{(movie.socialMentions / 1000000).toFixed(1)}M mentions</div>
                </div>
              </div>
              
              {/* Director/Creator */}
              {(details?.director || details?.creator || movie.director || movie.creator) && (
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {movie.type === 'series' ? 'Createur' : 'Realisateur'}: {' '}
                  <span className="text-[var(--color-text-primary)]">{details?.director || details?.creator || movie.director || movie.creator}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">Synopsis</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {details?.overview || movie.description || 'Aucune description disponible.'}
            </p>
          </div>

          {/* Why Trending */}
          {movie.trendingReason && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <TrendingUp size={16} className="text-orange-400 flex-shrink-0" />
              <span className="text-sm text-orange-300">{movie.trendingReason}</span>
            </div>
          )}

          {/* Content Ideas Section - KEY FEATURE */}
          {contentIdeas.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-violet-300">Idees de contenu pour ce film</h3>
                <Sparkles size={14} className="text-fuchsia-400" />
              </div>
              <div className="space-y-2">
                {contentIdeas.slice(0, 5).map((idea, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(idea)
                    }}
                  >
                    <span className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-300 flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[var(--color-text-secondary)]">{idea}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-[var(--color-text-tertiary)] text-center">Clique sur une idee pour la copier</p>
            </div>
          )}

          {/* Loading state for content ideas */}
          {detailsLoading && (
            <div className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                <span className="text-sm text-[var(--color-text-secondary)]">{ALGO_UI_LOADING.contentIdeas}</span>
              </div>
            </div>
          )}
          
          {/* Empty state for content ideas (only when loaded but empty) */}
          {!detailsLoading && !detailsError && contentIdeas.length === 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border border-violet-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={18} className="text-violet-400/50" />
                <h3 className="text-sm font-bold text-violet-300/50">Idees de contenu</h3>
              </div>
              <p className="text-sm text-[var(--color-text-tertiary)]">Les suggestions de contenu seront disponibles prochainement pour ce film.</p>
            </div>
          )}

          {/* Error state */}
          {detailsError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400" />
              <span className="text-sm text-amber-300">Certains details sont temporairement indisponibles</span>
            </div>
          )}

          {/* Action Panel - What to do with this content */}
          <ActionPanel
            viralScore={movie.viralScore}
            timeRemaining={movie.momentum === 'exploding' ? '6h restantes' : movie.momentum === 'rising' ? '24h restantes' : '48h restantes'}
            postBefore={movie.momentum === 'exploding' ? '18h' : undefined}
            emotion={movie.buzzKeywords?.includes('scandal') ? 'colere' : movie.buzzKeywords?.includes('award') ? 'joie' : 'surprise'}
            format="reaction"
            idealPlatform={['TikTok', 'YouTube']}
            hookSuggestion={contentIdeas[0] || `Mon avis honnete sur ${movie.title}...`}
            videoDuration="30-60s"
            confidenceLevel={movie.viralScore >= 80 ? 'eleve' : movie.viralScore >= 60 ? 'moyen' : 'faible'}
          />

          {/* Cast */}
          <div>
            <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">Casting</h3>
            {cast.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {cast.map(actor => (
                  <div key={actor.name} className="shrink-0 text-center">
                    <AvatarWithFallback
                      src={actor.photo}
                      name={actor.name}
                      size={64}
                      className="mx-auto bg-[var(--color-card-hover)]"
                    />
                    <div className="mt-2 text-xs font-medium text-[var(--color-text-primary)] truncate max-w-[80px]">{actor.name}</div>
                    <div className="text-[10px] text-[var(--color-text-tertiary)] truncate max-w-[80px]">{actor.character}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-tertiary)] text-sm">
                <Users size={16} />
                <span>Informations du casting non disponibles</span>
              </div>
            )}
          </div>

          {/* Platforms */}
          <div>
            <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">Ou regarder</h3>
            <div className="flex flex-wrap gap-2">
              {movie.platforms.map(platform => (
                <a
                  key={platform.name}
                  href={platform.url !== '#' ? platform.url : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all min-h-[44px]',
                    platform.type === 'cinema' 
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : platform.type === 'streaming'
                      ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                      : 'bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] border border-[var(--color-border)]',
                    platform.url === '#' && 'cursor-default opacity-60'
                  )}
                  onClick={(e) => platform.url === '#' && e.preventDefault()}
                >
                  {platform.name}
                  {platform.price && <span className="text-[var(--color-text-tertiary)]">• {platform.price}</span>}
                  {platform.url !== '#' && <ExternalLink size={12} />}
                </a>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--color-border)]">
            {hasTrailer && trailerKey && (
              <button
                onClick={() => setShowTrailer(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
              >
                <Play size={18} className="fill-white" />
                Voir la bande-annonce
              </button>
            )}
            <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-card-hover)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-card)] border border-[var(--color-border)] transition-colors min-h-[44px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Ajouter a ma liste
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: movie.title,
                    text: `Decouvre "${movie.title}" sur ALGO`,
                    url: window.location.href
                  })
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-card)] text-[var(--color-text-secondary)] font-medium hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors min-h-[44px]"
            >
              <ExternalLink size={16} />
              Partager
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
