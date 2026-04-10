import { describe, it, expect } from 'vitest'
import { shouldServerEnrichTrends } from '@/lib/ai/algo-ask-orchestrate'

describe('algo-ask-orchestrate', () => {
  it('enrichit seulement quand aucune tendance client', () => {
    expect(shouldServerEnrichTrends(undefined)).toBe(true)
    expect(shouldServerEnrichTrends([])).toBe(true)
    expect(shouldServerEnrichTrends(['  '])).toBe(true)
    expect(shouldServerEnrichTrends(['IA', 'musique'])).toBe(false)
  })

  it('respecte serverEnrich: false', () => {
    expect(shouldServerEnrichTrends(undefined, { serverEnrich: false })).toBe(false)
    expect(shouldServerEnrichTrends([], { serverEnrich: false })).toBe(false)
  })
})
