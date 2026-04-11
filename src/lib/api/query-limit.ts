/**
 * Paramètre GET `limit` optionnel pour tronquer des listes (cron ingest, widgets).
 * Absence de paramètre → pas de troncature (comportement historique des pages UI).
 */
export function parseOptionalListLimit(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(100, Math.max(1, n));
}

/**
 * Limite toujours numérique (pages Reddit/GitHub/Twitch/Spotify, cron ingest).
 * Valeur invalide ou absente → `defaultVal` ; bornée à **[1, maxVal]**.
 */
export function parseDefaultedListLimit(
  raw: string | null,
  defaultVal: number,
  maxVal: number,
): number {
  if (raw === null || raw === "") return defaultVal;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return defaultVal;
  return Math.min(maxVal, Math.max(1, n));
}

/**
 * Offset / page « 0-based » : défaut souvent 0, plafond pour éviter abus mémoire.
 */
export function parseDefaultedOffset(
  raw: string | null,
  defaultVal: number,
  maxVal: number,
): number {
  if (raw === null || raw === "") return defaultVal;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return defaultVal;
  return Math.min(maxVal, Math.max(0, n));
}
