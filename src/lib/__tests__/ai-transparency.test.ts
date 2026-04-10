import { describe, it, expect } from 'vitest'
import {
  AI_TRANSPARENCY_LIMITS_FR,
  buildAskTransparencyLines,
  expertiseTransparencyLineFr,
} from '@/lib/ai/ai-transparency'

describe('ai-transparency', () => {
  it('buildAskTransparencyLines reflète enrichissement serveur', () => {
    const clientOnly = buildAskTransparencyLines({
      serverEnrichedTrends: false,
      trendTitlesPassedToModel: 6,
      region: 'FR',
    })
    expect(clientOnly.some((l) => l.includes('navigateur'))).toBe(true)
    expect(clientOnly.join(' ')).toMatch(/6/)

    const server = buildAskTransparencyLines({
      serverEnrichedTrends: true,
      trendTitlesPassedToModel: 12,
      region: 'ALL',
    })
    expect(server.some((l) => l.includes('serveur'))).toBe(true)
    expect(server.join(' ')).toMatch(/12/)
  })

  it('limits et expertise sont non vides', () => {
    expect(AI_TRANSPARENCY_LIMITS_FR.length).toBeGreaterThan(40)
    expect(expertiseTransparencyLineFr('novice')).toMatch(/débutant/i)
    expect(expertiseTransparencyLineFr('advanced')).toMatch(/expert/i)
  })
})
