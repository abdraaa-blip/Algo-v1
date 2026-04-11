"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_STORAGE_KEY, parseConsent } from "@/lib/consent/storage";

/**
 * Charge Plausible **uniquement** si `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` est défini
 * et que l’utilisateur a accepté l’analytics dans le bandeau.
 */
export function AnalyticsConsentScripts() {
  const [allow, setAllow] = useState(false);
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  useEffect(() => {
    const sync = () => {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(CONSENT_STORAGE_KEY)
          : null;
      const c = parseConsent(raw);
      setAllow(Boolean(c?.analytics));
    };
    sync();
    window.addEventListener("algo:consent-updated", sync);
    return () => window.removeEventListener("algo:consent-updated", sync);
  }, []);

  if (!domain || !allow) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
