import { NextRequest, NextResponse } from 'next/server'
import { getRadarHistoryCombined } from '@/lib/intelligence/radar-snapshot-store'
import { supabaseServiceRoleConfigured } from '@/lib/supabase/admin'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { validators } from '@/lib/security'

export const dynamic = 'force-dynamic'

/**
 * GET /api/intelligence/radar-history?region=FR&days=7
 * Historique des points radar (score prédit, confiance, anomalies) · mémoire process + Supabase si lisible.
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, { limit: 60, windowMs: 60_000 })
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

  const daysRaw = Number(searchParams.get('days') || '7')
  const days = Number.isFinite(daysRaw) ? Math.min(30, Math.max(1, Math.floor(daysRaw))) : 7

  const { points, sources } = await getRadarHistoryCombined(region, days)

  return NextResponse.json(
    {
      success: true,
      kind: 'algo.intelligence_radar_history',
      region,
      days,
      generatedAt: new Date().toISOString(),
      points,
      sources,
      noteFr: supabaseServiceRoleConfigured()
        ? 'Persistance : table `intelligence_radar_point` (+ anciennes lignes `analytics_events` si présentes). Cron `/api/cron/radar-snapshot` (défaut FR,US). Appliquer la migration SQL du dépôt sur Supabase.'
        : 'Sans SUPABASE_SERVICE_ROLE_KEY : mémoire process et éventuel insert anon dans `analytics_events` ; pas de lecture table métier.',
    },
    { headers: createRateLimitHeaders(rateLimit) }
  )
}
