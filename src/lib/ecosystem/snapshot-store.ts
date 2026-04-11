import type { LiveTrendsPayload } from '@/lib/api/live-trends-query'
import { parseDefaultedListLimit } from '@/lib/api/query-limit'
import { ALGO_ECOSYSTEM_API_VERSION } from '@/lib/ecosystem/constants'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const SNAPSHOT_ENTITY_TYPES = [
  'trend_signal',
  'viral_score_snapshot',
  'model_weight_version',
] as const

export type SnapshotEntityType = (typeof SNAPSHOT_ENTITY_TYPES)[number]

export type SnapshotQuery = {
  since: Date
  types: SnapshotEntityType[]
  limitPerType: number
}

export function parseSnapshotQuery(searchParams: URLSearchParams):
  | { ok: true; value: SnapshotQuery }
  | { ok: false; error: string } {
  const sinceRaw = searchParams.get('since')
  let since: Date
  if (sinceRaw) {
    const t = Date.parse(sinceRaw)
    if (Number.isNaN(t)) return { ok: false, error: 'Invalid since: use ISO 8601 datetime' }
    since = new Date(t)
  } else {
    since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  }

  const typesRaw = searchParams.get('types')
  let types: SnapshotEntityType[]
  if (typesRaw?.trim()) {
    const parts = typesRaw.split(',').map((s) => s.trim()).filter(Boolean)
    const invalid = parts.filter((p) => !SNAPSHOT_ENTITY_TYPES.includes(p as SnapshotEntityType))
    if (invalid.length) {
      return {
        ok: false,
        error: `Invalid types: ${invalid.join(', ')}. Allowed: ${SNAPSHOT_ENTITY_TYPES.join(', ')}`,
      }
    }
    types = parts as SnapshotEntityType[]
  } else {
    types = [...SNAPSHOT_ENTITY_TYPES]
  }

  const limitPerType = parseDefaultedListLimit(searchParams.get('limit'), 100, 500)

  return { ok: true, value: { since, types, limitPerType } }
}

/**
 * Enregistre un lot de tendances après un fetch réussi (optionnel, `ALGO_SNAPSHOT_PERSIST=1`).
 */
export async function persistTrendSignalSnapshot(
  country: string | null,
  payload: LiveTrendsPayload
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient()
  if (!supabase) return { ok: false, error: 'Supabase admin client not configured' }

  const row = {
    country: country || 'ALL',
    data_source: payload.meta?.sourceName || payload.source || 'unknown',
    ecosystem_version: ALGO_ECOSYSTEM_API_VERSION,
    payload: {
      data: payload.data,
      source: payload.source,
      fetchedAt: payload.fetchedAt,
      expiresAt: payload.expiresAt,
      status: payload.status,
      meta: payload.meta,
      count: payload.count,
    },
  }

  const { error } = await supabase.from('trend_signal').insert(row)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Pour enregistrer un score depuis Viral Analyzer / prédiction (appels futurs). */
export async function persistViralScoreSnapshot(input: {
  subjectType: string
  subjectKey: string
  score: number
  confidence?: number | null
  payload?: Record<string, unknown>
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient()
  if (!supabase) return { ok: false, error: 'Supabase admin client not configured' }

  const { error } = await supabase.from('viral_score_snapshot').insert({
    subject_type: input.subjectType.slice(0, 120),
    subject_key: input.subjectKey.slice(0, 500),
    score: Math.min(100, Math.max(0, Math.round(input.score))),
    confidence: input.confidence ?? null,
    payload: input.payload ?? {},
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function persistModelWeightVersionIfNew(adaptive: {
  version: string
  weights: Record<string, number>
  notes: string[]
  rollbackApplied: boolean
}): Promise<{ ok: boolean; skipped?: boolean; error?: string; version?: string }> {
  const supabase = createSupabaseAdminClient()
  if (!supabase) return { ok: false, error: 'Supabase admin client not configured' }

  const { data: existing, error: selErr } = await supabase
    .from('model_weight_version')
    .select('id')
    .eq('version', adaptive.version)
    .maybeSingle()

  if (selErr) return { ok: false, error: selErr.message }
  if (existing) return { ok: true, skipped: true, version: adaptive.version }

  const { error } = await supabase.from('model_weight_version').insert({
    version: adaptive.version,
    payload: {
      weights: adaptive.weights,
      notes: adaptive.notes,
      rollbackApplied: adaptive.rollbackApplied,
      recordedAt: new Date().toISOString(),
    },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, version: adaptive.version }
}

export type SnapshotBundle = {
  success: true
  since: string
  queriedAt: string
  ecosystemApiVersion: string
  limitPerType: number
  counts: Record<SnapshotEntityType, number>
  trend_signal: Record<string, unknown>[]
  viral_score_snapshot: Record<string, unknown>[]
  model_weight_version: Record<string, unknown>[]
}

export async function fetchSnapshotBundle(query: SnapshotQuery): Promise<
  { ok: true; data: SnapshotBundle } | { ok: false; error: string }
> {
  const supabase = createSupabaseAdminClient()
  if (!supabase) return { ok: false, error: 'Clé secrète Supabase manquante (SERVICE_ROLE ou SUPABASE_SECRET_KEY)' }

  const sinceIso = query.since.toISOString()
  const lim = query.limitPerType

  const emptyCounts = (): Record<SnapshotEntityType, number> => ({
    trend_signal: 0,
    viral_score_snapshot: 0,
    model_weight_version: 0,
  })

  const bundle: SnapshotBundle = {
    success: true,
    since: sinceIso,
    queriedAt: new Date().toISOString(),
    ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
    limitPerType: lim,
    counts: emptyCounts(),
    trend_signal: [],
    viral_score_snapshot: [],
    model_weight_version: [],
  }

  for (const t of query.types) {
    const { data, error } = await supabase
      .from(t)
      .select('*')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(lim)

    if (error) return { ok: false, error: `${t}: ${error.message}` }
    const rows = (data || []) as Record<string, unknown>[]
    if (t === 'trend_signal') bundle.trend_signal = rows
    else if (t === 'viral_score_snapshot') bundle.viral_score_snapshot = rows
    else bundle.model_weight_version = rows
    bundle.counts[t] = rows.length
  }

  return { ok: true, data: bundle }
}
