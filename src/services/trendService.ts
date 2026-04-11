// =============================================================================
// ALGO V1 · trendService
// Fonctions pures. Aucun effet de bord. Aucune dépendance UI.
// =============================================================================

import { mockTrends } from '@/data/mock-trends'
import { filterTrendsByScope } from '@/services/scopeService'
import { sortTrendsByMomentum } from '@/services/logic/computeTrendMomentum'
import type { Trend, AppScope, TrendTab } from '@/types'

/**
 * Retourne les trends selon le scope et l'onglet actif.
 */
export function getTrends(
  scope: AppScope,
  tab: TrendTab = 'today',
  limit?: number,
): Trend[] {
  let results = filterTrendsByScope(mockTrends, scope)

  switch (tab) {
    case 'emerging':
      results = results
        .filter((t) => t.growthTrend === 'up')
        .sort((a, b) => b.growthRate - a.growthRate)
      break

    case 'mostCopied':
      results = results.sort((a, b) => b.watchersCount - a.watchersCount)
      break

    case 'mostViewed':
    case 'mostPlayed':
      results = results.sort((a, b) => b.score - a.score)
      break

    case 'week':
    case 'month':
      // En V1 : même logique que today · différenciée en V2 avec vraies données
      results = sortTrendsByMomentum(results)
      break

    case 'today':
    default:
      results = sortTrendsByMomentum(results)
  }

  return limit ? results.slice(0, limit) : results
}

/**
 * Retourne une trend par son ID.
 */
export function getTrendById(id: string): Trend | undefined {
  return mockTrends.find((t) => t.id === id)
}

/**
 * Retourne les trends en explosion.
 */
export function getExplodingTrends(limit = 5): Trend[] {
  return mockTrends
    .filter((t) => t.isExploding)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Recherche textuelle dans les trends.
 */
export function searchTrends(query: string): Trend[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  return mockTrends.filter((t) =>
    t.name.toLowerCase().includes(q)        ||
    t.category.toLowerCase().includes(q)    ||
    t.explanation.toLowerCase().includes(q)
  )
}

/**
 * Retourne les trends liées à un contenu donné.
 */
export function getTrendsRelatedToContent(contentId: string): Trend[] {
  return mockTrends.filter((t) => t.relatedContentIds.includes(contentId))
}

/**
 * Retourne tous les IDs de trends disponibles.
 */
export function getAllTrendIds(): string[] {
  return mockTrends.map((t) => t.id)
}
