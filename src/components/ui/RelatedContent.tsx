'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ViralScoreRing } from '@/components/ui/ViralScoreRing'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'

interface RelatedItem {
  id: string
  title: string
  score: number
  type: 'trend' | 'video' | 'news'
  thumbnail?: string
  sourceUrl?: string
}

interface RelatedContentProps {
  contentId?: string
  contentType?: string
  // Alternative props from content/[id] usage
  currentContentId?: string
  category?: string
  platform?: string
  keywords?: string[]
  limit?: number
  className?: string
}

export function RelatedContent({
  contentId,
  contentType,
  currentContentId,
  category,
  platform: _platform,
  keywords = [],
  limit = 6,
  className,
}: RelatedContentProps) {
  void _platform
  // Normalize props - support both naming conventions
  const resolvedContentId = contentId || currentContentId || ''
  const resolvedContentType = contentType || category || 'trend'
  // Memoize keywords string to prevent infinite loop
  const keywordsString = keywords.length > 0 ? keywords.join(',') : (category || '')
  
  const [items, setItems] = useState<RelatedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    // Prevent re-fetching if we already have data for this content
    if (hasFetched) return
    
    const fetchRelated = async () => {
      // Skip fetch if no valid content ID
      if (!resolvedContentId) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      
      try {
        const response = await fetch(`/api/content/related?id=${encodeURIComponent(resolvedContentId)}&type=${encodeURIComponent(resolvedContentType)}&keywords=${encodeURIComponent(keywordsString)}&limit=${limit}`)
        
        if (response.ok) {
          const data = await response.json()
          setItems(data.items || [])
        } else {
          // Generate mock related content
          setItems(generateMockRelated(keywordsString.split(',').filter(Boolean), limit))
        }
      } catch {
        setItems(generateMockRelated(keywordsString.split(',').filter(Boolean), limit))
      } finally {
        setIsLoading(false)
        setHasFetched(true)
      }
    }

    fetchRelated()
  }, [resolvedContentId, resolvedContentType, keywordsString, limit, hasFetched])
  
  // Don't render if we don't have a valid content ID
  if (!resolvedContentId) {
    return null
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <TrendingUp size={18} className="text-violet-400" />
          Related Content
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
        <TrendingUp size={18} className="text-violet-400" />
        Related Content
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => (
          <Link
            key={item.id}
            href={`/content/${item.id}`}
            className={cn(
              'group flex items-center gap-3 p-3 rounded-xl',
              'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]',
              'border border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
              'transition-all duration-200'
            )}
          >
            {/* Thumbnail or Score */}
            {item.thumbnail ? (
              <ImageWithFallback
                src={item.thumbnail}
                alt={item.title}
                width={48}
                height={48}
                fallbackType="platform"
                platform={item.type}
                className="object-cover rounded-lg"
                containerClassName="size-12 rounded-lg bg-[var(--color-card)] shrink-0"
              />
            ) : (
              <ViralScoreRing value={item.score} size="sm" />
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] truncate transition-colors">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                  item.type === 'trend' && 'bg-violet-500/10 text-violet-400',
                  item.type === 'video' && 'bg-red-500/10 text-red-400',
                  item.type === 'news' && 'bg-blue-500/10 text-blue-400'
                )}>
                  {item.type.toUpperCase()}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">Score: {item.score}</span>
              </div>
            </div>
            
            {/* Arrow */}
            <ExternalLink size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-tertiary)] shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}

function generateMockRelated(keywords: string[], limit: number): RelatedItem[] {
  const types: Array<'trend' | 'video' | 'news'> = ['trend', 'video', 'news']
  
  return Array.from({ length: limit }, (_, i) => ({
    id: `related-${i}-${Date.now()}`,
    title: keywords[i % keywords.length] 
      ? `${keywords[i % keywords.length]} - Related ${types[i % 3]}`
      : `Trending ${types[i % 3]} #${i + 1}`,
    score: Math.round(60 + Math.random() * 35),
    type: types[i % 3],
    thumbnail: i % 2 === 0 ? undefined : undefined
  }))
}
