/**
 * Scores affichés dans Control Center : dérivés des sondes `/api/v1/health`
 * et `/api/health` — pas une « note magique » ni une mesure UX automatique.
 */

export type HealthProbeShape = {
  status?: "healthy" | "degraded" | "unhealthy" | string;
  responseTime?: string;
  checks?: {
    server?: boolean;
    database?: boolean;
    externalApis?: {
      newsapi?: boolean;
      youtube?: boolean;
      tmdb?: boolean;
    };
  };
};

export type ControlCenterScores = {
  global: number;
  stability: number;
  performance: number;
  methodologyFr: string;
};

function clamp100(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function parseResponseTimeMs(responseTime: string | undefined): number | null {
  if (!responseTime) return null;
  const n = parseInt(String(responseTime).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Avant sonde complète : plateforme v1 + présence des clés API écosystème. */
export function scoresFromV1Probe(
  v1Ok: boolean,
  platformKeysConfigured: boolean,
): ControlCenterScores {
  const stability = v1Ok ? (platformKeysConfigured ? 92 : 78) : 44;
  const performance = 72;
  const global = clamp100(stability * 0.55 + performance * 0.45);
  return {
    global,
    stability,
    performance,
    methodologyFr:
      "Estimation à partir de la sonde légère `/api/v1/health` uniquement. Lance « Sonde complète » pour affiner.",
  };
}

/** Après `GET /api/health` (sonde serveur + intégrations). */
export function scoresFromFullHealth(
  h: HealthProbeShape | null,
): ControlCenterScores {
  if (!h?.checks) {
    return {
      global: 0,
      stability: 0,
      performance: 0,
      methodologyFr:
        "Sonde complète indisponible ou réponse vide — vérifie le réseau et les variables d'environnement.",
    };
  }

  const { checks, status } = h;
  const critOk =
    checks.server !== false && checks.database !== false;
  let stability = 0;
  if (!critOk) stability = 32;
  else if (status === "healthy") stability = 100;
  else if (status === "degraded") stability = 80;
  else stability = 46;

  const ms = parseResponseTimeMs(h.responseTime);
  const performance = ms == null
    ? 68
    : ms < 160
      ? 97
      : ms < 500
        ? 86
        : ms < 1500
          ? 70
          : 54;

  const ext = checks.externalApis || {};
  const anyExt = Object.values(ext).some(Boolean);
  const integration = anyExt ? 94 : 55;

  const global = clamp100(
    stability * 0.46 + performance * 0.28 + integration * 0.26,
  );

  return {
    global,
    stability,
    performance,
    methodologyFr:
      "Calcul : stabilité serveur + base (poids 46 %), temps de réponse sonde (28 %), au moins une API externe joignable (26 %). L'UX n'est pas notée automatiquement.",
  };
}
