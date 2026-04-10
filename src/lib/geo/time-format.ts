import type { AppScope } from '@/types'
import { getDateLocaleForCountry, getScopeCountryCode, getTimeZoneForCountry } from '@/lib/geo/country-profile'

function getScopeIntlConfig(scope: AppScope): { locale: string; timeZone: string } {
  const countryCode = getScopeCountryCode(scope)
  return {
    locale: getDateLocaleForCountry(countryCode),
    timeZone: getTimeZoneForCountry(countryCode),
  }
}

export function formatRelativeScopeTime(input: string | number | Date, scope: AppScope): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return 'pending'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  const { locale } = getScopeIntlConfig(scope)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffMinutes < 1) return rtf.format(0, 'minute')
  if (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute')
  if (diffHours < 24) return rtf.format(-diffHours, 'hour')
  if (diffDays < 7) return rtf.format(-diffDays, 'day')

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatScopeDateTime(input: string | number | Date, scope: AppScope): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''

  const { locale, timeZone } = getScopeIntlConfig(scope)
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date)
}
