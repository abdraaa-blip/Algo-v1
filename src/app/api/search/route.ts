import { NextResponse, type NextRequest } from 'next/server'
import type {
  Content,
  Trend,
  NewsItem,
  Category,
  Platform,
  Insight,
  PostProbability,
} from '@/types'
import { fillLocaleStrings } from '@/types'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'
import { sanitizeInput } from '@/lib/security'

const CATEGORIES: Category[] = ['Drôle', 'Insolite', 'Buzz', 'Émotion', 'Drama', 'Lifestyle', 'Culture', 'Actu', 'Autre']
const PLATFORMS: Platform[] = ['YouTube', 'TikTok', 'Twitter', 'Instagram', 'Snapchat', 'Reddit', 'Other']
function insightForScore(viralScore: number): Insight {
  const postNow: PostProbability = viralScore >= 80 ? 'high' : viralScore >= 55 ? 'medium' : 'low'
  return {
    postNowProbability: postNow,
    timing: 'now',
    bestPlatform: ['YouTube'],
    bestFormat: 'reaction',
    timingLabel: fillLocaleStrings({ fr: 'Fenêtre actuelle', en: 'Current window' }),
    postWindow: { status: 'optimal' },
  }
}

function buildContent(params: {
  id: string
  title: string
  category: Category
  platform: Platform
  country: string
  sourceUrl: string
  viralScore: number
  thumbnail?: string
  detectedAt: string
}): Content {
  return {
    id: params.id,
    title: params.title,
    category: params.category,
    platform: params.platform,
    country: params.country,
    language: 'fr',
    viralScore: params.viralScore,
    badge: 'Trend',
    views: Math.floor(10000 + Math.random() * 900000),
    growthRate: 12,
    growthTrend: 'up',
    detectedAt: params.detectedAt,
    thumbnail: params.thumbnail,
    sourceUrl: params.sourceUrl,
    explanation: '',
    creatorTips: '',
    insight: insightForScore(params.viralScore),
    sourceDistribution: [{ platform: params.platform, percentage: 60, momentum: 'high' }],
    watchersCount: Math.floor(100 + Math.random() * 5000),
    isExploding: params.viralScore >= 85,
  }
}

function buildNewsItem(params: {
  id: string
  title: string
  summary: string
  sourceUrl: string
  country: string
  detectedAt: string
  thumb?: string
}): NewsItem {
  return {
    id: params.id,
    title: params.title,
    summary: params.summary,
    importanceScore: Math.floor(60 + Math.random() * 35),
    speedScore: Math.floor(50 + Math.random() * 40),
    tags: [],
    sourceUrl: params.sourceUrl,
    detectedAt: params.detectedAt,
    country: params.country,
    language: 'fr',
    relatedContentIds: [],
    thumbnail: params.thumb,
  }
}

function buildTrend(params: {
  id: string
  name: string
  category: Category
  country: string
  score: number
  isExploding: boolean
}): Trend {
  return {
    id: params.id,
    name: params.name,
    platform: 'YouTube',
    category: params.category,
    growthRate: Math.floor(20 + Math.random() * 80),
    growthTrend: 'up',
    score: params.score,
    relatedContentIds: [],
    explanation: '',
    recommendedFormat: ['reaction'],
    country: params.country,
    language: 'fr',
    watchersCount: Math.floor(500 + Math.random() * 8000),
    isExploding: params.isExploding,
  }
}

/**
 * GET /api/search
 * Global search API for content, trends, and news
 * Rate limited: 30 requests per minute per IP
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, { limit: 30, windowMs: 60000 })

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get('q') || ''
  const query = sanitizeInput(rawQuery).toLowerCase()
  const type = searchParams.get('type')
  const country = sanitizeInput(searchParams.get('country') || 'FR').toUpperCase()
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50)

  if (!query || query.length < 2) {
    return NextResponse.json({ content: [], trends: [], news: [] }, { headers: createRateLimitHeaders(rateLimit) })
  }

  const content: Content[] = []
  const trends: Trend[] = []
  const news: NewsItem[] = []

  if ((type === 'all' || type === 'content' || !type) && process.env.YOUTUBE_API_KEY) {
    try {
      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=8&regionCode=${country}&key=${process.env.YOUTUBE_API_KEY}`,
        { next: { revalidate: 300 } }
      )

      if (ytRes.ok) {
        const ytData = await ytRes.json()
        for (const item of ytData.items || []) {
          const videoId = item.id?.videoId
          if (!videoId) continue
          content.push(
            buildContent({
              id: `yt-${videoId}`,
              title: item.snippet?.title || '',
              category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
              platform: 'YouTube',
              country,
              sourceUrl: `https://youtube.com/watch?v=${videoId}`,
              viralScore: Math.floor(70 + Math.random() * 25),
              thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
              detectedAt: item.snippet?.publishedAt || new Date().toISOString(),
            })
          )
        }
      }
    } catch (e) {
      console.error('[Search] YouTube error:', e)
    }
  }

  if ((type === 'all' || type === 'news' || !type) && process.env.NEWS_API_KEY) {
    try {
      const newsRes = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=fr&sortBy=relevancy&pageSize=8&apiKey=${process.env.NEWS_API_KEY}`,
        { next: { revalidate: 300 } }
      )

      if (newsRes.ok) {
        const newsData = await newsRes.json()
        for (const [i, article] of (newsData.articles || []).entries()) {
          news.push(
            buildNewsItem({
              id: `news-${i}-${Date.now()}`,
              title: article.title || '',
              summary: article.description || '',
              sourceUrl: article.url || '',
              country,
              detectedAt: article.publishedAt || new Date().toISOString(),
              thumb: article.urlToImage || undefined,
            })
          )
        }
      }
    } catch (e) {
      console.error('[Search] NewsAPI error:', e)
    }
  }

  if (type === 'all' || type === 'trends' || !type) {
    const trendSuffixes = ['Trend', 'Viral', 'Challenge', 'Update', 'News']
    for (let i = 0; i < 5; i++) {
      trends.push(
        buildTrend({
          id: `trend-${query}-${i}`,
          name: `#${query.replace(/\s+/g, '')}${trendSuffixes[i]}`,
          category: CATEGORIES[i % CATEGORIES.length],
          country,
          score: 90 - i * 8,
          isExploding: i < 2,
        })
      )
    }
  }

  if (content.length === 0 && (type === 'all' || type === 'content' || !type)) {
    for (let i = 0; i < 6; i++) {
      content.push(
        buildContent({
          id: `mock-content-${i}`,
          title: `${query.charAt(0).toUpperCase() + query.slice(1)} - ${['Latest', 'Viral', 'Breaking', 'Trending'][i % 4]}`,
          category: CATEGORIES[i % CATEGORIES.length],
          platform: PLATFORMS[i % PLATFORMS.length],
          country,
          sourceUrl: `https://example.com/search/${i}`,
          viralScore: Math.floor(70 + Math.random() * 30),
          thumbnail: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=640&h=360&fit=crop`,
          detectedAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
        })
      )
    }
  }

  if (news.length === 0 && (type === 'all' || type === 'news' || !type)) {
    for (let i = 0; i < 5; i++) {
      news.push(
        buildNewsItem({
          id: `mock-news-${i}`,
          title: `${query.charAt(0).toUpperCase() + query.slice(1)}: ${['Breaking', 'Latest', 'Analysis', 'Update', 'Report'][i]}`,
          summary: `News about ${query} - comprehensive coverage.`,
          sourceUrl: `https://news.example.com/${query}/${i}`,
          country,
          detectedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          thumb: `https://images.unsplash.com/photo-${1600000000000 + i * 100000}?w=800&h=450&fit=crop`,
        })
      )
    }
  }

  const response: {
    content?: Content[]
    trends?: Trend[]
    news?: NewsItem[]
    query: string
    timestamp: string
  } = {
    query,
    timestamp: new Date().toISOString(),
  }

  if (type === 'all' || type === 'content' || !type) {
    response.content = content.slice(0, limit)
  }
  if (type === 'all' || type === 'trends' || !type) {
    response.trends = trends.slice(0, limit)
  }
  if (type === 'all' || type === 'news' || !type) {
    response.news = news.slice(0, limit)
  }

  return NextResponse.json(response, { headers: createRateLimitHeaders(rateLimit) })
}
