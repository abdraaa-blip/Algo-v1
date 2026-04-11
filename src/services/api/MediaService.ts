// =============================================================================
// ALGO V1 · MediaService
// Service unifie pour les videos et la musique
// Connecte a YouTube Data API et Last.fm
// =============================================================================

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Video {
  id: string
  title: string
  channelTitle: string
  channelId: string
  thumbnail: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
  url: string
  viralScore: number
  growthRate: number
  category: string
  tags: string[]
}

export interface Track {
  id: string
  name: string
  artist: string
  album?: string
  albumArt?: string
  playCount: number
  listeners: number
  url: string
  viralScore: number
  rank: number
  isNew: boolean
}

export interface Artist {
  id: string
  name: string
  image?: string
  listeners: number
  playCount: number
  url: string
  viralScore: number
  rank: number
  tags: string[]
}

export interface MediaServiceResponse<T> {
  success: boolean
  data: T[]
  source: 'live' | 'cache' | 'fallback'
  error?: string
  timestamp: string
}

// ─── Cache Configuration ──────────────────────────────────────────────────────

const VIDEO_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MUSIC_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

const videoCache: Map<string, { data: Video[]; expiresAt: Date }> = new Map()
const trackCache: Map<string, { data: Track[]; expiresAt: Date }> = new Map()
const artistCache: Map<string, { data: Artist[]; expiresAt: Date }> = new Map()

// ─── Utility Functions ────────────────────────────────────────────────────────

function calculateVideoViralScore(views: number, likes: number, comments: number, hoursAgo: number): number {
  // Engagement rate based scoring
  const engagementRate = views > 0 ? ((likes + comments * 2) / views) * 100 : 0
  
  let score = 50 // Base score
  
  // Views contribution (max 30 points)
  if (views > 10000000) score += 30
  else if (views > 1000000) score += 25
  else if (views > 100000) score += 20
  else if (views > 10000) score += 15
  else score += 10
  
  // Engagement contribution (max 25 points)
  if (engagementRate > 10) score += 25
  else if (engagementRate > 5) score += 20
  else if (engagementRate > 2) score += 15
  else score += 10
  
  // Recency bonus (max 15 points)
  if (hoursAgo < 6) score += 15
  else if (hoursAgo < 24) score += 12
  else if (hoursAgo < 48) score += 8
  else if (hoursAgo < 168) score += 5 // 1 week
  
  return Math.min(99, Math.round(score))
}

function calculateMusicViralScore(playCount: number, listeners: number): number {
  let score = 50
  
  // Play count contribution (max 30 points)
  if (playCount > 100000000) score += 30
  else if (playCount > 10000000) score += 25
  else if (playCount > 1000000) score += 20
  else if (playCount > 100000) score += 15
  else score += 10
  
  // Listeners contribution (max 20 points)
  if (listeners > 10000000) score += 20
  else if (listeners > 1000000) score += 15
  else if (listeners > 100000) score += 10
  else score += 5
  
  return Math.min(99, Math.round(score))
}

function guessVideoCategory(title: string, channelTitle: string): string {
  const text = `${title} ${channelTitle}`.toLowerCase()
  
  if (/gaming|fortnite|minecraft|gta|valorant|league|cod|playstation|xbox/.test(text)) return 'Gaming'
  if (/music|official|mv|clip|lyrics|song|feat|ft\./.test(text)) return 'Musique'
  if (/vlog|daily|routine|life|grwm/.test(text)) return 'Lifestyle'
  if (/tutorial|how to|diy|learn|cours/.test(text)) return 'Education'
  if (/news|actualite|politique|reportage/.test(text)) return 'Actualite'
  if (/film|trailer|bande-annonce|review|critique/.test(text)) return 'Cinema'
  if (/comedy|humour|drole|prank|sketch/.test(text)) return 'Humour'
  if (/tech|unboxing|review|apple|samsung|test/.test(text)) return 'Tech'
  if (/sport|football|nba|match|goal/.test(text)) return 'Sport'
  
  return 'Divertissement'
}

// ─── API Fetchers ─────────────────────────────────────────────────────────────

async function fetchVideosFromAPI(country: string = 'FR'): Promise<Video[]> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  const res = await fetch(`${baseUrl}/api/youtube?country=${country}`, {
    next: { revalidate: 300 }
  })
  
  if (!res.ok) {
    throw new Error(`YouTube API returned ${res.status}`)
  }
  
  const data = await res.json()
  
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Invalid YouTube API response')
  }
  
  return data.data.map((video: Record<string, unknown>) => {
    const publishedAt = video.publishedAt as string || new Date().toISOString()
    const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / 3600000
    const views = Number(video.viewCount || 0)
    const likes = Number(video.likeCount || 0)
    const comments = Number(video.commentCount || 0)
    
    return {
      id: video.id as string || `yt_${Date.now()}`,
      title: video.title as string || 'Sans titre',
      channelTitle: video.channelTitle as string || 'Chaine inconnue',
      channelId: video.channelId as string || '',
      thumbnail: video.thumbnail as string || video.thumbnailUrl as string || '',
      publishedAt,
      viewCount: views,
      likeCount: likes,
      commentCount: comments,
      duration: video.duration as string || '',
      url: video.url as string || `https://youtube.com/watch?v=${video.id}`,
      viralScore: calculateVideoViralScore(views, likes, comments, hoursAgo),
      growthRate: Math.floor(Math.random() * 100) + 20, // Would need historical data
      category: guessVideoCategory(video.title as string || '', video.channelTitle as string || ''),
      tags: []
    }
  })
}

async function fetchMusicFromAPI(country: string = 'france'): Promise<{ tracks: Track[]; artists: Artist[] }> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  const res = await fetch(`${baseUrl}/api/live-music?country=${country}`, {
    next: { revalidate: 600 }
  })
  
  if (!res.ok) {
    throw new Error(`Music API returned ${res.status}`)
  }
  
  const data = await res.json()
  
  if (!data.success) {
    throw new Error('Invalid Music API response')
  }
  
  const tracks: Track[] = (data.data?.tracks || []).map((track: Record<string, unknown>, index: number) => ({
    id: `track_${track.name || index}`,
    name: track.name as string || 'Sans titre',
    artist: track.artist as string || 'Artiste inconnu',
    album: track.album as string,
    albumArt: track.image as string || track.albumArt as string,
    playCount: Number(track.playcount || track.playCount || 0),
    listeners: Number(track.listeners || 0),
    url: track.url as string || '#',
    viralScore: calculateMusicViralScore(
      Number(track.playcount || track.playCount || 0),
      Number(track.listeners || 0)
    ),
    rank: index + 1,
    isNew: index < 3
  }))
  
  const artists: Artist[] = (data.data?.artists || []).map((artist: Record<string, unknown>, index: number) => ({
    id: `artist_${artist.name || index}`,
    name: artist.name as string || 'Artiste inconnu',
    image: artist.image as string,
    listeners: Number(artist.listeners || 0),
    playCount: Number(artist.playcount || artist.playCount || 0),
    url: artist.url as string || '#',
    viralScore: calculateMusicViralScore(
      Number(artist.playcount || artist.playCount || 0),
      Number(artist.listeners || 0)
    ),
    rank: index + 1,
    tags: []
  }))
  
  return { tracks, artists }
}

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Get trending videos
 */
export async function getTrendingVideos(country: string = 'FR'): Promise<MediaServiceResponse<Video>> {
  const cacheKey = `videos_${country}`
  const cached = videoCache.get(cacheKey)
  
  if (cached && cached.expiresAt > new Date()) {
    return {
      success: true,
      data: cached.data,
      source: 'cache',
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    const videos = await fetchVideosFromAPI(country)
    
    // Sort by viral score
    videos.sort((a, b) => b.viralScore - a.viralScore)
    
    videoCache.set(cacheKey, {
      data: videos,
      expiresAt: new Date(Date.now() + VIDEO_CACHE_DURATION)
    })
    
    return {
      success: true,
      data: videos,
      source: 'live',
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('[MediaService] Error fetching videos:', error)
    
    if (cached) {
      return {
        success: true,
        data: cached.data,
        source: 'cache',
        error: 'Using cached data',
        timestamp: new Date().toISOString()
      }
    }
    
    return {
      success: false,
      data: [],
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get trending tracks
 */
export async function getTrendingTracks(country: string = 'france'): Promise<MediaServiceResponse<Track>> {
  const cacheKey = `tracks_${country}`
  const cached = trackCache.get(cacheKey)
  
  if (cached && cached.expiresAt > new Date()) {
    return {
      success: true,
      data: cached.data,
      source: 'cache',
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    const { tracks } = await fetchMusicFromAPI(country)
    
    trackCache.set(cacheKey, {
      data: tracks,
      expiresAt: new Date(Date.now() + MUSIC_CACHE_DURATION)
    })
    
    return {
      success: true,
      data: tracks,
      source: 'live',
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('[MediaService] Error fetching tracks:', error)
    
    if (cached) {
      return {
        success: true,
        data: cached.data,
        source: 'cache',
        error: 'Using cached data',
        timestamp: new Date().toISOString()
      }
    }
    
    return {
      success: false,
      data: [],
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get trending artists
 */
export async function getTrendingArtists(country: string = 'france'): Promise<MediaServiceResponse<Artist>> {
  const cacheKey = `artists_${country}`
  const cached = artistCache.get(cacheKey)
  
  if (cached && cached.expiresAt > new Date()) {
    return {
      success: true,
      data: cached.data,
      source: 'cache',
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    const { artists } = await fetchMusicFromAPI(country)
    
    artistCache.set(cacheKey, {
      data: artists,
      expiresAt: new Date(Date.now() + MUSIC_CACHE_DURATION)
    })
    
    return {
      success: true,
      data: artists,
      source: 'live',
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('[MediaService] Error fetching artists:', error)
    
    if (cached) {
      return {
        success: true,
        data: cached.data,
        source: 'cache',
        error: 'Using cached data',
        timestamp: new Date().toISOString()
      }
    }
    
    return {
      success: false,
      data: [],
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get video by ID
 */
export async function getVideoById(videoId: string, country: string = 'FR'): Promise<Video | null> {
  const response = await getTrendingVideos(country)
  
  if (!response.success) return null
  
  return response.data.find(v => v.id === videoId) || null
}

/**
 * Generate content ideas for videos
 */
export function generateVideoContentIdeas(video: Video): string[] {
  const ideas: string[] = []
  
  ideas.push(`Reaction a "${video.title}"`)
  ideas.push(`Pourquoi "${video.title}" cartonne - Analyse`)
  
  switch (video.category) {
    case 'Gaming':
      ideas.push(`Let's play inspire de "${video.title}"`)
      ideas.push(`Tutorial base sur "${video.title}"`)
      break
    case 'Musique':
      ideas.push(`Cover/remix de "${video.title}"`)
      ideas.push(`Analyse musicale de "${video.title}"`)
      break
    case 'Tech':
      ideas.push(`Mon test apres avoir vu "${video.title}"`)
      ideas.push(`Comparatif suite a "${video.title}"`)
      break
    default:
      ideas.push(`Ma version de "${video.title}"`)
  }
  
  if (video.viralScore > 85) {
    ideas.push(`La formule secrete de "${video.title}" - ${video.viewCount.toLocaleString()} vues!`)
  }
  
  return ideas.slice(0, 5)
}

/**
 * Generate content ideas for music
 */
export function generateMusicContentIdeas(track: Track): string[] {
  return [
    `Cover de "${track.name}" par ${track.artist}`,
    `Reaction a "${track.name}" - Premier ecoute`,
    `Pourquoi "${track.name}" est partout en ce moment`,
    `Analyse des paroles de "${track.name}"`,
    `Dance challenge sur "${track.name}"`,
    `Ma playlist autour de "${track.name}"`
  ]
}

// ─── Export Service Object ────────────────────────────────────────────────────

export const MediaService = {
  getVideos: getTrendingVideos,
  getTracks: getTrendingTracks,
  getArtists: getTrendingArtists,
  getVideoById,
  generateVideoIdeas: generateVideoContentIdeas,
  generateMusicIdeas: generateMusicContentIdeas
}
