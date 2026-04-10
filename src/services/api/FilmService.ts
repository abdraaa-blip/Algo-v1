// =============================================================================
// ALGO V1 — FilmService
// Service unifie pour les films et series - connecte a TMDB
// Architecture professionnelle: cache, validation, fallbacks
// =============================================================================

import { fetchTrendingMovies, fetchTrendingTV, fetchMovieDetails, fetchTVDetails } from '@/lib/api/tmdb-service'
import type { MovieDetails, TVDetails } from '@/lib/api/tmdb-service'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Film {
  id: string
  title: string
  type: 'movie' | 'series'
  poster: string
  backdrop: string
  year: string
  rating: number
  voteCount: number
  genres: string[]
  description: string
  runtime?: number
  seasons?: number
  episodes?: number
  popularity: number
  viralScore: number
  director?: string
  creator?: string
  cast: Array<{ name: string; character: string; photo: string }>
  trailerKey?: string
  trailerUrl?: string
  platforms: Array<{ name: string; url: string; type: string; price?: string }>
  trendingReason?: string
  momentum: 'exploding' | 'rising' | 'stable' | 'fading'
  socialMentions: number
  buzzKeywords?: string[]
}

export interface FilmServiceResponse {
  success: boolean
  data: Film[]
  source: 'live' | 'cache' | 'fallback'
  error?: string
  timestamp: string
}

export interface FilmDetailResponse {
  success: boolean
  data: Film | null
  source: 'live' | 'cache' | 'fallback'
  error?: string
  contentIdeas?: string[]
}

// ─── Cache Configuration ──────────────────────────────────────────────────────

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const filmCache: Map<string, { data: Film[]; expiresAt: Date }> = new Map()
const detailCache: Map<string, { data: Film; expiresAt: Date }> = new Map()

// ─── Utility Functions ────────────────────────────────────────────────────────

function calculateViralScore(popularity: number, voteCount: number, rating: number): number {
  // Combine popularity, votes, and rating into a viral score (0-100)
  const popularityScore = Math.min(popularity / 100, 30) // Max 30 points
  const voteScore = Math.min(voteCount / 1000, 40) // Max 40 points
  const ratingScore = (rating / 10) * 30 // Max 30 points
  return Math.min(99, Math.round(popularityScore + voteScore + ratingScore))
}

function determineMomentum(popularity: number): 'exploding' | 'rising' | 'stable' | 'fading' {
  if (popularity > 500) return 'exploding'
  if (popularity > 200) return 'rising'
  if (popularity > 50) return 'stable'
  return 'fading'
}

function generateTrendingReason(film: Film): string {
  const reasons = []
  
  if (film.viralScore >= 90) reasons.push('En tete des tendances')
  if (film.momentum === 'exploding') reasons.push('Buzz massif sur les reseaux')
  if (film.rating >= 8) reasons.push('Notes excellentes')
  if (film.voteCount > 5000) reasons.push('Tres discute')
  
  if (reasons.length === 0) {
    if (film.type === 'movie') return 'Film populaire du moment'
    return 'Serie populaire du moment'
  }
  
  return reasons[0]
}

function extractBuzzKeywords(title: string, genres: string[]): string[] {
  const keywords = [...genres.slice(0, 3)]
  
  // Add keywords based on common patterns
  if (title.toLowerCase().includes('marvel') || title.toLowerCase().includes('avenger')) {
    keywords.push('superhero', 'blockbuster')
  }
  if (title.toLowerCase().includes('star wars')) {
    keywords.push('sci-fi', 'franchise')
  }
  
  return keywords
}

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Fetch all trending films (movies + series)
 */
export async function getTrendingFilms(): Promise<FilmServiceResponse> {
  const cacheKey = 'trending_all'
  const cached = filmCache.get(cacheKey)
  
  if (cached && cached.expiresAt > new Date()) {
    return {
      success: true,
      data: cached.data,
      source: 'cache',
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    const [movies, tvShows] = await Promise.all([
      fetchTrendingMovies('day'),
      fetchTrendingTV('day')
    ])
    
    const films: Film[] = []
    
    // Transform movies
    for (const movie of movies) {
      const film: Film = {
        id: movie.id,
        title: movie.title,
        type: 'movie',
        poster: movie.posterUrl,
        backdrop: movie.backdropUrl,
        year: movie.releaseDate?.split('-')[0] || '',
        rating: movie.rating,
        voteCount: movie.voteCount,
        genres: movie.genres,
        description: movie.overview,
        runtime: movie.runtime,
        popularity: movie.popularity,
        viralScore: calculateViralScore(movie.popularity, movie.voteCount, movie.rating),
        cast: [],
        platforms: [{ name: 'Cinema', url: '#', type: 'cinema' }],
        momentum: determineMomentum(movie.popularity),
        socialMentions: Math.round(movie.popularity * 10000),
        buzzKeywords: extractBuzzKeywords(movie.title, movie.genres)
      }
      film.trendingReason = generateTrendingReason(film)
      films.push(film)
    }
    
    // Transform TV shows
    for (const show of tvShows) {
      const film: Film = {
        id: show.id,
        title: show.title,
        type: 'series',
        poster: show.posterUrl,
        backdrop: show.backdropUrl,
        year: show.firstAirDate?.split('-')[0] || '',
        rating: show.rating,
        voteCount: show.voteCount,
        genres: show.genres,
        description: show.overview,
        seasons: show.seasons,
        episodes: show.episodes,
        popularity: show.popularity,
        viralScore: calculateViralScore(show.popularity, show.voteCount, show.rating),
        cast: [],
        platforms: [{ name: 'Streaming', url: '#', type: 'streaming' }],
        momentum: determineMomentum(show.popularity),
        socialMentions: Math.round(show.popularity * 10000),
        buzzKeywords: extractBuzzKeywords(show.title, show.genres)
      }
      film.trendingReason = generateTrendingReason(film)
      films.push(film)
    }
    
    // Sort by viral score
    films.sort((a, b) => b.viralScore - a.viralScore)
    
    // Cache results
    filmCache.set(cacheKey, {
      data: films,
      expiresAt: new Date(Date.now() + CACHE_DURATION)
    })
    
    return {
      success: true,
      data: films,
      source: 'live',
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('[FilmService] Error fetching trending films:', error)
    
    // Return cached data if available (even if expired)
    if (cached) {
      return {
        success: true,
        data: cached.data,
        source: 'cache',
        error: 'Using cached data due to API error',
        timestamp: new Date().toISOString()
      }
    }
    
    return {
      success: false,
      data: [],
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get detailed info for a specific film
 */
export async function getFilmDetails(filmId: string): Promise<FilmDetailResponse> {
  const cached = detailCache.get(filmId)
  
  if (cached && cached.expiresAt > new Date()) {
    return {
      success: true,
      data: cached.data,
      source: 'cache',
      contentIdeas: generateContentIdeas(cached.data)
    }
  }
  
  try {
    // Parse the ID to determine type and TMDB ID
    const isMovie = filmId.includes('movie')
    const tmdbId = parseInt(filmId.replace(/[^0-9]/g, ''), 10)
    
    if (isNaN(tmdbId)) {
      return {
        success: false,
        data: null,
        source: 'fallback',
        error: 'Invalid film ID format'
      }
    }
    
    const details: MovieDetails | TVDetails | null = isMovie 
      ? await fetchMovieDetails(tmdbId)
      : await fetchTVDetails(tmdbId)
    
    if (!details) {
      return {
        success: false,
        data: null,
        source: 'fallback',
        error: 'Film not found'
      }
    }
    
    const film: Film = {
      id: details.id,
      title: details.title,
      type: isMovie ? 'movie' : 'series',
      poster: details.posterUrl,
      backdrop: details.backdropUrl,
      year: isMovie 
        ? (details as MovieDetails).releaseDate?.split('-')[0] || ''
        : (details as TVDetails).firstAirDate?.split('-')[0] || '',
      rating: details.rating,
      voteCount: details.voteCount,
      genres: details.genres,
      description: details.overview,
      runtime: isMovie ? (details as MovieDetails).runtime : undefined,
      seasons: !isMovie ? (details as TVDetails).seasons : undefined,
      episodes: !isMovie ? (details as TVDetails).episodes : undefined,
      popularity: details.popularity,
      viralScore: calculateViralScore(details.popularity, details.voteCount, details.rating),
      director: isMovie ? (details as MovieDetails).director : undefined,
      creator: !isMovie ? (details as TVDetails).creator : undefined,
      cast: details.cast,
      trailerKey: details.trailerKey,
      trailerUrl: details.trailerUrl,
      platforms: details.platforms,
      momentum: determineMomentum(details.popularity),
      socialMentions: Math.round(details.popularity * 10000),
      buzzKeywords: extractBuzzKeywords(details.title, details.genres)
    }
    film.trendingReason = generateTrendingReason(film)
    
    // Cache the result
    detailCache.set(filmId, {
      data: film,
      expiresAt: new Date(Date.now() + CACHE_DURATION)
    })
    
    return {
      success: true,
      data: film,
      source: 'live',
      contentIdeas: generateContentIdeas(film)
    }
    
  } catch (error) {
    console.error('[FilmService] Error fetching film details:', error)
    
    if (cached) {
      return {
        success: true,
        data: cached.data,
        source: 'cache',
        error: 'Using cached data',
        contentIdeas: generateContentIdeas(cached.data)
      }
    }
    
    return {
      success: false,
      data: null,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate content ideas for creators based on film data
 */
function generateContentIdeas(film: Film): string[] {
  const ideas: string[] = []
  
  // Genre-based ideas
  if (film.genres.some(g => g.toLowerCase().includes('action'))) {
    ideas.push(`Top 5 des scenes d'action les plus memorables de "${film.title}"`)
    ideas.push(`Analyse des cascades et effets speciaux de "${film.title}"`)
  }
  
  if (film.genres.some(g => g.toLowerCase().includes('comedie') || g.toLowerCase().includes('comedy'))) {
    ideas.push(`Les repliques cultes de "${film.title}" a connaitre`)
  }
  
  if (film.genres.some(g => g.toLowerCase().includes('horreur') || g.toLowerCase().includes('horror'))) {
    ideas.push(`Reaction a "${film.title}" - Est-ce vraiment effrayant ?`)
    ideas.push(`Les details caches que vous avez rates dans "${film.title}"`)
  }
  
  // Rating-based ideas
  if (film.rating >= 8) {
    ideas.push(`Pourquoi "${film.title}" merite un ${film.rating}/10`)
    ideas.push(`"${film.title}" est-il le meilleur ${film.type === 'movie' ? 'film' : 'serie'} de l'annee ?`)
  } else if (film.rating < 6) {
    ideas.push(`"${film.title}" - Critique honnete sans spoilers`)
    ideas.push(`Ce qui ne va pas avec "${film.title}"`)
  }
  
  // Universal ideas
  ideas.push(`Mon avis sur "${film.title}" en ${film.type === 'movie' ? '2' : '5'} minutes`)
  ideas.push(`"${film.title}" - Faut-il le regarder ? Analyse complete`)
  ideas.push(`Theorie : Ce que "${film.title}" nous dit sur la societe`)
  
  // Type-specific ideas
  if (film.type === 'series' && film.seasons && film.seasons > 1) {
    ideas.push(`Recap complet de "${film.title}" avant la nouvelle saison`)
    ideas.push(`L'evolution des personnages dans "${film.title}"`)
  }
  
  // Trailer-based ideas
  if (film.trailerKey) {
    ideas.push(`Reaction au trailer de "${film.title}" - Mes attentes`)
    ideas.push(`Analyse frame par frame du trailer de "${film.title}"`)
  }
  
  return ideas.slice(0, 8) // Return max 8 ideas
}

/**
 * Search films by query
 */
export async function searchFilms(query: string): Promise<FilmServiceResponse> {
  // For now, filter from trending films
  // In production, this would call TMDB search API
  const trending = await getTrendingFilms()
  
  if (!trending.success) return trending
  
  const q = query.toLowerCase()
  const filtered = trending.data.filter(film => 
    film.title.toLowerCase().includes(q) ||
    film.genres.some(g => g.toLowerCase().includes(q)) ||
    film.description.toLowerCase().includes(q)
  )
  
  return {
    ...trending,
    data: filtered
  }
}

/**
 * Get films by type (movie or series)
 */
export async function getFilmsByType(type: 'movie' | 'series'): Promise<FilmServiceResponse> {
  const trending = await getTrendingFilms()
  
  if (!trending.success) return trending
  
  return {
    ...trending,
    data: trending.data.filter(film => film.type === type)
  }
}

// ─── Export Service Object ────────────────────────────────────────────────────

export const FilmService = {
  getTrending: getTrendingFilms,
  getDetails: getFilmDetails,
  search: searchFilms,
  getByType: getFilmsByType,
  generateContentIdeas
}
