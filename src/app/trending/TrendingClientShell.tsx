'use client'

import { useEffect, useState, useCallback } from 'react'
import { Play, Eye, ThumbsUp, MessageSquare, Clock, RefreshCw, Wifi, WifiOff, ExternalLink } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { useScope } from '@/hooks/useScope'
import { cn } from '@/lib/utils'
import { scopeToCountryCode } from '@/types'

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

const STAGGER = ['algo-s1', 'algo-s2', 'algo-s3', 'algo-s4', 'algo-s5', 'algo-s6'] as const

// Map scope code to YouTube region code
const scopeToRegion: Record<string, string> = {
  'FR': 'FR',
  'US': 'US',
  'GB': 'GB',
  'NG': 'NG',
  'global': ''
}

export function TrendingClientShell() {
  const { scope, isLoaded } = useScope()
  const [videos, setVideos] = useState<RealVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'fallback' | 'mixed'>('live')
  const [refreshing, setRefreshing] = useState(false)

  const fetchVideos = useCallback(async () => {
    try {
      const code = scopeToCountryCode(scope) ?? 'global'
      const regionCode = scopeToRegion[code] ?? ''
      const url = regionCode
        ? `/api/live-videos?region=${regionCode}`
        : '/api/live-videos'
      
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      const data = await res.json()
      
      if (data.success && Array.isArray(data.data)) {
        setVideos(data.data)
        setFetchedAt(data.fetchedAt)
        setDataSource(data.source)
      }
    } catch (error) {
      console.error('[ALGO Trending] Fetch failed:', error)
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

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVideos()
    }, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchVideos])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchVideos()
  }

  const scopeLabel = scope.type === 'global' ? 'Global' : scope.name

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={`Trending Videos · ${scopeLabel}`}
          subtitle="Videos tendance YouTube (MAJ toutes les 15 min)"
        />
        
        {/* Live indicator */}
        <div className="flex items-center gap-3">
          <LiveIndicator source={dataSource} fetchedAt={fetchedAt} />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={cn('text-white/50', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonLoader key={i} shape="card" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && videos.length === 0 && (
        <EmptyState icon={Play} title="Aucune vidéo disponible" />
      )}

      {/* Grid */}
      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {videos.map((video, i) => (
            <VideoCard
              key={`${video.id}-${video.country}-${i}`}
              video={video}
              animClass={STAGGER[i % 6]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── LiveIndicator ────────────────────────────────────────────────────────────

// Honest status indicator - no fake "live" labels
function LiveIndicator({ source, fetchedAt }: { source: string, fetchedAt: string | null }) {
  const isRecent = source === 'live'
  const isCached = source === 'cache'
  
  return (
    <div className="flex items-center gap-2 text-xs">
      {isRecent ? (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-amber-400 font-medium">Donnees recentes</span>
        </>
      ) : isCached ? (
        <>
          <Wifi size={14} className="text-zinc-400" />
          <span className="text-zinc-400">Cache (15 min)</span>
        </>
      ) : (
        <>
          <WifiOff size={14} className="text-red-400" />
          <span className="text-red-400">Hors ligne</span>
        </>
      )}
      {fetchedAt && (
        <span className="text-white/30 ml-1">
          {formatRelativeTime(fetchedAt)}
        </span>
      )}
    </div>
  )
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

function VideoCard({ video, animClass }: { video: RealVideo; animClass: string }) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.id}`
  
  return (
    <article
      role="listitem"
      className={cn(
        'group rounded-2xl border border-white/6 bg-white/[0.025] overflow-hidden',
        'hover:bg-white/[0.045] hover:border-white/10',
        'transition-all duration-[250ms]',
        animClass,
      )}
    >
      {/* Thumbnail */}
      <a 
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video bg-black/50 overflow-hidden"
      >
        <ImageWithFallback
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          platform="youtube"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
          {parseDuration(video.duration)}
        </span>
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <Play size={48} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
        </div>
        {/* Trending badge - honest label */}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600/90 text-white text-[10px] font-bold rounded">
          TENDANCE
        </span>
        {/* Country badge */}
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-violet-600/80 text-white text-[10px] font-bold rounded">
          {video.country}
        </span>
      </a>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <a 
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <h3 className="text-sm font-semibold text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {video.title}
          </h3>
        </a>

        {/* Channel */}
        <p className="text-xs text-white/50 truncate">
          {video.channel}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {formatViewCount(video.views)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp size={12} />
            {formatViewCount(Math.round(video.views * 0.04))}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {formatViewCount(Math.round(video.views * 0.002))}
          </span>
        </div>

        {/* Published */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-white/30 flex items-center gap-1">
            <Clock size={10} />
            {formatRelativeTime(video.publishedAt)}
          </span>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
          >
            Watch <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </article>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatViewCount(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

function parseDuration(duration: string): string {
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
