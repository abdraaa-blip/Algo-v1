// =============================================================================
// ALGO V1 · computeTrendMomentum (Logic Layer)
// Fonctions pures. Aucun appel API. Aucune dépendance UI.
// En V1 : opère sur les données mock. En V2 : branche sur les signaux temps réel.
// =============================================================================

import type { Trend, GrowthTrend } from '@/types'

export interface MomentumScore {
  value:      number    // 0–100
  trend:      GrowthTrend
  label:      'explosive' | 'rising' | 'stable' | 'declining'
}

/**
 * Calcule le momentum d'une trend à partir de ses métriques.
 * Formule V1 simplifiée · sera calibrée avec de vraies données en V2.
 */
export function computeTrendMomentum(trend: Trend): MomentumScore {
  const growthComponent    = Math.min(Math.max(trend.growthRate, -100), 500) / 5  // 0–100 normalisé
  const watchersComponent  = Math.min(trend.watchersCount / 200, 20)
  const explodingBonus     = trend.isExploding ? 20 : 0

  const raw   = growthComponent + watchersComponent + explodingBonus
  const value = Math.min(Math.round(Math.max(raw, 0)), 100)

  const label: MomentumScore['label'] =
    value >= 80 ? 'explosive'
    : value >= 55 ? 'rising'
    : value >= 30 ? 'stable'
    : 'declining'

  return { value, trend: trend.growthTrend, label }
}

/**
 * Trie les trends par momentum décroissant.
 */
export function sortTrendsByMomentum(trends: Trend[]): Trend[] {
  return [...trends].sort((a, b) => {
    const ma = computeTrendMomentum(a).value
    const mb = computeTrendMomentum(b).value
    return mb - ma
  })
}

/**
 * Détermine si une trend mérite un badge "En explosion".
 */
export function isTrendExploding(trend: Trend): boolean {
  return trend.isExploding || (trend.growthRate >= 200 && trend.score >= 85)
}
