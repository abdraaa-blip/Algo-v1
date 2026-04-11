import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

// =============================================================================
// ALGO V1 · TMDB Detail API
// Fetches full movie/series details including trailer, cast, and similar content
// =============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`api-tmdb-id:${identifier}`, { limit: 90, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { id } = await params
  const tmdbId = id.replace('tmdb-', '')
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 })
  }
  
  try {
    // Fetch movie details, videos, credits, and similar in parallel
    const [detailsRes, videosRes, creditsRes, similarRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=fr-FR&append_to_response=release_dates`),
      fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${apiKey}&language=fr-FR`),
      fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${apiKey}&language=fr-FR`),
      fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/similar?api_key=${apiKey}&language=fr-FR&page=1`),
    ])
    
    // If movie not found, try TV show
    if (!detailsRes.ok) {
      const [tvDetailsRes, tvVideosRes, tvCreditsRes, tvSimilarRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=fr-FR`),
        fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/videos?api_key=${apiKey}&language=fr-FR`),
        fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/credits?api_key=${apiKey}&language=fr-FR`),
        fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/similar?api_key=${apiKey}&language=fr-FR&page=1`),
      ])
      
      if (!tvDetailsRes.ok) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }
      
      const details = await tvDetailsRes.json()
      const videos = await tvVideosRes.json()
      const credits = await tvCreditsRes.json()
      const similar = await tvSimilarRes.json()
      
      return buildResponse(details, videos, credits, similar, 'tv')
    }
    
    const details = await detailsRes.json()
    const videos = await videosRes.json()
    const credits = await creditsRes.json()
    const similar = await similarRes.json()
    
    return buildResponse(details, videos, credits, similar, 'movie')
  } catch (e) {
    console.error('TMDB fetch error:', e)
    return NextResponse.json({ error: 'TMDB fetch failed' }, { status: 500 })
  }
}

interface TMDBDetails {
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  [key: string]: unknown
}

interface TMDBVideo {
  type: string
  site: string
  iso_639_1: string
  key: string
}

interface TMDBCast {
  id: number
  name: string
  character: string
  profile_path: string | null
}

interface TMDBSimilar {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  popularity: number
  release_date?: string
  first_air_date?: string
}

function buildResponse(
  details: TMDBDetails,
  videos: { results?: TMDBVideo[] },
  credits: { cast?: TMDBCast[] },
  similar: { results?: TMDBSimilar[] },
  type: 'movie' | 'tv'
) {
  // Find best trailer: French first, then English, then any YouTube video
  const allVideos = videos.results || []
  const trailer = 
    allVideos.find((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'fr') ||
    allVideos.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    allVideos.find((v) => v.site === 'YouTube')
  
  return NextResponse.json({
    type,
    details: {
      ...details,
      title: details.title || details.name,
      releaseDate: details.release_date || details.first_air_date,
    },
    trailerKey: trailer?.key || null,
    cast: (credits.cast || []).slice(0, 8).map((a) => ({
      id: a.id,
      name: a.name,
      character: a.character,
      photo: a.profile_path ? `https://image.tmdb.org/t/p/w185${a.profile_path}` : null,
    })),
    similar: (similar.results || []).slice(0, 6).map((m) => ({
      id: `tmdb-${m.id}`,
      title: m.title || m.name,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
      score: Math.min(Math.floor(m.popularity / 10), 99),
      badge: m.popularity > 200 ? 'Trend' : 'Early',
      year: (m.release_date || m.first_air_date)?.slice(0, 4),
    })),
  })
}
