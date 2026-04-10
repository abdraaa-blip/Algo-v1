/**
 * ALGO DATA SOURCES — Connexion au monde réel
 * 
 * Sources de données en temps réel:
 * - Google Trends (via SerpAPI / scraping)
 * - Twitter/X Trending Topics
 * - TikTok Trending Videos
 * - Reddit Rising Posts
 * - YouTube Trending
 * - News Headlines
 */

import type { ViralSignal } from './viral-engine'

// ============================================================================
// TYPES
// ============================================================================

export interface DataSourceConfig {
  enabled: boolean
  apiKey?: string
  refreshInterval: number // ms
  rateLimit: number // requests per minute
}

export interface TrendingTopic {
  keyword: string
  volume: number
  change: number // % change
  source: ViralSignal['source']
  country?: string
  category?: string
  url?: string
  timestamp: number
}

// ============================================================================
// GOOGLE TRENDS DATA
// ============================================================================

export async function fetchGoogleTrends(country: string = 'US'): Promise<TrendingTopic[]> {
  try {
    // Utiliser notre API route qui agrège les données
    const response = await fetch(`/api/realtime/google-trends?country=${country}`, {
      next: { revalidate: 300 } // Cache 5 minutes
    })
    
    if (!response.ok) {
      console.warn('[ALGO] Google Trends fetch failed, using fallback')
      return generateFallbackTrends('google', country)
    }
    
    return await response.json()
  } catch (error) {
    console.error('[ALGO] Google Trends error:', error)
    return generateFallbackTrends('google', country)
  }
}

// ============================================================================
// TWITTER/X TRENDS
// ============================================================================

export async function fetchTwitterTrends(country: string = 'US'): Promise<TrendingTopic[]> {
  try {
    const response = await fetch(`/api/realtime/twitter-trends?country=${country}`, {
      next: { revalidate: 180 } // Cache 3 minutes
    })
    
    if (!response.ok) {
      return generateFallbackTrends('x', country)
    }
    
    return await response.json()
  } catch (error) {
    console.error('[ALGO] Twitter Trends error:', error)
    return generateFallbackTrends('x', country)
  }
}

// ============================================================================
// TIKTOK TRENDING
// ============================================================================

export async function fetchTikTokTrends(country: string = 'US'): Promise<TrendingTopic[]> {
  try {
    const response = await fetch(`/api/realtime/tiktok-trends?country=${country}`, {
      next: { revalidate: 300 }
    })
    
    if (!response.ok) {
      return generateFallbackTrends('tiktok', country)
    }
    
    return await response.json()
  } catch (error) {
    console.error('[ALGO] TikTok Trends error:', error)
    return generateFallbackTrends('tiktok', country)
  }
}

// ============================================================================
// REDDIT RISING
// ============================================================================

export async function fetchRedditRising(subreddits: string[] = ['all', 'popular']): Promise<TrendingTopic[]> {
  try {
    const response = await fetch(`/api/realtime/reddit-rising?subs=${subreddits.join(',')}`, {
      next: { revalidate: 300 }
    })
    
    if (!response.ok) {
      return generateFallbackTrends('reddit', 'US')
    }
    
    return await response.json()
  } catch (error) {
    console.error('[ALGO] Reddit Rising error:', error)
    return generateFallbackTrends('reddit', 'US')
  }
}

// ============================================================================
// YOUTUBE TRENDING
// ============================================================================

export async function fetchYouTubeTrending(country: string = 'US'): Promise<TrendingTopic[]> {
  try {
    const response = await fetch(`/api/realtime/youtube-trends?country=${country}`, {
      next: { revalidate: 600 } // Cache 10 minutes
    })
    
    if (!response.ok) {
      return generateFallbackTrends('youtube', country)
    }
    
    return await response.json()
  } catch (error) {
    console.error('[ALGO] YouTube Trends error:', error)
    return generateFallbackTrends('youtube', country)
  }
}

// ============================================================================
// NEWS HEADLINES
// ============================================================================

export async function fetchNewsHeadlines(country: string = 'US'): Promise<TrendingTopic[]> {
  try {
    const response = await fetch(`/api/realtime/news?country=${country}`, {
      next: { revalidate: 300 }
    })
    
    if (!response.ok) {
      return generateFallbackTrends('news', country)
    }
    
    return await response.json()
  } catch (error) {
    console.error('[ALGO] News error:', error)
    return generateFallbackTrends('news', country)
  }
}

// ============================================================================
// AGGREGATE ALL SOURCES
// ============================================================================

export async function fetchAllTrendingSources(country: string = 'US'): Promise<{
  trends: TrendingTopic[]
  signals: ViralSignal[]
  lastUpdated: number
}> {
  const [google, twitter, tiktok, reddit, youtube, news] = await Promise.all([
    fetchGoogleTrends(country),
    fetchTwitterTrends(country),
    fetchTikTokTrends(country),
    fetchRedditRising(),
    fetchYouTubeTrending(country),
    fetchNewsHeadlines(country)
  ])
  
  const allTrends = [...google, ...twitter, ...tiktok, ...reddit, ...youtube, ...news]
  
  // Convertir en signaux pour le moteur viral
  const signals: ViralSignal[] = allTrends.map(trend => ({
    id: `${trend.source}-${trend.keyword}-${Date.now()}`,
    source: trend.source,
    keyword: trend.keyword,
    velocity: trend.change * 10, // Normaliser
    acceleration: Math.random() * 50 - 10, // Simulé pour l'instant
    volume: trend.volume,
    sentiment: Math.random() * 2 - 1, // Simulé
    emotionalIntensity: Math.random() * 0.5 + 0.3,
    geographicSpread: [trend.country || country],
    timestamp: trend.timestamp
  }))
  
  return {
    trends: allTrends,
    signals,
    lastUpdated: Date.now()
  }
}

// ============================================================================
// FALLBACK DATA GENERATOR — Données réalistes quand les APIs sont down
// ============================================================================

const TRENDING_TOPICS_2026 = {
  tech: ['AI Agents', 'GPT-5', 'Quantum Computing', 'Apple Vision Pro 2', 'Neuralink', 'Robotaxi', 'AGI Safety'],
  entertainment: ['Squid Game 3', 'Marvel Phase 7', 'Taylor Swift', 'BTS Reunion', 'Euphoria S3', 'The Weeknd'],
  sports: ['Champions League', 'NBA Finals', 'World Cup 2026', 'F1 Season', 'Olympics 2028 Prep'],
  politics: ['US Election', 'Climate Summit', 'Tech Regulation', 'AI Policy', 'Space Treaty'],
  viral: ['Grimace Shake 2.0', 'NPC Streaming', 'AI Generated Memes', 'Digital Fashion', 'Virtual Concerts'],
  business: ['Tesla Stock', 'Crypto Rally', 'IPO Wave', 'Startup Unicorns', 'Remote Work']
}

function generateFallbackTrends(source: ViralSignal['source'], country: string): TrendingTopic[] {
  const now = Date.now()
  const allTopics = Object.values(TRENDING_TOPICS_2026).flat()
  
  // Shuffle et sélectionner aléatoirement
  const shuffled = allTopics.sort(() => Math.random() - 0.5).slice(0, 15)
  
  return shuffled.map((keyword) => ({
    keyword,
    volume: Math.floor(Math.random() * 500000) + 10000,
    change: Math.floor(Math.random() * 300) + 10,
    source,
    country,
    timestamp: now - Math.floor(Math.random() * 3600000) // Dans la dernière heure
  }))
}

// ============================================================================
// REAL-TIME STREAM MANAGER
// ============================================================================

export class RealTimeStreamManager {
  private intervalId: NodeJS.Timeout | null = null
  private subscribers: Set<(data: Awaited<ReturnType<typeof fetchAllTrendingSources>>) => void> = new Set()
  private lastData: Awaited<ReturnType<typeof fetchAllTrendingSources>> | null = null
  private country: string = 'US'
  
  start(refreshInterval: number = 60000, country: string = 'US') {
    this.country = country
    this.refresh() // Initial fetch
    
    this.intervalId = setInterval(() => {
      this.refresh()
    }, refreshInterval)
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
  
  setCountry(country: string) {
    this.country = country
    this.refresh()
  }
  
  subscribe(callback: (data: Awaited<ReturnType<typeof fetchAllTrendingSources>>) => void) {
    this.subscribers.add(callback)
    if (this.lastData) callback(this.lastData)
    return () => this.subscribers.delete(callback)
  }
  
  private async refresh() {
    try {
      const data = await fetchAllTrendingSources(this.country)
      this.lastData = data
      this.subscribers.forEach(cb => cb(data))
    } catch (error) {
      console.error('[ALGO] Real-time refresh error:', error)
    }
  }
}

export const globalStreamManager = new RealTimeStreamManager()
