"use client";

import { useState, useCallback } from "react";
import fr from "@/i18n/locales/fr.json";
import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";
import de from "@/i18n/locales/de.json";
import ar from "@/i18n/locales/ar.json";
import { detectBrowserLocale } from "@/i18n/utils";
import type { Locale } from "@/types";

interface TranslationMap {
  [key: string]: string | TranslationMap;
}

const translations: Record<Locale, TranslationMap> = {
  fr: fr as TranslationMap,
  en: en as TranslationMap,
  es: es as TranslationMap,
  de: de as TranslationMap,
  ar: ar as TranslationMap,
};

// Get nested value from object using dot notation
function getNestedValue(obj: TranslationMap, path: string): string {
  const keys = path.split(".");
  let current: TranslationMap | string = obj;

  for (const key of keys) {
    if (typeof current === "string") return path;
    if (current[key] === undefined) return path;
    current = current[key] as TranslationMap | string;
  }

  return typeof current === "string" ? current : path;
}

function detectLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  try {
    const stored = localStorage.getItem("algo_locale");
    if (stored && ["fr", "en", "es", "de", "ar"].includes(stored)) {
      return stored as Locale;
    }
  } catch {
    // Ignore storage errors
  }
  return detectBrowserLocale(["fr", "en", "es", "de", "ar"], "fr") as Locale;
}

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>(() => detectLocale());
  const [isLoaded] = useState(true);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      // Fallback chain: active locale -> french fallback -> key
      let text = getNestedValue(translations[locale], key);
      if (text === key && locale !== "fr") {
        text = getNestedValue(translations.fr, key);
      }

      // Replace params like {name} with values
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
        });
      }

      return text;
    },
    [locale],
  );

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("algo_locale", newLocale);
    }
  }, []);

  return {
    t,
    locale,
    changeLocale,
    isLoaded,
  };
}
