export const CONSENT_STORAGE_KEY = "algo_consent_v1";
export const CONSENT_VERSION = 1;

export type ConsentState = {
  version: number;
  /** Strictement nécessaire · toujours vrai */
  necessary: true;
  /** Mesure d’audience anonymisée (ex. Plausible) */
  analytics: boolean;
  /** Rappels / marketing (non implémenté par défaut) */
  marketing: boolean;
  decidedAt: string;
};

export const DEFAULT_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  necessary: true,
  analytics: false,
  marketing: false,
  decidedAt: "",
};

export function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<ConsentState>;
    if (o.version !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: Boolean(o.analytics),
      marketing: Boolean(o.marketing),
      decidedAt:
        typeof o.decidedAt === "string"
          ? o.decidedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function serializeConsent(
  c: Omit<ConsentState, "version" | "necessary"> & {
    analytics: boolean;
    marketing?: boolean;
  },
): ConsentState {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: c.analytics,
    marketing: c.marketing ?? false,
    decidedAt: c.decidedAt || new Date().toISOString(),
  };
}
