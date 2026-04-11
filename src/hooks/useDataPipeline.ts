'use client'

/**
 * useDataPipeline - React hook for data fetching with pipeline system
 * 
 * Features:
 * - Automatic caching with configurable TTL
 * - Background revalidation (stale-while-revalidate)
 * - Fallback to last valid data on error
 * - Status tracking (active, delayed, static, error)
 * - Deduplication of concurrent requests
 * 
 * @module useDataPipeline
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { mapUserFacingApiError } from '@/lib/copy/api-error-fr'
import {
  DataPipeline,
  type DataStatus,
  type NormalizedDataItem,
} from '@/lib/data-pipeline'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseDataPipelineOptions<T> {
  sourceId: string
  endpoint: string
  region?: string
  autoRefresh?: boolean
  refreshIntervalMs?: number
  normalize?: (data: unknown, region: string) => T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseDataPipelineResult<T> {
  data: T | null
  isLoading: boolean
  isRefreshing: boolean
  error: Error | null
  status: DataStatus
  fetchedAt: string | null
  isFallback: boolean
  refresh: () => Promise<void>
  meta: {
    totalItems: number
    region: string
    apiCalls: number
  } | null
}

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

const memoryCache = new Map<string, {
  data: unknown
  fetchedAt: string
  expiresAt: string
}>()

const inFlightRequests = new Map<string, Promise<unknown>>()

// ─── Hook Implementation ──────────────────────────────────────────────────────

export function useDataPipeline<T = NormalizedDataItem[]>(
  options: UseDataPipelineOptions<T>
): UseDataPipelineResult<T> {
  const {
    sourceId,
    endpoint,
    region = 'FR',
    autoRefresh = true,
    refreshIntervalMs,
    normalize,
    onSuccess,
    onError,
  } = options

  const config = DataPipeline.sources[sourceId]
  const effectiveRefreshInterval = refreshIntervalMs || config?.refreshIntervalMs || 15 * 60 * 1000

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [meta, setMeta] = useState<{ totalItems: number; region: string; apiCalls: number } | null>(null)

  const lastValidDataRef = useRef<T | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const cacheKey = `${sourceId}:${region}:${endpoint}`

  // Determine current status
  const status: DataStatus = error 
    ? 'error' 
    : isLoading 
    ? 'loading' 
    : fetchedAt 
    ? DataPipeline.determineStatus(fetchedAt, config || { 
        refreshIntervalMs: effectiveRefreshInterval, 
        maxAgeMs: effectiveRefreshInterval * 4 
      } as Parameters<typeof DataPipeline.determineStatus>[1])
    : 'loading'

  // Fetch data with caching and fallback
  const fetchData = useCallback(async (isBackground = false) => {
    // Check cache first
    const cached = memoryCache.get(cacheKey)
    if (cached && new Date(cached.expiresAt) > new Date()) {
      setData(cached.data as T)
      setFetchedAt(cached.fetchedAt)
      setIsLoading(false)
      setIsFallback(false)
      return
    }

    // Deduplicate concurrent requests
    const existing = inFlightRequests.get(cacheKey)
    if (existing) {
      try {
        const result = await existing as T
        setData(result)
        setIsLoading(false)
      } catch {
        // Request failed, handled by original caller
      }
      return
    }

    // Set loading state
    if (!isBackground) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const fetchPromise = (async () => {
      try {
        const url = new URL(endpoint, window.location.origin)
        if (region) url.searchParams.set('country', region)

        const response = await fetch(url.toString(), {
          signal: abortControllerRef.current?.signal,
          headers: {
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const json = await response.json()
        
        // Extract data from various API response formats
        let rawData = json.data || json.items || json.results || json
        if (Array.isArray(rawData) && rawData.length === 0 && json.videos) {
          rawData = json.videos
        }
        if (Array.isArray(rawData) && rawData.length === 0 && json.articles) {
          rawData = json.articles
        }
        if (Array.isArray(rawData) && rawData.length === 0 && json.trends) {
          rawData = json.trends
        }

        // Normalize if normalizer provided
        const normalizedData = normalize 
          ? normalize(rawData, region)
          : rawData as T

        // Update cache
        const now = new Date()
        const expiresAt = new Date(now.getTime() + effectiveRefreshInterval)
        memoryCache.set(cacheKey, {
          data: normalizedData,
          fetchedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        })

        // Update state
        setData(normalizedData)
        setFetchedAt(now.toISOString())
        setError(null)
        setIsFallback(false)
        lastValidDataRef.current = normalizedData

        // Update meta
        setMeta({
          totalItems: Array.isArray(normalizedData) ? normalizedData.length : 1,
          region,
          apiCalls: 1,
        })

        onSuccess?.(normalizedData)

        return normalizedData
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return null
        }

        const error = err as Error
        console.error(`[DataPipeline] Error fetching ${sourceId}:`, error.message)
        
        setError(new Error(mapUserFacingApiError(error.message)))
        onError?.(error)

        // Use last valid data as fallback
        if (lastValidDataRef.current) {
          setData(lastValidDataRef.current)
          setIsFallback(true)
        } else if (cached) {
          setData(cached.data as T)
          setFetchedAt(cached.fetchedAt)
          setIsFallback(true)
        }

        throw error
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
        inFlightRequests.delete(cacheKey)
      }
    })()

    inFlightRequests.set(cacheKey, fetchPromise)
    
    try {
      await fetchPromise
    } catch {
      // Error already handled
    }
  }, [cacheKey, endpoint, region, effectiveRefreshInterval, normalize, onSuccess, onError, sourceId])

  // Manual refresh function
  const refresh = useCallback(async () => {
    // Clear cache to force fresh fetch
    memoryCache.delete(cacheKey)
    await fetchData(false)
  }, [cacheKey, fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData(false)

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchData(true)
    }, effectiveRefreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, effectiveRefreshInterval, fetchData])

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    status,
    fetchedAt,
    isFallback,
    refresh,
    meta,
  }
}

// ─── Batch Fetching Hook ──────────────────────────────────────────────────────

interface UseBatchDataOptions {
  sources: Array<{
    sourceId: string
    endpoint: string
    region?: string
  }>
  autoRefresh?: boolean
}

interface BatchDataResult {
  results: Map<string, {
    data: unknown
    status: DataStatus
    fetchedAt: string | null
    error: Error | null
  }>
  isLoading: boolean
  refreshAll: () => Promise<void>
}

export function useBatchData(options: UseBatchDataOptions): BatchDataResult {
  const { sources, autoRefresh = true } = options
  const [results, setResults] = useState<BatchDataResult['results']>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    
    const newResults = new Map<string, {
      data: unknown
      status: DataStatus
      fetchedAt: string | null
      error: Error | null
    }>()

    await Promise.allSettled(
      sources.map(async ({ sourceId, endpoint, region = 'FR' }) => {
        try {
          const url = new URL(endpoint, window.location.origin)
          if (region) url.searchParams.set('country', region)

          const response = await fetch(url.toString())
          const json = await response.json()
          const data = json.data || json.items || json

          newResults.set(sourceId, {
            data,
            status: 'active',
            fetchedAt: new Date().toISOString(),
            error: null,
          })
        } catch (err) {
          newResults.set(sourceId, {
            data: null,
            status: 'error',
            fetchedAt: null,
            error: err as Error,
          })
        }
      })
    )

    setResults(newResults)
    setIsLoading(false)
  }, [sources])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!autoRefresh) return

    const minInterval = Math.min(
      ...sources.map(s => DataPipeline.sources[s.sourceId]?.refreshIntervalMs || 15 * 60 * 1000)
    )

    const interval = setInterval(fetchAll, minInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, sources, fetchAll])

  return {
    results,
    isLoading,
    refreshAll: fetchAll,
  }
}

export default useDataPipeline
