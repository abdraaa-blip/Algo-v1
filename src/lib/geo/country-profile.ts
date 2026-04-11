import type { Locale, AppScope } from "@/types";

interface CountryProfile {
  locale: Locale;
  dateLocale: string;
  timeZone: string;
}

const DEFAULT_PROFILE: CountryProfile = {
  locale: "fr",
  dateLocale: "fr-FR",
  timeZone: "UTC",
};

const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  FR: { locale: "fr", dateLocale: "fr-FR", timeZone: "Europe/Paris" },
  BE: { locale: "fr", dateLocale: "fr-BE", timeZone: "Europe/Brussels" },
  MA: { locale: "ar", dateLocale: "ar-MA", timeZone: "Africa/Casablanca" },
  SN: { locale: "fr", dateLocale: "fr-SN", timeZone: "Africa/Dakar" },
  CM: { locale: "fr", dateLocale: "fr-CM", timeZone: "Africa/Douala" },
  US: { locale: "en", dateLocale: "en-US", timeZone: "America/New_York" },
  CA: { locale: "en", dateLocale: "en-CA", timeZone: "America/Toronto" },
  GB: { locale: "en", dateLocale: "en-GB", timeZone: "Europe/London" },
  BR: { locale: "es", dateLocale: "pt-BR", timeZone: "America/Sao_Paulo" },
  NG: { locale: "en", dateLocale: "en-NG", timeZone: "Africa/Lagos" },
  DE: { locale: "de", dateLocale: "de-DE", timeZone: "Europe/Berlin" },
  ES: { locale: "es", dateLocale: "es-ES", timeZone: "Europe/Madrid" },
  JP: { locale: "en", dateLocale: "ja-JP", timeZone: "Asia/Tokyo" },
  KR: { locale: "en", dateLocale: "ko-KR", timeZone: "Asia/Seoul" },
  CI: { locale: "fr", dateLocale: "fr-CI", timeZone: "Africa/Abidjan" },
};

const REGION_DEFAULT_COUNTRY: Record<string, string> = {
  EUROPE: "FR",
  AFRICA: "NG",
  AMERICAS: "US",
  ASIA: "JP",
};

export function getCountryProfile(countryCode?: string | null): CountryProfile {
  if (!countryCode) return DEFAULT_PROFILE;
  return COUNTRY_PROFILES[countryCode.toUpperCase()] ?? DEFAULT_PROFILE;
}

export function getLocaleForCountry(countryCode?: string | null): Locale {
  return getCountryProfile(countryCode).locale;
}

export function getTimeZoneForCountry(countryCode?: string | null): string {
  return getCountryProfile(countryCode).timeZone;
}

export function getDateLocaleForCountry(countryCode?: string | null): string {
  return getCountryProfile(countryCode).dateLocale;
}

export function getScopeCountryCode(scope: AppScope): string | null {
  if (scope.type === "country") return scope.code;
  if (scope.type === "region")
    return REGION_DEFAULT_COUNTRY[scope.code] ?? null;
  return null;
}
