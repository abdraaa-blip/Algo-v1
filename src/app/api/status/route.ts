/**
 * ALGO API Status
 * Tests connectivity to all data sources
 */
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-status:${identifier}`, { limit: 24, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const newsKey = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY
  const youtubeKey = process.env.YOUTUBE_API_KEY
  
  const results = {
    timestamp: new Date().toISOString(),
    status: 'checking' as 'live' | 'partial' | 'offline' | 'checking',
    apis: {
      newsapi: {
        configured: !!newsKey,
        test: null as { success: boolean; count: number; source: string; error?: string } | null
      },
      youtube: {
        configured: !!youtubeKey,
        test: null as { success: boolean; count: number; source: string; error?: string } | null
      }
    }
  }
  
  // Test NewsAPI directly
  if (newsKey) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=fr&pageSize=5&apiKey=${newsKey}`,
        { next: { revalidate: 0 } }
      )
      if (response.ok) {
        const data = await response.json()
        results.apis.newsapi.test = {
          success: true,
          count: data.articles?.length || 0,
          source: 'live'
        }
      } else {
        results.apis.newsapi.test = {
          success: false,
          count: 0,
          source: 'error',
          error: `HTTP ${response.status}`
        }
      }
    } catch (error) {
      results.apis.newsapi.test = {
        success: false,
        count: 0,
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  } else {
    results.apis.newsapi.test = {
      success: false,
      count: 0,
      source: 'error',
      error: 'API key not configured'
    }
  }
  
  // Test YouTube API directly
  if (youtubeKey) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=FR&maxResults=5&key=${youtubeKey}`,
        { next: { revalidate: 0 } }
      )
      if (response.ok) {
        const data = await response.json()
        results.apis.youtube.test = {
          success: true,
          count: data.items?.length || 0,
          source: 'live'
        }
      } else {
        results.apis.youtube.test = {
          success: false,
          count: 0,
          source: 'error',
          error: `HTTP ${response.status}`
        }
      }
    } catch (error) {
      results.apis.youtube.test = {
        success: false,
        count: 0,
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  } else {
    results.apis.youtube.test = {
      success: false,
      count: 0,
      source: 'error',
      error: 'API key not configured'
    }
  }
  
  // Calculate overall status
  const newsOk = results.apis.newsapi.test?.success && results.apis.newsapi.test?.source === 'live'
  const youtubeOk = results.apis.youtube.test?.success && results.apis.youtube.test?.source === 'live'
  
  if (newsOk && youtubeOk) {
    results.status = 'live'
  } else if (newsOk || youtubeOk) {
    results.status = 'partial'
  } else {
    results.status = 'offline'
  }
  
  return NextResponse.json(results)
}
