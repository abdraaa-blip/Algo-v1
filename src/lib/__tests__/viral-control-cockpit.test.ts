import { describe, expect, it } from 'vitest'
import { deriveVelocityAcceleration, buildViralControlCockpitPayload } from '@/lib/intelligence/viral-control-cockpit'
import { isViralControlRegion } from '@/lib/intelligence/viral-control-regions'
import type { GlobalIntelligenceSnapshot } from '@/lib/intelligence/global-intelligence'

const baseSnapshot = {
  generatedAt: new Date().toISOString(),
  scope: { region: 'FR', locale: 'fr' },
  sources: {
    news: { count: 1, source: 'x' },
    social: { count: 1, source: 'x' },
    videos: { count: 1, source: 'x' },
    finance: { count: 0, source: 'x' },
    science: { count: 0, source: 'x' },
    economic: { count: 0, source: 'x' },
    socialExternal: { count: 0, source: 'x' },
    commerce: { count: 0, source: 'x' },
    firstPartySignals: { engagementRate: 0.5, frictionRate: 0.1, source: 'x' },
  },
  categories: [
    { name: 'Tech', score: 62, momentum: 'up' as const, signals: ['a'] },
    { name: 'Culture', score: 48, momentum: 'stable' as const, signals: ['b'] },
  ],
  anomalies: [],
  opportunities: [
    { type: 'timing', title: 'Tester un hook court', confidence: 0.7, rationale: 'r' },
  ],
} satisfies GlobalIntelligenceSnapshot

describe('viral-control-regions', () => {
  it('isViralControlRegion recognises catalog codes', () => {
    expect(isViralControlRegion('FR')).toBe(true)
    expect(isViralControlRegion('XX')).toBe(false)
  })
})

describe('viral-control-cockpit', () => {
  it('deriveVelocityAcceleration from two points', () => {
    const t0 = new Date('2026-01-01T10:00:00Z').toISOString()
    const t1 = new Date('2026-01-01T12:00:00Z').toISOString()
    const { velocityPerHour, accelerationPerHour2 } = deriveVelocityAcceleration([
      { at: t0, viralityScore: 50, confidence: 0.5, anomalyCount: 0 },
      { at: t1, viralityScore: 54, confidence: 0.5, anomalyCount: 0 },
    ])
    expect(velocityPerHour).toBeCloseTo(2, 5)
    expect(accelerationPerHour2).toBeNull()
  })

  it('deriveVelocityAcceleration returns nulls for empty or single point', () => {
    expect(deriveVelocityAcceleration([])).toEqual({ velocityPerHour: null, accelerationPerHour2: null })
    expect(
      deriveVelocityAcceleration([
        { at: new Date('2026-01-01T10:00:00Z').toISOString(), viralityScore: 50, confidence: 0.5, anomalyCount: 0 },
      ])
    ).toEqual({ velocityPerHour: null, accelerationPerHour2: null })
  })

  it('deriveVelocityAcceleration computes acceleration with four points', () => {
    const pts = [
      { at: new Date('2026-01-01T04:00:00Z').toISOString(), viralityScore: 48, confidence: 0.5, anomalyCount: 0 },
      { at: new Date('2026-01-01T06:00:00Z').toISOString(), viralityScore: 50, confidence: 0.5, anomalyCount: 0 },
      { at: new Date('2026-01-01T08:00:00Z').toISOString(), viralityScore: 52, confidence: 0.5, anomalyCount: 0 },
      { at: new Date('2026-01-01T10:00:00Z').toISOString(), viralityScore: 56, confidence: 0.5, anomalyCount: 0 },
    ]
    const { velocityPerHour, accelerationPerHour2 } = deriveVelocityAcceleration(pts)
    expect(velocityPerHour).not.toBeNull()
    expect(accelerationPerHour2).not.toBeNull()
    expect(Number.isFinite(accelerationPerHour2)).toBe(true)
  })

  it('buildViralControlCockpitPayload returns shaped cockpit', () => {
    const p = buildViralControlCockpitPayload({
      region: 'FR',
      locale: 'fr',
      snapshot: baseSnapshot,
      predictedViralityScore: 58,
      confidence: 0.6,
      radarPoints: [
        { at: new Date('2026-01-01T08:00:00Z').toISOString(), viralityScore: 50, confidence: 0.5, anomalyCount: 0 },
        { at: new Date('2026-01-01T10:00:00Z').toISOString(), viralityScore: 52, confidence: 0.5, anomalyCount: 0 },
      ],
      recommendations: [{ type: 'timing', title: 'Tester un hook court', confidence: 0.7 }],
    })
    expect(p.success).toBe(true)
    expect(p.kind).toBe('algo.viral_control_cockpit')
    expect(p.global.viralScore).toBe(58)
    expect(p.engagementProxy.viewsIndex).toBeGreaterThanOrEqual(0)
    expect(p.engagementProxy.viewsIndex).toBeLessThanOrEqual(100)
    expect(p.actions.length).toBeGreaterThan(0)
    expect(p.topCategory).toBe('Tech')
  })

  it('expose radarDeltaHint quand la série saute', () => {
    const p = buildViralControlCockpitPayload({
      region: 'FR',
      locale: 'fr',
      snapshot: baseSnapshot,
      predictedViralityScore: 70,
      confidence: 0.6,
      radarPoints: [
        { at: new Date('2026-01-01T08:00:00Z').toISOString(), viralityScore: 40, confidence: 0.5, anomalyCount: 0 },
        { at: new Date('2026-01-01T10:00:00Z').toISOString(), viralityScore: 70, confidence: 0.5, anomalyCount: 0 },
      ],
      recommendations: [{ type: 'timing', title: 'Tester un hook court', confidence: 0.7 }],
    })
    expect(p.radarDeltaHint?.kind).toBe('score_spike')
    expect(p.radarDeltaHint?.deltaPercent).toBe(75)
  })
})
