/**
 * Spotify-style Data Fetching Layer
 * 
 * Features:
 * - Normalized caching with cache keys
 * - Stale-while-revalidate
 * - Optimistic updates
 * - Background revalidation
 * - Request deduplication
 */

import { withResilience } from '@/lib/resilience/circuit-breaker'

// Cache configuration per Spotify standards
interface CacheConfig {
  staleTime: number       // How long data is considered fresh (ms)
  cacheTime: number       // How long to keep in cache (ms)
  revalidateOnFocus: boolean
  revalidateOnReconnect: boolean
  dedupingInterval: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  isValidating: boolean
}

// In-memory cache
const cache = new Map<string, CacheEntry<unknown>>()

// Request deduplication - ongoing fetches by key
const ongoingFetches = new Map<string, Promise<unknown>>()

// Default cache config
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  staleTime: 30000,        // 30 seconds fresh
  cacheTime: 300000,       // 5 minutes in cache
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,  // 2 second deduping
}

/**
 * Generate a stable cache key from URL and params
 */
export function generateCacheKey(
  url: string, 
  params?: Record<string, string | number | boolean | undefined>
): string {
  const sortedParams = params 
    ? Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    : ''
  
  return sortedParams ? `${url}?${sortedParams}` : url
}

/**
 * Check if cached data is stale
 */
function isStale(entry: CacheEntry<unknown>, staleTime: number): boolean {
  return Date.now() - entry.timestamp > staleTime
}

/**
 * Check if cached data should be evicted
 */
function isExpired(entry: CacheEntry<unknown>, cacheTime: number): boolean {
  return Date.now() - entry.timestamp > cacheTime
}

/**
 * Fetch with caching, deduplication, and resilience
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: Partial<CacheConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_CACHE_CONFIG, ...config }
  
  // Check cache first
  const cached = cache.get(key) as CacheEntry<T> | undefined
  
  if (cached) {
    // Return cached data if fresh
    if (!isStale(cached, cfg.staleTime)) {
      return cached.data
    }
    
    // Return stale data but revalidate in background
    if (!cached.isValidating) {
      cached.isValidating = true
      revalidateInBackground(key, fetcher).catch(console.error)
    }
    
    return cached.data
  }
  
  // Check for ongoing fetch (deduplication)
  const ongoing = ongoingFetches.get(key) as Promise<T> | undefined
  if (ongoing) {
    return ongoing
  }
  
  // Fetch with resilience
  const fetchPromise = withResilience<T>(
    `fetch:${key}`,
    fetcher,
    {
      retries: 3,
      retryDelay: 1000,
    }
  )
  
  // Store for deduplication
  ongoingFetches.set(key, fetchPromise)
  
  try {
    const data = await fetchPromise
    
    // Cache the result
    cache.set(key, {
      data,
      timestamp: Date.now(),
      isValidating: false,
    })
    
    return data
  } finally {
    // Clean up deduplication after interval
    setTimeout(() => {
      ongoingFetches.delete(key)
    }, cfg.dedupingInterval)
  }
}

/**
 * Background revalidation
 */
async function revalidateInBackground<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
  try {
    const data = await withResilience<T>(
      `revalidate:${key}`,
      fetcher,
      { retries: 2 }
    )
    
    cache.set(key, {
      data,
      timestamp: Date.now(),
      isValidating: false,
    })
  } catch {
    // Mark as no longer validating even on error
    const entry = cache.get(key)
    if (entry) {
      entry.isValidating = false
    }
  }
}

/**
 * Mutate cache with optimistic update
 */
export function mutateCache<T>(
  key: string,
  data: T | ((current: T | undefined) => T),
  revalidate = true
): void {
  const current = cache.get(key)?.data as T | undefined
  const newData = typeof data === 'function' ? (data as (c: T | undefined) => T)(current) : data
  
  cache.set(key, {
    data: newData,
    timestamp: Date.now(),
    isValidating: revalidate,
  })
}

/**
 * Invalidate cache entries
 */
export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    cache.clear()
    return
  }
  
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key)
    }
  }
}

/**
 * Prefetch data for predictive loading (TikTok pattern)
 */
export function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: Partial<CacheConfig> = {}
): void {
  // Don't prefetch if already cached and fresh
  const cached = cache.get(key)
  if (cached && !isStale(cached, config.staleTime ?? DEFAULT_CACHE_CONFIG.staleTime)) {
    return
  }
  
  // Fetch in background with low priority
  fetchWithCache(key, fetcher, config).catch(() => {
    // Silently ignore prefetch errors
  })
}

/**
 * Cleanup expired cache entries
 */
export function cleanupCache(): void {
  for (const [key, entry] of cache.entries()) {
    if (isExpired(entry, DEFAULT_CACHE_CONFIG.cacheTime)) {
      cache.delete(key)
    }
  }
}

// Periodic cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 300000)
}

/**
 * Create a typed fetcher for a specific endpoint
 */
export function createFetcher<T, P extends Record<string, unknown> = Record<string, never>>(
  baseUrl: string,
  defaultConfig: Partial<CacheConfig> = {}
) {
  return {
    fetch: async (params?: P, config?: Partial<CacheConfig>): Promise<T> => {
      const key = generateCacheKey(baseUrl, params as Record<string, string | number | boolean | undefined>)
      
      return fetchWithCache<T>(
        key,
        async () => {
          const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
          
          if (params) {
            Object.entries(params).forEach(([k, v]) => {
              if (v !== undefined) {
                url.searchParams.set(k, String(v))
              }
            })
          }
          
          const res = await fetch(url.toString())
          
          if (!res.ok) {
            throw new Error(`Fetch failed: ${res.status}`)
          }
          
          return res.json()
        },
        { ...defaultConfig, ...config }
      )
    },
    
    prefetch: (params?: P, config?: Partial<CacheConfig>): void => {
      const key = generateCacheKey(baseUrl, params as Record<string, string | number | boolean | undefined>)
      
      prefetch<T>(
        key,
        async () => {
          const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
          
          if (params) {
            Object.entries(params).forEach(([k, v]) => {
              if (v !== undefined) {
                url.searchParams.set(k, String(v))
              }
            })
          }
          
          const res = await fetch(url.toString())
          return res.json()
        },
        { ...defaultConfig, ...config }
      )
    },
    
    mutate: (data: T | ((current: T | undefined) => T), params?: P): void => {
      const key = generateCacheKey(baseUrl, params as Record<string, string | number | boolean | undefined>)
      mutateCache<T>(key, data)
    },
    
    invalidate: (params?: P): void => {
      if (params) {
        const key = generateCacheKey(baseUrl, params as Record<string, string | number | boolean | undefined>)
        cache.delete(key)
      } else {
        invalidateCache(new RegExp(`^${baseUrl}`))
      }
    },
  }
}
