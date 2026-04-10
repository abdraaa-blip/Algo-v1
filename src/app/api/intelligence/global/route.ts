import { NextRequest, NextResponse } from 'next/server'
import { buildGlobalIntelligence } from '@/lib/intelligence/global-intelligence'

export const dynamic = 'force-dynamic'

interface GlobalCacheEntry {
  key: string
  payload: {
    success: true
    data: Awaited<ReturnType<typeof buildGlobalIntelligence>>
    cached: boolean
    stale?: boolean
    cacheTtlMs: number
  }
  expiresAtMs: number
}

const GLOBAL_CACHE_TTL_MS = 30_000
const globalCache = new Map<string, GlobalCacheEntry>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region') || 'FR'
  const locale = searchParams.get('locale') || 'fr'
  const cacheKey = `${region.toUpperCase()}:${locale.toLowerCase()}`
  const nowMs = Date.now()
  const cached = globalCache.get(cacheKey)
  if (cached && cached.expiresAtMs > nowMs) {
    return NextResponse.json({ ...cached.payload, cached: true })
  }

  try {
    const snapshot = await buildGlobalIntelligence({ region, locale })
    const payload = {
      success: true,
      data: snapshot,
      cached: false,
      cacheTtlMs: GLOBAL_CACHE_TTL_MS,
    } as const
    globalCache.set(cacheKey, {
      key: cacheKey,
      payload,
      expiresAtMs: nowMs + GLOBAL_CACHE_TTL_MS,
    })
    return NextResponse.json(payload)
  } catch (error) {
    const stale = globalCache.get(cacheKey)
    if (stale) {
      return NextResponse.json({
        ...stale.payload,
        cached: true,
        stale: true,
      })
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build intelligence snapshot',
      },
      { status: 500 }
    )
  }
}
