import { describe, it, expect } from 'vitest'
import { parseOptionalListLimit } from '@/lib/api/query-limit'

describe('parseOptionalListLimit', () => {
  it('retourne undefined si absent ou vide', () => {
    expect(parseOptionalListLimit(null)).toBeUndefined()
    expect(parseOptionalListLimit('')).toBeUndefined()
  })

  it('borne entre 1 et 100', () => {
    expect(parseOptionalListLimit('0')).toBe(1)
    expect(parseOptionalListLimit('500')).toBe(100)
    expect(parseOptionalListLimit('12')).toBe(12)
  })

  it('rejète NaN', () => {
    expect(parseOptionalListLimit('x')).toBeUndefined()
  })
})
