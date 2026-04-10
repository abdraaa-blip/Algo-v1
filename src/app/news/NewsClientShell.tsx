'use client'
// Force rebuild: 2026-04-06T23:22:00 - Ultimate cache purge v2

import { useEffect, useState, useCallback, memo } from 'react'
import { useScope } from '@/hooks/useScope'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { 
  ExternalLink, 
  Globe2, 
  TrendingUp
} from 'lucide-react'
import { TrendLevelBadge, getTrendLevel } from '@/components/algo/TrendLevelBadge'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { DataQualityChip } from '@/components/ui/DataQualityChip'
import { formatRelativeScopeTime } from '@/lib/geo/time-format'
import { ALGO_UI_EMPTY, ALGO_UI_ERROR, ALGO_UI_LOADING } from '@/lib/copy/ui-strings'

// Types
interface NewsItem {
  id: string
  title: string
  source: string
  sourceName: string
  url: string
  image?: string
  publishedAt: string
  fetchedAt?: string
  category?: string
  importanceScore?: number
}

interface NewsClientShellProps {
  initialNews?: NewsItem[]
}

// Source colors
const SOURCE_COLORS: Record<string, string> = {
  'lemonde.fr': '#1a1a2e',
  'lefigaro.fr': '#b8860b',
  'bfmtv.com': '#ff6600',
  'franceinfo.fr': '#0066cc',
  'liberation.fr': '#cc0000',
  '20minutes.fr': '#0099cc',
  'default': '#374151'
}

function getSourceColor(source: string): string {
  const domain = source.toLowerCase()
  for (const [key, color] of Object.entries(SOURCE_COLORS)) {
    if (domain.includes(key)) return color
  }
  return SOURCE_COLORS.default
}

export function NewsClientShell({ initialNews = [] }: NewsClientShellProps) {
  const { scope } = useScope()
  const { t } = useTranslation()
  const [news, setNews] = useState<NewsItem[]>(initialNews)
  const [loading, setLoading] = useState(initialNews.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const [newsSource, setNewsSource] = useState<string>('live-news')
  
  const labels = {
    title: t('news.title', 'Actualites'),
    loading: t('news.loading', ALGO_UI_LOADING.news),
    error: t('news.error', ALGO_UI_ERROR.message),
    empty: t('news.empty', ALGO_UI_EMPTY.title),
    readMore: t('news.readMore', 'Lire'),
    retry: t('common.retry', 'Reessayer')
  }
  
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const country = scope === 'france' ? 'fr' : 'us'
      const response = await fetch(`/api/live-news?country=${country}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      // API returns data in 'data' field, not 'news'
      setNews(data.data || data.news || [])
      setLastFetchedAt(new Date().toISOString())
      setNewsSource(String(data.source || 'live-news'))
    } catch (err) {
      console.error('[ALGO News] Fetch error:', err)
      setError(labels.error)
    } finally {
      setLoading(false)
    }
  }, [scope, labels.error])
  
  useEffect(() => {
    if (initialNews.length === 0) {
      fetchNews()
    }
  }, [fetchNews, initialNews.length])
  
  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])
  
  if (loading && news.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-4">
        <h1 className="text-2xl font-bold mb-6">{labels.title}</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse bg-[var(--color-card)] rounded-xl h-24" />
          ))}
        </div>
      </div>
    )
  }
  
  if (error && news.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-4 flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchNews}
          className="px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)] transition-colors"
        >
          {labels.retry}
        </button>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-cyan-400" />
            {labels.title}
          </h1>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {news.length} articles
          </span>
        </header>
        <div className="mb-4">
          <DataQualityChip
            source={newsSource}
            freshness={lastFetchedAt ? formatRelativeScopeTime(lastFetchedAt, scope) : 'pending'}
            confidence={news.length >= 12 ? 'high' : news.length >= 5 ? 'medium' : 'low'}
          />
        </div>
        
        {news.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            {labels.empty}
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((item) => (
              <NewsRow
                key={item.id}
                {...item}
                labels={labels}
                scope={scope}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Memoized NewsRow component
interface NewsRowProps extends NewsItem {
  labels: {
    readMore: string
  }
  scope: ReturnType<typeof useScope>['scope']
}

const NewsRow = memo(function NewsRow({
  title,
  source,
  sourceName,
  url,
  image,
  publishedAt,
  importanceScore = 50,
  labels,
  scope,
}: NewsRowProps) {
  const sourceColor = getSourceColor(source)
  const relativeTime = formatRelativeScopeTime(publishedAt, scope)
  const thumb =
    image ||
    `https://picsum.photos/seed/algo${encodeURIComponent(String(id).slice(0, 24))}/80/80`
  
  return (
    <article
      className={cn(
        'group relative rounded-xl overflow-hidden',
        'bg-gradient-to-r from-[var(--color-card)] to-transparent',
        'border border-[var(--color-border)]',
        'hover:border-[var(--color-border-strong)] hover:bg-[var(--color-card-hover)]',
        'transition-all duration-200'
      )}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-4 p-4"
      >
        {/* Image */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[var(--color-card)]">
          <ImageWithFallback
            src={thumb}
            alt=""
            width={80}
            height={80}
            className="w-full h-full object-cover"
            fallbackType="news"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 mb-2 group-hover:text-[var(--color-text-primary)] transition-colors">
            {title}
          </h2>
          
          <div className="flex items-center gap-2 flex-wrap">
            <TrendLevelBadge
              level={getTrendLevel(importanceScore)}
              size="sm"
              animated={importanceScore >= 85}
            />
            
            {/* Freshness indicator */}
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </span>
            
            <span 
              className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              style={{ borderColor: `${sourceColor}40` }}
            >
              {sourceName}
            </span>
            
            <span className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1">
              <TrendingUp size={10} />
              {relativeTime}
            </span>
          </div>
        </div>
        
        {/* Read more */}
        <div className="flex-shrink-0 self-center">
          <span className="flex items-center gap-1 text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {labels.readMore}
            <ExternalLink size={9} strokeWidth={2} aria-hidden />
          </span>
        </div>
      </a>
    </article>
  )
})

NewsRow.displayName = 'NewsRow'

