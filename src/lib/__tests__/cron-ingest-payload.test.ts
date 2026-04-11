import { describe, it, expect } from 'vitest'
import {
  businessLevelErrorFromJson,
  normalizeIngestPayload,
} from '@/lib/cron/ingest-payload'

describe('cron ingest payload', () => {
  it('normalise Spotify dégradé : tableau data avec title sur chaque item', () => {
    const degraded = {
      success: false,
      error: 'Failed to fetch Spotify data',
      source: 'fallback',
      count: 2,
      data: [
        {
          id: 'spotify_1',
          rank: 1,
          title: 'Die With A Smile',
          artist: 'Lady Gaga, Bruno Mars',
          popularity: 98,
          viralScore: 95,
          platform: 'spotify',
          type: 'track',
          thumbnail: 'https://ui-avatars.com/api/?name=x',
        },
        {
          id: 'spotify_2',
          rank: 2,
          title: 'APT.',
          artist: 'ROSE & Bruno Mars',
          popularity: 96,
          viralScore: 92,
          platform: 'spotify',
          type: 'track',
          thumbnail: 'https://ui-avatars.com/api/?name=y',
        },
      ],
    }
    const rows = normalizeIngestPayload(degraded, 'Spotify')
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => typeof (r as { title?: string }).title === 'string')).toBe(true)
    expect(businessLevelErrorFromJson(degraded)).toBe('Failed to fetch Spotify data')
  })

  it('normalise live-music (tracks + artists)', () => {
    const payload = {
      success: true,
      tracks: [{ id: 't1', name: 'A' }],
      artists: [{ id: 'a1', name: 'B' }],
    }
    const rows = normalizeIngestPayload(payload, 'Music')
    expect(rows).toHaveLength(2)
  })

  it('businessLevelErrorFromJson absent si success true', () => {
    expect(businessLevelErrorFromJson({ success: true, data: [] })).toBeUndefined()
  })

  it('businessLevelErrorFromJson sans message explicite', () => {
    expect(businessLevelErrorFromJson({ success: false })).toBe('success:false')
  })
})
