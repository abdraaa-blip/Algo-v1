import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-live-stars:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/person/day?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    return NextResponse.json({ data: data.results || [] })
  } catch (error) {
    console.error('[API] live-stars error:', error)
    return NextResponse.json({ data: [], error: 'Failed to fetch stars' }, { status: 500 })
  }
}
