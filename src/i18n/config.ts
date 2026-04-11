// =============================================================================
// ALGO V1 · Configuration i18n
// next-intl est la seule librairie i18n autorisée.
// Aucune autre librairie sans validation explicite.
// =============================================================================

import type { Locale } from '@/types'

export const locales: Locale[] = ['fr', 'en', 'es', 'de', 'ar']

export const defaultLocale: Locale = 'fr'

// Locales nécessitant dir="rtl" sur <html>
export const rtlLocales: Locale[] = ['ar']

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale)
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}
