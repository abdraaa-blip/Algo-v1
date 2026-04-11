import type { ActionProposal } from '@/lib/autonomy/types'
import type { GlobalIntelligenceSnapshot } from '@/lib/intelligence/global-intelligence'

interface PredictiveSignal {
  predictedViralityScore: number
  confidence: number
  drivers: {
    topCategory: string
    engagementRate: number
    frictionRate: number
    anomalies: Array<{ type: string; severity: string; message: string }>
  }
}

interface ProductSignal {
  keyword: string
  score: number
  potential: 'high' | 'medium' | 'emerging'
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function buildProposal(
  partial: Omit<ActionProposal, 'id' | 'requiresApproval'> & { idHint: string }
): ActionProposal {
  return {
    id: `${partial.idHint}-${Date.now()}`,
    type: partial.type,
    title: partial.title,
    rationale: partial.rationale,
    confidence: clamp01(partial.confidence),
    expectedImpact: Math.max(0, Math.min(100, Math.round(partial.expectedImpact))),
    riskLevel: partial.riskLevel,
    requiresApproval: partial.riskLevel !== 'low',
    metadata: partial.metadata,
  }
}

export function generateAutonomyProposals(params: {
  snapshot: GlobalIntelligenceSnapshot
  predictive: PredictiveSignal
  topProduct?: ProductSignal | null
}): ActionProposal[] {
  const { snapshot, predictive, topProduct } = params
  const proposals: ActionProposal[] = []
  const friction = predictive.drivers.frictionRate
  const engagement = predictive.drivers.engagementRate
  const topCategory = predictive.drivers.topCategory || 'general'
  const highFriction = snapshot.anomalies.some((a) => a.type === 'friction' && a.severity === 'high')

  if (highFriction || friction >= 0.22) {
    proposals.push(
      buildProposal({
        idHint: 'ux-fix',
        type: 'ux_fix',
        title: 'Reduce UX friction on conversion path',
        rationale: `Friction at ${(friction * 100).toFixed(1)}% is suppressing amplification.`,
        confidence: 0.82,
        expectedImpact: 68,
        riskLevel: 'low',
        metadata: { frictionRate: friction },
      })
    )
  }

  if (predictive.predictedViralityScore >= 70) {
    proposals.push(
      buildProposal({
        idHint: 'content-boost',
        type: 'content_boost',
        title: `Boost ${topCategory} content cycle`,
        rationale: `Virality=${predictive.predictedViralityScore}, confidence=${Math.round(
          predictive.confidence * 100
        )}%`,
        confidence: predictive.confidence,
        expectedImpact: predictive.predictedViralityScore,
        riskLevel: predictive.confidence >= 0.75 ? 'low' : 'medium',
        metadata: { category: topCategory },
      })
    )
  } else if (predictive.predictedViralityScore >= 55) {
    proposals.push(
      buildProposal({
        idHint: 'watch',
        type: 'watch_signal',
        title: `Watch ${topCategory} momentum`,
        rationale: 'Signal promising but below hard execution threshold.',
        confidence: 0.66,
        expectedImpact: 48,
        riskLevel: 'low',
        metadata: { category: topCategory },
      })
    )
  }

  if (topProduct && topProduct.score >= 70) {
    proposals.push(
      buildProposal({
        idHint: 'product-test',
        type: 'product_test',
        title: `Launch controlled product test: ${topProduct.keyword}`,
        rationale: `Product score ${topProduct.score} with potential ${topProduct.potential}.`,
        confidence: topProduct.score >= 80 ? 0.78 : 0.69,
        expectedImpact: topProduct.score,
        riskLevel: topProduct.score >= 80 ? 'low' : 'medium',
        metadata: { keyword: topProduct.keyword, potential: topProduct.potential },
      })
    )
  }

  if (engagement < 0.1 && predictive.predictedViralityScore < 50) {
    proposals.push(
      buildProposal({
        idHint: 'campaign-pause',
        type: 'campaign_pause',
        title: 'Pause broad amplification campaign',
        rationale: 'Low engagement and weak virality indicate low ROI window.',
        confidence: 0.72,
        expectedImpact: 35,
        riskLevel: 'medium',
        metadata: { engagementRate: engagement },
      })
    )
  }

  return proposals.slice(0, 8)
}
