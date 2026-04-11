/**
 * Canonical site URL for metadata, sitemap, robots, and JSON-LD.
 */

export const SITE_NAME = 'ALGO'

/** Positionnement public · ADN produit (cohérent avec pages transparence / légal). */
export const SITE_TAGLINE = "L'algorithme des algorithmes"

/** Philosophie d’expérience : peu de bruit UI, signal utile pour tous les profils. */
export const SITE_SILENT_SLOGAN = "L'appli silencieuse qui parle à tout le monde."

/** Ancre transparence : calibrage ALGO AI & familles de rôle (unique source pour les liens UI). */
export const SITE_TRANSPARENCY_AI_CALIBRATION_HREF = '/transparency#algo-ai-directive' as const

/** Default social preview when no page-specific image exists (manifest icon). */
export const DEFAULT_OG_IMAGE_PATH = '/icons/icon-512.png'

export function getSiteBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`
  return 'http://localhost:3000'
}

export function absoluteUrl(path: string): string {
  const base = getSiteBaseUrl()
  if (!path || path === '/') return base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
