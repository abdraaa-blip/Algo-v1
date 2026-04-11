'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Radio, ExternalLink, ChevronRight, Clock, Zap } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { cn } from '@/lib/utils'
import { CORE_NEWS_REGIONS } from '@/lib/geo/global-presets'

interface NewsItem {
  id: string
  title: string
  description?: string
  source: { name: string } | string
  url: string
  urlToImage?: string
  image?: string
  publishedAt: string
}

function newsThumb(item: NewsItem): string | undefined {
  return item.urlToImage || item.image
}

const NEWS_REGIONS = [...CORE_NEWS_REGIONS]

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  
  if (diffMins < 1) return 'A l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  return date.toLocaleDateString('fr-FR')
}

export function LiveNewsSection() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeRegion, setActiveRegion] = useState(NEWS_REGIONS[0])
  const regionIdxRef = useRef(0)

  useEffect(() => {
    async function fetchNews() {
      try {
        const region = NEWS_REGIONS[regionIdxRef.current % NEWS_REGIONS.length]
        const res = await fetch(`/api/live-news?country=${region}`)
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          // Filter to only items with good data and prioritize those with images
          const validNews = data.data
            .filter((item: NewsItem) => item.title && item.title.length > 10)
            .sort((a: NewsItem, b: NewsItem) => {
              const ai = Boolean(newsThumb(a))
              const bi = Boolean(newsThumb(b))
              if (ai && !bi) return -1
              if (!ai && bi) return 1
              return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            })
            .slice(0, 8)
          
          setNews(validNews)
          setIsLive(data.source === 'live')
          setLastUpdate(new Date())
          setActiveRegion(region)
          regionIdxRef.current = (regionIdxRef.current + 1) % NEWS_REGIONS.length
        }
      } catch (e) {
        console.warn('[ALGO] Failed to fetch news:', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchNews()
    const interval = setInterval(fetchNews, 3 * 60 * 1000) // Refresh every 3 min for more liveness
    return () => clearInterval(interval)
  }, [])

  // Auto-rotate featured news
  useEffect(() => {
    if (news.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.min(news.length, 3))
    }, 5000)
    return () => clearInterval(timer)
  }, [news.length])

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <div className="h-5 w-32 bg-[var(--color-card)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-video bg-[var(--color-card)] rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (news.length === 0) return null

  const featuredNews = news.slice(0, 3)
  const sideNews = news.slice(3, 8) // Show more side news
  const currentFeatured = featuredNews[currentSlide] || featuredNews[0]

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 border-t border-[var(--color-border)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio size={18} className={isLive ? 'text-amber-400' : 'text-zinc-400'} />
            <span className={cn(
              'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse',
              isLive ? 'bg-amber-500' : 'bg-zinc-500'
            )} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">Actualites du moment</h2>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
            isLive ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-500/20 text-zinc-400'
          )}>
            {isLive ? 'MAJ recente' : 'Cache'}
          </span>
          {lastUpdate && (
            <span className="text-[9px] text-[var(--color-text-muted)] hidden sm:inline">
              Maj {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <Link 
          href="/news"
          className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Tout voir
          <ChevronRight size={14} />
        </Link>
      </div>
      <div className="mb-3 text-[10px]">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-[var(--color-text-secondary)]">
          <span>source: live-news ({activeRegion.toUpperCase()})</span>
          <span className="text-[var(--color-text-muted)]">|</span>
          <span>freshness: {lastUpdate ? lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'pending'}</span>
          <span className="text-[var(--color-text-muted)]">|</span>
          <span className={isLive ? 'text-emerald-300' : 'text-amber-300'}>confidence: {isLive ? 'high' : 'medium'}</span>
        </span>
      </div>

      {/* Content Grid - fixed height to prevent CLS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ contain: 'layout', minHeight: '300px' }}>
        {/* Featured Large Card */}
        <a
          href={currentFeatured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="md:col-span-2 group relative aspect-video md:aspect-[2/1] rounded-xl overflow-hidden bg-[var(--color-card)]"
          style={{ contain: 'layout paint' }}
        >
          {newsThumb(currentFeatured) && (
            <ImageWithFallback
              src={newsThumb(currentFeatured)!}
              alt={currentFeatured.title}
              fill
              fallbackType="news"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              containerClassName="w-full h-full"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* Trending Badge - Honest labeling */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/80 backdrop-blur-sm">
            <Zap size={10} className="text-white" />
            <span className="text-[10px] font-bold text-white uppercase">Tendance</span>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-white/60">
                {typeof currentFeatured.source === 'string' ? currentFeatured.source : currentFeatured.source.name}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-[10px] text-white/60 flex items-center gap-1">
                <Clock size={10} />
                {formatRelativeTime(currentFeatured.publishedAt)}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 group-hover:text-violet-300 transition-colors">
              {currentFeatured.title}
            </h3>
            {currentFeatured.description && (
              <p className="text-xs text-white/50 line-clamp-2 mt-1 hidden sm:block">
                {currentFeatured.description}
              </p>
            )}
          </div>

          {/* Slide Indicators */}
          {featuredNews.length > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1">
              {featuredNews.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentSlide(i)
                  }}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    currentSlide === i ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'
                  )}
                />
              ))}
            </div>
          )}
        </a>

        {/* Side News */}
        <div className="flex flex-col gap-3">
          {sideNews.map((item, i) => (
            <a
              key={item.id || i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-2 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-transparent hover:border-[var(--color-border)] transition-colors"
            >
              {newsThumb(item) && (
                <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={newsThumb(item)!}
                    alt=""
                    fill
                    fallbackType="news"
                    className="object-cover"
                    containerClassName="w-full h-full"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-2 group-hover:text-violet-300 transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] text-[var(--color-text-tertiary)]">
                    {typeof item.source === 'string' ? item.source : item.source.name}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]" />
                  <span className="text-[9px] text-[var(--color-text-tertiary)]">
                    {formatRelativeTime(item.publishedAt)}
                  </span>
                </div>
              </div>
              <ExternalLink size={14} className="text-[var(--color-text-muted)] group-hover:text-violet-400 flex-shrink-0" />
            </a>
          ))}
          
          {/* See All Button */}
          <Link
            href="/news"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-medium transition-colors"
          >
            <Zap size={14} />
            Voir toutes les actualités
          </Link>
        </div>
      </div>
    </section>
  )
}
