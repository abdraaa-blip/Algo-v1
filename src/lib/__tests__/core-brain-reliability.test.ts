import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { BRAIN_INTENT_PRIORITY, BRAIN_MODULE_REGISTRY, centralAsk } from '@/core/brain'
import { DATA_RELIABILITY_MAP, getDataReliabilityEntry } from '@/lib/data/data-reliability-map'
import { GET as getDataReliability } from '@/app/api/meta/data-reliability/route'

describe('central brain', () => {
  it('expose un registre de modules cohérent', () => {
    expect(BRAIN_MODULE_REGISTRY.centralBrain).toContain('core/brain')
    expect(BRAIN_MODULE_REGISTRY.askOrchestrate).toContain('algo-ask-orchestrate')
  })

  it('priorités intent définies', () => {
    expect(BRAIN_INTENT_PRIORITY.ask_open).toBeLessThan(BRAIN_INTENT_PRIORITY.analyze_content)
  })

  it('centralAsk est la façade exportée (pas d’appel réseau dans ce test)', () => {
    expect(typeof centralAsk).toBe('function')
  })
})

describe('data reliability map', () => {
  it('couvre les sources principales', () => {
    expect(DATA_RELIABILITY_MAP.length).toBeGreaterThanOrEqual(4)
    expect(getDataReliabilityEntry('trends')?.fallbacksFr.length).toBeGreaterThan(0)
  })

  it('GET /api/meta/data-reliability renvoie la carte alignée sur le module', async () => {
    const res = await getDataReliability(new NextRequest('http://localhost/api/meta/data-reliability'))
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      success: boolean
      kind?: string
      sources?: { id: string }[]
    }
    expect(json.success).toBe(true)
    expect(json.kind).toBe('algo.data_reliability_map')
    expect(json.sources?.length).toBe(DATA_RELIABILITY_MAP.length)
  })
})
