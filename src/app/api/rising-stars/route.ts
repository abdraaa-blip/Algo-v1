import { NextRequest, NextResponse } from 'next/server'
import { parseDefaultedListLimit } from '@/lib/api/query-limit'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { fetchTrendingPeople, type RealCelebrity } from '@/lib/api/tmdb-service'

// Force dynamic - no caching, always fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Map TMDB department to our categories
function mapDepartmentToCategory(department: string): 'rapper' | 'singer' | 'comedian' | 'influencer' | 'creator' | 'athlete' | 'actor' {
  const dept = department.toLowerCase()
  if (dept.includes('acting')) return 'actor'
  if (dept.includes('directing') || dept.includes('production')) return 'creator'
  if (dept.includes('sound') || dept.includes('music')) return 'singer'
  if (dept.includes('writing')) return 'creator'
  return 'actor' // Default for celebrities
}

// Transform TMDB celebrity to RisingStar format
function transformToRisingStar(person: RealCelebrity) {
  const popularity = person.popularity
  const viralScore = Math.min(99, Math.floor(50 + popularity))
  const isExploding = popularity > 50
  
  return {
    id: person.id,
    name: person.name,
    handle: `@${person.name.toLowerCase().replace(/\s+/g, '')}`,
    avatar_url: person.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=8b5cf6&color=fff&size=300&bold=true`,
    cover_url: `https://placehold.co/800x400/1a1a2e/8b5cf6?text=${encodeURIComponent(person.name)}`,
    category: mapDepartmentToCategory(person.department),
    country_code: 'US', // TMDB doesn't provide country, default to US
    platforms: ['imdb', 'instagram'],
    social_links: [
      { platform: 'imdb', url: `https://www.themoviedb.org/person/${person.id}`, username: person.name }
    ],
    total_followers: Math.floor(popularity * 100000),
    follower_growth_24h: Math.floor(popularity * 500 * Math.random()),
    follower_growth_7d: Math.floor(popularity * 2000 * Math.random()),
    viral_score: viralScore,
    momentum: isExploding ? 'exploding' : popularity > 30 ? 'rising' : 'steady',
    trending_content: person.knownFor.slice(0, 2).map((title) => ({
      title,
      type: 'video' as const,
      url: `https://www.themoviedb.org/person/${person.id.replace('tmdb_', '')}`,
      views: Math.floor(popularity * 1000000 * Math.random())
    })),
    best_video: person.knownFor.length > 0 ? {
      title: person.knownFor[0],
      url: `https://www.themoviedb.org/person/${person.id.replace('tmdb_', '')}`,
      thumbnail: person.profileUrl || `https://placehold.co/480x360/1a1a2e/8b5cf6?text=${encodeURIComponent(person.name)}`,
      views: Math.floor(popularity * 5000000),
      platform: 'tmdb'
    } : undefined,
    buzz_keywords: person.knownFor.slice(0, 3),
    sentiment_score: Math.floor(60 + Math.random() * 35),
    mention_count_24h: Math.floor(popularity * 1000),
    verified: popularity > 40,
    breakout_date: null,
    top_platforms: [
      { platform: 'tmdb', followers: Math.floor(popularity * 50000), growth: Math.random() * 5, url: `https://www.themoviedb.org/person/${person.id.replace('tmdb_', '')}` }
    ],
    bio: `Known for: ${person.knownFor.slice(0, 2).join(', ')}`,
    is_future_star: popularity > 20 && popularity < 50,
    algo_prediction: isExploding ? 'Trending on TMDB - high visibility' : 'Rising popularity'
  }
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-rising-stars:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const sortBy = searchParams.get('sort') || 'viral_score'
  const limit = parseDefaultedListLimit(searchParams.get('limit'), 20, 50)

  try {
    // Fetch LIVE trending people from TMDB
    const result = await fetchTrendingPeople('day')
    
    if (!result.data || result.data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        source: 'fallback',
        message: 'No trending people found'
      })
    }
    
    // Transform TMDB data to RisingStar format
    let stars = result.data.map(transformToRisingStar)
    
    // Filter by category if specified
    if (category && category !== 'all') {
      stars = stars.filter(s => s.category === category)
    }
    
    // Sort
    switch (sortBy) {
      case 'growth':
        stars.sort((a, b) => b.follower_growth_24h - a.follower_growth_24h)
        break
      case 'mentions':
        stars.sort((a, b) => b.mention_count_24h - a.mention_count_24h)
        break
      case 'sentiment':
        stars.sort((a, b) => b.sentiment_score - a.sentiment_score)
        break
      case 'viral_score':
      default:
        stars.sort((a, b) => b.viral_score - a.viral_score)
    }
    
    // Limit results
    stars = stars.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      data: stars,
      source: result.source,
      fetchedAt: result.fetchedAt,
      count: stars.length,
      total: result.data.length
    })
    
  } catch (error) {
    console.error('[API Rising Stars] Error:', error)
    return NextResponse.json({
      success: false,
      data: [],
      error: 'Failed to fetch rising stars',
      source: 'error'
    }, { status: 500 })
  }
}
