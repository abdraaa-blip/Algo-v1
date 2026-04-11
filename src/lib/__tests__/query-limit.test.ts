import { describe, it, expect } from 'vitest'
import {
  parseDefaultedListLimit,
  parseOptionalListLimit,
} from '@/lib/api/query-limit'

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

describe('parseDefaultedListLimit', () => {
  it('défaut si absent ou invalide', () => {
    expect(parseDefaultedListLimit(null, 20, 50)).toBe(20)
    expect(parseDefaultedListLimit('', 20, 50)).toBe(20)
    expect(parseDefaultedListLimit('nope', 20, 50)).toBe(20)
  })

  it('borne 1..maxVal', () => {
    expect(parseDefaultedListLimit('0', 20, 50)).toBe(1)
    expect(parseDefaultedListLimit('200', 20, 50)).toBe(50)
    expect(parseDefaultedListLimit('12', 20, 50)).toBe(12)
  })
})
