/**
 * ALGO Data Pipeline - Central Data Management System
 * 
 * Purpose:
 * - Unified data format across all sources
 * - Transparent status tracking (ACTIVE, DELAYED, STATIC, ERROR)
 * - Automatic refresh with configurable intervals
 * - Robust fallback system
 * - Performance-optimized with batching and deduplication
 * 
 * @module data-pipeline
 */

import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DataStatus = 'active' | 'delayed' | 'static' | 'error' | 'loading'

export interface DataSourceConfig {
  id: string
  name: string
  refreshIntervalMs: number
  maxAgeMs: number
  fallbackEnabled: boolean
  batchable: boolean
}

export interface NormalizedDataItem {
  id: string
  title: string
  type: 'trend' | 'news' | 'video' | 'music' | 'movie' | 'celebrity' | 'signal'
  category: string
  source: string
  timestamp: string
  region: string
  score: number
  metadata: Record<string, unknown>
}

export interface DataPacket<T = NormalizedDataItem[]> {
  data: T
  status: DataStatus
  source: string
  fetchedAt: string
  expiresAt: string
  refreshIntervalMs: number
  isStale: boolean
  isFallback: boolean
  error?: string
  meta?: {
    totalItems: number
    filteredItems: number
    region: string
    apiCalls: number
  }
}

export interface PipelineMetrics {
  totalFetches: number
  successfulFetches: number
  failedFetches: number
  cacheHits: number
  fallbackUsed: number
  averageLatencyMs: number
  lastError: string | null
  uptime: number
}

// ─── Source Configurations ────────────────────────────────────────────────────

export const DATA_SOURCES: Record<string, DataSourceConfig> = {
  // Real-time-ish sources (5-15 min refresh)
  news: {
    id: 'news',
    name: 'Google News',
    refreshIntervalMs: 15 * 60 * 1000, // 15 minutes
    maxAgeMs: 60 * 60 * 1000, // 1 hour max
    fallbackEnabled: true,
    batchable: true,
  },
  trends: {
    id: 'trends',
    name: 'Google Trends',
    refreshIntervalMs: 15 * 60 * 1000, // 15 minutes
    maxAgeMs: 60 * 60 * 1000,
    fallbackEnabled: true,
    batchable: true,
  },
  
  // Medium refresh sources (30 min - 2h)
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    refreshIntervalMs: 30 * 60 * 1000, // 30 minutes
    maxAgeMs: 4 * 60 * 60 * 1000, // 4 hours
    fallbackEnabled: true,
    batchable: true,
  },
  music: {
    id: 'music',
    name: 'Last.fm',
    refreshIntervalMs: 30 * 60 * 1000, // 30 minutes
    maxAgeMs: 4 * 60 * 60 * 1000,
    fallbackEnabled: true,
    batchable: false,
  },
  
  // Slow refresh sources (6h+)
  movies: {
    id: 'movies',
    name: 'TMDB',
    refreshIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
    maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
    fallbackEnabled: true,
    batchable: true,
  },
  celebrities: {
    id: 'celebrities',
    name: 'TMDB People',
    refreshIntervalMs: 6 * 60 * 60 * 1000,
    maxAgeMs: 24 * 60 * 60 * 1000,
    fallbackEnabled: true,
    batchable: true,
  },
}

// ─── Status Determination ─────────────────────────────────────────────────────

export function determineDataStatus(
  fetchedAt: string | Date,
  config: DataSourceConfig
): DataStatus {
  const fetchedTime = new Date(fetchedAt).getTime()
  const now = Date.now()
  const age = now - fetchedTime
  
  // Within refresh interval = active
  if (age < config.refreshIntervalMs) {
    return 'active'
  }
  
  // Within max age = delayed
  if (age < config.maxAgeMs) {
    return 'delayed'
  }
  
  // Beyond max age = static (stale but usable)
  return 'static'
}

export function getStatusLabel(status: DataStatus): string {
  switch (status) {
    case 'active':
      return 'Donnees recentes'
    case 'delayed':
      return 'Actualisation en cours'
    case 'static':
      return 'Donnees en cache'
    case 'error':
      return 'Temporairement indisponible'
    case 'loading':
      return ALGO_UI_LOADING.root
    default:
      return 'Inconnu'
  }
}

export function getStatusColor(status: DataStatus): string {
  switch (status) {
    case 'active':
      return 'amber' // Not green - we're not truly real-time
    case 'delayed':
      return 'yellow'
    case 'static':
      return 'zinc'
    case 'error':
      return 'red'
    case 'loading':
      return 'blue'
    default:
      return 'gray'
  }
}

// ─── Data Normalization ───────────────────────────────────────────────────────

export function normalizeNewsItem(item: Record<string, unknown>, region: string): NormalizedDataItem {
  return {
    id: String(item.id || item.url || Math.random().toString(36)),
    title: String(item.title || ''),
    type: 'news',
    category: String(item.category || 'general'),
    source: String(item.source || 'unknown'),
    timestamp: String(item.publishedAt || item.timestamp || new Date().toISOString()),
    region,
    score: Number(item.score || item.viralScore || 50),
    metadata: {
      description: item.description,
      url: item.url,
      imageUrl: item.urlToImage || item.imageUrl,
      author: item.author,
    },
  }
}

export function normalizeVideoItem(item: Record<string, unknown>, region: string): NormalizedDataItem {
  return {
    id: String(item.id),
    title: String(item.title || ''),
    type: 'video',
    category: String(item.category || 'entertainment'),
    source: 'YouTube',
    timestamp: String(item.publishedAt || new Date().toISOString()),
    region,
    score: Number(item.viralScore || item.score || 50),
    metadata: {
      channel: item.channel,
      thumbnail: item.thumbnail,
      views: item.views,
      viewsFormatted: item.viewsFormatted,
      duration: item.duration,
      url: item.url || `https://youtube.com/watch?v=${item.id}`,
      growthRate: item.growthRate,
      badge: item.badge,
    },
  }
}

export function normalizeTrendItem(item: Record<string, unknown>, region: string): NormalizedDataItem {
  return {
    id: String(item.id || item.title || Math.random().toString(36)),
    title: String(item.title || item.name || ''),
    type: 'trend',
    category: String(item.category || 'trending'),
    source: String(item.source || item.platform || 'Google'),
    timestamp: String(item.timestamp || new Date().toISOString()),
    region,
    score: Number(item.score || item.trafficVolume || 50),
    metadata: {
      description: item.description,
      trafficVolume: item.trafficVolume,
      relatedQueries: item.relatedQueries,
      newsUrl: item.newsUrl,
      imageUrl: item.imageUrl,
      growthRate: item.growthRate,
      emotion: item.emotion,
    },
  }
}

export function normalizeMusicItem(item: Record<string, unknown>, region: string): NormalizedDataItem {
  return {
    id: String(item.id || item.name || Math.random().toString(36)),
    title: String(item.name || item.title || ''),
    type: 'music',
    category: 'music',
    source: 'Last.fm',
    timestamp: new Date().toISOString(),
    region,
    score: Number(item.playcount || item.listeners || 50),
    metadata: {
      artist: item.artist,
      album: item.album,
      playcount: item.playcount,
      listeners: item.listeners,
      imageUrl: item.image || item.imageUrl,
      url: item.url,
    },
  }
}

export function normalizeMovieItem(item: Record<string, unknown>, region: string): NormalizedDataItem {
  return {
    id: String(item.id),
    title: String(item.title || item.name || ''),
    type: 'movie',
    category: String(item.category || 'cinema'),
    source: 'TMDB',
    timestamp: String(item.releaseDate || item.release_date || new Date().toISOString()),
    region,
    score: Number(item.viralScore || item.vote_average * 10 || 50),
    metadata: {
      overview: item.overview || item.description,
      poster: item.poster || item.poster_path,
      backdrop: item.backdrop || item.backdrop_path,
      genres: item.genres,
      voteAverage: item.voteAverage || item.vote_average,
      voteCount: item.voteCount || item.vote_count,
      runtime: item.runtime,
      trailer: item.trailer,
    },
  }
}

// ─── Timestamp Formatting ─────────────────────────────────────────────────────

export function formatTimestamp(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then
  
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'a l\'instant'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export function getRefreshIntervalLabel(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  
  const hours = Math.floor(minutes / 60)
  return `${hours}h`
}

// ─── Fallback Data ────────────────────────────────────────────────────────────

const FALLBACK_MESSAGES = {
  news: 'Les actualites sont temporairement indisponibles. Reessayez dans quelques minutes.',
  youtube: 'Les videos YouTube sont temporairement indisponibles.',
  trends: 'Les tendances sont temporairement indisponibles.',
  music: 'Les classements musicaux sont temporairement indisponibles.',
  movies: 'Les films sont temporairement indisponibles.',
  celebrities: 'Les celebrites sont temporairement indisponibles.',
} as const

export function createFallbackPacket<T>(
  sourceId: string,
  lastValidData: T | null,
  error?: string
): DataPacket<T | null> {
  const config = DATA_SOURCES[sourceId]
  const now = new Date().toISOString()
  
  return {
    data: lastValidData,
    status: lastValidData ? 'static' : 'error',
    source: config?.name || sourceId,
    fetchedAt: now,
    expiresAt: new Date(Date.now() + (config?.maxAgeMs || 3600000)).toISOString(),
    refreshIntervalMs: config?.refreshIntervalMs || 900000,
    isStale: true,
    isFallback: true,
    error: error || FALLBACK_MESSAGES[sourceId as keyof typeof FALLBACK_MESSAGES] || 'Donnees indisponibles',
    meta: {
      totalItems: Array.isArray(lastValidData) ? lastValidData.length : 0,
      filteredItems: 0,
      region: 'unknown',
      apiCalls: 0,
    },
  }
}

// ─── Data Packet Creation ─────────────────────────────────────────────────────

export function createDataPacket<T>(
  sourceId: string,
  data: T,
  region: string,
  apiCalls = 1
): DataPacket<T> {
  const config = DATA_SOURCES[sourceId]
  const now = new Date()
  const expiresAt = new Date(now.getTime() + (config?.refreshIntervalMs || 900000))
  
  return {
    data,
    status: 'active',
    source: config?.name || sourceId,
    fetchedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    refreshIntervalMs: config?.refreshIntervalMs || 900000,
    isStale: false,
    isFallback: false,
    meta: {
      totalItems: Array.isArray(data) ? data.length : 1,
      filteredItems: Array.isArray(data) ? data.length : 1,
      region,
      apiCalls,
    },
  }
}

// ─── Export Registry ──────────────────────────────────────────────────────────

export const DataPipeline = {
  sources: DATA_SOURCES,
  determineStatus: determineDataStatus,
  getStatusLabel,
  getStatusColor,
  formatTimestamp,
  formatRelativeTime,
  getRefreshIntervalLabel,
  createPacket: createDataPacket,
  createFallback: createFallbackPacket,
  normalize: {
    news: normalizeNewsItem,
    video: normalizeVideoItem,
    trend: normalizeTrendItem,
    music: normalizeMusicItem,
    movie: normalizeMovieItem,
  },
}

export default DataPipeline
