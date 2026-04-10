import { buildLiveTrendsPayload } from '@/lib/api/live-trends-query'
import { computeAdaptiveWeights } from '@/lib/ai/adaptive-weighting'
import { persistModelWeightVersionIfNew, persistTrendSignalSnapshot } from '@/lib/ecosystem/snapshot-store'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/** Parse `ALGO_SNAPSHOT_CRON_REGIONS` ex. `ALL,FR,US` ou vide = défaut. */
export function parseSnapshotCronRegions(raw: string | undefined): Array<string | null> {
  if (!raw?.trim()) return [null, 'FR', 'US']
  return raw.split(',').map((s) => {
    const t = s.trim().toUpperCase()
    if (t === '' || t === 'ALL') return null
    return t
  })
}

export type TrendSnapshotJobResult = {
  region: string
  ok: boolean
  error?: string
  rowHint?: string
}

/**
 * Persiste un lot de tendances par région (pour cron / tâches internes).
 */
export async function runTrendSnapshotJob(
  regions: Array<string | null> = [null, 'FR', 'US']
): Promise<TrendSnapshotJobResult[]> {
  const admin = createSupabaseAdminClient()
  if (!admin) {
    return regions.map((r) => ({
      region: r ?? 'ALL',
      ok: false,
      error: 'Clé secrète Supabase non configurée (SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY)',
    }))
  }

  const out: TrendSnapshotJobResult[] = []
  for (const country of regions) {
    try {
      const payload = await buildLiveTrendsPayload(country)
      const r = await persistTrendSignalSnapshot(country, payload)
      out.push({
        region: country ?? 'ALL',
        ok: r.ok,
        error: r.error,
        rowHint: r.ok ? `${payload.count} trends` : undefined,
      })
    } catch (e) {
      out.push({
        region: country ?? 'ALL',
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return out
}

/**
 * Enregistre la version de poids adaptatifs actuelle si nouvelle (table model_weight_version).
 */
export async function runModelWeightSnapshotJob(): Promise<{
  ok: boolean
  skipped?: boolean
  error?: string
  version?: string
}> {
  if (!createSupabaseAdminClient()) {
    return { ok: false, error: 'Clé secrète Supabase non configurée (SERVICE_ROLE ou SUPABASE_SECRET_KEY)' }
  }
  const adaptive = computeAdaptiveWeights()
  return persistModelWeightVersionIfNew({
    version: adaptive.version,
    weights: adaptive.weights as Record<string, number>,
    notes: adaptive.notes,
    rollbackApplied: adaptive.rollbackApplied,
  })
}
