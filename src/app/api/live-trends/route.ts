import { NextResponse, type NextRequest } from 'next/server'
import { buildLiveTrendsPayload } from '@/lib/api/live-trends-query'
import { parseOptionalListLimit } from '@/lib/api/query-limit'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'
import { sanitizeInput, validators } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/live-trends
 * Fetches real-time trending topics from multiple sources
 * Rate limited: 60 requests per minute per IP
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, { limit: 60, windowMs: 60000 })
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const rawCountry = searchParams.get('country')
  
  // Validate and sanitize country input
  const country = rawCountry ? sanitizeInput(rawCountry).toUpperCase() : null
  if (country && !validators.countryCode(country)) {
    return NextResponse.json(
      { success: false, error: 'Invalid country code' },
      { status: 400 }
    )
  }
  
  try {
    const listLimit = parseOptionalListLimit(request.nextUrl.searchParams.get('limit'))
    const payload = await buildLiveTrendsPayload(country, listLimit)
    return NextResponse.json(payload, { headers: createRateLimitHeaders(rateLimit) })
    
  } catch (error) {
    console.error('[API] Live trends error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trends',
      data: [],
      status: 'error',
      source: 'error',
      fallbackMessage: 'Les tendances sont temporairement indisponibles.',
    }, { status: 500 })
  }
}
