/**
 * ALGO API Utilities
 * Retry Logic, Caching, Error Handling
 */

interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  /** Cache mémoire interne (ne pas confondre avec `RequestInit.cache`). */
  useMemoryCache?: boolean;
  cacheTTL?: number;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

// In-memory cache for API responses
const apiCache = new Map<string, CacheEntry>();

/**
 * Fetch with automatic retry logic
 * Retries failed requests up to 3 times with exponential backoff
 */
export async function fetchWithRetry<T = unknown>(
  url: string,
  options: FetchWithRetryOptions = {},
): Promise<T> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 10000,
    useMemoryCache: useCache = true,
    cacheTTL = 60000, // 1 minute default
    ...fetchOptions
  } = options;

  const cacheKey = `${url}-${JSON.stringify(fetchOptions.body || "")}`;

  // Check cache first
  if (useCache && fetchOptions.method !== "POST") {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          const errorData = await response.json().catch(() => ({}));
          throw new APIError(
            errorData.message || `HTTP ${response.status}`,
            response.status,
            errorData,
          );
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Cache successful GET responses
      if (useCache && (!fetchOptions.method || fetchOptions.method === "GET")) {
        apiCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: cacheTTL,
        });
      }

      return data as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort or client errors
      if (
        error instanceof APIError ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (process.env.NODE_ENV === "development") {
          console.log(`[ALGO API] Retry ${attempt + 1}/${retries} for ${url}`);
        }
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Clear API cache
 */
export function clearAPICache(pattern?: string): void {
  if (pattern) {
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    }
  } else {
    apiCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: apiCache.size,
    keys: Array.from(apiCache.keys()),
  };
}

/**
 * Prefetch and cache API endpoint
 */
export async function prefetch(
  url: string,
  options?: FetchWithRetryOptions,
): Promise<void> {
  try {
    await fetchWithRetry(url, { ...options, useMemoryCache: true });
  } catch {
    // Silent fail for prefetch
  }
}

/**
 * Batch multiple API requests with concurrency control
 */
export async function batchFetch<T>(
  requests: Array<{ url: string; options?: FetchWithRetryOptions }>,
  concurrency = 3,
): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
  const results: Array<{ success: boolean; data?: T; error?: Error }> = [];

  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((req) => fetchWithRetry<T>(req.url, req.options)),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push({ success: true, data: result.value });
      } else {
        results.push({ success: false, error: result.reason });
      }
    }
  }

  return results;
}

/**
 * SWR-like data fetching hook helper
 */
export function createFetcher<T>(options?: FetchWithRetryOptions) {
  return (url: string) => fetchWithRetry<T>(url, options);
}
