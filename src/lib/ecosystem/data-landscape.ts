/**
 * PHASE 1 · Audit « données » : état actuel du dépôt ALGO (Next.js).
 * À utiliser comme référence avant introduction d’une base unique (Postgres/Supabase tables métier).
 */

export type StorageClass =
  | "relational"
  | "memory_process"
  | "client_browser"
  | "external_api"
  | "derived";

export interface DataDomainRow {
  domain: string;
  examples: string[];
  storage: StorageClass;
  notes: string;
}

/** Vue normalisée cible (futures tables / vues) · pas encore toutes implémentées en SQL. */
export const TARGET_ENTITY_VIEWS = [
  "viral_score_snapshot",
  "trend_signal",
  "content_item",
  "user_interaction_event",
  "intelligence_decision_log",
  "ops_incident",
  "model_weight_version",
] as const;

export const DATA_LANDSCAPE: DataDomainRow[] = [
  {
    domain: "Tendances & radar",
    examples: [
      "live-trends",
      "realtime/trends",
      "v1/trends",
      "trend_signal (Supabase)",
    ],
    storage: "external_api",
    notes:
      "Agrégation Google Trends + caches TTL ; persistance optionnelle en base via migration ecosystem + ALGO_SNAPSHOT_PERSIST.",
  },
  {
    domain: "Scores & analyse virale",
    examples: ["/api/viral-analyzer", "canonical-viral-score"],
    storage: "derived",
    notes: "Calculés à la volée; pas de table persistante dédiée dans ce repo.",
  },
  {
    domain: "Contenus (news, vidéos, films)",
    examples: ["/api/live-news", "/api/youtube", "/api/tmdb"],
    storage: "external_api",
    notes:
      "Fournisseurs externes; normaliser via DTOs communs côté intégration.",
  },
  {
    domain: "Événements analytics & feedback",
    examples: [
      "/api/analytics/events",
      "/api/v1/ingest/events",
      "intelligence/feedback",
    ],
    storage: "memory_process",
    notes:
      "File mémoire process + option Supabase `analytics_events` si configuré.",
  },
  {
    domain: "Intelligence / ops / apprentissage",
    examples: [
      "/api/intelligence/*",
      "radar-history",
      "decision-log",
      "learning-history",
    ],
    storage: "memory_process",
    notes:
      "Mémoire process + table `intelligence_radar_point` (snapshots radar, service role) ; repli `analytics_events` ; cron `/api/cron/radar-snapshot`.",
  },
  {
    domain: "Personnalisation UI",
    examples: ["/api/context", "localStorage profil tendances"],
    storage: "client_browser",
    notes:
      "Préférences légères côté client; ne pas traiter comme source de vérité serveur.",
  },
  {
    domain: "Auth utilisateur",
    examples: ["Supabase auth"],
    storage: "relational",
    notes: "Variables NEXT_PUBLIC_SUPABASE_* ; schéma géré hors de ce fichier.",
  },
  {
    domain: "Méta & transparence",
    examples: ["/api/v1/manifest", "/api/meta/data-reliability"],
    storage: "derived",
    notes:
      "Inventaire et carte statique alignés sur le code · aucun secret, utile intégrations / audit.",
  },
];
