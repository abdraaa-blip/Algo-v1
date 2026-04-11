import { NextRequest, NextResponse } from 'next/server'
import { parseDefaultedListLimit } from '@/lib/api/query-limit'
import { buildPredictiveIntelligenceBundle } from '@/lib/intelligence/predictive-intelligence-bundle'
import { buildViralControlCockpitPayload } from '@/lib/intelligence/viral-control-cockpit'
import { resolveYoutubeForViralControl } from '@/lib/intelligence/viral-control-youtube'
import { getRadarHistoryCombined } from '@/lib/intelligence/radar-snapshot-store'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { validators } from '@/lib/security'

export const dynamic = 'force-dynamic'

const BUNDLE_CACHE_TTL_MS = 15_000
const bundleCache = new Map<string, { expiresAtMs: number; payload: Record<string, unknown> }>()

/**
 * GET /api/intelligence/viral-control?region=FR&locale=fr&days=7&videoUrl=…
 * Cockpit Viral Control Center : radar + historique · optionnellement métriques YouTube publiques par URL.
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, { limit: 45, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const rawRegion = searchParams.get('region') || 'FR'
  const region = rawRegion.toUpperCase()
  if (!validators.countryCode(region)) {
    return NextResponse.json(
      { success: false, error: 'Invalid region' },
      { status: 400, headers: createRateLimitHeaders(rateLimit) }
    )
  }
  const locale = (searchParams.get('locale') || 'fr').toLowerCase()
  const days = parseDefaultedListLimit(searchParams.get('days'), 7, 30)
  const videoUrl = searchParams.get('videoUrl')?.trim() || searchParams.get('youtubeUrl')?.trim() || undefined

  const cacheKey = `${region}:${locale}:${days}:${videoUrl ?? ''}`
  const nowMs = Date.now()
  const hit = bundleCache.get(cacheKey)
  if (hit && hit.expiresAtMs > nowMs) {
    return NextResponse.json(hit.payload, { headers: createRateLimitHeaders(rateLimit) })
  }

  try {
    const [bundle, history, youtube] = await Promise.all([
      buildPredictiveIntelligenceBundle({ region, locale }),
      getRadarHistoryCombined(region, days),
      resolveYoutubeForViralControl(videoUrl),
    ])

    const recommendations = bundle.snapshot.opportunities.map((o) => ({
      type: o.type,
      title: o.title,
      confidence: o.confidence,
    }))

    const payload = buildViralControlCockpitPayload({
      region: bundle.region,
      locale: bundle.locale,
      snapshot: bundle.snapshot,
      predictedViralityScore: bundle.predictedViralityScore,
      confidence: bundle.confidence,
      radarPoints: history.points,
      recommendations,
    })

    const body = {
      ...payload,
      radarSources: history.sources,
      youtube: youtube ?? undefined,
      cacheTtlMs: 30_000,
      serverBundleCacheTtlMs: BUNDLE_CACHE_TTL_MS,
    }

    bundleCache.set(cacheKey, { expiresAtMs: nowMs + BUNDLE_CACHE_TTL_MS, payload: body })

    return NextResponse.json(body, { headers: createRateLimitHeaders(rateLimit) })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'viral-control build failed',
      },
      { status: 500, headers: createRateLimitHeaders(rateLimit) }
    )
  }
}
