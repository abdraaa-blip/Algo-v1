/**
 * Netflix-style Circuit Breaker Pattern
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit tripped, all requests fail fast
 * - HALF_OPEN: Testing if service recovered
 *
 * Configuration per Netflix SRE standards:
 * - 3 failures in 10 seconds opens the circuit
 * - 30 second timeout before half-open
 * - 2 successes in half-open closes the circuit
 */

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitConfig {
  failureThreshold: number; // Number of failures before opening
  failureWindow: number; // Time window for failures (ms)
  resetTimeout: number; // Time before trying half-open (ms)
  successThreshold: number; // Successes needed to close from half-open
  name: string; // Circuit name for logging
}

interface CircuitStats {
  failures: number[]; // Timestamps of recent failures
  successes: number; // Consecutive successes in half-open
  state: CircuitState;
  lastStateChange: number;
  totalFailures: number;
  totalSuccesses: number;
  totalRequests: number;
}

const DEFAULT_CONFIG: Omit<CircuitConfig, "name"> = {
  failureThreshold: 3,
  failureWindow: 10000, // 10 seconds
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
};

// Circuit breaker instances by name
const circuits = new Map<string, CircuitStats>();

function getCircuit(name: string): CircuitStats {
  if (!circuits.has(name)) {
    circuits.set(name, {
      failures: [],
      successes: 0,
      state: "CLOSED",
      lastStateChange: Date.now(),
      totalFailures: 0,
      totalSuccesses: 0,
      totalRequests: 0,
    });
  }
  return circuits.get(name)!;
}

function cleanOldFailures(circuit: CircuitStats, window: number): void {
  const cutoff = Date.now() - window;
  circuit.failures = circuit.failures.filter((t) => t > cutoff);
}

function transitionState(circuit: CircuitStats, newState: CircuitState): void {
  if (circuit.state !== newState) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[CircuitBreaker] State transition: ${circuit.state} -> ${newState}`,
      );
    }
    circuit.state = newState;
    circuit.lastStateChange = Date.now();
    if (newState === "HALF_OPEN") {
      circuit.successes = 0;
    }
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly state: CircuitState,
  ) {
    super(`Circuit ${circuitName} is ${state}`);
    this.name = "CircuitBreakerError";
  }
}

/**
 * Execute a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  fallback?: () => T | Promise<T>,
  config?: Partial<CircuitConfig>,
): Promise<T> {
  const cfg: CircuitConfig = { ...DEFAULT_CONFIG, name, ...config };
  const circuit = getCircuit(name);

  circuit.totalRequests++;

  // Clean old failures
  cleanOldFailures(circuit, cfg.failureWindow);

  // Check if circuit should transition from OPEN to HALF_OPEN
  if (circuit.state === "OPEN") {
    const elapsed = Date.now() - circuit.lastStateChange;
    if (elapsed >= cfg.resetTimeout) {
      transitionState(circuit, "HALF_OPEN");
    } else {
      // Circuit is open - fail fast or use fallback
      if (fallback) {
        return fallback();
      }
      throw new CircuitBreakerError(name, "OPEN");
    }
  }

  try {
    const result = await fn();

    // Success handling
    circuit.totalSuccesses++;

    if (circuit.state === "HALF_OPEN") {
      circuit.successes++;
      if (circuit.successes >= cfg.successThreshold) {
        transitionState(circuit, "CLOSED");
      }
    }

    return result;
  } catch (error) {
    // Failure handling
    circuit.totalFailures++;
    circuit.failures.push(Date.now());

    if (circuit.state === "HALF_OPEN") {
      // Any failure in half-open immediately opens
      transitionState(circuit, "OPEN");
    } else if (circuit.state === "CLOSED") {
      // Check if we should open
      cleanOldFailures(circuit, cfg.failureWindow);
      if (circuit.failures.length >= cfg.failureThreshold) {
        transitionState(circuit, "OPEN");
      }
    }

    // Use fallback if available
    if (fallback) {
      return fallback();
    }

    throw error;
  }
}

/**
 * Bulkhead isolation - limits concurrent requests to prevent cascade failures
 */
interface BulkheadConfig {
  maxConcurrent: number;
  maxQueued: number;
  timeout: number;
}

const DEFAULT_BULKHEAD: BulkheadConfig = {
  maxConcurrent: 10,
  maxQueued: 20,
  timeout: 30000,
};

interface BulkheadStats {
  active: number;
  queued: number;
  queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>;
}

const bulkheads = new Map<string, BulkheadStats>();

function getBulkhead(name: string): BulkheadStats {
  if (!bulkheads.has(name)) {
    bulkheads.set(name, { active: 0, queued: 0, queue: [] });
  }
  return bulkheads.get(name)!;
}

export class BulkheadError extends Error {
  constructor(name: string, reason: "FULL" | "TIMEOUT") {
    super(`Bulkhead ${name}: ${reason}`);
    this.name = "BulkheadError";
  }
}

/**
 * Execute with bulkhead isolation
 */
export async function withBulkhead<T>(
  name: string,
  fn: () => Promise<T>,
  config?: Partial<BulkheadConfig>,
): Promise<T> {
  const cfg: BulkheadConfig = { ...DEFAULT_BULKHEAD, ...config };
  const bulkhead = getBulkhead(name);

  // Try to acquire slot
  if (bulkhead.active < cfg.maxConcurrent) {
    bulkhead.active++;
    try {
      return await fn();
    } finally {
      bulkhead.active--;
      // Process queue
      if (bulkhead.queue.length > 0) {
        const next = bulkhead.queue.shift()!;
        bulkhead.queued--;
        clearTimeout(next.timeout);
        next.resolve();
      }
    }
  }

  // Queue if possible
  if (bulkhead.queued >= cfg.maxQueued) {
    throw new BulkheadError(name, "FULL");
  }

  // Wait in queue
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      const idx = bulkhead.queue.findIndex((q) => q.resolve === resolve);
      if (idx !== -1) {
        bulkhead.queue.splice(idx, 1);
        bulkhead.queued--;
      }
      reject(new BulkheadError(name, "TIMEOUT"));
    }, cfg.timeout);

    bulkhead.queue.push({ resolve, reject, timeout });
    bulkhead.queued++;
  });

  bulkhead.active++;
  try {
    return await fn();
  } finally {
    bulkhead.active--;
    if (bulkhead.queue.length > 0) {
      const next = bulkhead.queue.shift()!;
      bulkhead.queued--;
      clearTimeout(next.timeout);
      next.resolve();
    }
  }
}

/**
 * Combined resilience wrapper with circuit breaker + bulkhead + retry
 */
export async function withResilience<T>(
  name: string,
  fn: () => Promise<T>,
  options: {
    fallback?: () => T | Promise<T>;
    circuit?: Partial<CircuitConfig>;
    bulkhead?: Partial<BulkheadConfig>;
    retries?: number;
    retryDelay?: number;
  } = {},
): Promise<T> {
  const {
    fallback,
    circuit,
    bulkhead,
    retries = 3,
    retryDelay = 1000,
  } = options;

  return withCircuitBreaker(
    name,
    () =>
      withBulkhead(
        name,
        async () => {
          let lastError: Error | null = null;

          for (let attempt = 0; attempt < retries; attempt++) {
            try {
              return await fn();
            } catch (error) {
              lastError = error as Error;

              if (attempt < retries - 1) {
                // Exponential backoff with jitter (Netflix pattern)
                const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
                const delay = retryDelay * Math.pow(2, attempt) * jitter;
                await new Promise((r) => setTimeout(r, delay));
              }
            }
          }

          throw lastError;
        },
        bulkhead,
      ),
    fallback,
    circuit,
  );
}

/**
 * Get circuit breaker stats for monitoring
 */
export function getCircuitStats(name: string): CircuitStats | undefined {
  return circuits.get(name);
}

/**
 * Get all circuit breaker stats
 */
export function getAllCircuitStats(): Record<string, CircuitStats> {
  const stats: Record<string, CircuitStats> = {};
  circuits.forEach((v, k) => {
    stats[k] = v;
  });
  return stats;
}

/**
 * Reset a circuit breaker (for testing)
 */
export function resetCircuit(name: string): void {
  circuits.delete(name);
}
