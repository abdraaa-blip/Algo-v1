import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { RadarHistoryPointDTO } from '@/lib/intelligence/radar-history-utils'
import {
  dedupeRadarPointsByAt,
  mergeRadarHistoryPoints,
  pruneRadarPointsByAge,
} from '@/lib/intelligence/radar-history-utils'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabasePublicApiKey, getSupabaseUrl } from '@/lib/supabase/env-keys'

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000
/** Évite de saturer analytics / mémoire si le radar est sollicité en boucle. */
const RECORD_THROTTLE_MS = 10 * 60 * 1000
const MAX_POINTS_PER_REGION = 800

const memoryByRegion = new Map<string, RadarHistoryPointDTO[]>()
const lastRecordMsByRegion = new Map<string, number>()

function getSupabaseAnonWriter() {
  const url = getSupabaseUrl()
  const anon = getSupabasePublicApiKey()
  if (!url || !anon) return null
  return createClient(url, anon)
}

/** Lecture historique : admin préféré ; sinon anon (souvent vide si RLS). */
function getSupabaseForRadarRead() {
  return createSupabaseAdminClient() ?? getSupabaseAnonWriter()
}

export type RecordRadarSnapshotOpts = {
  /** Pour le cron : enregistrer même si le throttle 10 min n’est pas écoulé. */
  bypassThrottle?: boolean
}

/**
 * Enregistre un point radar après un calcul predictif **frais** (hors cache).
 * Mémoire process + persistance : table `intelligence_radar_point` (service role) ou repli `analytics_events`.
 */
export function recordRadarSnapshotIfDue(
  request: NextRequest | null,
  params: {
    region: string
    locale: string
    viralityScore: number
    confidence: number
    anomalyCount: number
    generatedAt: string
  },
  opts?: RecordRadarSnapshotOpts
): void {
  const r = params.region.toUpperCase()
  const now = Date.now()
  const last = lastRecordMsByRegion.get(r) ?? 0
  if (!opts?.bypassThrottle && now - last < RECORD_THROTTLE_MS) return
  lastRecordMsByRegion.set(r, now)

  const point: RadarHistoryPointDTO = {
    at: new Date(params.generatedAt).toISOString(),
    viralityScore: params.viralityScore,
    confidence: params.confidence,
    anomalyCount: params.anomalyCount,
  }

  const prev = memoryByRegion.get(r) ?? []
  const merged = dedupeRadarPointsByAt([...prev, point])
  const pruned = pruneRadarPointsByAge(merged, now, RETENTION_MS)
  const capped = pruned.length > MAX_POINTS_PER_REGION ? pruned.slice(-MAX_POINTS_PER_REGION) : pruned
  memoryByRegion.set(r, capped)

  void persistRadarSnapshotEvent(request, params).catch(() => {})
}

async function persistRadarSnapshotEvent(
  request: NextRequest | null,
  params: {
    region: string
    locale: string
    viralityScore: number
    confidence: number
    anomalyCount: number
    generatedAt: string
  }
) {
  const admin = createSupabaseAdminClient()
  const sourceHint = request ? 'api' : 'cron'

  if (admin) {
    const row = {
      region: params.region.toUpperCase(),
      locale: (params.locale || 'fr').slice(0, 16),
      virality_score: Math.round(params.viralityScore),
      confidence: params.confidence,
      anomaly_count: Math.max(0, Math.round(params.anomalyCount)),
      captured_at: new Date(params.generatedAt).toISOString(),
      source_hint: sourceHint,
    }
    const { error } = await admin.from('intelligence_radar_point').insert(row)
    if (!error) return
  }

  const fallback = getSupabaseAnonWriter()
  if (!fallback) return
  await fallback.from('analytics_events').insert({
    event_type: 'radar_snapshot',
    event_name: 'intelligence_radar_tick',
    session_id: null,
    page_path: '/intelligence',
    user_agent: request?.headers.get('user-agent') || 'algo-server',
    ip_hash: null,
    properties: {
      region: params.region.toUpperCase(),
      locale: params.locale,
      capturedAt: params.generatedAt,
      viralityScore: params.viralityScore,
      confidence: params.confidence,
      anomalyCount: params.anomalyCount,
    },
  })
}

/** Points en mémoire process pour une région (fenêtre 7j déjà appliquée côté store). */
export function getRadarHistoryMemory(region: string, days: number): RadarHistoryPointDTO[] {
  const r = region.toUpperCase()
  const safeDays = Math.min(30, Math.max(1, Math.floor(days)))
  const maxAgeMs = safeDays * 24 * 60 * 60 * 1000
  const now = Date.now()
  const raw = memoryByRegion.get(r) ?? []
  return pruneRadarPointsByAge(raw, now, maxAgeMs)
}

async function loadRadarPointsFromDedicatedTable(
  region: string,
  limit: number
): Promise<RadarHistoryPointDTO[]> {
  const admin = createSupabaseAdminClient()
  if (!admin) return []
  const r = region.toUpperCase()
  const { data, error } = await admin
    .from('intelligence_radar_point')
    .select('captured_at, virality_score, confidence, anomaly_count')
    .eq('region', r)
    .order('captured_at', { ascending: false })
    .limit(limit)

  if (error || !Array.isArray(data)) return []

  const out: RadarHistoryPointDTO[] = []
  for (const row of data as Array<{
    captured_at: string
    virality_score: number
    confidence: number
    anomaly_count: number | null
  }>) {
    if (!row?.captured_at) continue
    const confidence = Number(row.confidence)
    if (!Number.isFinite(row.virality_score) || !Number.isFinite(confidence)) continue
    out.push({
      at: new Date(row.captured_at).toISOString(),
      viralityScore: Math.round(row.virality_score),
      confidence,
      anomalyCount:
        typeof row.anomaly_count === 'number' && Number.isFinite(row.anomaly_count)
          ? Math.max(0, Math.round(row.anomaly_count))
          : 0,
    })
  }
  return dedupeRadarPointsByAt(out)
}

async function loadRadarSnapshotsFromAnalyticsLegacy(
  region: string,
  limit: number
): Promise<RadarHistoryPointDTO[]> {
  const supabase = getSupabaseForRadarRead()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('analytics_events')
    .select('properties, created_at')
    .eq('event_type', 'radar_snapshot')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !Array.isArray(data)) return []

  const r = region.toUpperCase()
  const out: RadarHistoryPointDTO[] = []
  for (const row of data) {
    const props = (row as { properties?: Record<string, unknown> }).properties
    if (!props || String(props.region || '').toUpperCase() !== r) continue
    const at = String(props.capturedAt || (row as { created_at?: string }).created_at || '')
    if (!at) continue
    const viralityScore = typeof props.viralityScore === 'number' ? props.viralityScore : Number(props.viralityScore)
    const confidence = typeof props.confidence === 'number' ? props.confidence : Number(props.confidence)
    const anomalyCount = typeof props.anomalyCount === 'number' ? props.anomalyCount : Number(props.anomalyCount)
    if (!Number.isFinite(viralityScore) || !Number.isFinite(confidence)) continue
    out.push({
      at: new Date(at).toISOString(),
      viralityScore: Math.round(viralityScore),
      confidence,
      anomalyCount: Number.isFinite(anomalyCount) ? Math.max(0, Math.round(anomalyCount)) : 0,
    })
  }
  return dedupeRadarPointsByAt(out)
}

async function loadRadarSnapshotsFromSupabase(region: string, limit: number): Promise<RadarHistoryPointDTO[]> {
  const fromTable = await loadRadarPointsFromDedicatedTable(region, limit)
  const fromLegacy = await loadRadarSnapshotsFromAnalyticsLegacy(region, Math.min(limit, 200))
  return dedupeRadarPointsByAt([...fromTable, ...fromLegacy])
}

/**
 * Mémoire process + lecture durable best-effort (nécessite politique SELECT côté Supabase pour être non vide).
 */
export async function getRadarHistoryCombined(
  region: string,
  days: number
): Promise<{ points: RadarHistoryPointDTO[]; sources: ('memory' | 'supabase')[] }> {
  const mem = getRadarHistoryMemory(region, days)
  const sources: ('memory' | 'supabase')[] = ['memory']
  let durable: RadarHistoryPointDTO[] = []
  try {
    durable = await loadRadarSnapshotsFromSupabase(region, 400)
    if (durable.length) sources.push('supabase')
  } catch {
    /* RLS ou indisponibilité */
  }
  const maxAgeMs = Math.min(30, Math.max(1, days)) * 24 * 60 * 60 * 1000
  const merged = mergeRadarHistoryPoints(mem, durable, { maxAgeMs, cap: 400 })
  return { points: merged, sources: [...new Set(sources)] }
}
