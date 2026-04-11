/**
 * Données / indices par **route système** (couche au-dessus des modules existants).
 * Pas de second fetch tendances ici : l’orchestrateur `algo-ask-orchestrate` reste la source ;
 * on ne fait qu’indiquer quand **privilégier** l’enrichissement serveur.
 */

import type { AlgoAskRoute } from '@/core/router'

export type AlgoRouteContextData = {
  /** Lignes injectées dans le bloc « Contexte ALGO » du modèle. */
  hintLines: string[]
  /** Si true et aucun titre côté client, `serverEnrich` peut être activé automatiquement. */
  preferTrendServerEnrich?: boolean
}

export function buildRouteContextData(
  route: AlgoAskRoute,
  opts?: { hasClientTrends: boolean }
): AlgoRouteContextData {
  const hasTrends = opts?.hasClientTrends === true

  switch (route) {
    case 'TRENDS':
      return {
        hintLines: [
          'Route TENDANCES : prioriser les titres fournis, la fraîcheur du signal et un renvoi utile vers /trends pour caler un angle.',
        ],
        preferTrendServerEnrich: !hasTrends,
      }
    case 'VIRAL':
      return {
        hintLines: [
          'Route VIRAL / ANALYSE : prioriser hooks, formats courts, plateforme, risque de saturation ; /viral-analyzer pour creuser un lien ou un titre.',
        ],
      }
    case 'STRATEGY':
      return {
        hintLines: [
          'Route STRATÉGIE : si pertinent, 2–3 options comparées, recommandation avec critère, risque principal, prochain pas concret.',
        ],
      }
    default:
      return { hintLines: [] }
  }
}
