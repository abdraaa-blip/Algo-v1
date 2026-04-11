import { describe, expect, it } from 'vitest'
import {
  ALGO_ASK_FALLBACK_MINIMAL,
  ALGO_ASK_FALLBACK_NO_QUESTION,
  buildAlgoAskFallbackResponse,
} from '@/lib/ai/algo-ask-fallback'

describe('algo-ask-fallback', () => {
  it('buildAlgoAskFallbackResponse inclut la question et des pistes sans vocabulaire d’échec technique', () => {
    const t = buildAlgoAskFallbackResponse('Comment percer sur TikTok cette semaine ?', {
      userCountry: 'FR',
      firstTrendTitle: 'IA création',
    })
    expect(t).toMatch(/TikTok|percer/i)
    expect(t).toMatch(/\/trends|piste/i)
    expect(t).not.toMatch(/erreur technique|limite technique|service modèle/i)
  })

  it('constantes minimales restent actionnables', () => {
    expect(ALGO_ASK_FALLBACK_MINIMAL.length).toBeGreaterThan(40)
    expect(ALGO_ASK_FALLBACK_NO_QUESTION).toMatch(/question|plateforme/i)
  })
})
