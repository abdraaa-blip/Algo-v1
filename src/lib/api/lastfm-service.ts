/**
 * Last.fm API Service
 * Real-time music charts and artist data
 * API Docs: https://www.last.fm/api
 */

import { getDemoLastFmArtists, getDemoLastFmTracks } from '@/lib/data/offline-media-demos'

const LASTFM_API_KEY = process.env.LASTFM_API_KEY
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

// Cache duration: 15 minutes
const CACHE_DURATION_MS = 15 * 60 * 1000

interface CachedData<T> {
  data: T
  fetchedAt: string
  expiresAt: string
  source: 'live' | 'cache' | 'fallback'
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface RealTrack {
  id: string
  name: string
  artist: string
  artistUrl: string
  url: string
  imageUrl: string
  listeners: number
  playcount: number
  rank: number
  duration?: number
  fetchedAt: string
}

export interface RealArtist {
  id: string
  name: string
  url: string
  imageUrl: string
  listeners: number
  playcount: number
  rank: number
  tags: string[]
  fetchedAt: string
}

export interface RealAlbum {
  id: string
  name: string
  artist: string
  url: string
  imageUrl: string
  playcount: number
  rank: number
  fetchedAt: string
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHES
// ═══════════════════════════════════════════════════════════════════════════

const topTracksCache: Map<string, CachedData<RealTrack[]>> = new Map()
const topArtistsCache: Map<string, CachedData<RealArtist[]>> = new Map()

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getImageUrl(images: Array<{ '#text': string; size: string }> | undefined, artistName?: string): string {
  // Generate a consistent fallback based on artist name
  const safeName = encodeURIComponent(artistName || 'Music')
  const fallbackUrl = `https://ui-avatars.com/api/?name=${safeName}&background=1db954&color=fff&size=300&bold=true`
  
  if (!images || images.length === 0) {
    return fallbackUrl
  }
  // Prefer extralarge, then large, then medium
  const extralarge = images.find(img => img.size === 'extralarge')
  const large = images.find(img => img.size === 'large')
  const medium = images.find(img => img.size === 'medium')
  const url = extralarge?.['#text'] || large?.['#text'] || medium?.['#text'] || images[0]?.['#text']
  
  // Return fallback if URL is empty or contains placeholder path
  if (!url || url === '' || url.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
    return fallbackUrl
  }
  return url
}

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch top tracks globally or by country
 */
export async function fetchTopTracks(country?: string, limit: number = 50): Promise<CachedData<RealTrack[]>> {
  const cacheKey = `tracks_${country || 'global'}_${limit}`
  const cached = topTracksCache.get(cacheKey)
  
  if (cached && new Date(cached.expiresAt) > new Date()) {
    return { ...cached, source: 'cache' }
  }
  
  if (!LASTFM_API_KEY) {
    const now = new Date()
    const demo = getDemoLastFmTracks().slice(0, Math.min(limit, 30))
    return {
      data: demo,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: 'fallback',
    }
  }
  
  try {
    const method = country ? 'geo.gettoptracks' : 'chart.gettoptracks'
    const params = new URLSearchParams({
      method,
      api_key: LASTFM_API_KEY,
      format: 'json',
      limit: limit.toString()
    })
    
    if (country) {
      params.set('country', country)
    }
    
    const response = await fetch(`${LASTFM_BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/json' }
    })
    
    if (!response.ok) {
      throw new Error(`Last.fm API returned ${response.status}`)
    }
    
    const data = await response.json()
    const now = new Date()
    
    // Handle both response formats
    const tracksData = data.tracks?.track || data.toptracks?.track || []
    
    const tracks: RealTrack[] = tracksData.map((track: {
      name: string
      artist: { name: string; url: string } | string
      url: string
      image?: Array<{ '#text': string; size: string }>
      listeners?: string
      playcount?: string
      duration?: string
      '@attr'?: { rank: string }
    }, index: number) => {
      const artistName = typeof track.artist === 'string' ? track.artist : track.artist?.name || 'Unknown Artist'
      return {
      id: `lastfm_track_${index}_${Date.now()}`,
      name: track.name,
      artist: artistName,
      artistUrl: typeof track.artist === 'object' ? track.artist?.url || '' : '',
      url: track.url,
      imageUrl: getImageUrl(track.image, `${artistName} ${track.name}`),
      listeners: parseInt(track.listeners || '0', 10),
      playcount: parseInt(track.playcount || '0', 10),
      rank: parseInt(track['@attr']?.rank || String(index + 1), 10),
      duration: track.duration ? parseInt(track.duration, 10) : undefined,
      fetchedAt: now.toISOString()
    }
    })
    
    const result: CachedData<RealTrack[]> = {
      data: tracks,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: 'live'
    }
    
    topTracksCache.set(cacheKey, result)
    return result
    
  } catch (error) {
    console.error('[Last.fm] Top tracks fetch failed:', error)
    if (cached) return { ...cached, source: 'fallback' }
    return { data: [], fetchedAt: new Date().toISOString(), expiresAt: new Date().toISOString(), source: 'fallback' }
  }
}

/**
 * Fetch top artists globally or by country
 */
export async function fetchTopArtists(country?: string, limit: number = 50): Promise<CachedData<RealArtist[]>> {
  const cacheKey = `artists_${country || 'global'}_${limit}`
  const cached = topArtistsCache.get(cacheKey)
  
  if (cached && new Date(cached.expiresAt) > new Date()) {
    return { ...cached, source: 'cache' }
  }
  
  if (!LASTFM_API_KEY) {
    const now = new Date()
    const demo = getDemoLastFmArtists().slice(0, Math.min(limit, 30))
    return {
      data: demo,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: 'fallback',
    }
  }
  
  try {
    const method = country ? 'geo.gettopartists' : 'chart.gettopartists'
    const params = new URLSearchParams({
      method,
      api_key: LASTFM_API_KEY,
      format: 'json',
      limit: limit.toString()
    })
    
    if (country) {
      params.set('country', country)
    }
    
    const response = await fetch(`${LASTFM_BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/json' }
    })
    
    if (!response.ok) {
      throw new Error(`Last.fm API returned ${response.status}`)
    }
    
    const data = await response.json()
    const now = new Date()
    
    const artistsData = data.artists?.artist || data.topartists?.artist || []
    
    const artists: RealArtist[] = artistsData.map((artist: {
      name: string
      url: string
      image?: Array<{ '#text': string; size: string }>
      listeners?: string
      playcount?: string
      '@attr'?: { rank: string }
    }, index: number) => ({
      id: `lastfm_artist_${index}_${Date.now()}`,
      name: artist.name,
      url: artist.url,
      imageUrl: getImageUrl(artist.image, artist.name),
      listeners: parseInt(artist.listeners || '0', 10),
      playcount: parseInt(artist.playcount || '0', 10),
      rank: parseInt(artist['@attr']?.rank || String(index + 1), 10),
      tags: [],
      fetchedAt: now.toISOString()
    }))
    
    const result: CachedData<RealArtist[]> = {
      data: artists,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: 'live'
    }
    
    topArtistsCache.set(cacheKey, result)
    return result
    
  } catch (error) {
    console.error('[Last.fm] Top artists fetch failed:', error)
    if (cached) return { ...cached, source: 'fallback' }
    return { data: [], fetchedAt: new Date().toISOString(), expiresAt: new Date().toISOString(), source: 'fallback' }
  }
}

/**
 * Fetch all music charts
 */
export async function fetchAllMusicCharts(country?: string): Promise<{
  tracks: RealTrack[]
  artists: RealArtist[]
  fetchedAt: string
  source: 'live' | 'cache' | 'fallback' | 'mixed'
}> {
  const [tracksResult, artistsResult] = await Promise.all([
    fetchTopTracks(country, 30),
    fetchTopArtists(country, 30)
  ])
  
  const sources = new Set([tracksResult.source, artistsResult.source])
  const source = sources.size === 1 ? tracksResult.source : 'mixed'
  
  return {
    tracks: tracksResult.data,
    artists: artistsResult.data,
    fetchedAt: new Date().toISOString(),
    source
  }
}
