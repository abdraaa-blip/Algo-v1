/**
 * ALGO VIRAL CONTENT API
 * 
 * Fetches real viral content from external APIs:
 * - YouTube Trending (via Invidious)
 * - Reddit Hot
 * - Hacker News Top
 * - RSS News Feeds
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { 
  fetchAllViralContent,
  fetchYouTubeTrending,
  fetchRedditHot,
  type ViralContent
} from '@/lib/external-apis/real-data-fetcher'

export const revalidate = 300 // Cache for 5 minutes

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-viral-content:${identifier}`, { limit: 50, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country') || 'US'
  const type = searchParams.get('type') as 'all' | 'video' | 'article' | 'post' | null
  const platform = searchParams.get('platform') as 'youtube' | 'reddit' | 'news' | null
  const limit = parseInt(searchParams.get('limit') || '50')
  
  try {
    let content: ViralContent[]
    
    // Fetch based on filters
    if (platform === 'youtube') {
      const videos = await fetchYouTubeTrending(country)
      content = videos.map((video, i) => ({
        id: `yt-${video.id}`,
        type: 'video' as const,
        title: video.title,
        thumbnail: video.thumbnail,
        source: video.channelName,
        platform: 'youtube' as const,
        url: `https://youtube.com/watch?v=${video.id}`,
        embedUrl: `https://www.youtube.com/embed/${video.id}`,
        metrics: { views: video.viewCount },
        publishedAt: video.publishedAt,
        viralScore: Math.max(95 - i * 3, 40),
        duration: video.duration,
      }))
    } else if (platform === 'reddit') {
      const posts = await fetchRedditHot('popular')
      content = posts.map((post, i) => ({
        id: `reddit-${post.id}`,
        type: post.isVideo ? 'video' as const : 'post' as const,
        title: post.title,
        thumbnail: post.thumbnail,
        source: `r/${post.subreddit}`,
        platform: 'reddit' as const,
        url: `https://reddit.com${post.url}`,
        embedUrl: post.videoUrl,
        metrics: { likes: post.score, comments: post.numComments },
        publishedAt: post.createdAt,
        viralScore: Math.max(90 - i * 2, 35),
      }))
    } else {
      // Fetch all content
      content = await fetchAllViralContent(country)
    }
    
    // Filter by type if specified
    if (type) {
      content = content.filter(item => item.type === type)
    }
    
    // Limit results
    content = content.slice(0, limit)
    
    // Add metadata
    const meta = {
      totalItems: content.length,
      sources: [...new Set(content.map(c => c.platform))],
      lastUpdated: new Date().toISOString(),
      country,
    }
    
    return NextResponse.json({
      success: true,
      content,
      meta,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
    
  } catch (error) {
    console.error('[ALGO Viral Content API] Error:', error)
    
    // Return fallback content on error
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch content',
      content: [],
      meta: {
        totalItems: 0,
        sources: [],
        lastUpdated: new Date().toISOString(),
        country,
      }
    }, { status: 500 })
  }
}
