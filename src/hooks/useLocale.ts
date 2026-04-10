'use client'

import { useCallback, useState } from 'react'

export type Locale = 'fr' | 'en' | 'es' | 'de' | 'ar'

const LOCALE_STORAGE_KEY = 'algo_locale'
const DEFAULT_LOCALE: Locale = 'fr'

export interface LocaleOption {
  code: Locale
  name: string
  nativeName: string
  dir: 'ltr' | 'rtl'
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'fr', name: 'French', nativeName: 'Francais', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
]

export interface UseLocaleReturn {
  locale: Locale
  localeOption: LocaleOption
  availableLocales: LocaleOption[]
  setLocale: (locale: Locale) => void
  isChanging: boolean
}

export function useAppLocale(): UseLocaleReturn {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
      if (stored && LOCALE_OPTIONS.some(l => l.code === stored)) {
        return stored
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_LOCALE
  })
  const [isChanging, setIsChanging] = useState(false)

  const localeOption = LOCALE_OPTIONS.find(l => l.code === locale) || LOCALE_OPTIONS[0]

  const setLocale = useCallback((newLocale: Locale) => {
    if (!LOCALE_OPTIONS.some(l => l.code === newLocale) || newLocale === locale) return

    setIsChanging(true)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    } catch {
      // Ignore storage errors
    }
    setLocaleState(newLocale)
    setIsChanging(false)
  }, [locale])

  return {
    locale,
    localeOption,
    availableLocales: LOCALE_OPTIONS,
    setLocale,
    isChanging,
  }
}
