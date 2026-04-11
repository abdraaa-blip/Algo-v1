/**
 * Carte de fiabilité des sources data (documentation exécutable + hooks UI/ops).
 * Les scores baseline sont des ordres de grandeur honnêtes, pas des métriques temps réel.
 */

export type DataReliabilityEntry = {
  id: string
  primaryRoute: string
  fallbacksFr: readonly string[]
  /** 0–1 : confiance de base « produit » lorsque la source primaire répond. */
  baselineReliability: number
  limitsFr: string
}

export const DATA_RELIABILITY_MAP: readonly DataReliabilityEntry[] = [
  {
    id: 'trends',
    primaryRoute: '/api/live-trends',
    fallbacksFr: ['Réponse cache / source secondaire dans real-data-service', 'Payload vide + message côté client'],
    baselineReliability: 0.72,
    limitsFr:
      'Google Trends via flux RSS agrégé · délai de rafraîchissement, quotas implicites, couverture variable par pays.',
  },
  {
    id: 'youtube',
    primaryRoute: '/api/youtube · /api/live-videos',
    fallbacksFr: ['Données cache ou partielles', 'Liste vide avec état partial'],
    baselineReliability: 0.68,
    limitsFr: 'Dépend des clés API / quotas YouTube et du pays demandé.',
  },
  {
    id: 'news',
    primaryRoute: '/api/live-news',
    fallbacksFr: ['Agrégation réduite', 'Erreur isolée par pays'],
    baselineReliability: 0.7,
    limitsFr: 'Latence et complétude variables selon partenaires et région.',
  },
  {
    id: 'music',
    primaryRoute: '/api/live-music',
    fallbacksFr: ['Charts en cache', 'Dégradation soft'],
    baselineReliability: 0.65,
    limitsFr: 'Last.fm / agrégats · pas synchronisé seconde par seconde.',
  },
  {
    id: 'ai_context',
    primaryRoute: 'POST /api/ai/ask (processAlgoAiRequest · enrichissement tendances)',
    fallbacksFr: [
      'Requête sans enrichissement si fetch live échoue',
      'Réponse modèle avec contexte minimal',
      'Route / confiance système = heuristiques transparence, pas une mesure terrain',
    ],
    baselineReliability: 0.78,
    limitsFr:
      'Le modèle ne remplace pas une source : si les tendances tombent, la réponse reste prudente. La route TRENDS/VIRAL/STRATEGY est dérivée des mots-clés, pas d’un classifieur profond.',
  },
  {
    id: 'intelligence_radar',
    primaryRoute: 'GET /api/intelligence/radar-history · table intelligence_radar_point',
    fallbacksFr: [
      'Mémoire process seule si pas de service role',
      'Anciennes lignes analytics_events (event_type radar_snapshot)',
    ],
    baselineReliability: 0.82,
    limitsFr:
      'Série issue du bundle predictif ; persistance SQL après migration + SUPABASE_SERVICE_ROLE_KEY. Cron défaut FR,US.',
  },
] as const

export function getDataReliabilityEntry(id: string): DataReliabilityEntry | undefined {
  return DATA_RELIABILITY_MAP.find((e) => e.id === id)
}

/** Exposition simple pour une future UI « couverture / confiance ». */
export function listDataReliabilitySummaries(): Array<{ id: string; baselineReliability: number; limitsFr: string }> {
  return DATA_RELIABILITY_MAP.map((e) => ({
    id: e.id,
    baselineReliability: e.baselineReliability,
    limitsFr: e.limitsFr,
  }))
}
