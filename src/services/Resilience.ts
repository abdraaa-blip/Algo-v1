/**
 * ALGO Resilience Layer - Netflix SRE Standard
 *
 * Implements:
 * - Circuit breakers (fail fast when service is down)
 * - Bulkhead isolation (failure in one feed doesn't affect others)
 * - Exponential backoff with jitter
 * - Graceful degradation
 * - Health checks
 */

import { CircuitBreaker } from "./CircuitBreaker";
import { AlgoCache, CacheSource } from "./AlgoCache";

interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  lastCheck: number;
  responseTime: number | null;
  errorRate: number;
  circuitState: "CLOSED" | "OPEN" | "HALF_OPEN";
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  jitter: true,
};

// Bulkhead semaphores - limit concurrent requests per service
const bulkheads: Map<string, { current: number; max: number }> = new Map([
  ["youtube", { current: 0, max: 5 }],
  ["tmdb", { current: 0, max: 5 }],
  ["newsapi", { current: 0, max: 3 }],
  ["reddit", { current: 0, max: 5 }],
  ["lastfm", { current: 0, max: 3 }],
  ["spotify", { current: 0, max: 3 }],
  ["twitch", { current: 0, max: 3 }],
  ["github", { current: 0, max: 3 }],
]);

// Service health tracking
const healthStats: Map<string, ServiceHealth> = new Map();

/**
 * Calculate exponential backoff with optional jitter
 */
function calculateBackoff(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(
    config.baseDelay * Math.pow(2, attempt),
    config.maxDelay,
  );

  if (config.jitter) {
    // Add random jitter (0-100% of delay)
    return exponentialDelay * (0.5 + Math.random() * 0.5);
  }

  return exponentialDelay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Acquire bulkhead slot
 */
function acquireBulkhead(serviceName: string): boolean {
  const bulkhead = bulkheads.get(serviceName);
  if (!bulkhead) return true; // No bulkhead configured

  if (bulkhead.current >= bulkhead.max) {
    console.warn(
      `[Resilience] Bulkhead full for ${serviceName} (${bulkhead.current}/${bulkhead.max})`,
    );
    return false;
  }

  bulkhead.current++;
  return true;
}

/**
 * Release bulkhead slot
 */
function releaseBulkhead(serviceName: string): void {
  const bulkhead = bulkheads.get(serviceName);
  if (bulkhead && bulkhead.current > 0) {
    bulkhead.current--;
  }
}

/**
 * Update service health stats
 */
function updateHealth(
  serviceName: string,
  success: boolean,
  responseTime?: number,
): void {
  const current = healthStats.get(serviceName) || {
    status: "healthy",
    lastCheck: 0,
    responseTime: null,
    errorRate: 0,
    circuitState: "CLOSED",
  };

  // Exponential moving average for error rate
  const alpha = 0.2;
  current.errorRate =
    current.errorRate * (1 - alpha) + (success ? 0 : 1) * alpha;
  current.lastCheck = Date.now();
  current.responseTime = responseTime || current.responseTime;
  current.circuitState = CircuitBreaker.getState(serviceName);

  // Determine status
  if (current.circuitState === "OPEN") {
    current.status = "unhealthy";
  } else if (current.errorRate > 0.3) {
    current.status = "degraded";
  } else {
    current.status = "healthy";
  }

  healthStats.set(serviceName, current);
}

/**
 * Execute a resilient API call with all protections
 */
export async function resilientFetch<T>(
  serviceName: string,
  fetchFn: () => Promise<T>,
  options: {
    fallback?: () => T | Promise<T>;
    cacheKey?: { source: CacheSource; scope: string };
    retryConfig?: Partial<RetryConfig>;
    timeout?: number;
  } = {},
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };
  const startTime = Date.now();

  // Check circuit breaker
  if (!CircuitBreaker.canRequest(serviceName)) {
    console.log(`[Resilience] ${serviceName} circuit is OPEN`);

    // Try to serve from cache
    if (options.cacheKey) {
      const cached = await AlgoCache.get<T>(
        options.cacheKey.source,
        options.cacheKey.scope,
      );
      if (cached.data) {
        console.log(`[Resilience] Serving stale cache for ${serviceName}`);
        return cached.data;
      }
    }

    // Use fallback
    if (options.fallback) {
      return options.fallback();
    }

    throw new Error(`Service ${serviceName} is unavailable`);
  }

  // Try to acquire bulkhead
  if (!acquireBulkhead(serviceName)) {
    // Bulkhead full, try cache or fallback
    if (options.cacheKey) {
      const cached = await AlgoCache.get<T>(
        options.cacheKey.source,
        options.cacheKey.scope,
      );
      if (cached.data) {
        return cached.data;
      }
    }

    if (options.fallback) {
      return options.fallback();
    }

    throw new Error(`Service ${serviceName} is overloaded`);
  }

  let lastError: Error | null = null;

  try {
    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Add timeout wrapper if specified
        let result: T;

        if (options.timeout) {
          result = await Promise.race([
            fetchFn(),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("Request timeout")),
                options.timeout,
              ),
            ),
          ]);
        } else {
          result = await fetchFn();
        }

        // Success!
        const responseTime = Date.now() - startTime;
        CircuitBreaker.recordSuccess(serviceName);
        updateHealth(serviceName, true, responseTime);

        // Cache the result
        if (options.cacheKey) {
          await AlgoCache.set(
            options.cacheKey.source,
            options.cacheKey.scope,
            result,
          );
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (
          lastError.message.includes("401") ||
          lastError.message.includes("403")
        ) {
          break; // Auth errors shouldn't be retried
        }

        if (attempt < config.maxRetries) {
          const delay = calculateBackoff(attempt, config);
          console.log(
            `[Resilience] ${serviceName} attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms`,
          );
          await sleep(delay);
        }
      }
    }

    // All retries failed
    CircuitBreaker.recordFailure(serviceName, lastError || undefined);
    updateHealth(serviceName, false);

    // Try cache
    if (options.cacheKey) {
      const cached = await AlgoCache.get<T>(
        options.cacheKey.source,
        options.cacheKey.scope,
      );
      if (cached.data) {
        console.log(
          `[Resilience] All retries failed for ${serviceName}, serving cache`,
        );
        return cached.data;
      }
    }

    // Use fallback
    if (options.fallback) {
      console.log(
        `[Resilience] All retries failed for ${serviceName}, using fallback`,
      );
      return options.fallback();
    }

    throw lastError || new Error(`Service ${serviceName} failed`);
  } finally {
    releaseBulkhead(serviceName);
  }
}

/**
 * Get health status of all services
 */
export function getServiceHealth(): Record<string, ServiceHealth> {
  const result: Record<string, ServiceHealth> = {};

  for (const [name, health] of healthStats) {
    // Update circuit state
    health.circuitState = CircuitBreaker.getState(name);
    result[name] = { ...health };
  }

  return result;
}

/**
 * Check if a service is healthy enough for requests
 */
export function isServiceHealthy(serviceName: string): boolean {
  const health = healthStats.get(serviceName);
  if (!health) return true; // Unknown services are assumed healthy

  return health.status !== "unhealthy" && health.circuitState !== "OPEN";
}

/**
 * Get best available data source for a feed type
 * If primary is unhealthy, returns alternative
 */
export function getBestDataSource(
  feedType: "news" | "videos" | "movies" | "music",
): string[] {
  const sources: Record<string, string[]> = {
    news: ["newsapi", "reddit", "github"],
    videos: ["youtube", "twitch", "reddit"],
    movies: ["tmdb"],
    music: ["lastfm", "spotify"],
  };

  const available = sources[feedType] || [];

  // Sort by health, putting healthy services first
  return available.sort((a, b) => {
    const healthA = healthStats.get(a);
    const healthB = healthStats.get(b);

    const scoreA =
      healthA?.status === "healthy"
        ? 0
        : healthA?.status === "degraded"
          ? 1
          : 2;
    const scoreB =
      healthB?.status === "healthy"
        ? 0
        : healthB?.status === "degraded"
          ? 1
          : 2;

    return scoreA - scoreB;
  });
}

/**
 * Perform health check on a service
 */
export async function healthCheck(
  serviceName: string,
  checkFn: () => Promise<boolean>,
): Promise<boolean> {
  const startTime = Date.now();

  try {
    const healthy = await Promise.race([
      checkFn(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);

    const responseTime = Date.now() - startTime;
    updateHealth(serviceName, healthy, responseTime);

    return healthy;
  } catch {
    updateHealth(serviceName, false);
    return false;
  }
}
