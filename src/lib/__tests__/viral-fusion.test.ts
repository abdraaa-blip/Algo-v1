import { describe, it, expect } from 'vitest'
import { computeFusionCanonicalForVideo } from '@/lib/intelligence/viral-fusion'

describe('viral fusion · score canonique', () => {
  it('renvoie un score global 0–100', () => {
    const out = computeFusionCanonicalForVideo({
      videoTitle: 'Réaction choc : le moment où tout bascule (analyse format court)',
      trendSignals: ['Sport', 'Politique', 'Culture'],
    })
    expect(out.overall).toBeGreaterThanOrEqual(0)
    expect(out.overall).toBeLessThanOrEqual(100)
    expect(out.hook).toBeGreaterThanOrEqual(0)
    expect(out.trend).toBeGreaterThanOrEqual(0)
  })
})
