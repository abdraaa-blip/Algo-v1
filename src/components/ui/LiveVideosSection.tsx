'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Play, Eye, ExternalLink, ChevronRight } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { DataStatusIndicator } from '@/components/ui/DataStatusIndicator'
import { useScope } from '@/hooks/useScope'
import { cn } from '@/lib/utils'

// Self-contained type to avoid importing from real-data-service
interface RealVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  viewCount: number
  duration: string
  country: string
}

interface LiveVideosSectionProps {
  title?: string
  subtitle?: string
  limit?: number
  country?: string
  showViewAll?: boolean
}

export function LiveVideosSection({ 
  title = 'Videos Tendance', 
  subtitle = 'Mises a jour toutes les 15 min',
  limit = 6,
  country,
  showViewAll = true
}: LiveVideosSectionProps) {
  const { scope } = useScope()
  const [videos, setVideos] = useState<RealVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchVideos = useCallback(async () => {
    try {
      const url = country
        ? `/api/live-videos?country=${country}`
        : '/api/live-videos'
      
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      const data = await res.json()
      
      if (data.success && Array.isArray(data.data)) {
        setVideos(data.data.slice(0, limit))
        setFetchedAt(data.fetchedAt)
      }
    } catch (error) {
      console.error('[ALGO Videos] Fetch failed:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [country, limit])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      fetchVideos()
    }, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchVideos])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchVideos()
  }

  return (
    <section aria-label={title}>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader
          title={title}
          subtitle={subtitle}
        />
        
        <DataStatusIndicator
          fetchedAt={fetchedAt}
          scope={scope}
          source="YouTube"
          hasAutoRefresh={true}
          refreshIntervalMs={15 * 60 * 1000}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
          variant="pill"
          showTimestamp={true}
        />
      </div>

      {/* Content wrapper with min-height to prevent CLS */}
      <div className="min-h-[280px]">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <SkeletonLoader key={i} shape="card" />
            ))}
          </div>
        )}

        {/* Videos Grid */}
        {!loading && videos.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video, index) => (
                <VideoCard key={`${video.id}-${video.country}-${index}`} video={video} />
              ))}
            </div>
            
            {showViewAll && (
              <div className="flex justify-center mt-4">
                <Link 
                  href="/trending"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl',
                    'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]',
                    'border border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                    'text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                    'transition-all duration-200'
                  )}
                >
                  <Play size={14} />
                  <span>Voir toutes les vidéos tendance</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-tertiary)]">
            <Play size={32} className="mx-auto mb-2 opacity-50" />
            <p>Aucune vidéo disponible</p>
          </div>
        )}
      </div>
    </section>
  )
}



// ─── VideoCard ────────────────────────────────────────────────────────────────

function VideoCard({ video }: { video: RealVideo }) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.id}`
  
  return (
    <article className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden hover:bg-[var(--color-card-hover)] hover:border-[var(--color-border-strong)] transition-all duration-[250ms]">
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
          <Play size={40} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
        </div>
        {/* Trending badge - honest, not "LIVE" */}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600/90 text-white text-[9px] font-bold rounded flex items-center gap-1">
          TENDANCE
        </span>
        {/* Country badge */}
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-violet-600/80 text-white text-[9px] font-bold rounded">
          {video.country}
        </span>
      </a>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Title */}
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--color-text-primary)] transition-colors">
            {video.title}
          </h3>
        </a>

        {/* Channel */}
        <p className="text-xs text-[var(--color-text-secondary)] truncate">
          {video.channelTitle}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)] pt-1">
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {formatViewCount(video.viewCount)} vues
          </span>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Regarder <ExternalLink size={10} />
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
