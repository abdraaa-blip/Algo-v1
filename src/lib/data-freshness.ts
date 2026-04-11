'use client'

// =============================================================================
// DATA FRESHNESS SYSTEM
// Centralized system for tracking and displaying data freshness across the app
// This ensures the app is honest about data status - no fake "live" labels
// =============================================================================

export type DataStatus = 'live' | 'delayed' | 'static' | 'error' | 'loading'

export interface DataFreshness {
  status: DataStatus
  fetchedAt: Date | null
  source: string
  refreshInterval?: number // in milliseconds, 0 = no auto-refresh
  isRefreshing?: boolean
}

// Status definitions with clear criteria
export const DATA_STATUS_CONFIG = {
  live: {
    // Data updated in the last 5 minutes with active refresh
    label: 'Données récentes',
    labelShort: 'ACTIF',
    color: 'amber',
    description: 'Données mises à jour périodiquement (pas en temps réel)',
    maxAgeMs: 5 * 60 * 1000, // 5 minutes
  },
  delayed: {
    // Data updated periodically (5min - 1hour)
    label: 'Mise à jour récente',
    labelShort: 'MAJ',
    color: 'amber',
    description: 'Données mises à jour périodiquement',
    maxAgeMs: 60 * 60 * 1000, // 1 hour
  },
  static: {
    // Data not automatically updated
    label: 'Données statiques',
    labelShort: 'STATIQUE',
    color: 'zinc',
    description: 'Données non mises à jour automatiquement',
    maxAgeMs: Infinity,
  },
  error: {
    label: 'Erreur',
    labelShort: 'ERREUR',
    color: 'red',
    description: 'Impossible de charger les données',
    maxAgeMs: 0,
  },
  loading: {
    label: 'Chargement',
    labelShort: '...',
    color: 'violet',
    description: 'Données en cours de chargement',
    maxAgeMs: 0,
  },
} as const

/**
 * Calculate the current status based on fetchedAt timestamp and refresh behavior
 */
export function calculateDataStatus(
  fetchedAt: Date | null,
  hasAutoRefresh: boolean = false,
  refreshIntervalMs: number = 0
): DataStatus {
  if (!fetchedAt) return 'loading'
  
  const ageMs = Date.now() - fetchedAt.getTime()
  
  // If data is fresh AND has active auto-refresh, it's "live"
  if (ageMs < DATA_STATUS_CONFIG.live.maxAgeMs && hasAutoRefresh && refreshIntervalMs > 0 && refreshIntervalMs <= 60000) {
    return 'live'
  }
  
  // If data is within delayed threshold
  if (ageMs < DATA_STATUS_CONFIG.delayed.maxAgeMs) {
    return 'delayed'
  }
  
  // Otherwise it's static
  return 'static'
}

/**
 * Format relative time in French
 */
export function formatRelativeTimeFr(date: Date | null, locale: string = 'fr-FR'): string {
  if (!date) return 'Jamais'

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (seconds < 10) return rtf.format(0, 'second')
  if (seconds < 60) return rtf.format(-seconds, 'second')
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-days, 'day')
}

/**
 * Format absolute time
 */
export function formatAbsoluteTime(date: Date | null, locale: string = 'fr-FR', timeZone?: string): string {
  if (!date) return '--:--'
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  }).format(date)
}

/**
 * Get CSS classes for status colors
 */
export function getStatusColorClasses(status: DataStatus) {
  const config = DATA_STATUS_CONFIG[status]
  const color = config.color
  
  return {
    bg: `bg-${color}-500`,
    bgSubtle: `bg-${color}-500/20`,
    text: `text-${color}-400`,
    border: `border-${color}-500/30`,
    dot: status === 'live' ? `bg-${color}-500 animate-pulse` : `bg-${color}-500`,
  }
}

// Hardcoded color classes to avoid Tailwind purging issues
export const STATUS_COLORS = {
  live: {
    bg: 'bg-emerald-500',
    bgSubtle: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    ring: 'ring-emerald-400',
  },
  delayed: {
    bg: 'bg-amber-500',
    bgSubtle: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    ring: 'ring-amber-400',
  },
  static: {
    bg: 'bg-zinc-500',
    bgSubtle: 'bg-zinc-500/20',
    text: 'text-zinc-400',
    border: 'border-zinc-500/30',
    ring: 'ring-zinc-400',
  },
  error: {
    bg: 'bg-red-500',
    bgSubtle: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    ring: 'ring-red-400',
  },
  loading: {
    bg: 'bg-violet-500',
    bgSubtle: 'bg-violet-500/20',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    ring: 'ring-violet-400',
  },
} as const

// =============================================================================
// DATA SOURCE REGISTRY
// Defines what each data source actually provides in terms of freshness
// =============================================================================

export interface DataSourceConfig {
  id: string
  name: string
  type: 'api' | 'scrape' | 'static' | 'realtime'
  refreshInterval: number // in milliseconds, 0 = manual only
  canBeLive: boolean // true if this source supports real-time data
  description: string
}

export const DATA_SOURCES: Record<string, DataSourceConfig> = {
  // News sources
  'newsapi': {
    id: 'newsapi',
    name: 'NewsAPI',
    type: 'api',
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    canBeLive: false, // NewsAPI has rate limits, not truly real-time
    description: 'Actualites via NewsAPI (limite de requetes)',
  },
  'google-news': {
    id: 'google-news',
    name: 'Google News RSS',
    type: 'scrape',
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    canBeLive: false,
    description: 'Flux RSS Google News',
  },
  
  // Video sources
  'youtube': {
    id: 'youtube',
    name: 'YouTube Trends',
    type: 'api',
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    canBeLive: false,
    description: 'Videos tendances YouTube (quota limite)',
  },
  
  // Movies/TV
  'tmdb': {
    id: 'tmdb',
    name: 'TMDB',
    type: 'api',
    refreshInterval: 60 * 60 * 1000, // 1 hour
    canBeLive: false,
    description: 'Films et series via TMDB',
  },
  
  // Music
  'lastfm': {
    id: 'lastfm',
    name: 'Last.fm',
    type: 'api',
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    canBeLive: false,
    description: 'Charts musicaux Last.fm',
  },
  'spotify': {
    id: 'spotify',
    name: 'Spotify',
    type: 'api',
    refreshInterval: 60 * 60 * 1000, // 1 hour
    canBeLive: false,
    description: 'Playlists Spotify',
  },
  
  // Trends
  'google-trends': {
    id: 'google-trends',
    name: 'Google Trends',
    type: 'scrape',
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    canBeLive: false,
    description: 'Tendances de recherche Google',
  },
  'twitter-trends': {
    id: 'twitter-trends',
    name: 'X/Twitter Trends',
    type: 'api',
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    canBeLive: true, // Twitter trends can be near real-time
    description: 'Tendances X/Twitter',
  },
  
  // Static
  'mock': {
    id: 'mock',
    name: 'Données démo',
    type: 'static',
    refreshInterval: 0,
    canBeLive: false,
    description: 'Données de démonstration statiques',
  },
  'fallback': {
    id: 'fallback',
    name: 'Données de secours',
    type: 'static',
    refreshInterval: 0,
    canBeLive: false,
    description: 'Données de secours en cas d\'erreur API',
  },
}

/**
 * Get the expected status for a data source
 */
export function getExpectedStatusForSource(sourceId: string): DataStatus {
  const config = DATA_SOURCES[sourceId]
  if (!config) return 'static'
  
  if (config.type === 'static') return 'static'
  if (config.canBeLive && config.refreshInterval <= 60000) return 'live'
  if (config.refreshInterval > 0) return 'delayed'
  return 'static'
}
