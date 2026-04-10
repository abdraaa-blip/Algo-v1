import { buildGlobalIntelligence } from '@/lib/intelligence/global-intelligence'

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

export type GlobalIntelligenceSnapshot = Awaited<ReturnType<typeof buildGlobalIntelligence>>

/**
 * Même logique que GET /api/intelligence/predictive (hors cache HTTP) — utilisée par le cron radar.
 */
export async function buildPredictiveIntelligenceBundle(input: { region: string; locale: string }): Promise<{
  snapshot: GlobalIntelligenceSnapshot
  topCategory: GlobalIntelligenceSnapshot['categories'][number] | undefined
  predictedViralityScore: number
  confidence: number
  anomalyCount: number
  generatedAt: string
  region: string
  locale: string
}> {
  const snapshot = await buildGlobalIntelligence(input)
  const topCategory = [...snapshot.categories].sort((a, b) => b.score - a.score)[0]
  const baseVirality = topCategory ? topCategory.score : 45
  const engagementAdj = snapshot.sources.firstPartySignals.engagementRate * 20
  const frictionPenalty = snapshot.sources.firstPartySignals.frictionRate * 30
  const anomalyPenalty = snapshot.anomalies.some((a) => a.type === 'friction' && a.severity === 'high') ? 8 : 0
  const predictedViralityScore = clamp(Math.round(baseVirality + engagementAdj - frictionPenalty - anomalyPenalty))
  const confidence = predictedViralityScore >= 70 ? 0.78 : predictedViralityScore >= 50 ? 0.64 : 0.52

  return {
    snapshot,
    topCategory,
    predictedViralityScore,
    confidence,
    anomalyCount: snapshot.anomalies.length,
    generatedAt: new Date().toISOString(),
    region: input.region.toUpperCase(),
    locale: input.locale,
  }
}
