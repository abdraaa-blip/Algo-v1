import fs from 'node:fs'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { BASE_WEIGHTS, computeAdaptiveWeights } from '@/lib/ai/adaptive-weighting'

export const dynamic = 'force-dynamic'

const HISTORY_PATH = path.join(process.cwd(), 'reports', 'adaptive-weights-history.json')

function readHistory() {
  if (!fs.existsSync(HISTORY_PATH)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-model-weights:${identifier}`, { limit: 90, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const rawE = searchParams.get('engagementRate')
  const rawF = searchParams.get('frictionRate')
  const engagementRate =
    rawE !== null && rawE !== '' ? Number.parseFloat(rawE) : Number.NaN
  const frictionRate =
    rawF !== null && rawF !== '' ? Number.parseFloat(rawF) : Number.NaN

  /** `Number(null) === 0` : sans query explicite, on reste en baseline (pas « 0,0 » adaptatif). */
  const hasSignals = Number.isFinite(engagementRate) && Number.isFinite(frictionRate)
  const adaptive = hasSignals
    ? computeAdaptiveWeights({ engagementRate, frictionRate })
    : computeAdaptiveWeights()

  const history = readHistory()
  const latestSnapshot = history.length > 0 ? history[history.length - 1] : null

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    baseline: BASE_WEIGHTS,
    active: adaptive.weights,
    version: adaptive.version,
    rollbackApplied: adaptive.rollbackApplied,
    notes: adaptive.notes,
    mode: hasSignals ? 'adaptive' : 'baseline',
    runtimeSignals: hasSignals ? { engagementRate, frictionRate } : null,
    rollbackRule: 'frictionRate > 0.20 OR (frictionRate > 0.12 AND engagementRate < 0.10)',
    history: {
      count: history.length,
      latest: latestSnapshot,
    },
  })
}
