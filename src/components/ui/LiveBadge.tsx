'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LiveBadgeProps {
  fetchedAt?: string | null
  className?: string
  showText?: boolean
}

/**
 * LiveBadge - Displays honest data freshness status
 * Uses amber colors instead of red to avoid "live streaming" impression
 */
export function LiveBadge({ fetchedAt, className, showText = true }: LiveBadgeProps) {
  const [status, setStatus] = useState<'live' | 'recent' | 'stale'>('stale')
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (!fetchedAt) return

    const updateStatus = () => {
      const fetched = new Date(fetchedAt).getTime()
      const now = Date.now()
      const minutesAgo = (now - fetched) / 60000

      // Honest labels - not truly "live", just "recent"
      if (minutesAgo < 5) {
        setStatus('live')
        setTimeAgo('Recente')
      } else if (minutesAgo < 15) {
        setStatus('recent')
        setTimeAgo(`${Math.floor(minutesAgo)} min`)
      } else if (minutesAgo < 60) {
        setStatus('stale')
        setTimeAgo(`${Math.floor(minutesAgo)} min`)
      } else {
        setStatus('stale')
        setTimeAgo(`${Math.floor(minutesAgo / 60)}h`)
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 10000)
    return () => clearInterval(interval)
  }, [fetchedAt])

  // Honest colors - amber for recent, not "live" red
  const statusColors = {
    live: 'bg-amber-500',
    recent: 'bg-amber-400',
    stale: 'bg-zinc-500'
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        <span className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          statusColors[status]
        )} />
      </span>
      
      {showText && (
        <span className={cn(
          'text-[10px] font-bold tracking-wider',
          status === 'live' ? 'text-amber-400' : 
          status === 'recent' ? 'text-amber-400' : 'text-zinc-500'
        )}>
          {timeAgo}
        </span>
      )}
    </div>
  )
}

export default LiveBadge
