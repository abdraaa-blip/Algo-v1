import { describe, it, expect } from 'vitest'
import { decideAlgoAskRoute } from '@/core/router'

describe('decideAlgoAskRoute', () => {
  it('détecte TRENDS', () => {
    expect(decideAlgoAskRoute('Quelles tendances TikTok ce soir ?')).toBe('TRENDS')
    expect(decideAlgoAskRoute('Veille signaux émergents')).toBe('TRENDS')
  })

  it('détecte VIRAL', () => {
    expect(decideAlgoAskRoute('Analyse la viralité de ce hook')).toBe('VIRAL')
    expect(decideAlgoAskRoute('Format shorts YouTube')).toBe('VIRAL')
  })

  it('détecte STRATEGY', () => {
    expect(decideAlgoAskRoute('Stratégie de conversion sur 30 jours')).toBe('STRATEGY')
    expect(decideAlgoAskRoute('Quel plan prioriser ?')).toBe('STRATEGY')
  })

  it('retourne GENERAL sinon', () => {
    expect(decideAlgoAskRoute('Bonjour')).toBe('GENERAL')
    expect(decideAlgoAskRoute('')).toBe('GENERAL')
  })
})
