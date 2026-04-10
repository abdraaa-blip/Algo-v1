// =============================================================================
// ALGO V1 — Donnees pays et regions pour le Country Scope System
// Les noms sont localises via le type Country.name[Locale].
// Cette liste pilote le ScopeSelector et les donnees mock.
// =============================================================================

import type { Country, Locale } from '@/types'

// Regions disponibles pour le filtrage de contenu
export interface Region {
  code: string
  name: { [key: string]: string }
  countries: string[] // List of country codes in this region
  flag: string
}

export const availableRegions: Region[] = [
  {
    code: 'EUROPE',
    name: { fr: 'Europe', en: 'Europe', es: 'Europa', de: 'Europa', ar: 'أوروبا' },
    countries: ['FR', 'BE', 'DE', 'ES', 'GB'],
    flag: '🇪🇺',
  },
  {
    code: 'AFRICA',
    name: { fr: 'Afrique', en: 'Africa', es: 'Africa', de: 'Afrika', ar: 'أفريقيا' },
    countries: ['MA', 'SN', 'CM', 'NG', 'CI'],
    flag: '🌍',
  },
  {
    code: 'AMERICAS',
    name: { fr: 'Ameriques', en: 'Americas', es: 'Americas', de: 'Amerika', ar: 'الأمريكتان' },
    countries: ['US', 'CA', 'BR'],
    flag: '🌎',
  },
  {
    code: 'ASIA',
    name: { fr: 'Asie', en: 'Asia', es: 'Asia', de: 'Asien', ar: 'آسيا' },
    countries: ['JP', 'KR'],
    flag: '🌏',
  },
]

export const availableCountries: Country[] = [
  {
    code: 'FR',
    name: { fr: 'France',       en: 'France',      es: 'Francia',      de: 'Frankreich',   ar: 'فرنسا'       },
    flag: '🇫🇷',
  },
  {
    code: 'US',
    name: { fr: 'États-Unis',   en: 'USA',          es: 'Estados Unidos', de: 'USA',         ar: 'الولايات المتحدة' },
    flag: '🇺🇸',
  },
  {
    code: 'MA',
    name: { fr: 'Maroc',        en: 'Morocco',      es: 'Marruecos',    de: 'Marokko',      ar: 'المغرب'      },
    flag: '🇲🇦',
  },
  {
    code: 'SN',
    name: { fr: 'Sénégal',      en: 'Senegal',      es: 'Senegal',      de: 'Senegal',      ar: 'السنغال'     },
    flag: '🇸🇳',
  },
  {
    code: 'CM',
    name: { fr: 'Cameroun',     en: 'Cameroon',     es: 'Camerún',      de: 'Kamerun',      ar: 'الكاميرون'   },
    flag: '🇨🇲',
  },
  {
    code: 'BE',
    name: { fr: 'Belgique',     en: 'Belgium',      es: 'Bélgica',      de: 'Belgien',      ar: 'بلجيكا'      },
    flag: '🇧🇪',
  },
  {
    code: 'CA',
    name: { fr: 'Canada',       en: 'Canada',       es: 'Canadá',       de: 'Kanada',       ar: 'كندا'        },
    flag: '🇨🇦',
  },
  {
    code: 'GB',
    name: { fr: 'Royaume-Uni',  en: 'UK',           es: 'Reino Unido',  de: 'Großbritannien', ar: 'المملكة المتحدة' },
    flag: '🇬🇧',
  },
  {
    code: 'BR',
    name: { fr: 'Brésil',       en: 'Brazil',       es: 'Brasil',       de: 'Brasilien',    ar: 'البرازيل'    },
    flag: '🇧🇷',
  },
  {
    code: 'NG',
    name: { fr: 'Nigeria',      en: 'Nigeria',      es: 'Nigeria',      de: 'Nigeria',      ar: 'نيجيريا'     },
    flag: '🇳🇬',
  },
  {
    code: 'DE',
    name: { fr: 'Allemagne',    en: 'Germany',      es: 'Alemania',     de: 'Deutschland',  ar: 'ألمانيا'     },
    flag: '🇩🇪',
  },
  {
    code: 'ES',
    name: { fr: 'Espagne',      en: 'Spain',        es: 'España',       de: 'Spanien',      ar: 'إسبانيا'     },
    flag: '🇪🇸',
  },
  {
    code: 'JP',
    name: { fr: 'Japon',        en: 'Japan',        es: 'Japón',        de: 'Japan',        ar: 'اليابان'     },
    flag: '🇯🇵',
  },
  {
    code: 'KR',
    name: { fr: 'Corée du Sud', en: 'South Korea',  es: 'Corea del Sur', de: 'Südkorea',   ar: 'كوريا الجنوبية' },
    flag: '🇰🇷',
  },
  {
    code: 'CI',
    name: { fr: "Côte d'Ivoire", en: 'Ivory Coast', es: 'Costa de Marfil', de: 'Elfenbeinküste', ar: 'ساحل العاج' },
    flag: '🇨🇮',
  },
]

/**
 * Retourne un pays par son code ISO.
 */
export function getCountryByCode(code: string): Country | undefined {
  return availableCountries.find((c) => c.code === code)
}

/**
 * Retourne le nom localisé d'un pays.
 * Fallback sur l'anglais, puis sur le code si aucune traduction disponible.
 */
export function getCountryName(country: Country, locale: string): string {
  return country.name[locale as Locale] ?? country.name['en'] ?? country.code
}

/**
 * Retourne la liste des codes pays disponibles dans les donnees.
 */
export function getAvailableCountryCodes(): string[] {
  return availableCountries.map((c) => c.code)
}

/**
 * Retourne une region par son code.
 */
export function getRegionByCode(code: string): Region | undefined {
  return availableRegions.find((r) => r.code === code)
}

/**
 * Retourne le nom localise d'une region.
 */
export function getRegionName(region: Region, locale: string): string {
  return region.name[locale as Locale] ?? region.name['en'] ?? region.code
}

/**
 * Retourne la region d'un pays par son code.
 */
export function getRegionForCountry(countryCode: string): Region | undefined {
  return availableRegions.find((r) => r.countries.includes(countryCode))
}

/**
 * Retourne tous les pays d'une region.
 */
export function getCountriesInRegion(regionCode: string): Country[] {
  const region = getRegionByCode(regionCode)
  if (!region) return []
  return availableCountries.filter((c) => region.countries.includes(c.code))
}

/**
 * Extrait le code pays a utiliser pour les APIs en fonction du scope.
 * Pour les regions, retourne le pays principal de la region.
 * Pour global, retourne 'US' comme defaut.
 */
export function getCountryCodeFromScope(scope: { type: string; code?: string }): string {
  if (scope.type === 'country' && scope.code) {
    return scope.code
  }
  if (scope.type === 'region' && scope.code) {
    // Map regions to representative countries
    const regionToCountry: Record<string, string> = {
      'EUROPE': 'FR',
      'AFRICA': 'NG',
      'AMERICAS': 'US',
      'ASIA': 'JP',
    }
    return regionToCountry[scope.code] || 'US'
  }
  return 'US' // Global default
}

/**
 * Retourne la liste des codes pays pour filtrer le contenu selon le scope.
 * Pour global: tous les pays
 * Pour region: tous les pays de la region
 * Pour country: juste ce pays
 */
export function getCountryCodesForScope(scope: { type: string; code?: string }): string[] | null {
  if (scope.type === 'global') {
    return null // No filtering, show all
  }
  if (scope.type === 'region' && scope.code) {
    const region = getRegionByCode(scope.code)
    return region?.countries || null
  }
  if (scope.type === 'country' && scope.code) {
    return [scope.code]
  }
  return null
}
