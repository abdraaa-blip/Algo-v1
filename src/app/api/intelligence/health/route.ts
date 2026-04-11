import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

export const dynamic = 'force-dynamic'

interface HealthItem {
  id: string
  label: string
  status: 'up' | 'degraded' | 'down'
  details: string
}

interface HealthCacheEntry {
  region: string
  updatedAt: string
  data: HealthItem[]
  expiresAtMs: number
}

const HEALTH_CACHE_TTL_MS = 30_000
const healthCache = new Map<string, HealthCacheEntry>()

function toStatus(ok: boolean, success: boolean): 'up' | 'degraded' | 'down' {
  if (ok && success) return 'up'
  if (ok) return 'degraded'
  return 'down'
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`intelligence-health:${identifier}`, { limit: 40, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams, origin } = new URL(request.url)
  const region = (searchParams.get('region') || 'FR').toUpperCase()
  const newsRegion = region.toLowerCase()
  const nowMs = Date.now()

  const cached = healthCache.get(region)
  if (cached && cached.expiresAtMs > nowMs) {
    return NextResponse.json({
      success: true,
      region: cached.region,
      updatedAt: cached.updatedAt,
      data: cached.data,
      cached: true,
      cacheTtlMs: HEALTH_CACHE_TTL_MS,
    })
  }

  try {
    const [newsH, musicH, videosH, trendsH, creatorH] = await Promise.all([
      fetch(`${origin}/api/live-news?country=${newsRegion}`, { cache: 'no-store' }),
      fetch(`${origin}/api/live-music?type=all&country=${region}`, { cache: 'no-store' }),
      fetch(`${origin}/api/live-videos?country=${region}`, { cache: 'no-store' }),
      fetch(`${origin}/api/live-trends?country=${region}`, { cache: 'no-store' }),
      fetch(`${origin}/api/live?limit=5`, { cache: 'no-store' }),
    ])

    const [newsJson, musicJson, videosJson, trendsJson, creatorJson] = await Promise.all([
      newsH.json(),
      musicH.json(),
      videosH.json(),
      trendsH.json(),
      creatorH.json(),
    ])

    const health: HealthItem[] = [
      {
        id: 'news',
        label: 'News',
        status: toStatus(newsH.ok, Boolean(newsJson?.success)),
        details: `items: ${Number(newsJson?.count || newsJson?.data?.length || 0)}`,
      },
      {
        id: 'music',
        label: 'Music',
        status: toStatus(musicH.ok, Boolean(musicJson?.success)),
        details: `tracks: ${Number(musicJson?.counts?.tracks || musicJson?.tracks?.length || 0)}`,
      },
      {
        id: 'videos',
        label: 'Videos',
        status: toStatus(videosH.ok, Boolean(videosJson?.success)),
        details: `videos: ${Number(videosJson?.count || videosJson?.data?.length || 0)}`,
      },
      {
        id: 'trends',
        label: 'Trends',
        status: toStatus(trendsH.ok, Boolean(trendsJson?.success)),
        details: `signals: ${Number(trendsJson?.count || trendsJson?.data?.length || 0)}`,
      },
      {
        id: 'creator',
        label: 'Creator',
        status: toStatus(creatorH.ok, Boolean(creatorJson?.success)),
        details: `sources: ${Number(creatorJson?.meta?.activeSourcesCount || 0)}/${Number(creatorJson?.meta?.totalSourcesCount || 0)}`,
      },
    ]

    const payload = {
      success: true,
      region,
      updatedAt: new Date().toISOString(),
      data: health,
      cached: false,
      cacheTtlMs: HEALTH_CACHE_TTL_MS,
    }

    healthCache.set(region, {
      region,
      updatedAt: payload.updatedAt,
      data: health,
      expiresAtMs: nowMs + HEALTH_CACHE_TTL_MS,
    })

    return NextResponse.json(payload)
  } catch (error) {
    // Graceful degradation: serve stale cache on transient upstream failures.
    const stale = healthCache.get(region)
    if (stale) {
      return NextResponse.json({
        success: true,
        region: stale.region,
        updatedAt: stale.updatedAt,
        data: stale.data,
        cached: true,
        stale: true,
        cacheTtlMs: HEALTH_CACHE_TTL_MS,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build intelligence health snapshot',
      },
      { status: 500 }
    )
  }
}
