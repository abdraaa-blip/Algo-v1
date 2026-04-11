import { describe, it, expect } from 'vitest'
import { toViralChartPoints } from '@/lib/dashboard/viral-chart-series'

describe('toViralChartPoints', () => {
  it('renvoie [] si série absente ou vide', () => {
    expect(toViralChartPoints(undefined)).toEqual([])
    expect(toViralChartPoints([])).toEqual([])
  })

  it('trie par date et tronque à 32 points max', () => {
    const base = new Date('2026-01-10T12:00:00Z').getTime()
    const series = Array.from({ length: 40 }, (_, i) => ({
      at: new Date(base + i * 3600_000).toISOString(),
      viralityScore: i,
    }))
    const out = toViralChartPoints(series)
    expect(out).toHaveLength(32)
    expect(out[0]!.score).toBe(8)
    expect(out[out.length - 1]!.score).toBe(39)
  })

  it('arrondit le score', () => {
    const out = toViralChartPoints([{ at: '2026-02-01T00:00:00Z', viralityScore: 77.4 }])
    expect(out).toHaveLength(1)
    expect(out[0]!.score).toBe(77)
    expect(out[0]!.time.length).toBeGreaterThan(0)
  })
})
