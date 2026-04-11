import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { getAllCircuitStats } from '@/lib/resilience/circuit-breaker'
import {
  getSupabasePublicApiKey,
  getSupabaseSecretApiKey,
  getSupabaseUrl,
} from '@/lib/supabase/env-keys'

/**
 * Health Check Endpoint
 * Returns comprehensive system status for monitoring and load balancers
 * 
 * Response codes:
 * - 200: All systems operational
 * - 503: One or more critical systems degraded
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-health:${identifier}`, { limit: 120, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { status: 'error', error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const startTime = Date.now()
  
  const supabaseUrl = getSupabaseUrl()
  const supabasePublic = getSupabasePublicApiKey()
  const supabaseConfigured = Boolean(supabaseUrl && supabasePublic)

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
    /** Si Supabase non configuré : true (optionnel). Si configuré : joignable via REST. */
    database: !supabaseConfigured,
    /** Aide au debug Vercel : présence des variables (pas les valeurs). */
    envPresent: {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
      supabasePublicKey: Boolean(supabasePublic),
      supabaseSecretKey: Boolean(getSupabaseSecretApiKey()),
      YOUTUBE_API_KEY: Boolean(process.env.YOUTUBE_API_KEY),
      NEWSAPI_KEY: Boolean(process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY),
      TMDB_API_KEY: Boolean(process.env.TMDB_API_KEY),
    },
    hints: {
      supabaseRestStatus: null as number | null,
      youtubeApiStatus: null as number | null,
    },
    externalApis: {
      newsapi: false,
      youtube: false,
      tmdb: false,
    },
    cache: true,
    circuitBreakers: getAllCircuitStats(),
  }

  // Supabase REST (anon / publishable obligatoire pour ce test)
  if (supabaseConfigured) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: supabasePublic || '',
        },
        signal: AbortSignal.timeout(5000),
      })
      checks.hints.supabaseRestStatus = response.status
      checks.database = response.ok
    } catch {
      checks.database = false
    }
  }

  const newsKey = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY
  const ytKey = process.env.YOUTUBE_API_KEY

  // NewsAPI + YouTube (test réel si clé présente) + TMDB
  const [newsResult, youtubeResult, tmdbResult] = await Promise.allSettled([
    newsKey
      ? fetch(
          'https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=' + newsKey,
          { signal: AbortSignal.timeout(5000) }
        ).then((r) => ({ ok: r.ok, status: r.status }))
      : Promise.resolve({ ok: false, status: 0 }),
    ytKey
      ? fetch(
          'https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&regionCode=US&maxResults=1&key=' +
            ytKey,
          { signal: AbortSignal.timeout(8000) }
        ).then((r) => ({ ok: r.ok, status: r.status }))
      : Promise.resolve({ ok: false, status: 0 }),
    process.env.TMDB_API_KEY
      ? fetch(
          'https://api.themoviedb.org/3/configuration?api_key=' + process.env.TMDB_API_KEY,
          { signal: AbortSignal.timeout(5000) }
        ).then((r) => r.ok)
      : Promise.resolve(false),
  ])

  if (newsResult.status === 'fulfilled') {
    checks.externalApis.newsapi = newsResult.value.ok
  }
  if (youtubeResult.status === 'fulfilled') {
    checks.externalApis.youtube = youtubeResult.value.ok
    checks.hints.youtubeApiStatus =
      youtubeResult.value.status > 0 ? youtubeResult.value.status : null
  }
  if (tmdbResult.status === 'fulfilled') {
    checks.externalApis.tmdb = tmdbResult.value
  }

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
