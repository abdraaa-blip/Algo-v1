import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

/**
 * Contexte public non nominatif pour personnalisation légère (SEO / UX).
 * Vercel : `x-vercel-ip-country`. Ailleurs : souvent vide · le client garde la langue navigateur.
 */
export function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-context:${identifier}`, { limit: 200, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-appengine-country') ||
    ''

  const accept = request.headers.get('accept-language') || ''
  const primary = accept.split(',')[0]?.trim().split(';')[0]?.toLowerCase().slice(0, 12) || 'fr'

  return NextResponse.json(
    {
      country: country || null,
      languageHint: primary,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=120',
      },
    }
  )
}
