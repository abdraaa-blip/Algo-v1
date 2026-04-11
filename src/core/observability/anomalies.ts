/**
 * Heuristiques d’anomalies à partir des seuls logs (pas de décision métier).
 */

import type { AlgoObsLog } from '@/core/observability/types'

export type AlgoObsAnomaly = {
  level: 'info' | 'warning' | 'error'
  code: string
  detail: string
}

export function detectLogAnomalies(logs: AlgoObsLog[], windowMs = 60_000): AlgoObsAnomaly[] {
  const now = Date.now()
  const w = logs.filter((l) => now - l.timestamp <= windowMs)
  const out: AlgoObsAnomaly[] = []

  const err = w.filter((l) => l.type === 'error' || l.type === 'critical').length
  if (err >= 8) {
    out.push({
      level: 'error',
      code: 'error_burst',
      detail: `${err} erreurs / critiques sur la fenêtre ${Math.round(windowMs / 1000)}s.`,
    })
  } else if (err >= 3) {
    out.push({
      level: 'warning',
      code: 'error_elevated',
      detail: `${err} erreurs / critiques sur la fenêtre récente.`,
    })
  }

  const apiSlow = w.filter(
    (l) => l.layer === 'api' && typeof l.metadata?.durationMs === 'number' && (l.metadata.durationMs as number) > 8000
  ).length
  if (apiSlow >= 2) {
    out.push({
      level: 'warning',
      code: 'api_latency',
      detail: 'Plusieurs événements API avec durée > 8s (métadonnée durationMs).',
    })
  }

  const crit = w.filter((l) => l.type === 'critical').length
  if (crit >= 1) {
    out.push({
      level: 'error',
      code: 'critical_present',
      detail: 'Au moins un événement critique dans la fenêtre.',
    })
  }

  return out
}
