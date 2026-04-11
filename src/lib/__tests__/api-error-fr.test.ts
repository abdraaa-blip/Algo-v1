import { describe, expect, it } from 'vitest'
import { mapUserFacingApiError } from '@/lib/copy/api-error-fr'

describe('mapUserFacingApiError', () => {
  it('maps known API boilerplate to French', () => {
    expect(mapUserFacingApiError('Unknown error')).toMatch(/Réessaie/)
    expect(mapUserFacingApiError('Failed to fetch trends')).toContain('tendances')
    expect(mapUserFacingApiError('Rate limit exceeded')).toMatch(/requêtes/)
    expect(mapUserFacingApiError('Not authenticated')).toContain('Connecte-toi')
  })

  it('handles Failed to fetch prefix', () => {
    expect(mapUserFacingApiError('Failed to fetch something weird')).toContain('données')
  })

  it('returns French message for empty input', () => {
    expect(mapUserFacingApiError(null)).toContain('Signal')
    expect(mapUserFacingApiError('   ')).toContain('Signal')
  })

  it('passes through unknown messages', () => {
    expect(mapUserFacingApiError('Email déjà utilisé')).toBe('Email déjà utilisé')
  })
})
