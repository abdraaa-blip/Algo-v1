/**
 * ALGO Viral Score Tests
 * Unit tests for critical viral score calculations
 */

import { describe, it, expect } from 'vitest'
import { 
  clampScore, 
  computeRingOffset,
  getScoreColor,
  getScoreTier,
} from '@/services/logic/computeViralScore'

describe('clampScore', () => {
  it('should clamp values between 0 and 100', () => {
    expect(clampScore(50)).toBe(50)
    expect(clampScore(0)).toBe(0)
    expect(clampScore(100)).toBe(100)
  })

  it('should clamp values below 0 to 0', () => {
    expect(clampScore(-10)).toBe(0)
    expect(clampScore(-100)).toBe(0)
  })

  it('should clamp values above 100 to 100', () => {
    expect(clampScore(150)).toBe(100)
    expect(clampScore(1000)).toBe(100)
  })

  it('should handle NaN and undefined', () => {
    expect(clampScore(NaN)).toBe(0)
    expect(clampScore(undefined as unknown as number)).toBe(0)
    expect(clampScore(null as unknown as number)).toBe(0)
  })

  it('should round decimal values', () => {
    expect(clampScore(50.4)).toBe(50)
    expect(clampScore(50.5)).toBe(51)
    expect(clampScore(50.9)).toBe(51)
  })
})

describe('computeRingOffset', () => {
  const radius = 20
  const circumference = 2 * Math.PI * radius

  it('should return full circumference for score 0', () => {
    expect(computeRingOffset(0, radius)).toBeCloseTo(circumference)
  })

  it('should return 0 for score 100', () => {
    expect(computeRingOffset(100, radius)).toBeCloseTo(0)
  })

  it('should return half circumference for score 50', () => {
    expect(computeRingOffset(50, radius)).toBeCloseTo(circumference / 2)
  })

  it('should handle NaN gracefully', () => {
    const result = computeRingOffset(NaN, radius)
    expect(Number.isNaN(result)).toBe(false)
  })
})

describe('getScoreColor', () => {
  it('should return correct colors for score ranges', () => {
    // High scores (viral)
    expect(getScoreColor(90)).toMatch(/#|rgb/i)
    expect(getScoreColor(80)).toMatch(/#|rgb/i)
    
    // Medium scores - yellow/amber
    expect(getScoreColor(50)).toMatch(/#|rgb/i)
    
    // Low scores - red/gray
    expect(getScoreColor(20)).toMatch(/#|rgb/i)
  })

  it('should handle edge cases', () => {
    expect(getScoreColor(0)).toBeDefined()
    expect(getScoreColor(100)).toBeDefined()
  })
})

describe('getScoreTier', () => {
  it('should return S tier for scores >= 90', () => {
    expect(getScoreTier(90)).toBe('S')
    expect(getScoreTier(95)).toBe('S')
    expect(getScoreTier(100)).toBe('S')
  })

  it('should return A tier for scores >= 75', () => {
    expect(getScoreTier(75)).toBe('A')
    expect(getScoreTier(85)).toBe('A')
    expect(getScoreTier(89)).toBe('A')
  })

  it('should return B tier for scores >= 60', () => {
    expect(getScoreTier(60)).toBe('B')
    expect(getScoreTier(70)).toBe('B')
    expect(getScoreTier(74)).toBe('B')
  })

  it('should return C tier for scores >= 40', () => {
    expect(getScoreTier(40)).toBe('C')
    expect(getScoreTier(50)).toBe('C')
    expect(getScoreTier(59)).toBe('C')
  })

  it('should return D tier for scores < 40', () => {
    expect(getScoreTier(0)).toBe('D')
    expect(getScoreTier(20)).toBe('D')
    expect(getScoreTier(39)).toBe('D')
  })
})

describe('Viral Score Integration', () => {
  it('should correctly calculate a complete viral score flow', () => {
    // Simulate a high-velocity trend
    const score = 85
    const tier = getScoreTier(score)
    const color = getScoreColor(score)
    const clamped = clampScore(score)
    
    expect(tier).toBe('A')
    expect(color).toBeDefined()
    expect(clamped).toBe(85)
  })
})
