/**
 * Safe Async Utility
 * Based on: Designing Data-Intensive Applications - Error Handling
 *
 * Returns [data, error] tuple instead of throwing
 * Makes error handling explicit and consistent
 */

export type SafeResult<T> = [T, null] | [null, Error];

/**
 * Wraps an async function to return [data, error] tuple
 * Never throws - always returns a result
 */
export async function safeAsync<T>(
  promise: Promise<T>,
): Promise<SafeResult<T>> {
  try {
    const data = await promise;
    return [data, null];
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return [null, error];
  }
}

/**
 * Wraps a fetch call with timeout and returns [data, error] tuple
 */
export async function safeFetch<T>(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<SafeResult<T>> {
  const { timeout = 10000, ...fetchOptions } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [
        null,
        new Error(`HTTP ${response.status}: ${response.statusText}`),
      ];
    }

    const data = await response.json();
    return [data as T, null];
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return [null, new Error("Request timeout")];
    }
    const error = err instanceof Error ? err : new Error(String(err));
    return [null, error];
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {},
): Promise<SafeResult<T>> {
  const { maxRetries = 3, baseDelay = 1000 } = options;

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const [result, error] = await safeAsync(fn());

    if (!error) {
      return [result, null];
    }

    lastError = error;

    if (attempt < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s...
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return [null, lastError];
}
