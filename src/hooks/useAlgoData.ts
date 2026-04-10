'use client'

import useSWR, { preload, mutate as globalMutate } from 'swr'

/**
 * SWR Fetcher - Spotify/Linear Engineering Standards
 * 
 * - Automatic retry with exponential backoff
 * - Request timeout (5 seconds)
 * - Proper error classification
 */
const fetcher = async (url: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)
  
  try {
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) {
      const error = new Error(`HTTP ${res.status}`) as Error & { status: number }
      error.status = res.status
      throw error
    }
    
    return res.json()
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * Global SWR config - Spotify Data Pipeline Standards
 * 
 * - stale-while-revalidate for instant display
 * - Background revalidation
 * - Error recovery
 */
export const algoSWRConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute deduplication
  errorRetryCount: 3,
  errorRetryInterval: 3000,
  // Stale-while-revalidate: show cached data immediately
  revalidateIfStale: true,
  // Keep previous data while loading new data
  keepPreviousData: true,
  // Don't suspend on initial load
  suspense: false,
  // Global error handler
  onError: (error: Error, key: string) => {
    // Don't report user aborts or 404s
    if (error.message === 'Request timeout') return
    if (error.message.includes('404')) return
    console.error(`[SWR] Error fetching ${key}:`, error.message)
  },
}

/**
 * Prefetch data - TikTok Algorithm Pattern
 * Preload next likely content before user requests it
 */
export function prefetchAlgoData(key: string) {
  preload(key, fetcher)
}

/**
 * Invalidate and refetch - Real-time update pattern
 */
export function invalidateAlgoData(keyPattern: string) {
  globalMutate(
    (key) => typeof key === 'string' && key.includes(keyPattern),
    undefined,
    { revalidate: true }
  )
}

// Hook for live trends - deduplicated across all components
export function useLiveTrends(country?: string) {
  const url = country ? `/api/live-trends?country=${country}` : '/api/live-trends'
  
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      ...algoSWRConfig,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    }
  )
  
  return {
    trends: data?.data || [],
    source: data?.source || 'loading',
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}

// Hook for live news - deduplicated across all components
export function useLiveNews(options?: { country?: string; limit?: number; breaking?: boolean }) {
  const params = new URLSearchParams()
  if (options?.country) params.set('country', options.country)
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.breaking) params.set('breaking', 'true')
  
  const url = `/api/live-news?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      ...algoSWRConfig,
      refreshInterval: 3 * 60 * 1000, // Refresh every 3 minutes
    }
  )
  
  return {
    news: data?.data || [],
    source: data?.source || 'loading',
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}

// Hook for YouTube videos - deduplicated across all components
export function useLiveVideos(country?: string) {
  const url = country ? `/api/youtube?country=${country}` : '/api/youtube'
  
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      ...algoSWRConfig,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    }
  )
  
  return {
    videos: data?.data || data?.videos || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}

// Hook for music - deduplicated across all components
export function useLiveMusic(country?: string) {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  params.set('lang', 'fr')
  
  const url = `/api/live-music?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      ...algoSWRConfig,
      refreshInterval: 10 * 60 * 1000, // Refresh every 10 minutes (music changes slower)
    }
  )
  
  return {
    tracks: data?.data || [],
    artists: data?.artists || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}
