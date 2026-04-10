import { describe, it, expect } from 'vitest'
import { parseTrafficToGrowth } from '@/lib/algo-core-intelligence/live-items'

describe('parseTrafficToGrowth', () => {
  it('returns a default for empty or non-numeric traffic', () => {
    expect(parseTrafficToGrowth('')).toBe(38)
    expect(parseTrafficToGrowth('n/a')).toBe(38)
  })

  it('maps higher volumes to higher growth proxy', () => {
    const low = parseTrafficToGrowth('500')
    const high = parseTrafficToGrowth('500000')
    expect(high).toBeGreaterThan(low)
    expect(low).toBeGreaterThanOrEqual(28)
    expect(high).toBeLessThanOrEqual(95)
  })
})
