// =============================================================================
// ALGO V1 — Utilitaires de formatage localisé
// Utilise uniquement les APIs natives Intl — zéro dépendance externe.
// =============================================================================

/**
 * Formate un nombre de vues selon la locale active.
 * Exemples : 1 200 000 → "1,2M" (fr) | "1.2M" (en)
 */
export function formatViews(count: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(count)
}

/**
 * Formate un temps relatif depuis une date ISO 8601.
 * Exemples : "il y a 17 min" (fr) | "17 minutes ago" (en)
 */
export function formatRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffMinutes < 1)   return rtf.format(0, 'minute')
  if (diffMinutes < 60)  return rtf.format(-diffMinutes, 'minute')
  if (diffHours < 24)    return rtf.format(-diffHours, 'hour')
  return rtf.format(-diffDays, 'day')
}

/**
 * Formate un taux de croissance en pourcentage signé.
 * Exemples : 182 → "+182 %" | -15 → "-15 %"
 */
export function formatGrowthRate(rate: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
    signDisplay: 'always',
  }).format(rate / 100)
}

/**
 * Formate un score entier (Viral Score, Importance Score…).
 * Toujours tabular-nums — la mise en forme typographique est gérée côté CSS.
 */
export function formatScore(score: number): string {
  return Math.round(Math.max(0, Math.min(100, score))).toString()
}

/**
 * Formate un nombre de personnes (watchersCount) selon la locale.
 * Exemple : 2847 → "2 847" (fr) | "2,847" (en)
 */
export function formatCount(count: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(count)
}

/**
 * Détecte la locale du navigateur et retourne la première supportée.
 * Fallback sur defaultLocale si aucune correspondance.
 */
export function detectBrowserLocale(
  supportedLocales: readonly string[],
  fallback: string = 'fr',
): string {
  if (typeof navigator === 'undefined') return fallback

  const languages = navigator.languages ?? [navigator.language]

  for (const lang of languages) {
    const code = lang.split('-')[0]
    if (supportedLocales.includes(code)) return code
  }

  return fallback
}
