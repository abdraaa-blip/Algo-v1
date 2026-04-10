import { NextResponse, type NextRequest } from 'next/server'
import { buildLiveTrendsPayload } from '@/lib/api/live-trends-query'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'
import type { RealTrend } from '@/lib/api/real-data-service'
import { ALGO_ECOSYSTEM_API_VERSION } from '@/lib/ecosystem/constants'
import {
  extractPlatformApiKey,
  fingerprintPlatformKey,
  platformApiKeysConfigured,
  verifyPlatformApiKey,
} from '@/lib/ecosystem/platform-auth'
import { sanitizeInput, validators } from '@/lib/security'
import { persistTrendSignalSnapshot } from '@/lib/ecosystem/snapshot-store'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RATE = { limit: 120, windowMs: 60_000 }

function trendsToCsv(rows: RealTrend[]): string {
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`
  const head = 'id,title,trafficVolume,country,source'
  const lines = rows.map((t) =>
    [t.id, t.title, t.trafficVolume, t.country, t.source].map(esc).join(',')
  )
  return [head, ...lines].join('\n')
}

/**
 * GET /api/v1/trends
 * Authentification : clé plateforme (Bearer ou X-ALGO-Platform-Key).
 * Query : country=FR (optionnel), format=json|csv
 */
export async function GET(request: NextRequest) {
  if (!platformApiKeysConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Platform API keys not configured (ALGO_PLATFORM_API_KEY or ALGO_PLATFORM_API_KEYS)',
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { status: 503 }
    )
  }

  const key = extractPlatformApiKey(request)
  if (!verifyPlatformApiKey(key)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', hint: 'Use Authorization: Bearer <key> or X-ALGO-Platform-Key' },
      { status: 401 }
    )
  }

  const keyFp = fingerprintPlatformKey(key!)
  const identifier = `platform:v1:trends:${keyFp}:${getClientIdentifier(request)}`
  const rateLimit = checkRateLimit(identifier, RATE)
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const rawCountry = searchParams.get('country')
  const country = rawCountry ? sanitizeInput(rawCountry).toUpperCase() : null
  if (country && !validators.countryCode(country)) {
    return NextResponse.json({ success: false, error: 'Invalid country code' }, { status: 400 })
  }

  const format = (searchParams.get('format') || 'json').toLowerCase()

  try {
    const payload = await buildLiveTrendsPayload(country)

    if (process.env.ALGO_SNAPSHOT_PERSIST === '1') {
      void persistTrendSignalSnapshot(country, payload).then((r) => {
        if (!r.ok && r.error) console.warn('[ALGO_SNAPSHOT_PERSIST]', r.error)
      })
    }

    const headers: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(createRateLimitHeaders(rateLimit)).map(([k, v]) => [k, String(v)])
      ),
      'X-ALGO-Ecosystem-Version': ALGO_ECOSYSTEM_API_VERSION,
    }

    if (format === 'csv') {
      const csv = trendsToCsv(payload.data as RealTrend[])
      return new NextResponse(csv, {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="algo-trends.csv"',
        },
      })
    }

    return NextResponse.json(
      {
        ...payload,
        ecosystem: { apiVersion: ALGO_ECOSYSTEM_API_VERSION, format: 'json' },
      },
      { headers }
    )
  } catch (error) {
    console.error('[API v1/trends]', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trends',
        data: [],
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { status: 500 }
    )
  }
}
