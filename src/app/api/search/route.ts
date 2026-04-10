import { NextResponse, type NextRequest } from 'next/server'
import type { Content, Trend, NewsItem, Category, Platform, ContentFormat } from '@/types'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'
import { sanitizeInput } from '@/lib/security'

// Arrays matching the strict Category, Platform, and ContentFormat types from @/types
const CATEGORIES: Category[] = ['Drôle', 'Insolite', 'Buzz', 'Émotion', 'Drama', 'Lifestyle', 'Culture', 'Actu', 'Autre']
const PLATFORMS: Platform[] = ['YouTube', 'TikTok', 'Twitter', 'Instagram', 'Snapchat', 'Reddit', 'Other']
const FORMATS: ContentFormat[] = ['face_cam', 'text', 'montage', 'narration', 'reaction', 'duet']

/**
 * GET /api/search
 * Global search API for content, trends, and news
 * Rate limited: 30 requests per minute per IP
 */
export async function GET(request: NextRequest) {
  // Rate limiting
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
  const type = searchParams.get('type') // 'content' | 'trends' | 'news' | 'all'
  const country = sanitizeInput(searchParams.get('country') || 'FR').toUpperCase()
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 results
  
  if (!query || query.length < 2) {
    return NextResponse.json({ content: [], trends: [], news: [] }, { headers: createRateLimitHeaders(rateLimit) })
  }

  const content: Content[] = []
  const trends: Trend[] = []
  const news: NewsItem[] = []

  // Fetch from YouTube API
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
          
          content.push({
            id: `yt-${videoId}`,
            type: 'video',
            title: item.snippet?.title || '',
            description: item.snippet?.description?.slice(0, 200) || '',
            thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
            sourceUrl: `https://youtube.com/watch?v=${videoId}`,
            platform: 'YouTube',
            category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
            viralScore: Math.floor(70 + Math.random() * 25),
            momentum: 'rising',
            detectedAt: item.snippet?.publishedAt || new Date().toISOString(),
            viewCount: Math.floor(10000 + Math.random() * 900000),
            engagementRate: Math.floor(5 + Math.random() * 15),
            suggestedFormat: 'reaction',
            insights: {
              whyViral: ['Trending search', 'High relevance'],
              peakWindow: 'now',
              bestPlatform: 'YouTube',
              competitorCount: Math.floor(Math.random() * 30),
              audienceOverlap: Math.floor(60 + Math.random() * 40),
            },
          })
        }
      }
    } catch (e) {
      console.error('[Search] YouTube error:', e)
    }
  }

  // Fetch from NewsAPI
  if ((type === 'all' || type === 'news' || !type) && process.env.NEWS_API_KEY) {
    try {
      const newsRes = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=fr&sortBy=relevancy&pageSize=8&apiKey=${process.env.NEWS_API_KEY}`,
        { next: { revalidate: 300 } }
      )
      
      if (newsRes.ok) {
        const newsData = await newsRes.json()
        
        for (const [i, article] of (newsData.articles || []).entries()) {
          news.push({
            id: `news-${i}-${Date.now()}`,
            title: article.title || '',
            summary: article.description || '',
            sourceUrl: article.url || '',
            sourceName: article.source?.name || 'News',
            imageUrl: article.urlToImage || '',
            publishedAt: article.publishedAt || new Date().toISOString(),
            category: CATEGORIES[i % CATEGORIES.length],
            viralScore: Math.floor(60 + Math.random() * 35),
            relatedTrendIds: [],
          })
        }
      }
    } catch (e) {
      console.error('[Search] NewsAPI error:', e)
    }
  }

  // Generate mock trends based on query
  if (type === 'all' || type === 'trends' || !type) {
    const trendSuffixes = ['Trend', 'Viral', 'Challenge', 'Update', 'News']
    
    for (let i = 0; i < 5; i++) {
      trends.push({
        id: `trend-${query}-${i}`,
        name: `#${query.replace(/\s+/g, '')}${trendSuffixes[i]}`,
        displayName: `${query} ${trendSuffixes[i]}`,
        category: CATEGORIES[i % CATEGORIES.length],
        volume: Math.floor(10000 + Math.random() * 500000),
        volumeLabel: `${Math.floor(10 + Math.random() * 490)}K`,
        growth: Math.floor(50 + Math.random() * 400),
        momentum: (['exploding', 'rising', 'stable'] as const)[i % 3],
        rank: i + 1,
        previousRank: i + 2,
        startedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        peakAt: null,
        relatedHashtags: [`#${query}`, '#Trending', '#Viral'],
        curveData: Array.from({ length: 24 }, () => Math.random() * 100),
      })
    }
  }

  // Fallback mock content if no real results
  if (content.length === 0 && (type === 'all' || type === 'content' || !type)) {
    for (let i = 0; i < 6; i++) {
      content.push({
        id: `mock-content-${i}`,
        type: 'video',
        title: `${query.charAt(0).toUpperCase() + query.slice(1)} - ${['Latest', 'Viral', 'Breaking', 'Trending'][i % 4]}`,
        description: `Content about "${query}" - trending now.`,
        thumbnail: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=640&h=360&fit=crop`,
        sourceUrl: `https://example.com/search/${i}`,
        platform: PLATFORMS[i % PLATFORMS.length],
        category: CATEGORIES[i % CATEGORIES.length],
        viralScore: Math.floor(70 + Math.random() * 30),
        momentum: (['rising', 'peak', 'stable'] as const)[i % 3],
        detectedAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
        viewCount: Math.floor(10000 + Math.random() * 900000),
        engagementRate: Math.floor(5 + Math.random() * 15),
        suggestedFormat: FORMATS[i % FORMATS.length],
        insights: {
          whyViral: ['High engagement', 'Trending topic'],
          peakWindow: 'now',
          bestPlatform: PLATFORMS[i % PLATFORMS.length],
          competitorCount: Math.floor(Math.random() * 30),
          audienceOverlap: Math.floor(60 + Math.random() * 40),
        },
      })
    }
  }

  // Fallback mock news if no real results
  if (news.length === 0 && (type === 'all' || type === 'news' || !type)) {
    const sources = ['TechCrunch', 'The Verge', 'BBC', 'Reuters', 'Le Monde']
    
    for (let i = 0; i < 5; i++) {
      news.push({
        id: `mock-news-${i}`,
        title: `${query.charAt(0).toUpperCase() + query.slice(1)}: ${['Breaking', 'Latest', 'Analysis', 'Update', 'Report'][i]}`,
        summary: `News about ${query} - comprehensive coverage.`,
        sourceUrl: `https://news.example.com/${query}/${i}`,
        sourceName: sources[i],
        imageUrl: `https://images.unsplash.com/photo-${1600000000000 + i * 100000}?w=800&h=450&fit=crop`,
        publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        category: CATEGORIES[i % CATEGORIES.length],
        viralScore: Math.floor(60 + Math.random() * 40),
        relatedTrendIds: [],
      })
    }
  }

  const response: { content?: Content[], trends?: Trend[], news?: NewsItem[], query: string, timestamp: string } = {
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

  return NextResponse.json(response)
}
