import { NextRequest, NextResponse } from 'next/server'
import { parseDefaultedListLimit } from '@/lib/api/query-limit'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'

/**
 * Twitch API - Fetches trending games and streams
 * Uses Twitch Helix API
 */

interface TwitchGame {
  id: string
  name: string
  box_art_url: string
}

interface TwitchStream {
  id: string
  user_id: string
  user_name: string
  game_id: string
  game_name: string
  title: string
  viewer_count: number
  started_at: string
  thumbnail_url: string
  language: string
}

interface TwitchClip {
  id: string
  url: string
  title: string
  view_count: number
  created_at: string
  thumbnail_url: string
  broadcaster_name: string
  game_id: string
}

// Cache for access token
let accessToken: string | null = null
let tokenExpiry: number = 0

async function getTwitchToken(): Promise<string | null> {
  // Check if we have a valid cached token
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('[ALGO Twitch] Missing API credentials, using fallback data')
    return null
  }

  try {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`)
    }

    const data = await response.json()
    accessToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000 // Refresh 5 min before expiry
    return accessToken
  } catch (error) {
    console.error('[ALGO Twitch] Failed to get access token:', error)
    return null
  }
}

async function fetchTopGames(token: string): Promise<TwitchGame[]> {
  const clientId = process.env.TWITCH_CLIENT_ID
  
  const response = await fetch('https://api.twitch.tv/helix/games/top?first=20', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId!
    },
    next: { revalidate: 300 }
  })

  if (!response.ok) return []
  const data = await response.json()
  return data.data || []
}

async function fetchTopStreams(token: string, gameId?: string): Promise<TwitchStream[]> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const url = gameId 
    ? `https://api.twitch.tv/helix/streams?first=20&game_id=${gameId}`
    : 'https://api.twitch.tv/helix/streams?first=50'

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId!
    },
    next: { revalidate: 60 }
  })

  if (!response.ok) return []
  const data = await response.json()
  return data.data || []
}

async function fetchTopClips(token: string): Promise<TwitchClip[]> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const startedAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const response = await fetch(
    `https://api.twitch.tv/helix/clips?first=20&started_at=${startedAt}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId!
      },
      next: { revalidate: 300 }
    }
  )

  if (!response.ok) return []
  const data = await response.json()
  return data.data || []
}

// Fallback data when API is not available
const FALLBACK_GAMES = [
  { id: '1', name: 'Just Chatting', viewers: 450000, viralScore: 95 },
  { id: '2', name: 'League of Legends', viewers: 280000, viralScore: 88 },
  { id: '3', name: 'Valorant', viewers: 220000, viralScore: 85 },
  { id: '4', name: 'Grand Theft Auto V', viewers: 180000, viralScore: 82 },
  { id: '5', name: 'Fortnite', viewers: 160000, viralScore: 80 },
  { id: '6', name: 'Minecraft', viewers: 140000, viralScore: 78 },
  { id: '7', name: 'Counter-Strike 2', viewers: 130000, viralScore: 76 },
  { id: '8', name: 'Apex Legends', viewers: 100000, viralScore: 72 },
]

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(identifier, { limit: 30, windowMs: 60000 })
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'games' // games, streams, clips
  const limit = parseDefaultedListLimit(searchParams.get('limit'), 20, 50)

  const token = await getTwitchToken()

  // Use fallback if no token
  if (!token) {
    return NextResponse.json({
      success: true,
      data: FALLBACK_GAMES.slice(0, limit).map(g => ({
        id: `twitch_game_${g.id}`,
        title: g.name,
        viewers: g.viewers,
        viralScore: g.viralScore,
        platform: 'twitch',
        type: 'game',
        thumbnail: `https://static-cdn.jtvnw.net/ttv-boxart/${encodeURIComponent(g.name)}-285x380.jpg`
      })),
      fetchedAt: new Date().toISOString(),
      source: 'fallback',
      count: Math.min(limit, FALLBACK_GAMES.length)
    }, { headers: createRateLimitHeaders(rateLimit) })
  }

  try {
    if (type === 'streams') {
      const streams = await fetchTopStreams(token)
      const data = streams.slice(0, limit).map(s => ({
        id: `twitch_stream_${s.id}`,
        title: s.title,
        streamer: s.user_name,
        game: s.game_name,
        viewers: s.viewer_count,
        startedAt: s.started_at,
        thumbnail: s.thumbnail_url.replace('{width}', '320').replace('{height}', '180'),
        language: s.language,
        viralScore: Math.min(100, Math.round(s.viewer_count / 1000)),
        platform: 'twitch',
        type: 'stream'
      }))

      return NextResponse.json({
        success: true,
        data,
        fetchedAt: new Date().toISOString(),
        source: 'live',
        count: data.length
      }, { headers: createRateLimitHeaders(rateLimit) })
    }

    if (type === 'clips') {
      const clips = await fetchTopClips(token)
      const data = clips.slice(0, limit).map(c => ({
        id: `twitch_clip_${c.id}`,
        title: c.title,
        streamer: c.broadcaster_name,
        views: c.view_count,
        createdAt: c.created_at,
        thumbnail: c.thumbnail_url,
        url: c.url,
        viralScore: Math.min(100, Math.round(c.view_count / 10000)),
        platform: 'twitch',
        type: 'clip'
      }))

      return NextResponse.json({
        success: true,
        data,
        fetchedAt: new Date().toISOString(),
        source: 'live',
        count: data.length
      }, { headers: createRateLimitHeaders(rateLimit) })
    }

    // Default: top games
    const games = await fetchTopGames(token)
    const streams = await fetchTopStreams(token)

    // Calculate viewers per game
    const viewersByGame: Record<string, number> = {}
    streams.forEach(s => {
      viewersByGame[s.game_id] = (viewersByGame[s.game_id] || 0) + s.viewer_count
    })

    const data = games.slice(0, limit).map(g => ({
      id: `twitch_game_${g.id}`,
      title: g.name,
      viewers: viewersByGame[g.id] || 0,
      thumbnail: g.box_art_url.replace('{width}', '285').replace('{height}', '380'),
      viralScore: Math.min(100, Math.round((viewersByGame[g.id] || 0) / 5000)),
      platform: 'twitch',
      type: 'game'
    }))

    return NextResponse.json({
      success: true,
      data,
      fetchedAt: new Date().toISOString(),
      source: 'live',
      count: data.length
    }, { headers: createRateLimitHeaders(rateLimit) })
  } catch (error) {
    console.error('[ALGO Twitch] API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Twitch data',
      data: FALLBACK_GAMES.slice(0, limit),
      source: 'fallback'
    }, { status: 500 })
  }
}
