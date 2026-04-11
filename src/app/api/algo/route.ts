import { NextRequest, NextResponse } from 'next/server'
import { processAlgoAiRequest } from '@/core/system'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

/**
 * POST /api/algo
 * Pont léger vers `processAlgoAiRequest` (même pipeline que `/api/ai/ask` · corps simplifié `input`).
 * Dashboard / outils internes : ne remplace pas la route Q&R complète.
 *
 * Ne pas dupliquer cette surface avec `pages/api/algo` ni un second `processRequest` : une seule entrée App Router
 * (`docs/ALGO_OFFLINE_EVOLUTION.md` · score viral → libs canoniques, pas de compute ad hoc ici).
 */
export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(identifier, { limit: 20, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  let body: {
    input?: string
    context?: { currentTrends?: string[]; userCountry?: string }
    country?: string | null
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const input = typeof body.input === 'string' ? body.input.trim() : ''
  if (!input) {
    return NextResponse.json({ success: false, error: 'Missing input' }, { status: 400 })
  }

  const out = await processAlgoAiRequest({
    question: input,
    clientContext: body.context,
    countryHint: typeof body.country === 'string' ? body.country : null,
    expertiseLevel: 'intermediate',
  })

  return NextResponse.json(
    {
      success: true,
      kind: 'algo.dashboard_insight',
      text: out.answer,
      standard: out.standard,
      quality: out.quality,
      systemRoute: out.route,
      systemConfidence: out.systemConfidence,
    },
    { headers: createRateLimitHeaders(rateLimit) }
  )
}
