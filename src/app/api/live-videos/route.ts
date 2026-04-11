/**
 * Live Videos API - Self-contained YouTube Data API integration
 * No external imports from real-data-service to avoid Turbopack module resolution issues
 */
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { buildDemoLiveVideos } from '@/lib/data/offline-media-demos'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Self-contained types
interface VideoData {
  id: string
  title: string
  channel: string
  thumbnail: string
  views: number
  viewsFormatted: string
  publishedAt: string
  publishedAtFormatted: string
  duration: string
  viralScore: number
  growthRate: number
  badge: 'Viral' | 'Early' | 'Breaking' | 'Trend'
  country: string
  url: string
  isExploding: boolean
}

interface CacheEntry {
  data: VideoData[]
  fetchedAt: string
  expiresAt: string
}

// In-memory cache
const videoCache = new Map<string, CacheEntry>()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

// Helper functions
function formatViewCount(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function parseDuration(duration: string): string {
  if (!duration) return '0:00'
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

async function fetchYouTubeVideos(country: string): Promise<VideoData[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return []
  }

  const cacheKey = `videos_${country}`
  const cached = videoCache.get(cacheKey)
  const now = Date.now()

  if (cached && new Date(cached.expiresAt).getTime() > now) {
    return cached.data
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${country.toUpperCase()}&maxResults=25&key=${apiKey}`
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    const nowDate = new Date()

    const videos: VideoData[] = (data.items || []).map((item: {
      id: string
      snippet: {
        title: string
        channelTitle: string
        thumbnails: { high?: { url: string }; medium?: { url: string } }
        publishedAt: string
      }
      statistics: { viewCount?: string; likeCount?: string }
      contentDetails?: { duration?: string }
    }, index: number) => {
      const views = parseInt(item.statistics.viewCount || '0', 10)
      const likes = parseInt(item.statistics.likeCount || '0', 10)
      const growthRate = Math.min(Math.floor((likes / Math.max(views, 1)) * 1000), 500)
      const viralScore = Math.min(Math.floor(growthRate / 5) + 60, 99)

      return {
        id: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
        views,
        viewsFormatted: formatViewCount(views),
        publishedAt: item.snippet.publishedAt,
        publishedAtFormatted: formatRelativeTime(item.snippet.publishedAt),
        duration: parseDuration(item.contentDetails?.duration || ''),
        viralScore,
        growthRate,
        badge: (index < 3 ? 'Viral' : index < 8 ? 'Early' : growthRate > 100 ? 'Breaking' : 'Trend') as VideoData['badge'],
        country: country.toUpperCase(),
        url: `https://youtube.com/watch?v=${item.id}`,
        isExploding: viralScore > 85
      }
    })

    // Cache the results
    videoCache.set(cacheKey, {
      data: videos,
      fetchedAt: nowDate.toISOString(),
      expiresAt: new Date(nowDate.getTime() + CACHE_TTL).toISOString()
    })

    return videos
  } catch {
    // Return cached data if available, even if expired
    if (cached) {
      return cached.data
    }
    return []
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`api-live-videos:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(req.url)
  const country = searchParams.get('country') || 'FR'
  const all = searchParams.get('all') === 'true'

  try {
    let videos: VideoData[]
    let fetchedAt = new Date().toISOString()
    let fromDemo = false

    if (all) {
      const countries = ['FR', 'US', 'GB', 'NG']
      const results = await Promise.all(countries.map(c => fetchYouTubeVideos(c)))
      videos = results.flat()
    } else {
      videos = await fetchYouTubeVideos(country.toUpperCase())
    }

    if (videos.length === 0) {
      videos = buildDemoLiveVideos(country.toUpperCase())
      fromDemo = true
    }

    // Check cache for fetchedAt timestamp
    const cacheKey = all ? 'videos_all' : `videos_${country.toUpperCase()}`
    const cached = videoCache.get(cacheKey)
    if (cached && !fromDemo) {
      fetchedAt = cached.fetchedAt
    }

    // Calculate data freshness - honest about cache status
    const isFromCache = cached !== undefined && !fromDemo
    const cacheAge = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : 0
    
    return NextResponse.json({
      success: true,
      data: videos,
      // Honest status labels
      status: videos.length > 0 ? 'active' : 'error',
      source: fromDemo ? 'fallback' : isFromCache ? 'cache' : 'api',
      fetchedAt,
      count: videos.length,
      // Transparency metadata
      meta: {
        refreshIntervalMs: CACHE_TTL,
        refreshIntervalLabel: '15 min',
        cacheAgeMs: cacheAge,
        isFromCache,
        region: country.toUpperCase(),
        // Not "live" - we're honest about periodic updates
        dataFreshness: cacheAge < 60000 ? 'recent' : cacheAge < CACHE_TTL ? 'cached' : 'stale',
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      data: [],
      status: 'error',
      source: 'error',
      fetchedAt: new Date().toISOString(),
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallbackMessage: 'Les videos YouTube sont temporairement indisponibles.',
    })
  }
}
