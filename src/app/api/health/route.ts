import { NextResponse } from 'next/server'
import { getAllCircuitStats } from '@/lib/resilience/circuit-breaker'
import { getSupabasePublicApiKey } from '@/lib/supabase/env-keys'

/**
 * Health Check Endpoint
 * Returns comprehensive system status for monitoring and load balancers
 * 
 * Response codes:
 * - 200: All systems operational
 * - 503: One or more critical systems degraded
 */
export async function GET() {
  const startTime = Date.now()
  
  const checks = {
    server: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      unit: 'MB'
    },
    env: process.env.NODE_ENV,
    database: false,
    externalApis: {
      newsapi: false,
      youtube: false,
      tmdb: false,
    },
    cache: true,
    circuitBreakers: getAllCircuitStats(),
  }

  // Check database connection
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: getSupabasePublicApiKey() || '',
        },
        signal: AbortSignal.timeout(5000),
      })
      checks.database = response.ok
    }
  } catch {
    checks.database = false
  }

  // Check external APIs (with timeout)
  const apiChecks = await Promise.allSettled([
    // NewsAPI
    fetch('https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=' + process.env.NEWS_API_KEY, {
      signal: AbortSignal.timeout(3000),
    }).then(r => r.ok),
    // YouTube (just check if API key exists)
    Promise.resolve(!!process.env.YOUTUBE_API_KEY),
    // TMDB
    fetch('https://api.themoviedb.org/3/configuration?api_key=' + process.env.TMDB_API_KEY, {
      signal: AbortSignal.timeout(3000),
    }).then(r => r.ok),
  ])

  checks.externalApis.newsapi = apiChecks[0].status === 'fulfilled' && apiChecks[0].value
  checks.externalApis.youtube = apiChecks[1].status === 'fulfilled' && apiChecks[1].value
  checks.externalApis.tmdb = apiChecks[2].status === 'fulfilled' && apiChecks[2].value

  const responseTime = Date.now() - startTime
  
  // Determine overall health status
  const criticalChecks = [checks.server, checks.database]
  const isHealthy = criticalChecks.every(Boolean)
  const apiHealthy = Object.values(checks.externalApis).some(Boolean)
  
  let status: 'healthy' | 'degraded' | 'unhealthy'
  if (isHealthy && apiHealthy) {
    status = 'healthy'
  } else if (isHealthy) {
    status = 'degraded'
  } else {
    status = 'unhealthy'
  }

  return NextResponse.json(
    {
      status,
      checks,
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '2.0.0',
      buildTime: process.env.BUILD_TIME || 'unknown',
    },
    { 
      status: status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Response-Time': `${responseTime}ms`,
      },
    }
  )
}

/**
 * HEAD request for simple liveness check
 */
export async function HEAD() {
  return new Response(null, { 
    status: 200,
    headers: {
      'X-Health': 'ok',
    },
  })
}
