import { NextRequest, NextResponse } from 'next/server'
import { 
  fetchTrendingMovies, 
  fetchTrendingTV, 
  fetchNowPlaying,
  type RealMovie,
  type RealTVShow
} from '@/lib/api/tmdb-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Movie {
  id: string
  title: string
  type: 'movie' | 'series'
  year: number
  poster: string
  backdrop: string
  rating: number
  viralScore: number
  momentum: 'exploding' | 'rising' | 'stable' | 'declining'
  genre: string[]
  runtime?: number
  seasons?: number
  description: string
  director?: string
  creator?: string
  cast: Array<{ name: string; character: string; photo: string }>
  platforms: Array<{ name: string; url: string; type: string; price?: string }>
  trailer?: string
  trendingReason?: string
  buzzKeywords: string[]
  socialMentions: number
  awards?: string
  source: 'live' | 'cache' | 'fallback'
  fetchedAt: string
}

// Calculate momentum based on popularity
function calculateMomentum(popularity: number): 'exploding' | 'rising' | 'stable' | 'declining' {
  if (popularity > 1000) return 'exploding'
  if (popularity > 500) return 'rising'
  if (popularity > 100) return 'stable'
  return 'declining'
}

// Calculate viral score based on rating and popularity
function calculateViralScore(rating: number, popularity: number): number {
  const normalizedRating = rating * 10 // 0-100
  const normalizedPopularity = Math.min(popularity / 20, 100) // Cap at 100
  return Math.round((normalizedRating * 0.6) + (normalizedPopularity * 0.4))
}

// Generate buzz keywords from genres
function generateBuzzKeywords(genres: string[], rating: number): string[] {
  const keywords = [...genres]
  if (rating > 8) keywords.push('Chef-d\'oeuvre')
  if (rating > 7) keywords.push('Must-See')
  return keywords.slice(0, 4)
}

// Transform TMDB movie to our Movie type
function transformMovie(movie: RealMovie, index: number): Movie {
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : new Date().getFullYear()
  const viralScore = calculateViralScore(movie.rating, movie.popularity)
  
  return {
    id: movie.id,
    title: movie.title,
    type: 'movie',
    year,
    poster: movie.posterUrl,
    backdrop: movie.backdropUrl,
    rating: movie.rating,
    viralScore,
    momentum: calculateMomentum(movie.popularity),
    genre: movie.genres,
    description: movie.overview || 'Aucune description disponible pour ce film.',
    cast: [], // TMDB basic endpoints don't include cast
    platforms: [
      { name: 'Cinema', url: '#', type: 'cinema' },
      { name: 'À venir', url: '#', type: 'streaming' }
    ],
    trendingReason: index < 5 ? 'Top du box-office' : 'Tendance cette semaine',
    buzzKeywords: generateBuzzKeywords(movie.genres, movie.rating),
    socialMentions: Math.round(movie.popularity * 100),
    source: 'live',
    fetchedAt: movie.fetchedAt
  }
}

// Transform TMDB TV show to our Movie type
function transformTVShow(show: RealTVShow, index: number): Movie {
  const year = show.firstAirDate ? new Date(show.firstAirDate).getFullYear() : new Date().getFullYear()
  const viralScore = calculateViralScore(show.rating, show.popularity)
  
  return {
    id: show.id,
    title: show.title,
    type: 'series',
    year,
    poster: show.posterUrl,
    backdrop: show.backdropUrl,
    rating: show.rating,
    viralScore,
    momentum: calculateMomentum(show.popularity),
    genre: show.genres,
    description: show.overview || 'Aucune description disponible pour cette serie.',
    cast: [],
    platforms: [
      { name: 'Streaming', url: '#', type: 'streaming' }
    ],
    trendingReason: index < 5 ? 'Série la plus regardée' : 'Tendance cette semaine',
    buzzKeywords: generateBuzzKeywords(show.genres, show.rating),
    socialMentions: Math.round(show.popularity * 100),
    source: 'live',
    fetchedAt: show.fetchedAt
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'
  const region = searchParams.get('region') || 'FR'
  
  try {
    let movies: Movie[] = []
    let source: 'live' | 'cache' | 'fallback' | 'mixed' = 'live'
    
    if (type === 'movie' || type === 'all') {
      const [trendingResult, nowPlayingResult] = await Promise.all([
        fetchTrendingMovies('week', region),
        fetchNowPlaying(region)
      ])
      
      // Deduplicate by ID
      const seen = new Set<string>()
      const allMovies = [...trendingResult.data, ...nowPlayingResult.data]
      const uniqueMovies = allMovies.filter(m => {
        const key = m.id
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      
      movies.push(...uniqueMovies.map((m, i) => transformMovie(m, i)))
      
      if (trendingResult.source !== 'live' || nowPlayingResult.source !== 'live') {
        source = 'mixed'
      }
    }
    
    if (type === 'series' || type === 'all') {
      const tvResult = await fetchTrendingTV('week', region)
      movies.push(...tvResult.data.map((s, i) => transformTVShow(s, i)))
      
      if (tvResult.source !== 'live') {
        source = source === 'live' ? tvResult.source : 'mixed'
      }
    }
    
    // Sort by viral score
    movies.sort((a, b) => b.viralScore - a.viralScore)
    
    // Deduplicate final list by ID
    const finalSeen = new Set<string>()
    movies = movies.filter(m => {
      if (finalSeen.has(m.id)) return false
      finalSeen.add(m.id)
      return true
    })
    
    // Filter out films without required data (title, poster, synopsis)
    // This ensures all displayed films have at least the minimum required info
    movies = movies.filter(m => {
      const hasTitle = m.title && m.title.trim().length > 0
      const hasPoster = m.poster && m.poster.startsWith('http')
      const hasDescription = m.description && m.description.length > 10
      return hasTitle && hasPoster && hasDescription
    })
    
    return NextResponse.json({
      success: true,
      movies,
      count: movies.length,
      source,
      fetchedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[ALGO API] Movies fetch failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movies', movies: [], source: 'error' },
      { status: 500 }
    )
  }
}
