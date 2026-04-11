import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockProcessAlgoAiRequest = vi.hoisted(() => vi.fn())

vi.mock('@/core/system', () => ({
  processAlgoAiRequest: mockProcessAlgoAiRequest,
}))

import { POST } from '@/app/api/algo/route'

function mockAlgoResult() {
  return {
    answer:
      'Lecture synthétique du signal : momentum modéré sur la zone. Pistes : caler un angle avec les titres radar du jour.\n\n• vérifier la cohérence créa\n• tester un hook court',
    structured: undefined as undefined,
    meta: { serverEnrichedTrends: false, trendTitlesPassedToModel: 0, region: 'FR' },
    standard: {
      comprehension: 'Lecture de ta demande : « test ».',
      reponse: 'Réponse mock structurée pour la route pont.',
      action: 'Ouvre /trends pour caler un angle.',
    },
    quality: { isClear: true, isUseful: true, isCoherent: true },
    route: 'GENERAL' as const,
    systemConfidence: 0.82,
  }
}

describe('POST /api/algo', () => {
  beforeEach(() => {
    mockProcessAlgoAiRequest.mockReset()
    mockProcessAlgoAiRequest.mockResolvedValue(mockAlgoResult())
  })

  it('renvoie 400 si JSON invalide', async () => {
    const req = new NextRequest('http://localhost/api/algo', {
      method: 'POST',
      body: 'not-json{',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const j = (await res.json()) as { success?: boolean }
    expect(j.success).toBe(false)
    expect(mockProcessAlgoAiRequest).not.toHaveBeenCalled()
  })

  it('renvoie 400 si input absent', async () => {
    const req = new NextRequest('http://localhost/api/algo', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(mockProcessAlgoAiRequest).not.toHaveBeenCalled()
  })

  it('appelle processAlgoAiRequest et renvoie le pont JSON', async () => {
    const req = new NextRequest('http://localhost/api/algo', {
      method: 'POST',
      body: JSON.stringify({
        input: '  Analyse rapide  ',
        context: { currentTrends: ['Titre A'], userCountry: 'FR' },
        country: 'FR',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const j = (await res.json()) as {
      success?: boolean
      kind?: string
      text?: string
      standard?: { reponse: string }
      systemRoute?: string
    }
    expect(j.success).toBe(true)
    expect(j.kind).toBe('algo.dashboard_insight')
    expect(j.text).toContain('Lecture synthétique')
    expect(j.standard?.reponse).toBeTruthy()
    expect(j.systemRoute).toBe('GENERAL')

    expect(mockProcessAlgoAiRequest).toHaveBeenCalledTimes(1)
    const arg = mockProcessAlgoAiRequest.mock.calls[0]![0] as {
      question: string
      clientContext?: { currentTrends?: string[]; userCountry?: string }
      countryHint: string | null
    }
    expect(arg.question).toBe('Analyse rapide')
    expect(arg.clientContext?.currentTrends).toEqual(['Titre A'])
    expect(arg.countryHint).toBe('FR')
  })
})
