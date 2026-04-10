import { describe, expect, it } from 'vitest'
import { buildPageMetadata, buildRootMetadata } from '@/lib/seo/build-metadata'
import { absoluteUrl, getSiteBaseUrl, SITE_TRANSPARENCY_AI_CALIBRATION_HREF } from '@/lib/seo/site'
import { extractTitleKeywords } from '@/lib/seo/keywords-from-title'
import { organizationJsonLd, personProfileJsonLd, websiteJsonLd } from '@/lib/seo/json-ld'

describe('seo site', () => {
  it('getSiteBaseUrl falls back to localhost without env', () => {
    expect(getSiteBaseUrl()).toMatch(/^https?:\/\//)
  })

  it('absoluteUrl joins path', () => {
    const base = getSiteBaseUrl()
    expect(absoluteUrl('/foo')).toBe(`${base.replace(/\/$/, '')}/foo`)
  })

  it('exposes stable calibrage IA anchor href', () => {
    expect(SITE_TRANSPARENCY_AI_CALIBRATION_HREF).toBe('/transparency#algo-ai-directive')
  })
})

describe('buildPageMetadata', () => {
  it('includes openGraph and twitter images', () => {
    const m = buildPageMetadata({
      title: 'Test Page',
      description: 'A description long enough for SEO checks and truncation paths.',
      path: '/test',
      keywords: ['a', 'b'],
    })
    expect(m.title).toContain('Test Page')
    expect(m.openGraph?.images?.length).toBeGreaterThan(0)
    expect(m.twitter?.images?.length).toBeGreaterThan(0)
    expect(m.robots).toEqual({ index: true, follow: true })
  })

  it('supports noindex', () => {
    const m = buildPageMetadata({
      title: 'X',
      description: 'Y',
      path: '/x',
      noindex: true,
    })
    expect(m.robots).toEqual({ index: false, follow: false })
  })
})

describe('buildRootMetadata', () => {
  it('returns manifest and metadataBase', () => {
    const m = buildRootMetadata()
    expect(m.manifest).toBe('/manifest.json')
    expect(m.metadataBase?.toString()).toMatch(/^https?:/)
  })
})

describe('keywords-from-title', () => {
  it('extracts keywords', () => {
    const k = extractTitleKeywords('Le président annonce une réforme majeure du numérique')
    expect(k.length).toBeGreaterThan(0)
    expect(k.some((x) => /réforme|numérique|président/i.test(x))).toBe(true)
  })
})

describe('json-ld', () => {
  it('organization and website have @context', () => {
    expect(organizationJsonLd()['@context']).toBe('https://schema.org')
    expect(websiteJsonLd()['@type']).toBe('WebSite')
  })

  it('person profile has name and url', () => {
    const p = personProfileJsonLd({
      name: 'Test Star',
      urlPath: '/star/star-1',
      description: 'Bio',
    })
    expect(p['@type']).toBe('Person')
    expect((p as { name: string }).name).toBe('Test Star')
  })
})
