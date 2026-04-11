import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { fetchTrendingPeople } from '@/lib/api/tmdb-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-live-celebrities:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const result = await fetchTrendingPeople('day')
    
    return NextResponse.json({
      success: true,
      data: result.data,
      fetchedAt: result.fetchedAt,
      expiresAt: result.expiresAt,
      source: result.source,
      count: result.data.length
    })
  } catch (error) {
    console.error('[ALGO API] Live celebrities fetch failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch celebrities', data: [], source: 'error' },
      { status: 500 }
    )
  }
}
