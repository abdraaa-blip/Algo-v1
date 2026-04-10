/**
 * Resilient API System - Production Grade
 * 
 * Features:
 * - Retry with exponential backoff
 * - Circuit breaker pattern
 * - Rate limiting
 * - Request deduplication
 * - Offline detection
 * - Fallback to cache
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
}

interface CircuitBreakerState {
  failures: number
  lastFailure: number
  isOpen: boolean
  openUntil: number
}

interface RateLimitState {
  requests: number[]
  windowMs: number
  maxRequests: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttlMs: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeoutMs: 60000, // 60 seconds
}

const RATE_LIMIT_CONFIG = {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
}

// ─── State ───────────────────────────────────────────────────────────────────

const circuitBreakers = new Map<string, CircuitBreakerState>()
const rateLimiters = new Map<string, RateLimitState>()
const requestCache = new Map<string, CacheEntry<unknown>>()
const pendingRequests = new Map<string, Promise<unknown>>()

// ─── Circuit Breaker ─────────────────────────────────────────────────────────

function getCircuitBreaker(key: string): CircuitBreakerState {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      openUntil: 0,
    })
  }
  return circuitBreakers.get(key)!
}

function recordFailure(key: string): void {
  const cb = getCircuitBreaker(key)
  cb.failures++
  cb.lastFailure = Date.now()
  
  if (cb.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
    cb.isOpen = true
    cb.openUntil = Date.now() + CIRCUIT_BREAKER_CONFIG.resetTimeoutMs
  }
}

function recordSuccess(key: string): void {
  const cb = getCircuitBreaker(key)
  cb.failures = 0
  cb.isOpen = false
  cb.openUntil = 0
}

function isCircuitOpen(key: string): boolean {
  const cb = getCircuitBreaker(key)
  
  // Check if circuit should be reset
  if (cb.isOpen && Date.now() > cb.openUntil) {
    cb.isOpen = false
    cb.failures = 0
  }
  
  return cb.isOpen
}

// ─── Rate Limiter ────────────────────────────────────────────────────────────

function getRateLimiter(key: string): RateLimitState {
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, {
      requests: [],
      windowMs: RATE_LIMIT_CONFIG.windowMs,
      maxRequests: RATE_LIMIT_CONFIG.maxRequests,
    })
  }
  return rateLimiters.get(key)!
}

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const rl = getRateLimiter(key)
  const now = Date.now()
  
  // Remove old requests outside the window
  rl.requests = rl.requests.filter(t => t > now - rl.windowMs)
  
  if (rl.requests.length >= rl.maxRequests) {
    const oldestRequest = rl.requests[0]
    const retryAfter = oldestRequest + rl.windowMs - now
    return { allowed: false, retryAfter }
  }
  
  rl.requests.push(now)
  return { allowed: true }
}

// ─── Cache ───────────────────────────────────────────────────────────────────

function getCachedResponse<T>(key: string): T | null {
  const entry = requestCache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  
  // Return cached data even if stale (stale-while-revalidate)
  return entry.data
}

function setCachedResponse<T>(key: string, data: T, ttlMs: number = 300000): void {
  requestCache.set(key, {
    data,
    timestamp: Date.now(),
    ttlMs,
  })
}

function isCacheValid(key: string): boolean {
  const entry = requestCache.get(key)
  if (!entry) return false
  return Date.now() - entry.timestamp < entry.ttlMs
}

// ─── Retry Logic ─────────────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateBackoff(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.baseDelayMs * Math.pow(2, attempt),
    config.maxDelayMs
  )
  // Add jitter (10-30%)
  const jitter = delay * (0.1 + Math.random() * 0.2)
  return Math.floor(delay + jitter)
}

// ─── Main Fetch Function ─────────────────────────────────────────────────────

export interface ResilientFetchOptions {
  retryConfig?: Partial<RetryConfig>
  cacheTtlMs?: number
  circuitBreakerKey?: string
  rateLimitKey?: string
  skipCache?: boolean
  timeout?: number
}

export async function resilientFetch<T>(
  url: string,
  options: RequestInit & ResilientFetchOptions = {}
): Promise<{ data: T; fromCache: boolean; source: 'live' | 'cache' | 'fallback' }> {
  const {
    retryConfig: customRetryConfig,
    cacheTtlMs = 300000,
    circuitBreakerKey = new URL(url, 'http://localhost').hostname,
    rateLimitKey = 'global',
    skipCache = false,
    timeout = 10000,
    ...fetchOptions
  } = options

  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...customRetryConfig }
  const cacheKey = `${options.method || 'GET'}:${url}`

  // Check rate limit
  const rateCheck = checkRateLimit(rateLimitKey)
  if (!rateCheck.allowed) {
    const cached = getCachedResponse<T>(cacheKey)
    if (cached) {
      return { data: cached, fromCache: true, source: 'cache' }
    }
    throw new Error(`Rate limit exceeded. Retry after ${rateCheck.retryAfter}ms`)
  }

  // Check circuit breaker
  if (isCircuitOpen(circuitBreakerKey)) {
    const cached = getCachedResponse<T>(cacheKey)
    if (cached) {
      return { data: cached, fromCache: true, source: 'fallback' }
    }
    throw new Error('Circuit breaker is open')
  }

  // Check cache first (if not skipping)
  if (!skipCache && isCacheValid(cacheKey)) {
    const cached = getCachedResponse<T>(cacheKey)
    if (cached) {
      return { data: cached, fromCache: true, source: 'cache' }
    }
  }

  // Deduplicate concurrent requests
  const pendingKey = cacheKey
  if (pendingRequests.has(pendingKey)) {
    const result = await pendingRequests.get(pendingKey) as T
    return { data: result, fromCache: false, source: 'live' }
  }

  // Create the fetch promise with retry logic
  const fetchPromise = (async () => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json() as T
        
        // Success - update circuit breaker and cache
        recordSuccess(circuitBreakerKey)
        setCachedResponse(cacheKey, data, cacheTtlMs)
        
        return data
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on 4xx errors (client errors)
        if (lastError.message.includes('HTTP 4')) {
          throw lastError
        }

        // Wait before retrying
        if (attempt < retryConfig.maxRetries) {
          const backoff = calculateBackoff(attempt, retryConfig)
          await sleep(backoff)
        }
      }
    }

    // All retries failed
    recordFailure(circuitBreakerKey)
    throw lastError || new Error('All retries failed')
  })()

  // Store pending request for deduplication
  pendingRequests.set(pendingKey, fetchPromise)

  try {
    const data = await fetchPromise
    return { data, fromCache: false, source: 'live' }
  } catch (error) {
    // Try to return cached data as fallback
    const cached = getCachedResponse<T>(cacheKey)
    if (cached) {
      return { data: cached, fromCache: true, source: 'fallback' }
    }
    throw error
  } finally {
    pendingRequests.delete(pendingKey)
  }
}

// ─── Offline Detection ───────────────────────────────────────────────────────

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// ─── Export Utilities ────────────────────────────────────────────────────────

export function getCircuitBreakerStatus(key: string): { isOpen: boolean; failures: number } {
  const cb = getCircuitBreaker(key)
  return { isOpen: cb.isOpen, failures: cb.failures }
}

export function getRateLimitStatus(key: string): { remaining: number; resetIn: number } {
  const rl = getRateLimiter(key)
  const now = Date.now()
  const validRequests = rl.requests.filter(t => t > now - rl.windowMs)
  const oldestRequest = validRequests[0] || now
  
  return {
    remaining: Math.max(0, rl.maxRequests - validRequests.length),
    resetIn: oldestRequest ? oldestRequest + rl.windowMs - now : 0,
  }
}

export function clearCache(): void {
  requestCache.clear()
}

export function clearCacheForKey(key: string): void {
  for (const [cacheKey] of requestCache) {
    if (cacheKey.includes(key)) {
      requestCache.delete(cacheKey)
    }
  }
}
