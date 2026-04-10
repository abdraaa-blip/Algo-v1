'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNetworkStatus } from './useNetworkStatus'

interface UseAutoRefreshOptions {
  /** Interval in milliseconds (default: 15 minutes) */
  interval?: number
  /** Whether to refresh when tab becomes visible */
  refreshOnFocus?: boolean
  /** Whether to refresh when network reconnects */
  refreshOnReconnect?: boolean
  /** Pause refresh when offline */
  pauseWhenOffline?: boolean
  /** Callback when refresh is triggered */
  onRefresh?: () => Promise<void> | void
}

interface AutoRefreshState {
  lastRefreshTime: Date | null
  isRefreshing: boolean
  refreshCount: number
}

/**
 * Hook for automatic content refresh
 * Refreshes every 15 minutes by default, with smart triggers
 */
export function useAutoRefresh(options: UseAutoRefreshOptions = {}) {
  const {
    interval = 15 * 60 * 1000, // 15 minutes
    refreshOnFocus = true,
    refreshOnReconnect = true,
    pauseWhenOffline = true,
    onRefresh,
  } = options

  const { isOnline } = useNetworkStatus()
  const [state, setState] = useState<AutoRefreshState>({
    lastRefreshTime: null,
    isRefreshing: false,
    refreshCount: 0,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<number>(Date.now())
  const wasOfflineRef = useRef(false)

  const refresh = useCallback(async () => {
    if (state.isRefreshing) return
    if (pauseWhenOffline && !isOnline) return

    setState(prev => ({ ...prev, isRefreshing: true }))

    try {
      await onRefresh?.()
      lastRefreshRef.current = Date.now()
      setState(prev => ({
        lastRefreshTime: new Date(),
        isRefreshing: false,
        refreshCount: prev.refreshCount + 1,
      }))
    } catch (error) {
      console.error('[ALGO AutoRefresh] Refresh failed:', error)
      setState(prev => ({ ...prev, isRefreshing: false }))
    }
  }, [onRefresh, pauseWhenOffline, isOnline, state.isRefreshing])

  // Setup interval
  useEffect(() => {
    if (pauseWhenOffline && !isOnline) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(refresh, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval, refresh, pauseWhenOffline, isOnline])

  // Refresh on focus
  useEffect(() => {
    if (!refreshOnFocus) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only refresh if stale (more than 1 minute since last refresh)
        const timeSinceLastRefresh = Date.now() - lastRefreshRef.current
        if (timeSinceLastRefresh > 60 * 1000) {
          refresh()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshOnFocus, refresh])

  // Refresh on reconnect
  useEffect(() => {
    if (!refreshOnReconnect) return

    if (!isOnline) {
      wasOfflineRef.current = true
    } else if (wasOfflineRef.current) {
      wasOfflineRef.current = false
      refresh()
    }
  }, [isOnline, refreshOnReconnect, refresh])

  // Calculate time until next refresh
  const getTimeUntilNextRefresh = useCallback(() => {
    const elapsed = Date.now() - lastRefreshRef.current
    const remaining = Math.max(0, interval - elapsed)
    return remaining
  }, [interval])

  return {
    ...state,
    refresh,
    getTimeUntilNextRefresh,
  }
}

/**
 * Format time since last refresh
 */
export function formatTimeSinceRefresh(date: Date | null): string {
  if (!date) return 'Jamais'

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'A l\'instant'
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`
  return `Il y a ${Math.floor(seconds / 86400)} j`
}
