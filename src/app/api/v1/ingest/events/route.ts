import { NextRequest, NextResponse } from 'next/server'
import { appendAnalyticsEvents, hashIpForAnalytics } from '@/lib/analytics/event-store'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'
import { ALGO_ECOSYSTEM_API_VERSION } from '@/lib/ecosystem/constants'
import {
  extractPlatformApiKey,
  fingerprintPlatformKey,
  platformApiKeysConfigured,
  verifyPlatformApiKey,
} from '@/lib/ecosystem/platform-auth'

export const dynamic = 'force-dynamic'

const RATE = { limit: 60, windowMs: 60_000 }

/**
 * POST /api/v1/ingest/events
 * Même contrat métier que POST /api/analytics/events · pour apps externes authentifiées.
 */
export async function POST(request: NextRequest) {
  if (!platformApiKeysConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Platform API keys not configured',
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { status: 503 }
    )
  }

  const key = extractPlatformApiKey(request)
  if (!verifyPlatformApiKey(key)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const keyFp = fingerprintPlatformKey(key!)
  const identifier = `platform:v1:ingest:${keyFp}:${getClientIdentifier(request)}`
  const rateLimit = checkRateLimit(identifier, RATE)
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = await request.json()
    const { events } = body as { events: unknown }
    const ipHash = hashIpForAnalytics(
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    )
    const userAgent = request.headers.get('user-agent') || null

    const result = await appendAnalyticsEvents(events, {
      ipHash,
      userAgent,
      source: 'ecosystem_v1',
    })

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION },
        { status: 400, headers: createRateLimitHeaders(rateLimit) }
      )
    }

    return NextResponse.json(
      {
        success: true,
        processed: result.processed,
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { headers: createRateLimitHeaders(rateLimit) }
    )
  } catch (error) {
    console.error('[API v1/ingest/events]', error)
    return NextResponse.json(
      { success: false, error: 'Ingest failed', ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION },
      { status: 500 }
    )
  }
}
