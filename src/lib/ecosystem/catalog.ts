import {
  ALGO_ECOSYSTEM_API_VERSION,
  ALGO_ECOSYSTEM_SCHEMA_DATE,
} from "@/lib/ecosystem/constants";

export type CatalogAuth =
  | "none"
  | "platform_key"
  | "ip_rate_limit"
  | "intelligence_token"
  | "cron_secret"
  | "mixed";

export interface CatalogEndpoint {
  /** Identifiant stable pour générateurs de clients */
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Chemin relatif à l’origine du déploiement */
  path: string;
  auth: CatalogAuth;
  summary: string;
  /** Indicatif ; les routes appliquent leurs propres limites */
  rateLimitPerMinute?: number;
  category: "read" | "write" | "meta" | "ai";
}

export const ECOSYSTEM_ENDPOINT_CATALOG: CatalogEndpoint[] = [
  {
    id: "ecosystem.manifest",
    method: "GET",
    path: "/api/v1/manifest",
    auth: "none",
    summary:
      "Catalogue machine-readable des capacités ALGO + liens documentation.",
    category: "meta",
  },
  {
    id: "ecosystem.health",
    method: "GET",
    path: "/api/v1/health",
    auth: "none",
    summary:
      "Santé légère pour orchestrateurs (clés plateforme configurées, version).",
    category: "meta",
  },
  {
    id: "ecosystem.trends",
    method: "GET",
    path: "/api/v1/trends",
    auth: "platform_key",
    rateLimitPerMinute: 120,
    summary:
      "Tendances normalisées (JSON ou CSV). Param: country=FR optionnel.",
    category: "read",
  },
  {
    id: "ecosystem.ingest.events",
    method: "POST",
    path: "/api/v1/ingest/events",
    auth: "platform_key",
    rateLimitPerMinute: 60,
    summary:
      "Ingestion d’événements depuis une app tierce (même contrat que /api/analytics/events).",
    category: "write",
  },
  {
    id: "cron.snapshot_trends",
    method: "GET",
    path: "/api/cron/snapshot-trends",
    auth: "cron_secret",
    summary:
      "Cron Vercel : persiste trend_signal + model_weight_version. Auth Bearer CRON_SECRET. Régions via ALGO_SNAPSHOT_CRON_REGIONS.",
    category: "write",
  },
  {
    id: "ecosystem.snapshot",
    method: "GET",
    path: "/api/v1/snapshot",
    auth: "platform_key",
    rateLimitPerMinute: 60,
    summary:
      "Export incrémental Supabase (trend_signal, viral_score_snapshot, model_weight_version). Query: since, types, limit. Requiert SUPABASE_SERVICE_ROLE_KEY.",
    category: "read",
  },
  {
    id: "public.live_trends",
    method: "GET",
    path: "/api/live-trends",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 60,
    summary: "Tendances live (sans clé plateforme).",
    category: "read",
  },
  {
    id: "public.health",
    method: "GET",
    path: "/api/health",
    auth: "none",
    summary: "Healthcheck détaillé (mémoire, circuits, APIs externes).",
    category: "meta",
  },
  {
    id: "meta.data_reliability",
    method: "GET",
    path: "/api/meta/data-reliability",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 120,
    summary:
      "Carte fiabilité des sources (fallbacks, limites, baseline) · transparence data.",
    category: "meta",
  },
  {
    id: "ai.ask",
    method: "POST",
    path: "/api/ai/ask",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 30,
    summary:
      "ALGO AI · Q&R via processAlgoAiRequest (route + indices + centralAsk + enveloppe) ; answer, standard, quality, systemRoute, systemConfidence (indicateur interne), structured?, contextMeta, transparencyLines.",
    category: "ai",
  },
  {
    id: "observability.logs.get",
    method: "GET",
    path: "/api/observability/logs",
    auth: "none",
    summary:
      "Snapshot tampon observabilité (logs, métriques dérivées, anomalies) · dev ou ALGO_OBSERVABILITY_DASHBOARD=1 uniquement.",
    category: "meta",
  },
  {
    id: "billing.status",
    method: "GET",
    path: "/api/billing/status",
    auth: "none",
    summary:
      "Statut facturation minimal : plan effectif (free par défaut), checkout Stripe disponible si STRIPE_SECRET_KEY + STRIPE_PRICE_PRO_MONTHLY.",
    category: "meta",
  },
  {
    id: "billing.checkout",
    method: "POST",
    path: "/api/billing/checkout",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 10,
    summary:
      "Stripe Checkout · abonnement PRO si variables serveur OK. Webhook + profil requis pour appliquer le plan côté ALGO.",
    category: "write",
  },
  {
    id: "billing.webhook",
    method: "POST",
    path: "/api/billing/webhook",
    auth: "none",
    summary:
      "Stripe webhooks (signature STRIPE_WEBHOOK_SECRET) : checkout.session.completed, customer.subscription.updated/deleted → colonnes billing sur profiles (service role).",
    category: "write",
  },
  {
    id: "billing.portal",
    method: "POST",
    path: "/api/billing/portal",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 10,
    summary:
      "Stripe Billing Portal · session utilisateur + customer id sur profiles. Retour /settings.",
    category: "write",
  },
  {
    id: "algo.bridge",
    method: "POST",
    path: "/api/algo",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 20,
    summary:
      "Pont léger vers processAlgoAiRequest (input + context optionnel) · dashboard / outils.",
    category: "ai",
  },
  {
    id: "observability.logs.post",
    method: "POST",
    path: "/api/observability/logs",
    auth: "none",
    summary: "Ingestion log client (couche UI) · même garde d’accès que GET.",
    category: "meta",
  },
  {
    id: "intelligence.feedback",
    method: "POST",
    path: "/api/intelligence/feedback",
    auth: "ip_rate_limit",
    summary: "Feedback intelligence (selon implémentation route).",
    category: "write",
  },
  {
    id: "intelligence.radar_history",
    method: "GET",
    path: "/api/intelligence/radar-history",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 60,
    summary:
      "Historique radar7j · mémoire + table intelligence_radar_point (service role) + repli analytics_events.",
    category: "read",
  },
  {
    id: "intelligence.viral_control",
    method: "GET",
    path: "/api/intelligence/viral-control",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 45,
    summary:
      "Cockpit Viral Control Center · bundle radar + historique + option videoUrl YouTube (métriques publiques si YOUTUBE_API_KEY). Query: region, locale, days, videoUrl.",
    category: "read",
  },
  {
    id: "intelligence.viral_fusion",
    method: "GET",
    path: "/api/intelligence/viral-fusion",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 30,
    summary:
      "Fusion dashboard : tendances (couche News RSS existante) + recherche YouTube (search + videos batch) + score canonique ALGO par vidéo. Query: region. Cache serveur ~30s.",
    category: "read",
  },
  {
    id: "social.youtube.video_metrics",
    method: "GET",
    path: "/api/social/youtube/video-metrics",
    auth: "ip_rate_limit",
    rateLimitPerMinute: 40,
    summary:
      "Métriques publiques YouTube Data API v3 par videoId ou videoUrl + série d observations serveur. Requiert YOUTUBE_API_KEY.",
    category: "read",
  },
  {
    id: "cron.radar_snapshot",
    method: "GET",
    path: "/api/cron/radar-snapshot",
    auth: "cron_secret",
    summary:
      "Cron Vercel · point radar / région (bypass throttle) pour historique sans trafic UI. ALGO_RADAR_CRON_REGIONS.",
    category: "meta",
  },
];

export function buildManifestPayload(baseUrl: string) {
  return {
    algoEcosystemVersion: ALGO_ECOSYSTEM_API_VERSION,
    schemaDate: ALGO_ECOSYSTEM_SCHEMA_DATE,
    kind: "algo.platform.manifest",
    baseUrl: baseUrl.replace(/\/$/, ""),
    documentation: {
      repositoryFile: "docs/ECOSYSTEM_PLATFORM.md",
      setupGuide: "docs/ECOSYSTEM_SETUP.md",
      description:
        "Guide connexion apps + setup Supabase/Vercel (migration, clés, cron).",
    },
    interchange: {
      primary: "REST JSON",
      csv: "GET /api/v1/trends?format=csv",
      graphql: "not_implemented",
      websocket: "not_implemented",
    },
    endpoints: ECOSYSTEM_ENDPOINT_CATALOG,
  };
}
