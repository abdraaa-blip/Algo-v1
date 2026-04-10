import { describe, expect, it } from 'vitest'
import { buildManifestPayload, ECOSYSTEM_ENDPOINT_CATALOG } from '@/lib/ecosystem/catalog'
import { DATA_LANDSCAPE } from '@/lib/ecosystem/data-landscape'

describe('ecosystem manifest', () => {
  it('builds a stable manifest shape', () => {
    const m = buildManifestPayload('https://algo.test')
    expect(m.algoEcosystemVersion).toMatch(/^\d+\.\d+\.\d+$/)
    expect(m.kind).toBe('algo.platform.manifest')
    expect(m.baseUrl).toBe('https://algo.test')
    expect(m.endpoints).toBe(ECOSYSTEM_ENDPOINT_CATALOG)
    expect(m.interchange.graphql).toBe('not_implemented')
  })

  it('data landscape lists domains', () => {
    expect(DATA_LANDSCAPE.length).toBeGreaterThan(3)
    expect(DATA_LANDSCAPE.some((d) => d.domain.includes('Tendances'))).toBe(true)
  })
})
