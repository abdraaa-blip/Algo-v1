// =============================================================================
// ALGO V1 — watchlistService
// Persistance localStorage en V1.
// En V2 : remplacer par des appels Supabase — la signature des fonctions ne change pas.
// =============================================================================

import { mockTrends } from '@/data/mock-trends'
import type { Trend } from '@/types'

const STORAGE_KEY = 'algo_watchlist'

// ─── Lecture ──────────────────────────────────────────────────────────────────

function readIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage indisponible (mode privé, quota atteint) — on ignore silencieusement
  }
}

// ─── API publique ─────────────────────────────────────────────────────────────

export function getWatchlistIds(): string[] {
  return readIds()
}

export function addToWatchlist(trendId: string): string[] {
  const current = readIds()
  if (current.includes(trendId)) return current
  const updated = [...current, trendId]
  writeIds(updated)
  return updated
}

export function removeFromWatchlist(trendId: string): string[] {
  const updated = readIds().filter((id) => id !== trendId)
  writeIds(updated)
  return updated
}

export function isInWatchlist(trendId: string): boolean {
  return readIds().includes(trendId)
}

export function clearWatchlist(): void {
  writeIds([])
}

/**
 * Retourne les objets Trend correspondant aux IDs en watchlist.
 * En V2 : remplacer par un appel Supabase avec JOIN sur les données temps réel.
 */
export function getWatchlistTrends(): Trend[] {
  const ids = readIds()
  return mockTrends.filter((t) => ids.includes(t.id))
}
