import { NextRequest, NextResponse } from 'next/server'
import { DATA_RELIABILITY_MAP } from '@/lib/data/data-reliability-map'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/meta/data-reliability
 * Carte statique des sources data : routes, fallbacks, baseline de confiance, limites (FR).
 * Données non sensibles — utile transparence / monitor / intégrations.
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, { limit: 120, windowMs: 60_000 })

  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  return NextResponse.json(
    {
      success: true,
      kind: 'algo.data_reliability_map',
      generatedAt: new Date().toISOString(),
      noteFr:
        'Les scores baseline sont des ordres de grandeur « produit », pas des métriques mesurées en temps réel sur chaque requête.',
      sources: [...DATA_RELIABILITY_MAP],
    },
    { headers: createRateLimitHeaders(rateLimit) }
  )
}
