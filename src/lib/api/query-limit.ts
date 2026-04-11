/**
 * Paramètre GET `limit` optionnel pour tronquer des listes (cron ingest, widgets).
 * Absence de paramètre → pas de troncature (comportement historique des pages UI).
 */
export function parseOptionalListLimit(raw: string | null): number | undefined {
  if (raw === null || raw === '') return undefined
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return undefined
  return Math.min(100, Math.max(1, n))
}
