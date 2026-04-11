'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { mapUserFacingApiError } from '@/lib/copy/api-error-fr'
import type { ViralSignal, ViralScore, TrendPrediction } from '@/lib/algorithm/viral-engine'

export interface RealTimeTrend {
  keyword: string
  signals: ViralSignal[]
  score: ViralScore & {
    breakdown: {
      volume: number
      velocity: number
      engagement: number
      growth: number
    }
  }
  prediction: TrendPrediction & {
    optimalWindow?: string[]
    duration?: string
  }
  platforms: string[]
  platform: string // Primary platform
  totalVolume: number
  volume: number
  avgVelocity: number
  velocity: number
  relatedSounds?: string[]
  region?: string
}

export interface RealTimeMeta {
  totalSignals: number
  uniqueTopics: number
  lastUpdated: number
  country: string
  avgViralScore: number
  topTier: number
}

interface UseRealTimeTrendsOptions {
  country?: string
  limit?: number
  refreshInterval?: number // ms
  enabled?: boolean
}

export function useRealTimeTrends(options: UseRealTimeTrendsOptions = {}) {
  const {
    country = 'US',
    limit = 20,
    refreshInterval = 30000, // 30 secondes par défaut
    enabled = true
  } = options
  
  const [trends, setTrends] = useState<RealTimeTrend[]>([])
  const [meta, setMeta] = useState<RealTimeMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const fetchTrends = useCallback(async () => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    try {
      const response = await fetch(
        `/api/realtime/trends?country=${country}&limit=${limit}`,
        { signal: abortControllerRef.current.signal }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch trends')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setTrends(data.trends)
        setMeta(data.meta)
        setLastFetch(Date.now())
        setError(null)
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Ignorer les erreurs d'annulation
      }
      console.error('[useRealTimeTrends] Error:', err)
      setError(mapUserFacingApiError(err instanceof Error ? err.message : 'Failed to fetch'))
    } finally {
      setLoading(false)
    }
  }, [country, limit])
  
  // Fetch initial et setup interval
  useEffect(() => {
    if (!enabled) return
    
    fetchTrends()
    
    // Setup refresh interval
    intervalRef.current = setInterval(fetchTrends, refreshInterval)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [enabled, refreshInterval, fetchTrends])
  
  // Calculer les métriques dérivées
  const topTrend = trends[0] || null
  const risingFast = trends.filter(t => t.score.tier === 'S' || t.score.tier === 'A')
  const postNowOpportunities = trends.filter(t => t.prediction.recommendedAction === 'post_now')
  
  // Temps depuis la dernière mise à jour
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFetch) {
        setTimeSinceUpdate(Math.floor((Date.now() - lastFetch) / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lastFetch])
  
  return {
    // Data
    trends,
    meta,
    topTrend,
    risingFast,
    postNowOpportunities,
    
    // State
    loading,
    error,
    lastFetch,
    timeSinceUpdate,
    
    // Actions
    refresh: fetchTrends,
    
    // Computed
    isStale: timeSinceUpdate > 60, // Plus de 60 secondes = stale
    hasData: trends.length > 0,
  }
}

// Hook pour un seul trend avec updates en temps réel
export function useRealTimeTrend(keyword: string, options: UseRealTimeTrendsOptions = {}) {
  const { trends, ...rest } = useRealTimeTrends({ ...options, limit: 50 })
  
  const trend = trends.find(t => 
    t.keyword.toLowerCase().includes(keyword.toLowerCase()) ||
    keyword.toLowerCase().includes(t.keyword.toLowerCase())
  )
  
  return {
    trend,
    ...rest
  }
}
