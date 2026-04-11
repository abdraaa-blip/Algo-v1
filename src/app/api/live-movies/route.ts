import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { 
  fetchTrendingMovies, 
  fetchTrendingTV, 
  fetchTrendingPeople,
  fetchNowPlaying,
  fetchUpcoming,
  fetchAllTrending 
} from '@/lib/api/tmdb-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-live-movies:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all' // movie, tv, person, now_playing, upcoming, all
  const timeWindow = (searchParams.get('time') || 'week') as 'day' | 'week'
  const region = searchParams.get('region') || 'FR'
  
  try {
    switch (type) {
      case 'movie':
        const moviesResult = await fetchTrendingMovies(timeWindow, region)
        return NextResponse.json({
          success: true,
          type: 'movies',
          ...moviesResult,
          count: moviesResult.data.length
        })
        
      case 'tv':
        const tvResult = await fetchTrendingTV(timeWindow, region)
        return NextResponse.json({
          success: true,
          type: 'tv',
          ...tvResult,
          count: tvResult.data.length
        })
        
      case 'person':
        const peopleResult = await fetchTrendingPeople(timeWindow)
        return NextResponse.json({
          success: true,
          type: 'celebrities',
          ...peopleResult,
          count: peopleResult.data.length
        })
        
      case 'now_playing':
        const nowPlayingResult = await fetchNowPlaying(region)
        return NextResponse.json({
          success: true,
          type: 'now_playing',
          ...nowPlayingResult,
          count: nowPlayingResult.data.length
        })
        
      case 'upcoming':
        const upcomingResult = await fetchUpcoming(region)
        return NextResponse.json({
          success: true,
          type: 'upcoming',
          ...upcomingResult,
          count: upcomingResult.data.length
        })
        
      case 'all':
      default:
        const allResult = await fetchAllTrending()
        return NextResponse.json({
          success: true,
          type: 'all',
          ...allResult,
          counts: {
            movies: allResult.movies.length,
            tvShows: allResult.tvShows.length,
            celebrities: allResult.celebrities.length
          }
        })
    }
  } catch (error) {
    console.error('[ALGO API] TMDB fetch failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movie data', data: [], source: 'error' },
      { status: 500 }
    )
  }
}
