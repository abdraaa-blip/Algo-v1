import { NextRequest, NextResponse } from 'next/server'
import {
  parseSnapshotCronRegions,
  runModelWeightSnapshotJob,
  runTrendSnapshotJob,
} from '@/lib/ecosystem/snapshot-jobs'
import { ALGO_ECOSYSTEM_API_VERSION } from '@/lib/ecosystem/constants'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Cron : persistance automatique des tendances (trend_signal) + version de poids (model_weight_version).
 * Vercel Cron : voir `vercel.json`. Auth : `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Régions : `ALGO_SNAPSHOT_CRON_REGIONS` ex. `ALL,FR,US` (défaut ALL+FR+US).
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not configured', ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION },
      { status: 503 }
    )
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const regions = parseSnapshotCronRegions(process.env.ALGO_SNAPSHOT_CRON_REGIONS)
  const trends = await runTrendSnapshotJob(regions)
  const weights = await runModelWeightSnapshotJob()

  return NextResponse.json({
    ok: true,
    ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
    durationMs: Date.now() - started,
    regions,
    trends,
    modelWeights: weights,
  })
}
