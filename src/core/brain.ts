/**
 * ALGO — Central Brain (socle d’orchestration).
 *
 * Objectif : un **point d’entrée nommé** pour le futur routeur à priorités.
 * Aujourd’hui : le pipeline Q&R passe par ici (`centralAsk` → enrichissement data → modèle).
 * Les routes HTTP peuvent importer ce module au lieu d’appeler directement les sous-couches.
 *
 * Ne pas confondre avec `AlgoOrchestrator` (fetch data temps réel) : complémentaire.
 */

import { orchestrateAskAlgo } from '@/lib/ai/algo-ask-orchestrate'
import type { AskOrchestrationMeta } from '@/lib/ai/algo-ask-orchestrate'
import type { AlgoAskStructured } from '@/lib/ai/algo-ask-contract'
import type { AlgoExpertiseLevel } from '@/lib/ai/algo-persona'

/** Registre lisible par humains / agents — chemins relatifs à la racine du dépôt. */
export const BRAIN_MODULE_REGISTRY = {
  centralBrain: 'src/core/brain.ts',
  persona: 'src/lib/ai/algo-persona.ts',
  directive: 'src/lib/ai/algo-directive-synthesis.ts',
  voice: 'src/lib/copy/algo-voice.ts',
  askOrchestrate: 'src/lib/ai/algo-ask-orchestrate.ts',
  askContract: 'src/lib/ai/algo-ask-contract.ts',
  aiBrain: 'src/lib/ai/algo-brain.ts',
  aiTransparency: 'src/lib/ai/ai-transparency.ts',
  dataOrchestrator: 'src/services/AlgoOrchestrator.ts',
  coherenceGuard: 'src/services/AlgoCoherenceGuard.ts',
  dataReliabilityMap: 'src/lib/data/data-reliability-map.ts',
} as const

export type CentralAskInput = {
  question: string
  clientContext?: { currentTrends?: string[]; userCountry?: string }
  countryHint?: string | null
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  expertiseLevel?: AlgoExpertiseLevel
  serverEnrich?: boolean
}

export type CentralAskResult = {
  answer: string
  structured?: AlgoAskStructured
  meta: AskOrchestrationMeta
}

/**
 * Pipeline : **entrée utilisateur → enrichissement tendances (si besoin) → modèle**.
 * C’est l’implémentation actuelle du « branché sur le réel » pour le mode Q&R.
 */
export async function centralAsk(input: CentralAskInput): Promise<CentralAskResult> {
  return orchestrateAskAlgo(input)
}

/**
 * Intentions futures pour un vrai routeur (priorités, modules multiples).
 * Non branché sur le runtime — sert de contrat pour étendre sans casser `centralAsk`.
 */
export type BrainIntent = 'ask_open' | 'analyze_content' | 'predict_viral' | 'daily_briefing'

export const BRAIN_INTENT_PRIORITY: Record<BrainIntent, number> = {
  ask_open: 10,
  analyze_content: 20,
  predict_viral: 20,
  daily_briefing: 15,
}
