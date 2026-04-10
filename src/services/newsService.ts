// =============================================================================
// ALGO V1 — newsService
// Fonctions pures. Aucun effet de bord. Aucune dépendance UI.
// =============================================================================

import { mockNews } from '@/data/mock-news'
import { filterNewsByScope } from '@/services/scopeService'
import type { NewsItem, AppScope } from '@/types'

/**
 * Retourne les news selon le scope.
 * En mode pays : news locales en tête, globales ensuite.
 */
export function getNews(scope: AppScope, limit?: number): NewsItem[] {
  const results = filterNewsByScope(mockNews, scope)
  return limit ? results.slice(0, limit) : results
}

/**
 * Retourne les news les plus urgentes (score composé importance × vitesse).
 */
export function getBreakingNews(limit = 3): NewsItem[] {
  return [...mockNews]
    .sort((a, b) =>
      b.importanceScore * b.speedScore - a.importanceScore * a.speedScore
    )
    .slice(0, limit)
}

/**
 * Retourne une news par son ID.
 */
export function getNewsById(id: string): NewsItem | undefined {
  return mockNews.find((n) => n.id === id)
}

/**
 * Recherche textuelle dans les news.
 */
export function searchNews(query: string): NewsItem[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  return mockNews.filter((n) =>
    n.title.toLowerCase().includes(q)   ||
    n.summary.toLowerCase().includes(q) ||
    n.tags.some((t) => t.toLowerCase().includes(q))
  )
}
