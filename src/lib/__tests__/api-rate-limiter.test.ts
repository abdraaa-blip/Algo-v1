import { describe, expect, it } from 'vitest'
import { checkRateLimit, createRateLimitHeaders } from '@/lib/api/rate-limiter'

describe('api rate-limiter', () => {
  it('reflects configured limit in headers and result', () => {
    const key = `test-limit-headers-${Date.now()}-${Math.random()}`
    const r = checkRateLimit(key, { limit: 7, windowMs: 60_000 })
    expect(r.success).toBe(true)
    expect(r.limit).toBe(7)
    const h = createRateLimitHeaders(r) as Record<string, string>
    expect(h['X-RateLimit-Limit']).toBe('7')
  })

  it('merges partial config with defaults', () => {
    const key = `test-partial-${Date.now()}-${Math.random()}`
    const r = checkRateLimit(key, { limit: 3 })
    expect(r.limit).toBe(3)
    expect(r.success).toBe(true)
  })
})
