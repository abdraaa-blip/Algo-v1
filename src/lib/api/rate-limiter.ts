/**
 * Simple in-memory rate limiter for API routes
 * In production, use Redis or Upstash for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of rateLimitMap.entries()) {
        if (entry.resetAt < now) {
          rateLimitMap.delete(key);
        }
      }
    },
    5 * 60 * 1000,
  );
}

export interface RateLimitConfig {
  limit: number; // Max requests
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  /** Plafond effectif pour cette fenêtre (en-têtes `X-RateLimit-*`). */
  limit: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config?: Partial<RateLimitConfig>,
): RateLimitResult {
  const cfg = config ?? {};
  const merged: RateLimitConfig = {
    limit: cfg.limit ?? DEFAULT_CONFIG.limit,
    windowMs: cfg.windowMs ?? DEFAULT_CONFIG.windowMs,
  };
  const now = Date.now();
  const key = `rate:${identifier}`;

  let entry = rateLimitMap.get(key);

  // Create new entry if doesn't exist or has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + merged.windowMs,
    };
  }

  entry.count++;
  rateLimitMap.set(key, entry);

  const remaining = Math.max(0, merged.limit - entry.count);

  if (entry.count > merged.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      limit: merged.limit,
    };
  }

  return {
    success: true,
    remaining,
    resetAt: entry.resetAt,
    limit: merged.limit,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const ip =
    cfConnectingIp ||
    realIp ||
    forwardedFor?.split(",")[0]?.trim() ||
    "anonymous";

  // Optionally include user agent for more granular limiting
  const userAgent = request.headers.get("user-agent") || "unknown";

  return `${ip}:${userAgent.slice(0, 50)}`;
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfter && { "Retry-After": String(result.retryAfter) }),
  };
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit<
  T extends (...args: [Request, ...unknown[]]) => Promise<Response>,
>(handler: T, config?: RateLimitConfig): T {
  return (async (request: Request, ...args: unknown[]) => {
    const identifier = getClientIdentifier(request);
    const result = checkRateLimit(identifier, config);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...createRateLimitHeaders(result),
          },
        },
      );
    }

    const response = await handler(request, ...args);

    // Add rate limit headers to successful responses
    const headers = new Headers(response.headers);
    Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }) as T;
}

/**
 * Circuit breaker for external API calls
 */
interface CircuitState {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

const circuitBreakers = new Map<string, CircuitState>();

const CIRCUIT_CONFIG = {
  failureThreshold: 5,
  resetTimeout: 60 * 1000, // 60 seconds
};

export function checkCircuit(serviceName: string): {
  isOpen: boolean;
  state: string;
} {
  const circuit = circuitBreakers.get(serviceName);
  const now = Date.now();

  if (!circuit) {
    return { isOpen: false, state: "closed" };
  }

  if (circuit.state === "open") {
    // Check if reset timeout has passed
    if (now - circuit.lastFailure > CIRCUIT_CONFIG.resetTimeout) {
      circuit.state = "half-open";
      circuitBreakers.set(serviceName, circuit);
      return { isOpen: false, state: "half-open" };
    }
    return { isOpen: true, state: "open" };
  }

  return { isOpen: false, state: circuit.state };
}

export function recordSuccess(serviceName: string): void {
  const circuit = circuitBreakers.get(serviceName);
  if (circuit) {
    circuit.failures = 0;
    circuit.state = "closed";
    circuitBreakers.set(serviceName, circuit);
  }
}

export function recordFailure(serviceName: string): void {
  const now = Date.now();
  let circuit = circuitBreakers.get(serviceName);

  if (!circuit) {
    circuit = { failures: 0, lastFailure: now, state: "closed" };
  }

  circuit.failures++;
  circuit.lastFailure = now;

  if (circuit.failures >= CIRCUIT_CONFIG.failureThreshold) {
    circuit.state = "open";
  }

  circuitBreakers.set(serviceName, circuit);
}
