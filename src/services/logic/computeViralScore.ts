// =============================================================================
// ALGO V1 — computeViralScore (Logic Layer)
// Fonctions pures. Aucun appel API. Aucune dépendance UI.
// En V1 : retourne le score stocké dans les données mock.
// En V2 : brancher sur les vraies métriques d'engagement temps réel.
// =============================================================================

import type { ViralScoreInput, ScoreGrade } from '@/types'
import { tokens } from '@/design-system/tokens'

/**
 * Calcule un Viral Score normalisé (0–100) à partir des métriques disponibles.
 *
 * Formule V1 (simplifiée — sera remplacée en V2) :
 *   - growthRate  → 40 pts max (taux de croissance)
 *   - views       → 20 pts max (portée absolue)
 *   - watchers    → 15 pts max (signal d'intérêt actif)
 *   - isExploding → 15 pts bonus binaire
 *   - sources     → 10 pts max (signal cross-platform)
 */
export function computeViralScore(input: ViralScoreInput): number {
  const growthWeight   = Math.min(Math.max(input.growthRate, 0) / 10, 40)
  const viewsWeight    = input.views != null
    ? Math.min(input.views / 500_000, 20)
    : 0
  const watchersWeight = Math.min(input.watchersCount / 1_000, 15)
  const explodingBonus = input.isExploding ? 15 : 0
  const platformBonus  = Math.min(input.sourceDistributionCount * 5, 10)

  const raw = growthWeight + viewsWeight + watchersWeight + explodingBonus + platformBonus
  return Math.min(Math.round(raw), 100)
}

/**
 * Retourne un grade qualitatif à partir d'un score.
 */
export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 90) return 'elite'
  if (score >= 70) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

/**
 * Retourne un tier (S/A/B/C/D) à partir d'un score.
 */
export type ScoreTier = 'S' | 'A' | 'B' | 'C' | 'D'

export function getScoreTier(score: number): ScoreTier {
  const clamped = clampScore(score)
  if (clamped >= 90) return 'S'
  if (clamped >= 75) return 'A'
  if (clamped >= 60) return 'B'
  if (clamped >= 40) return 'C'
  return 'D'
}

/**
 * Retourne la couleur associée au score selon les tokens du design system.
 * Aucune valeur arbitraire — toujours via tokens.
 */
export function getScoreColor(score: number): string {
  if (score >= 85) return tokens.colors.accent.violet
  if (score >= 65) return tokens.colors.accent.greenSignal
  if (score >= 45) return tokens.colors.accent.blueNeon
  return tokens.colors.text.muted
}

/**
 * Clamp un score entre 0 et 100.
 * Retourne 0 si la valeur est NaN, undefined, ou non-numérique.
 */
export function clampScore(score: number | undefined | null): number {
  if (score == null || typeof score !== 'number' || Number.isNaN(score)) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Calcule le stroke-dashoffset SVG pour un ViralScoreRing.
 * Exposé ici pour garder la logique hors composant UI.
 */
export function computeRingOffset(score: number | undefined | null, radius: number): number {
  const circumference = 2 * Math.PI * radius
  const clamped = clampScore(score)
  // Ensure we never return NaN
  if (Number.isNaN(circumference) || Number.isNaN(clamped)) {
    return circumference // Full offset = empty ring
  }
  return circumference - (clamped / 100) * circumference
}
