'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreakingNews {
  id: string
  title: string
  source: string
  url?: string
  publishedAt: string
}

interface BreakingNewsBannerProps {
  className?: string
}

export function BreakingNewsBanner({ className }: BreakingNewsBannerProps) {
  const [breakingNews, setBreakingNews] = useState<BreakingNews | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const res = await fetch('/api/live-news?breaking=true')
        if (!res.ok) return
        
        const data = await res.json()
        if (data.data?.[0]) {
          const news = data.data[0]
          const newsId = `${news.title}-${news.publishedAt}`
          
          // Check if this is truly breaking (published in last 30 minutes)
          const publishedTime = new Date(news.publishedAt).getTime()
          const now = Date.now()
          const minutesAgo = (now - publishedTime) / 60000
          
          if (minutesAgo < 30 && !dismissed.includes(newsId)) {
            setBreakingNews({
              id: newsId,
              title: news.title,
              source: typeof news.source === 'object' ? news.source.name : news.source,
              url: news.url,
              publishedAt: news.publishedAt
            })
            setIsVisible(true)
          }
        }
      } catch {
        // Silent fail
      }
    }

    fetchBreakingNews()
    const interval = setInterval(fetchBreakingNews, 5 * 60 * 1000) // Check every 5 min
    return () => clearInterval(interval)
  }, [dismissed])

  const handleDismiss = () => {
    if (breakingNews) {
      setDismissed(prev => [...prev, breakingNews.id])
    }
    setIsVisible(false)
  }

  if (!isVisible || !breakingNews) return null

  return (
    <div 
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-gradient-to-r from-red-600 via-red-500 to-red-600',
        'animate-in slide-in-from-top duration-500',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        {/* Pulsing alert icon */}
        <div className="flex-shrink-0 relative">
          <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
          <div className="absolute inset-0 animate-ping">
            <AlertTriangle className="w-5 h-5 text-white opacity-50" />
          </div>
        </div>

        {/* Breaking label */}
        <span className="flex-shrink-0 px-2 py-0.5 bg-white/20 rounded text-[10px] font-black tracking-wider text-white uppercase">
          Breaking
        </span>

        {/* News text */}
        <p className="flex-1 text-sm font-medium text-white truncate">
          {breakingNews.title}
        </p>

        {/* Source */}
        <span className="flex-shrink-0 text-xs text-white/70">
          {breakingNews.source}
        </span>

        {/* Link */}
        {breakingNews.url && (
          <a 
            href={breakingNews.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-white" />
          </a>
        )}

        {/* Dismiss */}
        <button 
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Animated bottom border */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
    </div>
  )
}
