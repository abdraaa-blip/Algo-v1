/**
 * Netflix-style Circuit Breaker Implementation
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is tripped, requests fail fast with cached data
 * - HALF_OPEN: Testing if service recovered
 *
 * Pattern: If a service fails 3 times in 10 seconds, open circuit for 30 seconds
 */

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitConfig {
  failureThreshold: number; // Number of failures before opening
  failureWindow: number; // Time window for counting failures (ms)
  resetTimeout: number; // Time before trying again (ms)
  halfOpenRequests: number; // Number of test requests in half-open state
}

interface CircuitStats {
  state: CircuitState;
  failures: number[]; // Timestamps of recent failures
  lastFailure: number | null;
  lastSuccess: number | null;
  openedAt: number | null;
  consecutiveSuccesses: number;
}

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 3,
  failureWindow: 10000, // 10 seconds
  resetTimeout: 30000, // 30 seconds
  halfOpenRequests: 2,
};

class CircuitBreakerClass {
  private circuits: Map<string, CircuitStats> = new Map();
  private configs: Map<string, CircuitConfig> = new Map();

  /**
   * Configure a circuit for a specific service
   */
  configure(serviceName: string, config: Partial<CircuitConfig> = {}): void {
    this.configs.set(serviceName, { ...DEFAULT_CONFIG, ...config });
    if (!this.circuits.has(serviceName)) {
      this.circuits.set(serviceName, {
        state: "CLOSED",
        failures: [],
        lastFailure: null,
        lastSuccess: null,
        openedAt: null,
        consecutiveSuccesses: 0,
      });
    }
  }

  /**
   * Get current state of a circuit
   */
  getState(serviceName: string): CircuitState {
    const stats = this.circuits.get(serviceName);
    if (!stats) return "CLOSED";

    // Check if we should transition from OPEN to HALF_OPEN
    if (stats.state === "OPEN" && stats.openedAt) {
      const config = this.configs.get(serviceName) || DEFAULT_CONFIG;
      if (Date.now() - stats.openedAt >= config.resetTimeout) {
        stats.state = "HALF_OPEN";
        stats.consecutiveSuccesses = 0;
      }
    }

    return stats.state;
  }

  /**
   * Check if request should be allowed
   */
  canRequest(serviceName: string): boolean {
    const state = this.getState(serviceName);
    return state !== "OPEN";
  }

  /**
   * Record a successful request
   */
  recordSuccess(serviceName: string): void {
    const stats = this.getOrCreateStats(serviceName);
    stats.lastSuccess = Date.now();
    stats.consecutiveSuccesses++;

    if (stats.state === "HALF_OPEN") {
      const config = this.configs.get(serviceName) || DEFAULT_CONFIG;
      if (stats.consecutiveSuccesses >= config.halfOpenRequests) {
        // Service recovered, close circuit
        stats.state = "CLOSED";
        stats.failures = [];
        stats.openedAt = null;
        console.log(
          `[CircuitBreaker] ${serviceName} recovered, circuit CLOSED`,
        );
      }
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(serviceName: string, error?: Error): void {
    const stats = this.getOrCreateStats(serviceName);
    const config = this.configs.get(serviceName) || DEFAULT_CONFIG;
    const now = Date.now();

    stats.lastFailure = now;
    stats.consecutiveSuccesses = 0;

    // Add failure timestamp
    stats.failures.push(now);

    // Remove failures outside the window
    stats.failures = stats.failures.filter(
      (t) => now - t < config.failureWindow,
    );

    // Check if we should open the circuit
    if (
      stats.state === "CLOSED" &&
      stats.failures.length >= config.failureThreshold
    ) {
      stats.state = "OPEN";
      stats.openedAt = now;
      console.warn(
        `[CircuitBreaker] ${serviceName} circuit OPENED after ${config.failureThreshold} failures`,
        error?.message,
      );
    } else if (stats.state === "HALF_OPEN") {
      // Failed during test, go back to OPEN
      stats.state = "OPEN";
      stats.openedAt = now;
      console.warn(
        `[CircuitBreaker] ${serviceName} failed during recovery test, circuit OPENED`,
      );
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    fallback?: () => T | Promise<T>,
  ): Promise<T> {
    // Initialize circuit if not exists
    if (!this.circuits.has(serviceName)) {
      this.configure(serviceName);
    }

    const state = this.getState(serviceName);

    // If circuit is OPEN, fail fast
    if (state === "OPEN") {
      console.log(`[CircuitBreaker] ${serviceName} is OPEN, using fallback`);
      if (fallback) {
        return fallback();
      }
      throw new Error(`Circuit breaker OPEN for ${serviceName}`);
    }

    // Try the request
    try {
      const result = await fn();
      this.recordSuccess(serviceName);
      return result;
    } catch (error) {
      this.recordFailure(
        serviceName,
        error instanceof Error ? error : new Error(String(error)),
      );

      // Use fallback if available
      if (fallback) {
        console.log(`[CircuitBreaker] ${serviceName} failed, using fallback`);
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Get all circuit stats for monitoring
   */
  getAllStats(): Record<string, CircuitStats & { config: CircuitConfig }> {
    const result: Record<string, CircuitStats & { config: CircuitConfig }> = {};

    for (const [name, stats] of this.circuits) {
      // Update state before returning
      this.getState(name);
      result[name] = {
        ...stats,
        config: this.configs.get(name) || DEFAULT_CONFIG,
      };
    }

    return result;
  }

  /**
   * Reset a circuit (for testing or manual recovery)
   */
  reset(serviceName: string): void {
    const stats = this.circuits.get(serviceName);
    if (stats) {
      stats.state = "CLOSED";
      stats.failures = [];
      stats.openedAt = null;
      stats.consecutiveSuccesses = 0;
      console.log(`[CircuitBreaker] ${serviceName} manually reset to CLOSED`);
    }
  }

  private getOrCreateStats(serviceName: string): CircuitStats {
    if (!this.circuits.has(serviceName)) {
      this.configure(serviceName);
    }
    return this.circuits.get(serviceName)!;
  }
}

// Singleton instance
export const CircuitBreaker = new CircuitBreakerClass();

// Pre-configure known services with appropriate settings
CircuitBreaker.configure("youtube", {
  failureThreshold: 3,
  resetTimeout: 60000,
});
CircuitBreaker.configure("tmdb", { failureThreshold: 3, resetTimeout: 60000 });
CircuitBreaker.configure("newsapi", {
  failureThreshold: 5,
  resetTimeout: 120000,
});
CircuitBreaker.configure("reddit", {
  failureThreshold: 3,
  resetTimeout: 30000,
});
CircuitBreaker.configure("lastfm", {
  failureThreshold: 3,
  resetTimeout: 60000,
});
CircuitBreaker.configure("spotify", {
  failureThreshold: 3,
  resetTimeout: 60000,
});
CircuitBreaker.configure("twitch", {
  failureThreshold: 3,
  resetTimeout: 30000,
});
CircuitBreaker.configure("github", {
  failureThreshold: 5,
  resetTimeout: 120000,
});
