'use client'

import { useState, useEffect, useCallback } from 'react'
import { Video, Play, Eye, Clock, RefreshCw } from 'lucide-react'
import { FilterBar } from '@/components/ui/FilterBar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ViralScoreRing } from '@/components/ui/ViralScoreRing'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { BackButton } from '@/components/ui/BackButton'
import { DataStatusIndicator } from '@/components/ui/DataStatusIndicator'
import { DataQualityChip } from '@/components/ui/DataQualityChip'
import { useScope } from '@/hooks/useScope'
import { getCountryCodeFromScope } from '@/data/countries'
import { cn } from '@/lib/utils'
import type { FilterOption } from '@/types'
import { formatRelativeScopeTime } from '@/lib/geo/time-format'

// Self-contained type
interface RealVideo {
  id: string
  title: string
  channel: string
  thumbnail: string
  views: number
  viewsFormatted: string
  publishedAt: string
  publishedAtFormatted: string
  duration: string
  viralScore: number
  growthRate: number
  badge: 'Viral' | 'Early' | 'Breaking' | 'Trend'
  country: string
  url: string
  isExploding?: boolean
}

// Self-contained helpers - formatViewCount with null safety
function formatViewCount(count: number | undefined | null): string {
  // Handle undefined, null, NaN, and non-number values
  if (count === undefined || count === null) return '0'
  const num = Number(count)
  if (isNaN(num)) return '0'
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(num)
}

function parseDuration(duration: string): string {
  if (!duration) return '0:00'
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

interface Labels {
  title: string
  subtitle: string
  loading: string
  emptyTitle: string
  emptySub: string
  filterAll: string
  filters: {
    time: FilterOption[]
    category: FilterOption[]
  }
}

interface VideosClientShellProps {
  locale: string
  labels: Labels
}

const STAGGER = ['algo-s1', 'algo-s2', 'algo-s3', 'algo-s4', 'algo-s5', 'algo-s6'] as const

// Map scope code to YouTube region code
const scopeToRegion: Record<string, string> = {
  'FR': 'FR',
  'US': 'US',
  'GB': 'GB',
  'NG': 'NG',
  'global': ''
}

export function VideosClientShell({ locale, labels }: VideosClientShellProps) {
  void locale
  const [activeRegion, setActiveRegion] = useState('all')
  const { scope, isLoaded } = useScope()
  const [videos, setVideos] = useState<RealVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchVideos = useCallback(async () => {
    try {
      // Get country code from scope (handles global, region, and country types)
      const countryCode = getCountryCodeFromScope(scope)
      const regionCode = scopeToRegion[countryCode] || ''
      const url = regionCode
        ? `/api/live-videos?country=${regionCode}`
        : '/api/live-videos'
      
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      const data = await res.json()
      
      if (data.success && Array.isArray(data.data)) {
        setVideos(data.data)
        setFetchedAt(data.fetchedAt)
      }
    } catch (error) {
      console.error('[ALGO Videos] Fetch failed:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [scope])

  useEffect(() => {
    if (isLoaded) {
      setLoading(true)
      fetchVideos()
    }
  }, [isLoaded, fetchVideos])

  // Auto-refresh every 30 seconds for live data
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      fetchVideos()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchVideos])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchVideos()
  }

  // Filter by region if not global
  const filtered = activeRegion === 'all' 
    ? videos 
    : videos.filter(v => v.country === activeRegion)

  const scopeLabel = scope.type === 'global' ? '' : ` · ${scope.name}`

  const regionFilters: FilterOption[] = [
    { value: 'all', label: 'All Regions' },
    { value: 'FR', label: 'France' },
    { value: 'US', label: 'USA' },
    { value: 'GB', label: 'UK' },
    { value: 'NG', label: 'Nigeria' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Back Button */}
      <BackButton fallbackHref="/" />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] border border-[var(--color-border)] p-5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-rose-500/5 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-violet-500/5 rounded-full blur-[60px]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Video className="text-rose-400" size={20} />
                <h1 className="text-xl font-black text-[var(--color-text-primary)] tracking-tight">
                  {labels.title}{scopeLabel}
                </h1>
                <DataStatusIndicator
                  fetchedAt={fetchedAt}
                  scope={scope}
                  source="YouTube"
                  hasAutoRefresh={true}
                  refreshIntervalMs={30000}
                  variant="badge"
                  showTimestamp={false}
                />
              </div>
              <p className="text-sm text-[var(--color-text-tertiary)]">Videos tendances YouTube (mises a jour toutes les 30s)</p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw size={16} className={cn('text-[var(--color-text-secondary)]', refreshing && 'animate-spin')} />
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {videos.reduce((sum, v) => sum + (v.views || 0), 0).toLocaleString()} total views
            </span>
            <span className="flex items-center gap-1">
              <Video size={12} />
              {videos.length} videos
            </span>
          </div>
          <div className="mt-3">
            <DataQualityChip
              source={`youtube:${getCountryCodeFromScope(scope) || 'global'}`}
              freshness={fetchedAt ? formatRelativeScopeTime(fetchedAt, scope) : 'pending'}
              confidence={videos.length >= 20 ? 'high' : videos.length >= 8 ? 'medium' : 'low'}
            />
          </div>
        </div>
      </div>

      {/* Region Filter */}
      <div
        className="sticky top-14 z-[100] -mx-4 px-4 py-2 border-b border-[var(--color-border)] algo-sticky-subnav"
      >
        <FilterBar
          filters={regionFilters}
          active={activeRegion}
          onChange={setActiveRegion}
          ariaLabel="Filter by region"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLoader key={i} shape="card" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={Video}
          title={labels.emptyTitle}
          subtitle={labels.emptySub}
          cta={{ label: labels.filterAll, onClick: () => setActiveRegion('all') }}
        />
      )}

      {/* Featured Video */}
      {!loading && filtered.length > 0 && (
        <section>
          <SectionHeader 
            title="Top Trending" 
            subtitle="Most watched video right now"
            className="mb-4"
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Main featured video */}
            <a
              href={`https://www.youtube.com/watch?v=${filtered[0].id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'relative group overflow-hidden rounded-2xl',
                'bg-gradient-to-br from-[var(--color-card)] to-transparent',
                'border border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                'transition-all duration-300',
                'algo-s1'
              )}
            >
              <div className="aspect-video relative">
                <ImageWithFallback 
                  src={filtered[0].thumbnail}
                  alt={filtered[0].title}
                  fill
                  className="object-cover"
                  platform="youtube"
                  showPlayButton={false}
                  priority
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={64} className="text-white/50 group-hover:text-white group-hover:scale-110 transition-all" />
                </div>
                
                {/* Duration badge */}
                <span className="absolute bottom-14 right-3 text-xs font-mono bg-black/80 text-white px-1.5 py-0.5 rounded">
                  {parseDuration(filtered[0].duration)}
                </span>
                
                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      TRENDING
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                      {filtered[0].country}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                    {filtered[0].title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">{filtered[0].channel}</p>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {formatViewCount(filtered[0].views)} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatRelativeScopeTime(filtered[0].publishedAt, scope)}
                    </span>
                  </div>
                </div>
                
                {/* Viral Score */}
                <div className="absolute top-4 right-4">
                  <ViralScoreRing 
                    value={Math.min(99, Math.round(50 + ((filtered[0].views || 0) / 1000000) * 5))} 
                    size="md" 
                  />
                </div>
              </div>
            </a>
            
            {/* Secondary featured videos */}
            <div className="grid grid-cols-2 gap-3">
              {filtered.slice(1, 5).map((video, i) => (
                <VideoCard key={`secondary-${video.id}-${i}`} video={video} animClass={STAGGER[(i + 1) % 6]} scope={scope} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Videos Grid */}
      {!loading && filtered.length > 5 && (
        <section>
          <SectionHeader 
            title="All Trending Videos" 
            className="mb-4"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.slice(5).map((video, i) => (
              <VideoCard key={`grid-${video.id}-${i}`} video={video} animClass={STAGGER[i % 6]} scope={scope} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}




// ─── VideoCard ────────────────────────────────────────────────────────────────

function VideoCard({ video, animClass, scope }: { video: RealVideo, animClass: string, scope: ReturnType<typeof useScope>['scope'] }) {
  const viralScore = Math.min(99, Math.round(40 + ((video.views || 0) / 500000) * 6))
  
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'relative group overflow-hidden rounded-xl',
        'bg-[var(--color-card)] border border-[var(--color-border)]',
        'hover:border-[var(--color-border-strong)] hover:bg-[var(--color-card-hover)]',
        'transition-all duration-200',
        animClass
      )}
    >
      <div className="aspect-video relative">
        <ImageWithFallback 
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover"
          platform="youtube"
          showPlayButton={false}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={32} className="text-white" />
        </div>
        
        {/* Duration */}
        <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 text-white px-1 py-0.5 rounded">
          {parseDuration(video.duration)}
        </span>
        
        {/* Country */}
        <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white/80">
          {video.country}
        </span>
        
        {/* Score */}
        <span className={cn(
          'absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded',
          viralScore >= 80 ? 'bg-yellow-500/30 text-yellow-400' :
          viralScore >= 60 ? 'bg-violet-500/30 text-violet-400' :
          'bg-[var(--color-card-hover)] text-[var(--color-text-secondary)]'
        )}>
          {viralScore}
        </span>
      </div>
      
      <div className="p-3">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 mb-1 group-hover:text-[var(--color-text-primary)] transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-2 line-clamp-1">{video.channel}</p>
        <div className="flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
          <span className="flex items-center gap-1">
            <Eye size={10} />
            {formatViewCount(video.views)}
          </span>
          <span>{formatRelativeScopeTime(video.publishedAt, scope)}</span>
        </div>
      </div>
    </a>
  )
}
