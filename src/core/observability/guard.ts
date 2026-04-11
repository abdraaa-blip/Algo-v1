/**
 * Accès dashboard / API observabilité (désactivé en prod par défaut).
 */

export function isObservabilityDashboardEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') return true
  return process.env.ALGO_OBSERVABILITY_DASHBOARD === '1'
}
