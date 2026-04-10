// =============================================================================
// ALGO V1 — geoService
// Service de geolocalisation cote serveur (IP-based).
// Utilise dans les Server Components et API Routes.
// =============================================================================

import { headers } from 'next/headers'
import { COUNTRIES } from '@/data/countries'
import type { AppScope } from '@/types'
import { getLocaleForCountry } from '@/lib/geo/country-profile'

export interface GeoInfo {
  countryCode: string | null
  countryName: string | null
  city: string | null
  region: string | null
  timezone: string | null
}

/**
 * Detecte le pays de l'utilisateur via les headers Vercel.
 * Fonctionne automatiquement sur Vercel Edge.
 * Fallback vers null si non disponible.
 */
export async function detectCountryFromHeaders(): Promise<GeoInfo> {
  const headersList = await headers()
  
  // Vercel injecte automatiquement ces headers sur Edge
  const countryCode = headersList.get('x-vercel-ip-country')?.toUpperCase() || null
  const city = headersList.get('x-vercel-ip-city') || null
  const region = headersList.get('x-vercel-ip-country-region') || null
  const timezone = headersList.get('x-vercel-ip-timezone') || null

  // Trouve le nom du pays dans notre liste
  const country = countryCode ? COUNTRIES.find(c => c.code === countryCode) : null
  const countryName = country?.name || null

  return {
    countryCode,
    countryName,
    city,
    region,
    timezone,
  }
}

/**
 * Retourne un AppScope suggere base sur la geolocalisation.
 * Retourne global si le pays n'est pas dans notre liste supportee.
 */
export async function getSuggestedScope(): Promise<AppScope> {
  const geo = await detectCountryFromHeaders()
  
  if (geo.countryCode && geo.countryName) {
    // Verifie que le pays est supporte
    const isSupported = COUNTRIES.some(c => c.code === geo.countryCode)
    if (isSupported) {
      return {
        type: 'country',
        code: geo.countryCode,
        name: geo.countryName,
      }
    }
  }

  return { type: 'global' }
}

/**
 * Determine la locale preferee basee sur le pays detecte.
 */
export async function getPreferredLocale(): Promise<string> {
  const geo = await detectCountryFromHeaders()
  return getLocaleForCountry(geo.countryCode)
}
