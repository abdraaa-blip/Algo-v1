import { describe, expect, it } from 'vitest'
import { parseSnapshotQuery } from '@/lib/ecosystem/snapshot-store'

describe('parseSnapshotQuery', () => {
  it('defaults since to ~24h and all types', () => {
    const q = parseSnapshotQuery(new URLSearchParams())
    expect(q.ok).toBe(true)
    if (!q.ok) return
    expect(q.value.types).toHaveLength(3)
    expect(q.value.limitPerType).toBe(100)
    const ageMs = Date.now() - q.value.since.getTime()
    expect(ageMs).toBeGreaterThan(23 * 3600 * 1000)
    expect(ageMs).toBeLessThan(25 * 3600 * 1000)
  })

  it('parses since ISO', () => {
    const q = parseSnapshotQuery(new URLSearchParams('since=2026-01-15T12:00:00.000Z'))
    expect(q.ok).toBe(true)
    if (!q.ok) return
    expect(q.value.since.toISOString()).toBe('2026-01-15T12:00:00.000Z')
  })

  it('rejects invalid since', () => {
    const q = parseSnapshotQuery(new URLSearchParams('since=not-a-date'))
    expect(q.ok).toBe(false)
  })

  it('filters types', () => {
    const q = parseSnapshotQuery(new URLSearchParams('types=trend_signal,model_weight_version'))
    expect(q.ok).toBe(true)
    if (!q.ok) return
    expect(q.value.types).toEqual(['trend_signal', 'model_weight_version'])
  })

  it('rejects unknown type', () => {
    const q = parseSnapshotQuery(new URLSearchParams('types=trend_signal,unknown'))
    expect(q.ok).toBe(false)
  })

  it('clamps limit', () => {
    const q = parseSnapshotQuery(new URLSearchParams('limit=9999'))
    expect(q.ok).toBe(true)
    if (!q.ok) return
    expect(q.value.limitPerType).toBe(500)
  })
})
