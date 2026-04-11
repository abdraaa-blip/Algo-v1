/**
 * Resilient fetch wrapper with retry logic, circuit breaker, and fallback support.
 * Implements exponential backoff with jitter for all API calls.
 */

interface FetchConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
  fallback?: () => Promise<Response> | Response;
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

const circuits = new Map<string, CircuitState>();
const FAILURE_THRESHOLD = 5;
const RECOVERY_TIME = 60000; // 60 seconds

function getCircuitKey(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url.split("/")[0];
  }
}

function isCircuitOpen(key: string): boolean {
  const circuit = circuits.get(key);
  if (!circuit) return false;

  if (circuit.state === "open") {
    // Check if recovery time has passed
    if (Date.now() - circuit.lastFailure > RECOVERY_TIME) {
      circuit.state = "half-open";
      return false;
    }
    return true;
  }
  return false;
}

function recordSuccess(key: string): void {
  const circuit = circuits.get(key);
  if (circuit) {
    circuit.failures = 0;
    circuit.state = "closed";
  }
}

function recordFailure(key: string): void {
  let circuit = circuits.get(key);
  if (!circuit) {
    circuit = { failures: 0, lastFailure: 0, state: "closed" };
    circuits.set(key, circuit);
  }

  circuit.failures++;
  circuit.lastFailure = Date.now();

  if (circuit.failures >= FAILURE_THRESHOLD) {
    circuit.state = "open";
    console.warn(
      `[ALGO Circuit] Circuit opened for ${key} after ${circuit.failures} failures`,
    );
  }
}

/**
 * Fetch with automatic retry, circuit breaker, and exponential backoff
 */
export async function fetchResilient(
  url: string,
  options?: RequestInit,
  config: FetchConfig = {},
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 8000,
    timeout = 10000,
    fallback,
  } = config;

  const circuitKey = getCircuitKey(url);

  // Check circuit breaker
  if (isCircuitOpen(circuitKey)) {
    console.warn(
      `[ALGO Circuit] Circuit open for ${circuitKey}, using fallback`,
    );
    if (fallback) {
      return fallback();
    }
    throw new Error(`Circuit breaker open for ${circuitKey}`);
  }

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout via AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      recordSuccess(circuitKey);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx) or abort
      if (lastError.name === "AbortError") {
        lastError = new Error(`Request timeout after ${timeout}ms`);
      }

      recordFailure(circuitKey);

      // If we have retries left, wait with exponential backoff + jitter
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        const jitter = delay * 0.2 * Math.random();
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      }
    }
  }

  // All retries failed, try fallback
  if (fallback) {
    console.warn(`[ALGO Fetch] All retries failed for ${url}, using fallback`);
    return fallback();
  }

  throw lastError;
}

/**
 * Resilient JSON fetch helper
 */
export async function fetchJSON<T>(
  url: string,
  options?: RequestInit,
  config?: FetchConfig,
): Promise<T> {
  const response = await fetchResilient(url, options, config);
  return response.json();
}

/**
 * Create a cached fallback response
 */
export function createFallbackResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Fallback": "true",
    },
  });
}
