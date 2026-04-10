// =============================================================================
// ALGO V1 — Unified API Services
// Professional service layer for all external data sources
// =============================================================================

export { FilmService, type Film, type FilmServiceResponse, type FilmDetailResponse } from './FilmService'
export { NewsService, type NewsArticle, type NewsServiceResponse, type NewsDetailResponse } from './NewsService'
export { MediaService, type Video, type Track, type Artist, type MediaServiceResponse } from './MediaService'
export { TrendService, type TrendItem, type TrendServiceResponse } from './TrendService'

// Re-export types for convenience
export type {
  MovieDetails,
  TVDetails
} from '@/lib/api/tmdb-service'
