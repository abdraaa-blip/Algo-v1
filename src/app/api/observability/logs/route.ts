import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { z } from 'zod'
import { BRAIN_MODULE_REGISTRY } from '@/core/brain'
import { detectLogAnomalies } from '@/core/observability/anomalies'
import { isObservabilityDashboardEnabled } from '@/core/observability/guard'
import { addLog, getCriticalErrors, getErrorLogs, getLogs } from '@/core/observability/logStore'
import { computeObservabilityMetrics } from '@/core/observability/metrics'
import type { AlgoObsLayer, AlgoObsSeverity } from '@/core/observability/types'

const ingestSchema = z.object({
  layer: z.enum(['api', 'ai', 'ui', 'memory', 'system']),
  type: z.enum(['info', 'warning', 'error', 'critical']),
  message: z.string().min(1).max(400),
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * GET /api/observability/logs
 * Snapshot tampon + métriques dérivées · **désactivé en production** sauf `ALGO_OBSERVABILITY_DASHBOARD=1`.
 */
export async function GET() {
  if (!isObservabilityDashboardEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const logs = getLogs()
  return NextResponse.json({
    success: true,
    kind: 'algo.observability.snapshot',
    logs: logs.slice(0, 250),
    metrics1m: computeObservabilityMetrics(logs, 60_000),
    metrics5m: computeObservabilityMetrics(logs, 300_000),
    anomalies: detectLogAnomalies(logs, 60_000),
    critical: getCriticalErrors().slice(0, 30),
    errors: getErrorLogs().slice(0, 50),
    activeModules: Object.keys(BRAIN_MODULE_REGISTRY),
    generatedAt: new Date().toISOString(),
  })
}

/**
 * POST /api/observability/logs
 * Ingestion légère (ex. couche UI) · même garde d’accès que GET.
 */
export async function POST(req: NextRequest) {
  if (!isObservabilityDashboardEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`api-observability-logs-post:${identifier}`, { limit: 180, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ingestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  const { layer, type, message, metadata } = parsed.data
  addLog({
    layer: layer as AlgoObsLayer,
    type: type as AlgoObsSeverity,
    message,
    metadata: { ...metadata, source: 'client_ingest' },
  })

  return NextResponse.json({ success: true, kind: 'algo.observability.ingest' })
}
