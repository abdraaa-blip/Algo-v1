import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { BRAIN_INTENT_PRIORITY, BRAIN_MODULE_REGISTRY, centralAsk } from '@/core/brain'
import { DATA_RELIABILITY_MAP, getDataReliabilityEntry } from '@/lib/data/data-reliability-map'
import { GET as getDataReliability } from '@/app/api/meta/data-reliability/route'

describe('central brain', () => {
  it('expose un registre de modules cohérent', () => {
    expect(BRAIN_MODULE_REGISTRY.centralBrain).toContain('core/brain')
    expect(BRAIN_MODULE_REGISTRY.askOrchestrate).toContain('algo-ask-orchestrate')
    expect(BRAIN_MODULE_REGISTRY.masterDirectiveDoc).toBe('docs/ALGO_MASTER_SYSTEM_DIRECTIVE.md')
    expect(BRAIN_MODULE_REGISTRY.systemLayer).toBe('src/core/system.ts')
    expect(BRAIN_MODULE_REGISTRY.askRouter).toBe('src/core/router.ts')
    expect(BRAIN_MODULE_REGISTRY.systemRouteData).toBe('src/core/system-data.ts')
    expect(BRAIN_MODULE_REGISTRY.designSystemRules).toBe('config/algo-system-rules.ts')
    expect(BRAIN_MODULE_REGISTRY.qaGate).toBe('config/algo-qa-gate.ts')
    expect(BRAIN_MODULE_REGISTRY.deployGate).toBe('config/algo-deploy-gate.ts')
    expect(BRAIN_MODULE_REGISTRY.offlineEvolution).toBe('docs/ALGO_OFFLINE_EVOLUTION.md')
    expect(BRAIN_MODULE_REGISTRY.controlRoom).toBe('docs/ALGO_CONTROL_ROOM.md')
    expect(BRAIN_MODULE_REGISTRY.operationsPlaybook).toBe('docs/ALGO_OPERATIONS_PLAYBOOK.md')
    expect(BRAIN_MODULE_REGISTRY.observability).toBe('src/core/observability/')
    expect(BRAIN_MODULE_REGISTRY.autonomyKnowledgeMemory).toBe('src/lib/autonomy/knowledge-memory.ts')
    expect(BRAIN_MODULE_REGISTRY.autonomyLearningHistory).toBe('src/lib/autonomy/learning-history.ts')
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
