'use client'

/**
 * useIntelligence Hook
 * 
 * React hook for processing content through the ALGO Engine.
 * Provides memoized intelligence data with caching.
 */

import { useMemo, useCallback } from 'react'
import {
  runAlgoCoreIntelligence,
  type AlgoCoreIntelligenceReport,
  type AlgoCoreUserContext,
} from '@/lib/algo-core-intelligence'
import {
  processContent,
  processContentBatch,
  calculateViralScore,
  analyzeEmotion,
  generateActions,
  isEarlySignal,
  getFreshness,
  formatFreshness,
  validateContent,
  createFallback,
  type RawContentInput,
  type ContentIntelligence,
  type ContentType
} from '@/lib/algo-engine'

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE ITEM HOOK
// ═══════════════════════════════════════════════════════════════════════════

interface UseIntelligenceOptions {
  enabled?: boolean
}

/**
 * Process a single content item through the ALGO Engine.
 */
export function useIntelligence(
  content: RawContentInput | null | undefined,
  options: UseIntelligenceOptions = {}
): ContentIntelligence | null {
  const { enabled = true } = options
  
  return useMemo(() => {
    if (!enabled || !content) return null
    
    const validation = validateContent(content)
    if (!validation.isValid) {
      const fallback = createFallback(content)
      return processContent(fallback)
    }
    
    return processContent(content)
  }, [content, enabled])
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH PROCESSING HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process multiple content items efficiently.
 */
export function useIntelligenceBatch(
  items: RawContentInput[],
  options: UseIntelligenceOptions = {}
): Map<string, ContentIntelligence> {
  const { enabled = true } = options
  
  return useMemo(() => {
    if (!enabled || items.length === 0) return new Map()
    return processContentBatch(items)
  }, [items, enabled])
}

/**
 * Rapport Core Intelligence (8 modules composés) pour un lot de contenus.
 * Passer un `userContext` mémoïsé côté appelant pour éviter des recalculs inutiles.
 */
export function useAlgoCoreIntelligence(
  items: RawContentInput[],
  userContext: AlgoCoreUserContext | undefined,
  options: UseIntelligenceOptions = {}
): AlgoCoreIntelligenceReport | null {
  const { enabled = true } = options
  return useMemo(() => {
    if (!enabled) return null
    return runAlgoCoreIntelligence(items, userContext)
  }, [items, userContext, enabled])
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate viral score for given metrics.
 */
export function useViralScore(metrics: {
  growthRate?: number
  engagement?: number
  novelty?: number
  views?: number
  ageHours?: number
}) {
  return useMemo(() => calculateViralScore(metrics), [metrics])
}

/**
 * Analyze emotion from text.
 */
export function useEmotion(text: string) {
  return useMemo(() => analyzeEmotion(text), [text])
}

/**
 * Check if content is an early signal.
 */
export function useEarlySignal(metrics: {
  growthRate?: number
  ageHours?: number
  engagement?: number
  novelty?: number
}) {
  return useMemo(() => isEarlySignal(metrics), [metrics])
}

/**
 * Get freshness status and formatted string.
 */
export function useFreshness(fetchedAt: string | Date | null) {
  return useMemo(() => ({
    status: getFreshness(fetchedAt),
    formatted: formatFreshness(fetchedAt)
  }), [fetchedAt])
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT TRANSFORMER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform raw API data into RawContentInput format.
 */
export function useContentTransformer() {
  const transformTrend = useCallback((trend: {
    id?: string
    name?: string
    title?: string
    description?: string
    explanation?: string
    growthRate?: number
    score?: number
    views?: number | string
    createdAt?: string
    publishedAt?: string
    platform?: string
    category?: string
  }): RawContentInput => {
    return {
      id: trend.id || `trend-${Date.now()}`,
      title: trend.name || trend.title || 'Untitled',
      description: trend.description || trend.explanation,
      growthRate: trend.growthRate,
      engagement: trend.score,
      views: typeof trend.views === 'string' ? parseInt(trend.views) : trend.views,
      publishedAt: trend.createdAt || trend.publishedAt,
      source: trend.platform,
      category: trend.category,
      type: 'trend'
    }
  }, [])
  
  const transformNews = useCallback((news: {
    id?: string
    title?: string
    description?: string
    snippet?: string
    publishedAt?: string
    source?: string | { name?: string }
    category?: string
  }): RawContentInput => {
    return {
      id: news.id || `news-${Date.now()}`,
      title: news.title || 'Untitled',
      description: news.description || news.snippet,
      publishedAt: news.publishedAt,
      source: typeof news.source === 'string' ? news.source : news.source?.name,
      category: news.category,
      type: 'news'
    }
  }, [])
  
  const transformVideo = useCallback((video: {
    id?: string
    title?: string
    description?: string
    viewCount?: number | string
    publishedAt?: string
    channelTitle?: string
    category?: string
  }): RawContentInput => {
    const views = typeof video.viewCount === 'string' 
      ? parseInt(video.viewCount.replace(/[^0-9]/g, '')) 
      : video.viewCount
    
    return {
      id: video.id || `video-${Date.now()}`,
      title: video.title || 'Untitled',
      description: video.description,
      views,
      publishedAt: video.publishedAt,
      source: video.channelTitle,
      category: video.category,
      type: 'video'
    }
  }, [])
  
  const transformMusic = useCallback((track: {
    id?: string
    name?: string
    title?: string
    artist?: string | { name?: string }
    playcount?: number | string
    listeners?: number | string
  }): RawContentInput => {
    const playcount = typeof track.playcount === 'string' 
      ? parseInt(track.playcount) 
      : track.playcount
    
    return {
      id: track.id || `music-${Date.now()}`,
      title: track.name || track.title || 'Untitled',
      description: typeof track.artist === 'string' ? track.artist : track.artist?.name,
      views: playcount,
      source: 'Last.fm',
      type: 'music'
    }
  }, [])
  
  const transformMovie = useCallback((movie: {
    id?: number | string
    title?: string
    name?: string
    overview?: string
    vote_average?: number
    release_date?: string
    first_air_date?: string
    popularity?: number
  }): RawContentInput => {
    return {
      id: String(movie.id || `movie-${Date.now()}`),
      title: movie.title || movie.name || 'Untitled',
      description: movie.overview,
      engagement: movie.vote_average ? movie.vote_average * 10 : undefined,
      views: movie.popularity ? Math.round(movie.popularity * 1000) : undefined,
      publishedAt: movie.release_date || movie.first_air_date,
      source: 'TMDB',
      type: 'movie'
    }
  }, [])
  
  return {
    transformTrend,
    transformNews,
    transformVideo,
    transformMusic,
    transformMovie
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════

export {
  processContent,
  processContentBatch,
  calculateViralScore,
  analyzeEmotion,
  generateActions,
  isEarlySignal,
  getFreshness,
  formatFreshness,
  validateContent,
  createFallback
}

export type {
  RawContentInput,
  ContentIntelligence,
  ContentType
}

export type { AlgoCoreIntelligenceReport, AlgoCoreUserContext }
export { runAlgoCoreIntelligence } from '@/lib/algo-core-intelligence'
export { ALGO_CORE_PHILOSOPHY_FR } from '@/lib/algo-core-intelligence'
