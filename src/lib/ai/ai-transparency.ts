/**
 * Textes de transparence pour les réponses IA (provenance, limites, entrées).
 * Utilisés par les routes API et la page /ai.
 */

import type { AskOrchestrationMeta } from '@/lib/ai/algo-ask-orchestrate'
import type { AlgoExpertiseLevel } from '@/lib/ai/algo-persona'

/** Affiché sous chaque réponse assistant — limites honnêtes du modèle. */
export const AI_TRANSPARENCY_LIMITS_FR =
  'Les scores et prédictions sont des indicateurs, pas des garanties. Le modèle ne parcourt pas le web en temps réel : il s’appuie sur ce que tu envoies et sur le contexte tendances au moment de l’appel.'

export const AI_TRANSPARENCY_ANALYZE_LINES_FR = [
  'Entrées envoyées : titre, description (optionnel), plateforme, catégorie, métriques.',
  'Sortie structurée : lecture « pourquoi ça peut performer », risque de cycle, formats suggérés — à croiser avec ton terrain.',
]

export const AI_TRANSPARENCY_PREDICT_LINES_FR = [
  'Entrées envoyées : idée (titre + description), format, plateforme, audience cible.',
  'Score et confiance sont des estimations internes ALGO : ils servent à prioriser des tests, pas à promettre un résultat.',
]

export const AI_TRANSPARENCY_BRIEFING_LINES_FR = [
  'Entrées envoyées : centres d’intérêt, pays, extraits de contenus tendance chargés sur cette page (YouTube / radar).',
  'Le briefing synthétise des signaux agrégés : utile pour orienter la veille, pas pour remplacer une analyse métier fine.',
]

export const AI_TRANSPARENCY_EXPLAIN_LOCAL_LINES_FR = [
  'Réponse générée localement (règles de lecture ALGO), sans appel au modèle distant.',
]

export function buildAskTransparencyLines(meta: AskOrchestrationMeta): string[] {
  return [
    meta.serverEnrichedTrends
      ? 'Tendances : complétées côté serveur (aucune liste n’avait été transmise).'
      : 'Tendances : titres issus du chargement radar de cette page (navigateur).',
    `${meta.trendTitlesPassedToModel} titre(s) de tendance ont été transmis au modèle.`,
    `Zone prise en compte pour les signaux : ${meta.region}.`,
  ]
}

export function expertiseTransparencyLineFr(level: AlgoExpertiseLevel): string {
  if (level === 'novice') return 'Niveau de réponse : débutant — vocabulaire guidé, moins de jargon.'
  if (level === 'advanced') return 'Niveau de réponse : expert — réponse plus dense et directe.'
  return 'Niveau de réponse : standard — équilibre clarté et profondeur.'
}
