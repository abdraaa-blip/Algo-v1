'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, ChevronDown, ChevronUp,
  Video, MessageCircle, Newspaper, Code2, Flame
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Honest status types - no "live" unless truly real-time
type SourceStatus = 'active' | 'delayed' | 'cached' | 'error' | 'offline'

interface DataSource {
  id: string
  name: string
  status: SourceStatus
  refreshRate?: string // e.g., "15min", "30min", "1h"
  lastFetch?: number
}

const sourceIcons: Record<string, typeof Activity> = {
  youtube: Video,
  reddit: MessageCircle,
  hackernews: Flame,
  github: Code2,
  news: Newspaper,
}

interface DataSourcesStatusProps {
  className?: string
}

export function DataSourcesStatus({ className }: DataSourcesStatusProps) {
  const [sources, setSources] = useState<DataSource[]>([
    // Default sources with honest refresh rates (not "live")
    { id: 'youtube', name: 'YouTube', status: 'active', refreshRate: '30min' },
    { id: 'news', name: 'NewsAPI', status: 'active', refreshRate: '15min' },
    { id: 'hackernews', name: 'HackerNews', status: 'active', refreshRate: '15min' },
    { id: 'github', name: 'GitHub', status: 'active', refreshRate: '30min' },
  ])
  const [expanded, setExpanded] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number>(() => Date.now())
  
  // Defer the slow API call - don't block initial render
  useEffect(() => {
    // Wait 5 seconds after page load before fetching status
    // This ensures FCP/LCP are not affected by slow API
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch('/api/live?limit=1')
        const data = await res.json()
        if (data.meta?.sources) {
          setSources(data.meta.sources)
          setLastUpdate(data.meta.lastUpdated)
        }
      } catch {
        // Keep default sources on error
      }
    }, 5000)
    
    // Then refresh every 2 minutes (not every minute to reduce load)
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/live?limit=1')
        const data = await res.json()
        if (data.meta?.sources) {
          setSources(data.meta.sources)
          setLastUpdate(data.meta.lastUpdated)
        }
      } catch {
        // Keep existing sources on error
      }
    }, 120000)
    
    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [])
  
  const activeCount = sources.filter(s => s.status === 'active' || s.status === 'delayed').length
  const totalCount = sources.length || 5
  
  // Use amber instead of green - we're not truly "live"
  const statusColor = activeCount === totalCount 
    ? 'text-amber-400' 
    : activeCount > 0 
    ? 'text-yellow-400' 
    : 'text-red-400'
  
  return (
    <div className={cn('relative', className)}>
      {/* Collapsed status pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-[var(--color-card)] border border-[var(--color-border)]',
          'hover:bg-[var(--color-card-hover)] transition-colors',
          'text-xs font-medium'
        )}
      >
        <span className={cn('w-2 h-2 rounded-full', 
          activeCount === totalCount ? 'bg-amber-400' : 
          activeCount > 0 ? 'bg-yellow-400' : 'bg-red-400'
        )} />
        <span className={statusColor}>
          {activeCount}/{totalCount} Actifs
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={cn(
              'absolute top-full mt-2 right-0 z-50 w-64',
              'bg-[color-mix(in_srgb,var(--color-bg-secondary)_95%,transparent)] backdrop-blur-xl',
              'border border-[var(--color-border)] rounded-xl',
              'shadow-2xl shadow-black/50',
              'p-3 space-y-2'
            )}
          >
            <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] pb-2 border-b border-[var(--color-border)]">
              <span>Data Sources</span>
              <span>
                Updated {lastUpdate ? formatTimeAgo(lastUpdate) : 'never'}
              </span>
            </div>
            
            {sources.length > 0 ? (
              sources.map((source) => {
                const Icon = sourceIcons[source.id] || Activity
                return (
                  <div
                    key={source.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-[var(--color-text-tertiary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">{source.name}</span>
                    </div>
                    <StatusBadge status={source.status} />
                  </div>
                )
              })
            ) : (
              // Default sources when not loaded - with honest "active" status
              ['YouTube', 'Reddit', 'Hacker News', 'GitHub', 'News'].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-white/40" />
                    <span className="text-sm text-white/70">{name}</span>
                  </div>
                  <StatusBadge status="active" />
                </div>
              ))
            )}
            
            <div className="pt-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)] text-center">
              Actualisation toutes les 15-30 minutes selon la source
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  // Honest labels - "active" instead of "live"
  const config = {
    active: { color: 'bg-amber-400', text: 'Actif' },
    delayed: { color: 'bg-yellow-400', text: 'Differe' },
    cached: { color: 'bg-zinc-400', text: 'Cache' },
    error: { color: 'bg-red-400', text: 'Erreur' },
    offline: { color: 'bg-gray-400', text: 'Hors ligne' },
  }
  
  const { color, text } = config[status as keyof typeof config] || config.offline
  
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('w-1.5 h-1.5 rounded-full', color)} />
      <span className="text-xs text-[var(--color-text-secondary)]">{text}</span>
    </div>
  )
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  const locale = typeof navigator !== 'undefined' ? (navigator.language || 'fr-FR') : 'fr-FR'
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (seconds < 60) return rtf.format(0, 'second')
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute')
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour')
  return rtf.format(-Math.floor(seconds / 86400), 'day')
}

// Mini version for navbar - optimized to not block render
export function MiniDataSourcesStatus({ className }: { className?: string }) {
  const [activeCount, setActiveCount] = useState(4) // Default to 4 active sources
  
  useEffect(() => {
    // Defer API call by 5 seconds to not block FCP/LCP
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch('/api/live?limit=1')
        const data = await res.json()
        if (data.meta?.liveSourcesCount !== undefined) {
          setActiveCount(data.meta.liveSourcesCount)
        }
      } catch {
        // Keep default count on error
      }
    }, 5000)
    
    return () => clearTimeout(timeoutId)
  }, [])
  
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        // Use amber instead of green - we're not truly "live"
        activeCount >= 4 ? 'bg-amber-400' : 
        activeCount >= 2 ? 'bg-yellow-400' : 'bg-red-400'
      )} />
      <span className="text-[var(--color-text-tertiary)]">{activeCount} sources actives</span>
    </div>
  )
}
