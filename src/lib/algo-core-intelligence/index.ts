/**
 * ALGO Core Intelligence — couche opérationnelle (analyse, simulation, priorités).
 * S’appuie sur algo-engine, autonomy/what-if et la validation existante.
 * Aucune reproduction des textes des archives : logique déterministe et vérifiable.
 */

import {
  processContent,
  validateContent,
  createFallback,
  type RawContentInput,
  type ContentIntelligence,
} from '@/lib/algo-engine'
import { runWhatIfSimulation } from '@/lib/autonomy/what-if'
import type { SimulationResult } from '@/lib/autonomy/types'

// ─── Philosophie produit (copy sobre, pas de promesses magiques) ─────────────

export const ALGO_CORE_PHILOSOPHY_FR = {
  tagline: 'Algo, l’appli silencieuse qui parle à tout le monde.',
  principles: [
    'Réduire le bruit, prioriser le signal.',
    'Indicateurs et vérification, pas d’affirmations gratuites.',
    'Analyser avant d’agir, simuler avant de décider.',
    'Ajuster après observation, sans inventer de données.',
    'Croiser création, distribution et risque quand la décision l’exige — pas de silo mental.',
    'La friction (objections, saturation, contraintes) est une donnée à lire, pas du bruit à ignorer.',
  ],
} as const

// ─── Types par module (sorties exploitables par l’UI ou des APIs) ────────────

export interface AlgoCoreUserContext {
  locale?: string
  regionHint?: string
  /** Poids d’intérêt par catégorie (ex. profil local first-party), 0–100 */
  interestByCategory?: Record<string, number>
}

export interface MultiLevelSlice {
  popularityScore: number
  propagationProxy: number
  engagementProxy: number
  emotionPrimary: ContentIntelligence['emotion']['primary']
  emotionIntensity: number
  weakSignal: boolean
  /** Écart simple entre métriques (incohérence = signal à creuser) */
  metricTension: number
}

export interface ReliabilitySlice {
  score: number
  flags: string[]
}

export interface PrioritySlice {
  rankScore: number
  bucket: 'focus' | 'watch' | 'noise'
  userBoost: number
}

export interface PatternSlice {
  repeatedTokens: Array<{ token: string; count: number }>
  duplicateTitles: number
  categoryConcentration: Record<string, number>
}

export interface ViralitySlice {
  earlySignalsCount: number
  risingOrPeakCount: number
  topActionLabels: string[]
}

export interface AlgoCoreItemReport {
  id: string
  title: string
  type: RawContentInput['type']
  intelligence: ContentIntelligence
  multiLevel: MultiLevelSlice
  reliability: ReliabilitySlice
  priority: PrioritySlice
}

export interface AlgoCoreIntelligenceReport {
  generatedAt: string
  philosophy: typeof ALGO_CORE_PHILOSOPHY_FR
  items: AlgoCoreItemReport[]
  /** IDs triés par pertinence décroissante */
  prioritizedIds: string[]
  crossBatch: {
    avgViralScore: number
    avgConfidence: number
    sourceCount: number
    weakSignalShare: number
  }
  scenarioSimulations: {
    viralBurst: SimulationResult
    stagnation: SimulationResult
    rejection: SimulationResult
  }
  patterns: PatternSlice
  autoOptimization: {
    suggestions: string[]
    confidenceHint: string
  }
  vigilance: {
    lowReliabilityCount: number
    notes: string[]
  }
  virality: ViralitySlice
  userLayer: {
    applied: boolean
    notes: string[]
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function tokenizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9àâäéèêëïîôùûüç]+/u)
    .filter((w) => w.length >= 4)
}

function buildPatterns(items: RawContentInput[]): PatternSlice {
  const freq = new Map<string, number>()
  const titles = items.map((i) => i.title?.trim().toLowerCase() || '')
  const seen = new Set<string>()
  let duplicateTitles = 0
  for (const t of titles) {
    if (!t) continue
    if (seen.has(t)) duplicateTitles += 1
    else seen.add(t)
    for (const tok of tokenizeTitle(t)) {
      freq.set(tok, (freq.get(tok) || 0) + 1)
    }
  }
  const repeatedTokens = [...freq.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([token, count]) => ({ token, count }))

  const categoryConcentration: Record<string, number> = {}
  for (const i of items) {
    const c = i.category || 'general'
    categoryConcentration[c] = (categoryConcentration[c] || 0) + 1
  }
  return { repeatedTokens, duplicateTitles, categoryConcentration }
}

function reliabilityFor(
  input: RawContentInput,
  intelligence: ContentIntelligence,
  validation: ReturnType<typeof validateContent>
): ReliabilitySlice {
  const flags: string[] = []
  let score = 100

  if (!validation.isValid) {
    flags.push('données_incomplètes')
    score -= 35
  }
  for (const w of validation.warnings) {
    flags.push(`avertissement:${w}`)
    score -= 6
  }
  if (intelligence.viralScore.confidence < 0.45) {
    flags.push('confiance_virale_faible')
    score -= 12
  }
  if (intelligence.freshness === 'stale') {
    flags.push('fraicheur_stale')
    score -= 8
  }
  const hasMetrics =
    (input.growthRate ?? 0) > 0 ||
    (input.engagement ?? 0) > 0 ||
    (input.views ?? 0) > 0
  if (!hasMetrics) {
    flags.push('métriques_partielles')
    score -= 10
  }

  return { score: clamp(Math.round(score), 0, 100), flags }
}

function multiLevelFrom(
  input: RawContentInput,
  intelligence: ContentIntelligence
): MultiLevelSlice {
  const v = intelligence.viralScore.score
  const growth = clamp(input.growthRate ?? 0, 0, 100)
  const eng = clamp(input.engagement ?? 0, 0, 100)
  const propagationProxy = clamp(growth * 0.55 + (input.views && input.views > 0 ? Math.log10(input.views + 1) * 12 : 0), 0, 100)
  const metricTension = Math.abs(v - (growth * 0.4 + eng * 0.6))
  return {
    popularityScore: v,
    propagationProxy,
    engagementProxy: eng,
    emotionPrimary: intelligence.emotion.primary,
    emotionIntensity: intelligence.emotion.intensity,
    weakSignal: intelligence.isEarlySignal,
    metricTension: Math.round(metricTension * 10) / 10,
  }
}

function userBoostFor(
  input: RawContentInput,
  ctx?: AlgoCoreUserContext
): number {
  if (!ctx?.interestByCategory || !input.category) return 0
  const w = ctx.interestByCategory[input.category]
  if (w === undefined) return 0
  return clamp(w / 5, 0, 18)
}

function priorityFrom(
  intelligence: ContentIntelligence,
  reliability: ReliabilitySlice,
  userBoost: number
): PrioritySlice {
  const base =
    intelligence.viralScore.score * 0.42 +
    intelligence.confidence * 100 * 0.28 +
    (intelligence.isEarlySignal ? 14 : 0) +
    userBoost -
    (100 - reliability.score) * 0.22
  const rankScore = clamp(Math.round(base * 10) / 10, 0, 100)
  const bucket: PrioritySlice['bucket'] =
    rankScore >= 62 ? 'focus' : rankScore >= 38 ? 'watch' : 'noise'
  return { rankScore, bucket, userBoost }
}

function batchSimulations(avgViral: number, avgConfidence: number): AlgoCoreIntelligenceReport['scenarioSimulations'] {
  const baselineEngagement = clamp(avgConfidence, 0.15, 0.92)
  const baselineFriction = 0.12
  const baselineAnomaly = avgConfidence < 0.5 ? 2 : 0

  return {
    viralBurst: runWhatIfSimulation({
      baselineScore: avgViral,
      baselineEngagementRate: baselineEngagement,
      baselineFrictionRate: baselineFriction,
      baselineAnomalyCount: baselineAnomaly,
      scenario: { viralityDelta: 18, engagementDelta: 0.12, frictionDelta: -0.04 },
    }),
    stagnation: runWhatIfSimulation({
      baselineScore: avgViral,
      baselineEngagementRate: baselineEngagement,
      baselineFrictionRate: baselineFriction,
      baselineAnomalyCount: baselineAnomaly,
      scenario: { viralityDelta: -12, engagementDelta: -0.08, frictionDelta: 0.06 },
    }),
    rejection: runWhatIfSimulation({
      baselineScore: avgViral,
      baselineEngagementRate: baselineEngagement,
      baselineFrictionRate: baselineFriction,
      baselineAnomalyCount: baselineAnomaly,
      scenario: { viralityDelta: -22, engagementDelta: -0.18, frictionDelta: 0.22, anomalyBoost: 2 },
    }),
  }
}

function autoOptimizationNotes(
  avgConfidence: number,
  lowReliabilityCount: number,
  weakShare: number
): AlgoCoreIntelligenceReport['autoOptimization'] {
  const suggestions: string[] = []
  if (avgConfidence < 0.52) {
    suggestions.push('Enrichir les signaux (volumes, dates, sources) avant de durcir les seuils.')
  }
  if (lowReliabilityCount > 0) {
    suggestions.push('Traiter en priorité les entrées à fiabilité basse : compléter ou exclure.')
  }
  if (weakShare > 0.35) {
    suggestions.push('Part importante de signaux faibles : conserver une lecture prudente et re-vérifier.')
  }
  if (suggestions.length === 0) {
    suggestions.push('Maintenir le rythme actuel : qualité des entrées suffisante pour des classements stables.')
  }
  const confidenceHint =
    avgConfidence >= 0.65
      ? 'Confiance globale correcte : les priorités sont exploitables.'
      : 'Confiance modérée : croiser avec d’autres sources avant engagement fort.'
  return { suggestions, confidenceHint }
}

function vigilanceNotes(
  items: AlgoCoreItemReport[],
  patterns: PatternSlice
): AlgoCoreIntelligenceReport['vigilance'] {
  const lowReliabilityCount = items.filter((i) => i.reliability.score < 55).length
  const notes: string[] = []
  if (patterns.duplicateTitles > 0) {
    notes.push('Titres dupliqués détectés : risque de double comptage ou de scrap répété.')
  }
  if (lowReliabilityCount > 0) {
    notes.push(`${lowReliabilityCount} élément(s) avec fiabilité basse — vérifier la provenance.`)
  }
  return { lowReliabilityCount, notes }
}

function viralitySliceFrom(items: AlgoCoreItemReport[]): ViralitySlice {
  let early = 0
  let rising = 0
  const actions = new Set<string>()
  for (const it of items) {
    if (it.intelligence.isEarlySignal) early += 1
    if (it.intelligence.viralScore.phase === 'rising' || it.intelligence.viralScore.phase === 'peak') {
      rising += 1
    }
    for (const a of it.intelligence.actions.slice(0, 2)) {
      actions.add(a.action)
    }
  }
  return {
    earlySignalsCount: early,
    risingOrPeakCount: rising,
    topActionLabels: [...actions].slice(0, 6),
  }
}

function userLayerNotes(ctx: AlgoCoreUserContext | undefined, items: AlgoCoreItemReport[]): AlgoCoreIntelligenceReport['userLayer'] {
  if (!ctx?.interestByCategory || Object.keys(ctx.interestByCategory).length === 0) {
    return { applied: false, notes: ['Pas de profil d’intérêts fourni : priorisation purement signal-based.'] }
  }
  const boosted = items.filter((i) => i.priority.userBoost > 0).length
  return {
    applied: true,
    notes: [
      `Profil appliqué : ${boosted} élément(s) rehaussé(s) selon les catégories suivies.`,
      ctx.regionHint ? `Contexte régional pris en compte : ${ctx.regionHint}.` : 'Locale générique : affiner regionHint si besoin.',
    ],
  }
}

/**
 * Analyse un lot de contenus bruts et produit un rapport Core Intelligence.
 * Idempotent, sans effet de bord hors compteur de simulations autonomy (léger).
 */
export function runAlgoCoreIntelligence(
  rawItems: RawContentInput[],
  userContext?: AlgoCoreUserContext
): AlgoCoreIntelligenceReport {
  const generatedAt = new Date().toISOString()
  if (rawItems.length === 0) {
    return {
      generatedAt,
      philosophy: ALGO_CORE_PHILOSOPHY_FR,
      items: [],
      prioritizedIds: [],
      crossBatch: { avgViralScore: 0, avgConfidence: 0, sourceCount: 0, weakSignalShare: 0 },
      scenarioSimulations: batchSimulations(0, 0.35),
      patterns: { repeatedTokens: [], duplicateTitles: 0, categoryConcentration: {} },
      autoOptimization: {
        suggestions: ['Ajouter des entrées pour activer l’analyse multi-niveaux.'],
        confidenceHint: 'Jeu de données vide.',
      },
      vigilance: { lowReliabilityCount: 0, notes: [] },
      virality: { earlySignalsCount: 0, risingOrPeakCount: 0, topActionLabels: [] },
      userLayer: { applied: false, notes: ['Aucun contenu à traiter.'] },
    }
  }

  const patterns = buildPatterns(rawItems)
  const items: AlgoCoreItemReport[] = []

  for (const raw of rawItems) {
    const validation = validateContent(raw)
    const input = validation.isValid ? raw : createFallback(raw)
    const intelligence = processContent(input)
    const reliability = reliabilityFor(input, intelligence, validateContent(raw))
    const multiLevel = multiLevelFrom(input, intelligence)
    const ub = userBoostFor(input, userContext)
    const priority = priorityFrom(intelligence, reliability, ub)
    items.push({
      id: input.id,
      title: input.title,
      type: input.type,
      intelligence,
      multiLevel,
      reliability,
      priority,
    })
  }

  const avgViral =
    items.reduce((s, i) => s + i.intelligence.viralScore.score, 0) / items.length
  const avgConfidence =
    items.reduce((s, i) => s + i.intelligence.confidence, 0) / items.length
  const sources = new Set(rawItems.map((r) => r.source || 'unknown')).size
  const weakShare =
    items.filter((i) => i.intelligence.isEarlySignal).length / items.length

  const prioritizedIds = [...items]
    .sort((a, b) => b.priority.rankScore - a.priority.rankScore)
    .map((i) => i.id)

  const scenarioSimulations = batchSimulations(avgViral, avgConfidence)
  const vig = vigilanceNotes(items, patterns)
  const autoOptimization = autoOptimizationNotes(avgConfidence, vig.lowReliabilityCount, weakShare)

  return {
    generatedAt,
    philosophy: ALGO_CORE_PHILOSOPHY_FR,
    items,
    prioritizedIds,
    crossBatch: {
      avgViralScore: Math.round(avgViral * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      sourceCount: sources,
      weakSignalShare: Math.round(weakShare * 100) / 100,
    },
    scenarioSimulations,
    patterns,
    autoOptimization,
    vigilance: vig,
    virality: viralitySliceFrom(items),
    userLayer: userLayerNotes(userContext, items),
  }
}
