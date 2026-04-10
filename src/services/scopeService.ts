// =============================================================================
// ALGO V1 — scopeService
// Logique pure de filtrage selon le Country Scope System.
// Ces fonctions sont des fonctions pures — aucun effet de bord.
// Elles ne connaissent pas les composants UI.
// =============================================================================

import type { AppScope, Content, Trend, NewsItem } from '@/types'

/**
 * Filtre un tableau de contenus selon le scope actif.
 * - Global → retourne tout
 * - Country → filtre par country code
 * - Si le filtrage par pays retourne 0 résultats, retourne le tableau complet
 *   (fallback global silencieux — expérience dégradée mais jamais vide)
 */
export function filterContentsByScope(
  contents: Content[],
  scope: AppScope,
): Content[] {
  if (scope.type === 'global') return contents

  const filtered = contents.filter((c) => c.country === scope.code)
  return filtered.length > 0 ? filtered : contents
}

/**
 * Filtre un tableau de trends selon le scope actif.
 * Même règle de fallback que filterContentsByScope.
 */
export function filterTrendsByScope(
  trends: Trend[],
  scope: AppScope,
): Trend[] {
  if (scope.type === 'global') return trends

  const filtered = trends.filter((t) => t.country === scope.code)
  return filtered.length > 0 ? filtered : trends
}

/**
 * Filtre les news selon le scope actif.
 * En mode pays : les news locales sont placées en tête de liste,
 * les news globales suivent (pas de filtrage strict).
 */
export function filterNewsByScope(
  news: NewsItem[],
  scope: AppScope,
): NewsItem[] {
  if (scope.type === 'global') {
    return [...news].sort((a, b) => b.importanceScore - a.importanceScore)
  }

  const local  = news.filter((n) => n.country === scope.code)
  const global = news.filter((n) => n.country !== scope.code)
    .sort((a, b) => b.importanceScore - a.importanceScore)

  return [...local, ...global]
}

/**
 * Retourne le label hero adapté au scope.
 * Utilisé dans la page NOW et le Daily Hook System.
 */
export function getScopeHeroKey(scope: AppScope): 'scope.hero.global' | 'scope.hero.country' {
  return scope.type === 'global' ? 'scope.hero.global' : 'scope.hero.country'
}

/**
 * Retourne le label hook adapté au scope.
 */
export function getScopeHookKey(scope: AppScope): 'scope.hook.global' | 'scope.hook.country' {
  return scope.type === 'global' ? 'scope.hook.global' : 'scope.hook.country'
}
