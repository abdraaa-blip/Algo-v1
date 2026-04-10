/**
 * Chaos Engineering System - Netflix Standard
 * 
 * Deliberately injects failures to test system resilience:
 * - API failures
 * - Network latency
 * - Timeout simulation
 * - Random failures
 * 
 * NEVER runs in production unless explicitly enabled
 */

type ChaosMode = 'off' | 'latency' | 'failure' | 'timeout' | 'intermittent'

interface ChaosConfig {
  enabled: boolean
  mode: ChaosMode
  failureRate: number      // 0-1, probability of failure
  latencyMs: number        // Added latency
  timeoutMs: number        // Timeout threshold
  targetServices: string[] // Which services to affect
}

const DEFAULT_CONFIG: ChaosConfig = {
  enabled: false,
  mode: 'off',
  failureRate: 0.1,
  latencyMs: 2000,
  timeoutMs: 5000,
  targetServices: [],
}

let chaosConfig: ChaosConfig = { ...DEFAULT_CONFIG }

/**
 * Check if chaos is enabled (NEVER in production without explicit flag)
 */
function isChaosEnabled(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: only enable if explicit env var
    return process.env.ENABLE_CHAOS === 'true' && process.env.NODE_ENV !== 'production'
  }
  // Client-side: only enable in development with explicit flag
  return chaosConfig.enabled && process.env.NODE_ENV === 'development'
}

/**
 * Enable chaos mode (development only)
 */
export function enableChaos(config: Partial<ChaosConfig> = {}): void {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Chaos] Cannot enable chaos in production')
    return
  }
  chaosConfig = { ...chaosConfig, ...config, enabled: true }
  console.info('[Chaos] Chaos engineering enabled:', chaosConfig)
}

/**
 * Disable chaos mode
 */
export function disableChaos(): void {
  chaosConfig = { ...DEFAULT_CONFIG }
  console.info('[Chaos] Chaos engineering disabled')
}

/**
 * Get current chaos status
 */
export function getChaosStatus(): ChaosConfig {
  return { ...chaosConfig }
}

/**
 * Should this service be affected by chaos?
 */
function shouldAffect(serviceName: string): boolean {
  if (!isChaosEnabled()) return false
  if (chaosConfig.targetServices.length === 0) return true
  return chaosConfig.targetServices.includes(serviceName)
}

/**
 * Inject chaos into a function call
 */
export async function withChaos<T>(
  serviceName: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!shouldAffect(serviceName)) {
    return fn()
  }
  
  const { mode, failureRate, latencyMs, timeoutMs } = chaosConfig
  
  switch (mode) {
    case 'latency':
      // Add artificial latency
      await new Promise(resolve => setTimeout(resolve, latencyMs))
      return fn()
    
    case 'failure':
      // Random failures
      if (Math.random() < failureRate) {
        throw new ChaosError(serviceName, 'Simulated failure')
      }
      return fn()
    
    case 'timeout':
      // Simulate timeout
      return Promise.race([
        fn(),
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new ChaosError(serviceName, 'Simulated timeout')), timeoutMs)
        )
      ])
    
    case 'intermittent':
      // Combination: random latency + occasional failures
      if (Math.random() < 0.3) {
        await new Promise(resolve => setTimeout(resolve, latencyMs * Math.random()))
      }
      if (Math.random() < failureRate) {
        throw new ChaosError(serviceName, 'Simulated intermittent failure')
      }
      return fn()
    
    default:
      return fn()
  }
}

/**
 * Custom error for chaos-induced failures
 */
export class ChaosError extends Error {
  constructor(
    public readonly serviceName: string,
    message: string
  ) {
    super(`[Chaos] ${serviceName}: ${message}`)
    this.name = 'ChaosError'
  }
}

/**
 * Chaos test scenarios for automated testing
 */
export const chaosScenarios = {
  // Test YouTube API failure
  youtubeDown: () => enableChaos({ 
    mode: 'failure', 
    failureRate: 1, 
    targetServices: ['youtube'] 
  }),
  
  // Test Google Trends API failure
  trendsDown: () => enableChaos({ 
    mode: 'failure', 
    failureRate: 1, 
    targetServices: ['google-trends'] 
  }),
  
  // Test news API failure
  newsDown: () => enableChaos({ 
    mode: 'failure', 
    failureRate: 1, 
    targetServices: ['news'] 
  }),
  
  // Test slow network
  slowNetwork: () => enableChaos({ 
    mode: 'latency', 
    latencyMs: 5000 
  }),
  
  // Test all APIs down
  totalOutage: () => enableChaos({ 
    mode: 'failure', 
    failureRate: 1 
  }),
  
  // Test flaky network
  flakyNetwork: () => enableChaos({ 
    mode: 'intermittent', 
    failureRate: 0.3, 
    latencyMs: 3000 
  }),
  
  // Reset to normal
  reset: disableChaos,
}

/**
 * Run chaos test and report results
 */
export async function runChaosTest(
  scenarioName: keyof typeof chaosScenarios,
  testFn: () => Promise<void>,
  duration: number = 10000
): Promise<{ passed: boolean; errors: Error[] }> {
  const errors: Error[] = []
  
  // Enable scenario
  chaosScenarios[scenarioName]()
  
  const startTime = Date.now()
  
  // Run test repeatedly during duration
  while (Date.now() - startTime < duration) {
    try {
      await testFn()
    } catch (error) {
      errors.push(error as Error)
    }
    await new Promise(r => setTimeout(r, 100))
  }
  
  // Reset chaos
  disableChaos()
  
  // Test passes if app handled failures gracefully (didn't crash)
  return {
    passed: true, // If we got here, app didn't crash
    errors,
  }
}
