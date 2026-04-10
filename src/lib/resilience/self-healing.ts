'use client'

// Self-Healing System for ALGO
// Automatically recovers from errors, switches to backups, and maintains stability

export interface HealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  lastCheck: number
  errorCount: number
  latency?: number
}

interface ServiceConfig {
  name: string
  primary: string
  backups: string[]
  timeout: number
  maxErrors: number
}

const SERVICES: ServiceConfig[] = [
  {
    name: 'trends',
    primary: '/api/realtime/trends',
    backups: ['/api/trends', '/api/fallback/trends'],
    timeout: 5000,
    maxErrors: 3,
  },
  {
    name: 'content',
    primary: '/api/content',
    backups: ['/api/fallback/content'],
    timeout: 5000,
    maxErrors: 3,
  },
  {
    name: 'rising-stars',
    primary: '/api/rising-stars',
    backups: ['/api/fallback/stars'],
    timeout: 5000,
    maxErrors: 3,
  },
]

const healthStatus = new Map<string, HealthStatus>()
const errorCounts = new Map<string, number>()
const activeEndpoints = new Map<string, string>()

// Initialize health status
export function initSelfHealing() {
  for (const service of SERVICES) {
    healthStatus.set(service.name, {
      service: service.name,
      status: 'healthy',
      lastCheck: Date.now(),
      errorCount: 0,
    })
    activeEndpoints.set(service.name, service.primary)
  }

  // Start health check loop
  setInterval(checkHealth, 30000) // Every 30 seconds
}

// Get the active endpoint for a service
export function getEndpoint(serviceName: string): string {
  return activeEndpoints.get(serviceName) || `/api/${serviceName}`
}

// Report an error for a service
export function reportError(serviceName: string, error: Error) {
  const count = (errorCounts.get(serviceName) || 0) + 1
  errorCounts.set(serviceName, count)

  const service = SERVICES.find(s => s.name === serviceName)
  if (!service) return

  // Update health status
  const status = healthStatus.get(serviceName)
  if (status) {
    status.errorCount = count
    status.status = count >= service.maxErrors ? 'down' : 'degraded'
    status.lastCheck = Date.now()
    healthStatus.set(serviceName, status)
  }

  // Switch to backup if needed
  if (count >= service.maxErrors) {
    switchToBackup(service)
  }

  // Log error
  console.error(`[ALGO Self-Healing] Error in ${serviceName}:`, error.message)
}

// Report a success for a service
export function reportSuccess(serviceName: string, latency?: number) {
  errorCounts.set(serviceName, 0)

  const status = healthStatus.get(serviceName)
  if (status) {
    status.errorCount = 0
    status.status = 'healthy'
    status.lastCheck = Date.now()
    status.latency = latency
    healthStatus.set(serviceName, status)
  }
}

// Switch to backup endpoint
function switchToBackup(service: ServiceConfig) {
  const currentEndpoint = activeEndpoints.get(service.name)
  const currentIndex = [service.primary, ...service.backups].indexOf(currentEndpoint || '')
  const nextIndex = (currentIndex + 1) % (service.backups.length + 1)
  
  const allEndpoints = [service.primary, ...service.backups]
  const newEndpoint = allEndpoints[nextIndex]
  
  activeEndpoints.set(service.name, newEndpoint)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ALGO Self-Healing] Switched ${service.name} to backup: ${newEndpoint}`)
  }
}

// Health check all services
async function checkHealth() {
  for (const service of SERVICES) {
    try {
      const start = Date.now()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), service.timeout)

      const response = await fetch(service.primary, {
        method: 'HEAD',
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (response.ok) {
        reportSuccess(service.name, Date.now() - start)
        
        // If we were on a backup, try to switch back to primary
        if (activeEndpoints.get(service.name) !== service.primary) {
          activeEndpoints.set(service.name, service.primary)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ALGO Self-Healing] Restored ${service.name} to primary`)
          }
        }
      } else {
        reportError(service.name, new Error(`HTTP ${response.status}`))
      }
    } catch (error) {
      reportError(service.name, error as Error)
    }
  }
}

// Get health status for all services
export function getHealthStatus(): HealthStatus[] {
  return Array.from(healthStatus.values())
}

// Check if a service is healthy
export function isServiceHealthy(serviceName: string): boolean {
  const status = healthStatus.get(serviceName)
  return status?.status === 'healthy'
}

// Resilient fetch wrapper
export async function resilientFetch<T>(
  serviceName: string,
  options: RequestInit = {}
): Promise<T> {
  const endpoint = getEndpoint(serviceName)
  const service = SERVICES.find(s => s.name === serviceName)
  const timeout = service?.timeout || 5000

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const start = Date.now()
    const response = await fetch(endpoint, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    reportSuccess(serviceName, Date.now() - start)
    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    reportError(serviceName, error as Error)
    
    // Try backup if available
    if (service && service.backups.length > 0) {
      const backupEndpoint = service.backups[0]
      try {
        const response = await fetch(backupEndpoint, options)
        if (response.ok) {
          return response.json()
        }
      } catch {
        // Backup also failed
      }
    }

    throw error
  }
}

// Component error recovery
export function createErrorRecovery(componentName: string, maxRetries = 3) {
  let retryCount = 0

  return {
    onError: (error: Error) => {
      retryCount++
      console.error(`[ALGO Recovery] ${componentName} error (${retryCount}/${maxRetries}):`, error)
      
      if (retryCount < maxRetries) {
        return { shouldRetry: true, delay: Math.pow(2, retryCount) * 1000 }
      }
      
      return { shouldRetry: false }
    },
    reset: () => {
      retryCount = 0
    },
    getRetryCount: () => retryCount,
  }
}
