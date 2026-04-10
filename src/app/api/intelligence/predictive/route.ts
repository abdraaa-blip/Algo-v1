import { NextRequest, NextResponse } from 'next/server'
import { generateAutonomyProposals } from '@/lib/autonomy/reasoner'
import { evaluatePolicy, getAutonomyPolicy } from '@/lib/autonomy/policy'
import {
  buildPredictiveIntelligenceBundle,
  type GlobalIntelligenceSnapshot,
} from '@/lib/intelligence/predictive-intelligence-bundle'
import { recordRadarSnapshotIfDue } from '@/lib/intelligence/radar-snapshot-store'

export const dynamic = 'force-dynamic'

interface PredictivePayload {
  success: true
  data: {
    generatedAt: string
    region: string
    locale: string
    predictedViralityScore: number
    confidence: number
    drivers: {
      topCategory: string
      engagementRate: number
      frictionRate: number
      anomalies: GlobalIntelligenceSnapshot['anomalies']
    }
    recommendations: Array<{
      type: string
      title: string
      confidence: number
    }>
    autonomy: {
      mode: ReturnType<typeof getAutonomyPolicy>['mode']
      killSwitch: boolean
      proposals: Array<{
        id: string
        type: string
        title: string
        rationale: string
        confidence: number
        expectedImpact: number
        riskLevel: string
        requiresApproval: boolean
        policyDecision: {
          allowed: boolean
          requiresApproval: boolean
          reason: string
          idempotencyKey: string
        }
      }>
    }
  }
  cached: boolean
  stale?: boolean
  cacheTtlMs: number
}

interface PredictiveCacheEntry {
  key: string
  payload: PredictivePayload
  expiresAtMs: number
}

const PREDICTIVE_CACHE_TTL_MS = 30_000
const predictiveCache = new Map<string, PredictiveCacheEntry>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region') || 'FR'
  const locale = searchParams.get('locale') || 'fr'
  const cacheKey = `${region.toUpperCase()}:${locale.toLowerCase()}`
  const nowMs = Date.now()
  const cached = predictiveCache.get(cacheKey)
  if (cached && cached.expiresAtMs > nowMs) {
    return NextResponse.json({ ...cached.payload, cached: true })
  }

  try {
    const bundle = await buildPredictiveIntelligenceBundle({ region, locale })
    const { snapshot, topCategory, predictedViralityScore, confidence } = bundle

    const payload: PredictivePayload = {
      success: true,
      data: {
        generatedAt: bundle.generatedAt,
        region: bundle.region,
        locale: bundle.locale,
        predictedViralityScore,
        confidence,
        drivers: {
          topCategory: topCategory?.name || 'general',
          engagementRate: snapshot.sources.firstPartySignals.engagementRate,
          frictionRate: snapshot.sources.firstPartySignals.frictionRate,
          anomalies: snapshot.anomalies,
        },
        recommendations: snapshot.opportunities.map((o) => ({
          type: o.type,
          title: o.title,
          confidence: o.confidence,
        })),
        autonomy: {
          mode: getAutonomyPolicy().mode,
          killSwitch: getAutonomyPolicy().killSwitch,
          proposals: generateAutonomyProposals({
            snapshot,
            predictive: {
              predictedViralityScore,
              confidence,
              drivers: {
                topCategory: topCategory?.name || 'general',
                engagementRate: snapshot.sources.firstPartySignals.engagementRate,
                frictionRate: snapshot.sources.firstPartySignals.frictionRate,
                anomalies: snapshot.anomalies,
              },
            },
          }).map((proposal) => ({
            ...proposal,
            policyDecision: evaluatePolicy(proposal, { dryRun: true }),
          })),
        },
      },
      cached: false,
      cacheTtlMs: PREDICTIVE_CACHE_TTL_MS,
    }
    predictiveCache.set(cacheKey, {
      key: cacheKey,
      payload,
      expiresAtMs: nowMs + PREDICTIVE_CACHE_TTL_MS,
    })
    recordRadarSnapshotIfDue(request, {
      region: bundle.region,
      locale: bundle.locale,
      viralityScore: predictedViralityScore,
      confidence,
      anomalyCount: bundle.anomalyCount,
      generatedAt: bundle.generatedAt,
    })
    return NextResponse.json(payload)
  } catch (error) {
    const stale = predictiveCache.get(cacheKey)
    if (stale) {
      return NextResponse.json({
        ...stale.payload,
        cached: true,
        stale: true,
      })
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build predictive analysis',
      },
      { status: 500 }
    )
  }
}
