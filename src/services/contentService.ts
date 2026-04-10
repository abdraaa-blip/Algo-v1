// =============================================================================
// ALGO V1 — contentService
// Logique d'acces et de filtrage des contenus.
// REFACTORED: Now delegates to real API services instead of mock data
// =============================================================================

import { mockContent } from '@/data/mock-content'
import { filterContentsByScope } from '@/services/scopeService'
import type { Content, AppScope, Category, Platform, BadgeType, GrowthTrend } from '@/types'

// Import real API services (used in async functions)
// Services are imported dynamically to avoid circular dependencies

// ─── Filtres ──────────────────────────────────────────────────────────────────

export interface ContentFilters {
  scope?:      AppScope
  category?:   Category
  platform?:   Platform
  badge?:      BadgeType
  growthTrend?:GrowthTrend
  isExploding?:boolean
  limit?:      number
  offset?:     number
}

// ─── Lecture (Sync - uses mock data as fallback) ─────────────────────────────

/**
 * Retourne les contenus filtrés et triés par Viral Score décroissant.
 * Note: This is the synchronous version using mock data.
 * For real-time data, use getContentsAsync() instead.
 */
export function getContents(filters: ContentFilters = {}): Content[] {
  let results = [...mockContent]

  // Filtrage scope
  if (filters.scope) {
    results = filterContentsByScope(results, filters.scope)
  }

  // Filtres métier
  if (filters.category)    results = results.filter((c) => c.category    === filters.category)
  if (filters.platform)    results = results.filter((c) => c.platform    === filters.platform)
  if (filters.badge)       results = results.filter((c) => c.badge       === filters.badge)
  if (filters.growthTrend) results = results.filter((c) => c.growthTrend === filters.growthTrend)
  if (filters.isExploding !== undefined) {
    results = results.filter((c) => c.isExploding === filters.isExploding)
  }

  // Tri par score décroissant
  results = results.sort((a, b) => b.viralScore - a.viralScore)

  // Pagination
  if (filters.offset) results = results.slice(filters.offset)
  if (filters.limit)  results = results.slice(0, filters.limit)

  return results
}

/**
 * Retourne les contenus filtrés par scope, triés par Viral Score.
 */
export function getContentsByScope(scope: AppScope, limit?: number): Content[] {
  const filtered = filterContentsByScope(mockContent, scope)
  const sorted   = filtered.sort((a, b) => b.viralScore - a.viralScore)
  return limit ? sorted.slice(0, limit) : sorted
}

/**
 * Retourne un contenu par son ID.
 * Pour les IDs d'API réelles (youtube-, tmdb-, lastfm-), retourne null
 * car ces contenus doivent être fetchés dynamiquement.
 */
export function getContentById(id: string): Content | undefined {
  // Check if it's a real API ID that needs dynamic fetching
  if (isRealApiContentId(id)) {
    return undefined // Will be handled by the page's async fetch
  }
  return mockContent.find((c) => c.id === id)
}

/**
 * Vérifie si un ID correspond à du contenu d'API réelle.
 */
export function isRealApiContentId(id: string): boolean {
  return (
    id.startsWith('youtube-') || 
    id.startsWith('yt_') ||
    id.startsWith('tmdb-') || 
    id.startsWith('tmdb_movie_') ||
    id.startsWith('tmdb_tv_') ||
    id.startsWith('lastfm-') || 
    id.startsWith('track_') ||
    id.startsWith('artist_') ||
    id.startsWith('news-') ||
    id.startsWith('news_') ||
    id.startsWith('reddit_') ||
    id.startsWith('gh_') ||
    id.startsWith('hn_') ||
    id.startsWith('github_') ||
    id.startsWith('hackernews_')
  )
}

/**
 * Determine le type de contenu basé sur l'ID
 */
export function getContentTypeFromId(id: string): 'video' | 'film' | 'music' | 'news' | 'trend' | 'unknown' {
  if (id.startsWith('youtube-') || id.startsWith('yt_')) return 'video'
  if (id.startsWith('tmdb-') || id.startsWith('tmdb_movie_') || id.startsWith('tmdb_tv_')) return 'film'
  if (id.startsWith('lastfm-') || id.startsWith('track_') || id.startsWith('artist_')) return 'music'
  if (id.startsWith('news-') || id.startsWith('news_')) return 'news'
  if (id.startsWith('reddit_') || id.startsWith('gh_')) return 'trend'
  return 'unknown'
}

/**
 * Retourne les contenus en explosion (isExploding: true), triés par score.
 */
export function getExplodingContents(limit = 5): Content[] {
  return mockContent
    .filter((c) => c.isExploding)
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, limit)
}

/**
 * Retourne les signaux précoces (badge Early), triés par growthRate.
 */
export function getEarlySignals(limit = 5): Content[] {
  return mockContent
    .filter((c) => c.badge === 'Early')
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, limit)
}

/**
 * Retourne les contenus pour le Fail Lab (AlmostViral ou growthTrend down).
 */
export function getFailLabContents(limit = 10): Content[] {
  return mockContent
    .filter((c) => c.badge === 'AlmostViral' || c.growthTrend === 'down')
    .sort((a, b) => a.viralScore - b.viralScore) // les plus faibles en premier
    .slice(0, limit)
}

/**
 * Recherche textuelle dans titre, catégorie et explication.
 */
export function searchContents(query: string, scope: AppScope): Content[] {
  if (!query.trim()) return []

  const q = query.toLowerCase().trim()

  let results = mockContent.filter((c) =>
    c.title.toLowerCase().includes(q)       ||
    c.category.toLowerCase().includes(q)    ||
    c.explanation.toLowerCase().includes(q) ||
    c.platform.toLowerCase().includes(q)
  )

  results = filterContentsByScope(results, scope)
  return results.sort((a, b) => b.viralScore - a.viralScore)
}

/**
 * Retourne les contenus liés à une liste d'IDs.
 */
export function getContentsByIds(ids: string[]): Content[] {
  return ids
    .map((id) => mockContent.find((c) => c.id === id))
    .filter((c): c is Content => c !== undefined)
}

/**
 * Retourne les IDs de tous les contenus disponibles (pour generateStaticParams).
 */
export function getAllContentIds(): string[] {
  return mockContent.map((c) => c.id)
}

// ─── Async Functions (Real API Data) ──────────────────────────────────────────

/**
 * Fetch real content from APIs based on content type
 * This is the preferred method for getting real-time data
 */
export async function fetchRealContent(contentId: string): Promise<Content | null> {
  const type = getContentTypeFromId(contentId)
  
  try {
    switch (type) {
      case 'film': {
        const { FilmService } = await import('@/services/api/FilmService')
        const response = await FilmService.getDetails(contentId)
        if (response.success && response.data) {
          return transformFilmToContent(response.data)
        }
        break
      }
      
      case 'video': {
        const { MediaService } = await import('@/services/api/MediaService')
        const video = await MediaService.getVideoById(contentId)
        if (video) {
          return transformVideoToContent(video)
        }
        break
      }
      
      case 'news': {
        const { NewsService } = await import('@/services/api/NewsService')
        const response = await NewsService.getById(contentId)
        if (response.success && response.data) {
          return transformNewsToContent(response.data)
        }
        break
      }
      
      default:
        // Fall back to mock content
        return getContentById(contentId) || null
    }
  } catch (error) {
    console.error('[contentService] Error fetching real content:', error)
  }
  
  return null
}

// ─── Transform Functions ──────────────────────────────────────────────────────

interface FilmData {
  id: string
  title: string
  description: string
  poster: string
  viralScore: number
  genres: string[]
  rating: number
  type: 'movie' | 'series'
  trendingReason?: string
  cast?: Array<{ name: string }>
}

function transformFilmToContent(film: FilmData): Content {
  return {
    id: film.id,
    title: film.title,
    explanation: film.description,
    thumbnail: film.poster,
    viralScore: film.viralScore,
    category: 'Cinema' as Category,
    platform: film.type === 'movie' ? 'TMDB' : 'Streaming' as Platform,
    growthRate: 50,
    growthTrend: 'up' as GrowthTrend,
    badge: film.viralScore >= 85 ? 'Viral' : film.viralScore >= 70 ? 'Trend' : 'Early' as BadgeType,
    watchersCount: Math.round(film.viralScore * 100),
    isExploding: film.viralScore >= 85,
    createdAt: new Date().toISOString(),
    relatedTrendIds: [],
    tags: film.genres.slice(0, 3),
    region: 'global',
    insight: {
      postNowProbability: film.viralScore >= 80 ? 'high' : 'medium',
      timing: 'now',
      bestPlatform: ['YouTube', 'TikTok'],
      bestFormat: 'reaction',
      whyItWorks: film.trendingReason || `${film.title} capte l'attention avec une note de ${film.rating}/10`,
      reproductionIdea: `Reagis a ${film.title} avec ton analyse personnelle`,
      timingLabel: { fr: 'Timing optimal', en: 'Optimal timing' },
      postWindow: { status: 'optimal' },
      tips: [
        'Donne ton avis sincere',
        'Evite les spoilers majeurs',
        'Ajoute des theories'
      ]
    },
    detectedAt: new Date().toISOString(),
    contentMeta: {
      type: film.type,
      castNames: film.cast?.map(c => c.name) || []
    }
  }
}

interface VideoData {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  viralScore: number
  viewCount: number
  category: string
  url: string
}

function transformVideoToContent(video: VideoData): Content {
  return {
    id: video.id,
    title: video.title,
    explanation: `Video de ${video.channelTitle} avec ${video.viewCount.toLocaleString()} vues`,
    thumbnail: video.thumbnail,
    viralScore: video.viralScore,
    category: video.category as Category || 'Video',
    platform: 'YouTube' as Platform,
    growthRate: 75,
    growthTrend: 'up' as GrowthTrend,
    badge: video.viralScore >= 85 ? 'Viral' : 'Trend' as BadgeType,
    watchersCount: Math.round(video.viewCount / 1000),
    isExploding: video.viralScore >= 85,
    createdAt: new Date().toISOString(),
    relatedTrendIds: [],
    tags: [video.category],
    region: 'global',
    insight: {
      postNowProbability: 'high',
      timing: 'now',
      bestPlatform: ['TikTok', 'YouTube Shorts'],
      bestFormat: 'reaction',
      whyItWorks: `Cette video fait le buzz avec ${video.viewCount.toLocaleString()} vues`,
      reproductionIdea: `Fais ta propre version de "${video.title}"`,
      timingLabel: { fr: 'Hot maintenant', en: 'Hot right now' },
      postWindow: { status: 'optimal' },
      tips: ['Reagis rapidement', 'Ajoute ta touche personnelle']
    },
    detectedAt: new Date().toISOString(),
    contentMeta: {
      url: video.url,
      channelTitle: video.channelTitle
    }
  }
}

interface NewsData {
  id: string
  title: string
  description: string
  urlToImage: string | null
  importanceScore: number
  category: string
  source: string
  url: string
}

function transformNewsToContent(news: NewsData): Content {
  return {
    id: news.id,
    title: news.title,
    explanation: news.description,
    thumbnail: news.urlToImage || '',
    viralScore: news.importanceScore,
    category: news.category as Category || 'Actualite',
    platform: news.source as Platform || 'News',
    growthRate: 60,
    growthTrend: 'up' as GrowthTrend,
    badge: news.importanceScore >= 85 ? 'Breaking' : 'Trend' as BadgeType,
    watchersCount: Math.round(news.importanceScore * 50),
    isExploding: news.importanceScore >= 85,
    createdAt: new Date().toISOString(),
    relatedTrendIds: [],
    tags: [news.category],
    region: 'global',
    insight: {
      postNowProbability: news.importanceScore >= 80 ? 'high' : 'medium',
      timing: 'now',
      bestPlatform: ['Twitter', 'TikTok'],
      bestFormat: 'news',
      whyItWorks: `Actualite chaude sur ${news.category}`,
      reproductionIdea: `Donne ton analyse sur "${news.title}"`,
      timingLabel: { fr: 'Breaking news', en: 'Breaking news' },
      postWindow: { status: 'optimal' },
      tips: ['Sois factuel', 'Cite tes sources', 'Ajoute du contexte']
    },
    detectedAt: new Date().toISOString(),
    contentMeta: {
      url: news.url,
      source: news.source
    }
  }
}
