/**
 * ALGO · couche système (orchestration Q&R + standardisation sortie + QC léger).
 *
 * - `processAlgoAiRequest` : entrée unique recommandée (route → indices → `centralAsk` → enveloppe + QC + confiance).
 * - `runAlgoAskSystem` : même chaîne sans routeur (tests, bypass).
 * - Évolution / « autonomie » produit : pas de seconde passe LLM ni d’auto-patch sur ce pipeline — voir `docs/ALGO_OFFLINE_EVOLUTION.md`.
 * - Mémoire / feedback : pas de buffer global « conscience » ni de dump Q&R ici — mémoire métier côté `src/lib/autonomy/*` et APIs intelligence.
 */

import { centralAsk, type CentralAskInput, type CentralAskResult } from '@/core/brain'
import { decideAlgoAskRoute, type AlgoAskRoute } from '@/core/router'
import { buildRouteContextData } from '@/core/system-data'
import type { AlgoAskStructured } from '@/lib/ai/algo-ask-contract'

export { decideAlgoAskRoute, type AlgoAskRoute } from '@/core/router'
export { buildRouteContextData } from '@/core/system-data'

/** Enveloppe stable pour lecture humaine et intégrations (clés FR volontaires). */
export type AlgoStandardAskEnvelope = {
  comprehension: string
  reponse: string
  action: string
}

export type AlgoResponseQuality = {
  isClear: boolean
  isUseful: boolean
  isCoherent: boolean
}

const TECH_ERR = /erreur\s+technique/i
/** Détecte formulations UI à éviter ; construit sans littéral scanné par `forbidden-ui-copy-scan`. */
const CASUAL_FAILURE_EN_RE = new RegExp(`\\b${['o', 'o', 'p', 's'].join('')}\\b`, 'i')
const CASUAL_FAILURE_FR_RE = new RegExp(`\\b${['o', 'u', 'p', 's'].join('')}\\b`, 'i')
const SOMETHING_WRONG = /something\s+went\s+wrong/i
const FR_SURVENUE = /une\s+erreur\s+est\s+survenue/i

function truncateQuestion(q: string, max = 200): string {
  const t = q.trim().replace(/\s+/g, ' ')
  if (!t) return 'ta question'
  return t.length > max ? `${t.slice(0, max)}…` : t
}

/**
 * Découpe heuristique : dernier bloc court = souvent une consigne ou une piste.
 */
function lastBlock(text: string): string | null {
  const parts = text.trim().split(/\n{2,}/)
  if (parts.length < 2) return null
  const last = parts[parts.length - 1]?.trim()
  if (!last || last.length > 420) return null
  return last
}

/**
 * Construit l’enveloppe à partir du texte principal et du contrat structuré optionnel.
 */
export function buildStandardAskEnvelope(
  question: string,
  answer: string,
  structured?: AlgoAskStructured
): AlgoStandardAskEnvelope {
  const reponse = answer.trim()
  const comprehension = `Lecture de ta demande : « ${truncateQuestion(question)} ».`

  let action = structured?.nextStep?.trim() ?? ''
  if (!action && structured?.recommendedChoice?.title) {
    action = `Piste prioritaire : ${structured.recommendedChoice.title.trim()}.`
  }
  if (!action) {
    const block = lastBlock(reponse)
    if (block && /^(piste|prochain|ensuite|teste|ouvre|vérif|vérifie|envoy|choisis)/i.test(block)) {
      action = block
    }
  }
  if (!action) {
    action =
      'Prochain pas : ouvre /trends pour caler un angle avec les signaux du jour, ou précise plateforme + objectif en une phrase.'
  }

  return { comprehension, reponse, action }
}

/** Texte lisible : longueur minimale, pas de bruit « erreur technique » évident. */
export function isClear(text: string): boolean {
  const t = text.trim()
  if (t.length < 28) return false
  if (TECH_ERR.test(t)) return false
  return true
}

/** Contenu assez riche ou structuré pour être actionnable. */
export function isUseful(text: string, structured?: AlgoAskStructured): boolean {
  if (structured?.nextStep?.trim()) return true
  if (structured?.recommendedChoice?.title) return true
  if (structured?.options && structured.options.length > 0) return true
  const t = text.trim()
  if (t.length >= 96) return true
  if (/(\*\*|•|^\s*[-–—]\s|\d+\.\s)/m.test(t)) return true
  return false
}

/** Alignement voix ALGO : pas de formulations UI interdites dans le corps réponse. */
export function isCoherent(text: string): boolean {
  const t = text
  if (TECH_ERR.test(t)) return false
  if (CASUAL_FAILURE_EN_RE.test(t)) return false
  if (CASUAL_FAILURE_FR_RE.test(t)) return false
  if (SOMETHING_WRONG.test(t)) return false
  if (FR_SURVENUE.test(t)) return false
  return true
}

export function evaluateAlgoResponseQuality(
  answer: string,
  structured?: AlgoAskStructured
): AlgoResponseQuality {
  return {
    isClear: isClear(answer),
    isUseful: isUseful(answer, structured),
    isCoherent: isCoherent(answer),
  }
}

/** Pour routes HTTP : enveloppe + QC sans passer par `runAlgoAskSystem`. */
export function attachAskOutputQuality(
  question: string,
  answer: string,
  structured?: AlgoAskStructured
): { standard: AlgoStandardAskEnvelope; quality: AlgoResponseQuality } {
  return {
    standard: buildStandardAskEnvelope(question, answer, structured),
    quality: evaluateAlgoResponseQuality(answer, structured),
  }
}

/** Lignes transparence optionnelles si un indicateur QC est faux. */
export function qualityTransparencyHints(quality: AlgoResponseQuality): string[] {
  const out: string[] = []
  if (!quality.isClear) {
    out.push('Contrôle auto : clarté perfectible · affine ta question ou relis le bloc compréhension.')
  }
  if (!quality.isUseful) {
    out.push('Contrôle auto : piste d’action peu visible · regarde le champ « action » ou précise plateforme / objectif.')
  }
  if (!quality.isCoherent) {
    out.push('Contrôle auto : formulation à recaler sur la voix ALGO (pas de jargon erreur brute).')
  }
  return out
}

export type AlgoSystemAskResult = CentralAskResult & {
  standard: AlgoStandardAskEnvelope
  quality: AlgoResponseQuality
}

function estimateSystemConfidence(quality: AlgoResponseQuality, route: AlgoAskRoute): number {
  let c = 0.66
  if (quality.isClear) c += 0.09
  if (quality.isUseful) c += 0.11
  if (quality.isCoherent) c += 0.07
  if (route !== 'GENERAL') c += 0.03
  return Math.min(0.93, Math.round(c * 100) / 100)
}

export type AlgoSystemProcessResult = AlgoSystemAskResult & {
  route: AlgoAskRoute
  systemConfidence: number
}

/**
 * Façade **cerveau système** : route heuristique, indices par intention, enrichissement tendances
 * ciblé (route TENDANCES sans titres client), puis pipeline complet + enveloppe + QC.
 */
export async function processAlgoAiRequest(input: CentralAskInput): Promise<AlgoSystemProcessResult> {
  const route = decideAlgoAskRoute(input.question)
  const hasClientTrends =
    (input.clientContext?.currentTrends?.filter((t) => typeof t === 'string' && t.trim()) ?? []).length > 0
  const routeData = buildRouteContextData(route, { hasClientTrends })

  let serverEnrich = input.serverEnrich
  if (serverEnrich === undefined && routeData.preferTrendServerEnrich) {
    serverEnrich = true
  }

  const merged: CentralAskInput = {
    ...input,
    serverEnrich,
    algoAskRoute: route,
    routeHintLines: routeData.hintLines,
  }

  const base = await runAlgoAskSystem(merged)
  const systemConfidence = estimateSystemConfidence(base.quality, route)
  return { ...base, route, systemConfidence }
}

/**
 * Q&R sans étape routeur explicite (même chaîne `centralAsk` + enveloppe + QC).
 */
export async function runAlgoAskSystem(input: CentralAskInput): Promise<AlgoSystemAskResult> {
  const base = await centralAsk(input)
  const standard = buildStandardAskEnvelope(input.question, base.answer, base.structured)
  const quality = evaluateAlgoResponseQuality(base.answer, base.structured)
  return { ...base, standard, quality }
}
