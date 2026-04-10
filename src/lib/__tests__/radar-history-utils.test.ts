import { describe, it, expect } from 'vitest'
import {
  dedupeRadarPointsByAt,
  mergeRadarHistoryPoints,
  pruneRadarPointsByAge,
} from '@/lib/intelligence/radar-history-utils'

describe('radar-history-utils', () => {
  const t0 = '2026-04-09T10:00:00.000Z'
  const t1 = '2026-04-09T11:00:00.000Z'

  it('pruneRadarPointsByAge filtre par fenêtre', () => {
    const now = new Date('2026-04-09T12:00:00.000Z').getTime()
    const hour = 60 * 60 * 1000
    const old = '2026-04-01T10:00:00.000Z'
    const points = [
      { at: old, viralityScore: 50, confidence: 0.5, anomalyCount: 0 },
      { at: t1, viralityScore: 55, confidence: 0.6, anomalyCount: 1 },
    ]
    const kept = pruneRadarPointsByAge(points, now, 2 * hour)
    expect(kept).toHaveLength(1)
    expect(kept[0].at).toBe(t1)
  })

  it('dedupeRadarPointsByAt garde un point par horodatage', () => {
    const points = [
      { at: t0, viralityScore: 50, confidence: 0.5, anomalyCount: 0 },
      { at: t0, viralityScore: 99, confidence: 0.9, anomalyCount: 9 },
      { at: t1, viralityScore: 55, confidence: 0.6, anomalyCount: 0 },
    ]
    const d = dedupeRadarPointsByAt(points)
    expect(d).toHaveLength(2)
    expect(d[0].viralityScore).toBe(50)
  })

  it('mergeRadarHistoryPoints fusionne et trie', () => {
    const now = new Date('2026-04-09T15:00:00.000Z').getTime()
    const a = [{ at: t0, viralityScore: 40, confidence: 0.4, anomalyCount: 0 }]
    const b = [{ at: t1, viralityScore: 60, confidence: 0.6, anomalyCount: 2 }]
    const m = mergeRadarHistoryPoints(a, b, { nowMs: now, maxAgeMs: 7 * 24 * 60 * 60 * 1000, cap: 10 })
    expect(m.map((p) => p.at)).toEqual([t0, t1])
  })
})
