'use client'

// =============================================================================
// ALGO V1 — useGeolocation
// Hook de geolocalisation avec consentement utilisateur.
// Regles :
//   - Ne jamais declencher sans action utilisateur explicite.
//   - Fallback vers IP-based geolocation si refus ou erreur.
//   - Resultat utilise pour suggerer un scope pays initial.
// =============================================================================

import { useState, useCallback, useEffect } from 'react'
import type { AppScope } from '@/types'
import { availableCountries, getCountryName } from '@/data/countries'
import { getLocaleForCountry } from '@/lib/geo/country-profile'

export type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

export interface GeoResult {
  countryCode: string | null
  countryName: string | null
  source: 'browser' | 'ip' | null
}

export interface UseGeolocationReturn {
  status: GeoStatus
  result: GeoResult
  requestLocation: () => Promise<void>
  suggestedScope: AppScope | null
}

// Mapping coordonnees vers pays (simplifie — utilise IP fallback en prod)
async function reverseGeocode(lat: number, lon: number): Promise<{ code: string; name: string } | null> {
  try {
    // Utilise l'API gratuite de BigDataCloud pour le reverse geocoding
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`
    )
    if (!res.ok) return null
    const data = await res.json()
    const code = data.countryCode?.toUpperCase()
    if (!code) return null
    // Verifie que le pays est dans notre liste supportee
    const country = availableCountries.find(c => c.code === code)
    return country ? { code: country.code, name: getCountryName(country, 'fr') } : null
  } catch {
    return null
  }
}

// Fallback: detection par IP
async function detectByIP(): Promise<{ code: string; name: string } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (!res.ok) return null
    const data = await res.json()
    const code = data.country_code?.toUpperCase()
    if (!code) return null
    const country = availableCountries.find(c => c.code === code)
    return country ? { code: country.code, name: getCountryName(country, 'fr') } : null
  } catch {
    return null
  }
}

export function useGeolocation(): UseGeolocationReturn {
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [result, setResult] = useState<GeoResult>({
    countryCode: null,
    countryName: null,
    source: null,
  })

  const requestLocation = useCallback(async () => {
    // Verifie si la geolocalisation est supportee
    if (!('geolocation' in navigator)) {
      setStatus('error')
      // Fallback IP
      const ipResult = await detectByIP()
      if (ipResult) {
        setResult({ countryCode: ipResult.code, countryName: ipResult.name, source: 'ip' })
        setStatus('granted')
      }
      return
    }

    setStatus('requesting')

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 600000, // Cache 10 minutes
        })
      })

      const { latitude, longitude } = position.coords
      const geo = await reverseGeocode(latitude, longitude)

      if (geo) {
        setResult({ countryCode: geo.code, countryName: geo.name, source: 'browser' })
        setStatus('granted')
      } else {
        // Fallback IP si reverse geocoding echoue
        const ipResult = await detectByIP()
        if (ipResult) {
          setResult({ countryCode: ipResult.code, countryName: ipResult.name, source: 'ip' })
          setStatus('granted')
        } else {
          setStatus('error')
        }
      }
    } catch (err) {
      const geoError = err as GeolocationPositionError
      
      if (geoError.code === geoError.PERMISSION_DENIED) {
        // L'utilisateur a explicitement refuse - on ne fait PAS de fallback IP
        // car c'est un choix conscient de l'utilisateur
        setStatus('denied')
        return
      }
      
      // Pour les autres erreurs (timeout, position unavailable, etc.)
      // on essaie le fallback IP silencieusement
      const ipResult = await detectByIP()
      if (ipResult) {
        setResult({ countryCode: ipResult.code, countryName: ipResult.name, source: 'ip' })
        setStatus('granted') // On a reussi via IP, donc granted
      } else {
        setStatus('error')
      }
    }
  }, [])

  // Scope suggere base sur le resultat
  const suggestedScope: AppScope | null = result.countryCode && result.countryName
    ? { type: 'country', code: result.countryCode, name: result.countryName }
    : null

  const suggestedLocale = result.countryCode ? getLocaleForCountry(result.countryCode) : null

  useEffect(() => {
    if (!suggestedLocale || typeof window === 'undefined') return
    if (localStorage.getItem('algo_locale')) return
    localStorage.setItem('algo_locale', suggestedLocale)
  }, [suggestedLocale])

  return {
    status,
    result,
    requestLocation,
    suggestedScope,
  }
}
