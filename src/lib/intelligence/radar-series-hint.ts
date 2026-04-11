import type { RadarHistoryPointDTO } from '@/lib/intelligence/radar-history-utils'

/** Seuils sur le delta relatif entre les deux derniers scores agrégés radar (0–100). */
const SPIKE_PCT = 18
const DROP_PCT = -18

export type RadarDeltaHint = {
  kind: 'score_spike' | 'score_drop'
  /** Variation en % du dernier point par rapport au précédent. */
  deltaPercent: number
  noteFr: string
}

/**
 * Indication légère sur la dernière variation de score (série radar seulement).
 * Pas une « anomalie » métier : pas de division par zéro, pas de données inventées.
 */
export function deriveRadarDeltaHint(points: RadarHistoryPointDTO[]): RadarDeltaHint | null {
  const sorted = [...points].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  if (sorted.length < 2) return null

  const prev = sorted[sorted.length - 2]!
  const cur = sorted[sorted.length - 1]!
  const p = prev.viralityScore
  const c = cur.viralityScore
  if (!Number.isFinite(p) || !Number.isFinite(c)) return null
  if (Math.abs(p) < 1e-6) return null

  const pct = ((c - p) / p) * 100
  if (!Number.isFinite(pct)) return null

  const rounded = Math.round(pct)
  if (pct >= SPIKE_PCT) {
    return {
      kind: 'score_spike',
      deltaPercent: rounded,
      noteFr: `Dernier point radar : +${rounded} % par rapport au précédent (score agrégé, pas une garantie de reach).`,
    }
  }
  if (pct <= DROP_PCT) {
    return {
      kind: 'score_drop',
      deltaPercent: rounded,
      noteFr: `Dernier point radar : ${rounded} % par rapport au précédent. Croise avec le contexte marché avant de conclure.`,
    }
  }
  return null
}
