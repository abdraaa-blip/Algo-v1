'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { History, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ViralScoreRing } from '@/components/ui/ViralScoreRing'

interface RecentItem {
  id: string
  title: string
  score: number
  type: 'trend' | 'video' | 'news' | 'star'
  viewedAt: number
  thumbnail?: string
}

const STORAGE_KEY = 'algo_recently_viewed'
const MAX_ITEMS = 20

// Add an item to recently viewed
export function addToRecentlyViewed(item: Omit<RecentItem, 'viewedAt'>) {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const items: RecentItem[] = stored ? JSON.parse(stored) : []
    
    // Remove existing entry for same id
    const filtered = items.filter(i => i.id !== item.id)
    
    // Add new item at the beginning
    const newItems = [
      { ...item, viewedAt: Date.now() },
      ...filtered
    ].slice(0, MAX_ITEMS)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
  } catch (error) {
    console.error('Failed to save recently viewed:', error)
  }
}

// Clear recently viewed
export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

interface RecentlyViewedProps {
  limit?: number
  showClear?: boolean
  horizontal?: boolean
  className?: string
}

export function RecentlyViewed({
  limit = 6,
  showClear = true,
  horizontal = false,
  className
}: RecentlyViewedProps) {
  const [items, setItems] = useState<RecentItem[]>([])
  const [isClient, setIsClient] = useState(false)

  const loadItems = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentItem[]
        setItems(parsed.slice(0, limit))
      }
    } catch (error) {
      console.error('Failed to load recently viewed:', error)
    }
  }, [limit])

  useEffect(() => {
    setIsClient(true)
    loadItems()
    
    // Listen for storage changes
    const handleStorage = () => loadItems()
    window.addEventListener('storage', handleStorage)
    
    return () => window.removeEventListener('storage', handleStorage)
  }, [loadItems])

  const handleClear = () => {
    clearRecentlyViewed()
    setItems([])
  }

  const removeItem = (id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const items = JSON.parse(stored) as RecentItem[]
        const filtered = items.filter(i => i.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        setItems(filtered.slice(0, limit))
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  if (!isClient || items.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
          <History size={14} />
          Recently Viewed
        </h3>
        {showClear && (
          <button
            onClick={handleClear}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className={cn(
        horizontal 
          ? 'flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide'
          : 'space-y-2'
      )}>
        {items.map(item => (
          <Link
            key={item.id}
            href={`/content/${item.id}`}
            className={cn(
              'group flex items-center gap-3 p-2.5 rounded-xl',
              'bg-white/[0.02] hover:bg-white/[0.05]',
              'border border-white/5 hover:border-white/10',
              'transition-all duration-200',
              horizontal && 'shrink-0 w-[200px]'
            )}
          >
            <ViralScoreRing value={item.score} size="xs" />
            
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-white/70 group-hover:text-white truncate transition-colors">
                {item.title}
              </h4>
              <span className="text-[10px] text-white/30">
                {formatTimeAgo(item.viewedAt)}
              </span>
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                removeItem(item.id)
              }}
              className="size-5 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Remove from history"
            >
              <X size={12} />
            </button>
          </Link>
        ))}
      </div>
      
      {items.length === limit && (
        <Link
          href="/history"
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          View all history
          <ChevronRight size={12} />
        </Link>
      )}
    </div>
  )
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return new Date(timestamp).toLocaleDateString()
}
