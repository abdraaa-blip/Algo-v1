import { NextRequest, NextResponse } from 'next/server'
import { parseDefaultedListLimit } from '@/lib/api/query-limit'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

interface RelatedItem {
  id: string
  title: string
  score: number
  type: 'trend' | 'video' | 'news'
  thumbnail?: string
  sourceUrl?: string
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-content-related:${identifier}`, { limit: 90, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const contentId = searchParams.get('id')
  const keywords = searchParams.get('keywords')?.split(',').filter(Boolean) || []
  const limit = parseDefaultedListLimit(searchParams.get('limit'), 6, 20)

  if (!contentId) {
    return NextResponse.json(
      { error: 'Content ID is required' },
      { status: 400 }
    )
  }

  // In production: Query database for related content based on:
  // - Keyword similarity
  // - Category/type matching
  // - User behavior (viewed together)
  // - Trending status
  
  const items = generateRelatedContent(keywords, limit, contentId)

  return NextResponse.json({
    items,
    total: items.length,
  })
}

function generateRelatedContent(keywords: string[], limit: number, excludeId: string): RelatedItem[] {
  const types: Array<'trend' | 'video' | 'news'> = ['trend', 'video', 'news']
  
  // Trending topics pool
  const trendingTopics = [
    'AI Revolution', 'Climate Tech', 'Viral Dance', 'New Album Drop',
    'Sports Upset', 'Tech Launch', 'Movie Premiere', 'Gaming News',
    'Fashion Week', 'Food Trend', 'Travel Hack', 'Fitness Challenge',
    ...keywords
  ]

  return Array.from({ length: limit }, (_, i) => {
    const topic = keywords[i % Math.max(1, keywords.length)] || 
                  trendingTopics[Math.floor(Math.random() * trendingTopics.length)]
    const type = types[i % types.length]
    
    return {
      id: `related-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
      title: `${topic} - ${type === 'video' ? 'Watch Now' : type === 'news' ? 'Breaking' : 'Trending'}`,
      score: Math.round(55 + Math.random() * 40),
      type,
      thumbnail: type === 'video' ? `https://picsum.photos/seed/${i + Date.now()}/320/180` : undefined,
    }
  }).filter(item => item.id !== excludeId)
}
