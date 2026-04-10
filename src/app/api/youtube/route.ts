/**
 * YouTube API Route - Netflix SRE Standard
 * 
 * Features:
 * - Circuit breaker protection
 * - Bulkhead isolation
 * - Exponential backoff with jitter
 * - Graceful degradation to cache/fallback
 * - Proper error handling
 */
import { NextRequest, NextResponse } from 'next/server'
import { resilientFetch } from '@/services/Resilience'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface YouTubeVideoItem {
  id: string
  snippet?: {
    title?: string
    publishedAt?: string
    defaultLanguage?: string
    thumbnails?: {
      high?: { url?: string }
    }
  }
  statistics?: {
    viewCount?: string
    likeCount?: string
  }
}

interface YouTubeResponse {
  items?: YouTubeVideoItem[]
}

// Fallback data when API is unavailable
function getFallbackData(regionCode: string) {
  return [
    {
      id: 'youtube-fallback-1',
      title: 'Tendance en cours de chargement...',
      category: 'Culture',
      platform: 'YouTube',
      country: regionCode,
      language: 'fr',
      viralScore: 75,
      badge: 'Trend',
      views: 0,
      growthRate: 100,
      growthTrend: 'up' as const,
      detectedAt: new Date().toISOString(),
      thumbnail: '',
      sourceUrl: 'https://youtube.com',
      explanation: 'Données en cours de chargement...',
      creatorTips: 'Actualise la page dans quelques instants.',
      insight: {
        postNowProbability: 'medium' as const,
        timing: 'now',
        bestPlatform: ['YouTube'],
        bestFormat: 'reaction',
        timingLabel: { fr: 'En attente', en: 'Loading' },
        postWindow: { status: 'optimal' as const },
      },
      sourceDistribution: [
        { platform: 'YouTube', percentage: 100, momentum: 'medium' as const },
      ],
      watchersCount: 0,
      isExploding: false,
    }
  ]
}

function transformYouTubeData(data: YouTubeResponse, regionCode: string) {
  return ((data.items || []) as YouTubeVideoItem[]).map((item) => {
    const views = parseInt(item.statistics?.viewCount || '0')
    const likes = parseInt(item.statistics?.likeCount || '0')
    const growthRate = Math.min(Math.floor((likes / Math.max(views, 1)) * 1000), 500)

    return {
      id: `youtube-${item.id}`,
      title: item.snippet?.title || '',
      category: 'Culture',
      platform: 'YouTube',
      country: regionCode,
      language: item.snippet?.defaultLanguage || 'fr',
      viralScore: Math.min(Math.floor(growthRate / 5) + 60, 99),
      badge: growthRate > 200 ? 'Viral' : growthRate > 100 ? 'Early' : 'Trend',
      views,
      growthRate,
      growthTrend: 'up' as const,
      detectedAt: item.snippet?.publishedAt || new Date().toISOString(),
      thumbnail: item.snippet?.thumbnails?.high?.url || '',
      sourceUrl: `https://youtube.com/watch?v=${item.id}`,
      explanation: `Video tendance sur YouTube ${regionCode} avec ${views.toLocaleString('fr-FR')} vues.`,
      creatorTips: 'Analyse ce format et adapte-le a ton audience.',
      insight: {
        postNowProbability: growthRate > 200 ? 'high' : 'medium',
        timing: 'now',
        bestPlatform: ['YouTube', 'TikTok'],
        bestFormat: 'reaction',
        timingLabel: { fr: 'Fenetre active', en: 'Active window' },
        postWindow: { status: 'optimal' as const },
      },
      sourceDistribution: [
        { platform: 'YouTube', percentage: 70, momentum: 'high' as const },
        { platform: 'TikTok', percentage: 30, momentum: 'medium' as const },
      ],
      watchersCount: Math.floor(views / 1000),
      isExploding: growthRate > 300,
    }
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const country = searchParams.get('country') || 'FR'
  const regionCode = country === 'global' ? 'FR' : country.toUpperCase()
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    return NextResponse.json(getFallbackData(regionCode), {
      headers: {
        'X-Data-Source': 'fallback',
        'X-Fallback-Reason': 'no-api-key'
      }
    })
  }

  try {
    const contents = await resilientFetch(
      'youtube',
      async () => {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=20&key=${apiKey}`
        const res = await fetch(url, { 
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(10000) // 10s timeout
        })

        if (!res.ok) {
          throw new Error(`YouTube API error: ${res.status}`)
        }
        
        const data: YouTubeResponse = await res.json()
        return transformYouTubeData(data, regionCode)
      },
      {
        cacheKey: { source: 'youtube', scope: regionCode },
        fallback: () => getFallbackData(regionCode),
        timeout: 15000,
        retryConfig: {
          maxRetries: 2,
          baseDelay: 500,
          maxDelay: 5000
        }
      }
    )

    return NextResponse.json(contents, {
      headers: {
        'X-Data-Source': 'live',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('[YouTube API] Fatal error:', error)
    return NextResponse.json(getFallbackData(regionCode), {
      status: 200,
      headers: {
        'X-Data-Source': 'fallback',
        'X-Fallback-Reason': 'error'
      }
    })
  }
}
