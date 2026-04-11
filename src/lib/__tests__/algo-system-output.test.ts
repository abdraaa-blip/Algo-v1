import { describe, it, expect, vi } from 'vitest'

vi.mock('@/core/brain', () => ({
  centralAsk: vi.fn(),
}))

import { centralAsk } from '@/core/brain'
import {
  attachAskOutputQuality,
  buildStandardAskEnvelope,
  evaluateAlgoResponseQuality,
  isClear,
  isCoherent,
  isUseful,
  processAlgoAiRequest,
  qualityTransparencyHints,
  runAlgoAskSystem,
} from '@/core/system'

describe('algo system · enveloppe & QC', () => {
  it('buildStandardAskEnvelope couvre comprehension, reponse, action', () => {
    const env = buildStandardAskEnvelope(
      'TikTok 60s pour vendre un ebook',
      'Voici une lecture courte du signal.\n\nTeste un hook direct.',
      { nextStep: 'Publie un brouillon et mesure 24h.' }
    )
    expect(env.comprehension).toContain('TikTok')
    expect(env.reponse).toContain('lecture courte')
    expect(env.action).toContain('Publie un brouillon')
  })

  it('isCoherent rejette erreur technique et Oops', () => {
    expect(isCoherent('Une piste utile avec détails.')).toBe(true)
    expect(isCoherent('Erreur technique côté serveur')).toBe(false)
    expect(isCoherent('Oops something failed')).toBe(false)
  })

  it('isClear exige un minimum de substance', () => {
    expect(isClear('x'.repeat(40))).toBe(true)
    expect(isClear('court')).toBe(false)
  })

  it('isUseful accepte texte long ou structuré', () => {
    expect(isUseful('a'.repeat(100))).toBe(true)
    expect(isUseful('court', { nextStep: 'go' })).toBe(true)
    expect(isUseful('petit')).toBe(false)
  })

  it('evaluateAlgoResponseQuality agrège les trois indicateurs', () => {
    const q = evaluateAlgoResponseQuality('Une réponse assez longue pour dépasser le seuil de clarté et d’utilité minimale.', {
      recommendedChoice: { title: 'Piste A' },
    })
    expect(q.isClear && q.isUseful && q.isCoherent).toBe(true)
  })

  it('qualityTransparencyHints ne parle que des flags faux', () => {
    const hints = qualityTransparencyHints({ isClear: false, isUseful: true, isCoherent: true })
    expect(hints.length).toBe(1)
    expect(hints[0]).toMatch(/clarté/i)
  })

  it('attachAskOutputQuality combine enveloppe + quality', () => {
    const { standard, quality } = attachAskOutputQuality('Q?', 'Réponse assez longue pour passer le seuil utilité · avec une structure.', {
      options: [{ title: 'A' }],
    })
    expect(standard.action.length).toBeGreaterThan(5)
    expect(quality.isUseful).toBe(true)
  })

  it('runAlgoAskSystem délègue à centralAsk et ajoute standard + quality', async () => {
    vi.mocked(centralAsk).mockResolvedValue({
      answer: 'Réponse '.repeat(24),
      meta: { serverEnrichedTrends: false, trendTitlesPassedToModel: 0, region: 'ALL' },
    })
    const out = await runAlgoAskSystem({ question: 'Hello?' })
    expect(out.standard.comprehension).toContain('Hello?')
    expect(out.quality.isClear).toBe(true)
    expect(centralAsk).toHaveBeenCalledOnce()
  })

  it('processAlgoAiRequest injecte route + confiance', async () => {
    vi.mocked(centralAsk).mockResolvedValue({
      answer: 'Réponse '.repeat(24),
      meta: { serverEnrichedTrends: false, trendTitlesPassedToModel: 0, region: 'ALL' },
    })
    const out = await processAlgoAiRequest({ question: 'Analyse viralité TikTok' })
    expect(out.route).toBe('VIRAL')
    expect(out.systemConfidence).toBeGreaterThanOrEqual(0.66)
    expect(out.systemConfidence).toBeLessThanOrEqual(0.93)
    const call = vi.mocked(centralAsk).mock.calls.at(-1)?.[0]
    expect(call?.algoAskRoute).toBe('VIRAL')
    expect(call?.routeHintLines?.length).toBeGreaterThan(0)
  })
})
