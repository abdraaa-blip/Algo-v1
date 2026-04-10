// =============================================================================
// ALGO V1 — TrendService
// Service unifie pour les tendances multi-sources
// Agrege: Google Trends, News, YouTube, Social Media
// =============================================================================

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrendItem {
  id: string
  name: string
  category: string
  source: string
  score: number
  viralScore: number
  growthRate: number
  growthTrend: 'up' | 'down' | 'stable'
  volume: number
  volumeLabel: string
  explanation: string
  relatedTopics: string[]
  isExploding: boolean
  detectedAt: string
  peakPrediction?: string
  url?: string
  thumbnail?: string
}

export interface TrendServiceResponse {
  success: boolean
  data: TrendItem[]
  source: 'live' | 'cache' | 'fallback'
  error?: string
  timestamp: string
  sources: {
    name: string
    status: 'success' | 'error' | 'partial'
    count: number
  }[]
}

// ─── Cache Configuration ──────────────────────────────────────────────────────

const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes
const trendCache: Map<string, { data: TrendItem[]; sources: TrendServiceResponse['sources']; expiresAt: Date }> = new Map()

// ─── Utility Functions ────────────────────────────────────────────────────────

function calculateViralScore(volume: number, growthRate: number, isRecent: boolean): number {
  let score = 50
  
  // Volume contribution (max 30)
  if (volume > 1000000) score += 30
  else if (volume > 100000) score += 25
  else if (volume > 10000) score += 20
  else if (volume > 1000) score += 15
  else score += 10
  
  // Growth rate contribution (max 30)
  if (growthRate > 200) score += 30
  else if (growthRate > 100) score += 25
  else if (growthRate > 50) score += 20
  else if (growthRate > 20) score += 15
  else score += 10
  
  // Recency bonus (max 10)
  if (isRecent) score += 10
  
  return Math.min(99, Math.round(score))
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
  return volume.toString()
}

function guessCategory(name: string, source: string): string {
  const nameLower = name.toLowerCase()
  
  if (/tech|ai|ia|apple|google|microsoft|startup/.test(nameLower)) return 'Tech'
  if (/film|movie|serie|netflix|disney|marvel|trailer/.test(nameLower)) return 'Cinema'
  if (/music|song|album|concert|artiste|rapper/.test(nameLower)) return 'Musique'
  if (/sport|football|nba|match|ligue|psg/.test(nameLower)) return 'Sport'
  if (/politique|president|election|gouvernement/.test(nameLower)) return 'Politique'
  if (/jeu|gaming|fortnite|minecraft|gta/.test(nameLower)) return 'Gaming'
  
  // Source-based fallback
  if (source === 'youtube') return 'Video'
  if (source === 'github') return 'Tech'
  
  return 'Actualite'
}

function generateExplanation(trend: Partial<TrendItem>): string {
  const parts: string[] = []
  
  if (trend.isExploding) {
    parts.push('En explosion!')
  }
  
  if (trend.growthRate && trend.growthRate > 100) {
    parts.push(`Croissance de +${trend.growthRate}%`)
  }
  
  if (trend.volume && trend.volume > 100000) {
    parts.push(`${formatVolume(trend.volume)} mentions`)
  }
  
  if (parts.length === 0) {
    return `Tendance ${trend.category?.toLowerCase() || 'generale'} du moment`
  }
  
  return parts.join(' - ')
}

// ─── API Fetcher ──────────────────────────────────────────────────────────────

interface TrendAPIResponse {
  success: boolean
  data: {
    news?: Array<{ title: string; url: string; publishedAt: string; source: string }>
    youtube?: Array<{ title: string; viewCount: number; url: string; thumbnail: string }>
    reddit?: Array<{ title: string; score: number; url: string; subreddit: string }>
    hackernews?: Array<{ title: string; score: number; url: string }>
    github?: Array<{ name: string; stars: number; url: string; description: string }>
  }
  sources: Record<string, { status: string; count: number }>
}

async function fetchTrendsFromAPI(country: string = 'FR'): Promise<TrendAPIResponse> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  const res = await fetch(`${baseUrl}/api/live-trends?country=${country}`, {
    next: { revalidate: 180 }
  })
  
  if (!res.ok) {
    throw new Error(`Trends API returned ${res.status}`)
  }
  
  return res.json()
}

// ─── Transform Functions ──────────────────────────────────────────────────────

function transformNewsToTrend(news: Array<{ title: string; url: string; publishedAt: string; source: string }>): TrendItem[] {
  return news.slice(0, 10).map((item, index) => {
    const isRecent = (Date.now() - new Date(item.publishedAt).getTime()) < 3600000
    const growthRate = Math.max(20, 150 - index * 10)
    const volume = Math.round(100000 / (index + 1))
    
    return {
      id: `news_${index}_${Date.now()}`,
      name: item.title,
      category: guessCategory(item.title, 'news'),
      source: item.source || 'News',
      score: 100 - index * 5,
      viralScore: calculateViralScore(volume, growthRate, isRecent),
      growthRate,
      growthTrend: index < 3 ? 'up' : index < 7 ? 'stable' : 'down',
      volume,
      volumeLabel: formatVolume(volume),
      explanation: '',
      relatedTopics: [],
      isExploding: index < 2,
      detectedAt: item.publishedAt,
      url: item.url
    }
  }).map(t => ({ ...t, explanation: generateExplanation(t) }))
}

function transformYouTubeToTrend(videos: Array<{ title: string; viewCount: number; url: string; thumbnail: string }>): TrendItem[] {
  return videos.slice(0, 8).map((item, index) => {
    const views = Number(item.viewCount) || 0
    const growthRate = Math.max(30, 200 - index * 15)
    
    return {
      id: `yt_${index}_${Date.now()}`,
      name: item.title,
      category: guessCategory(item.title, 'youtube'),
      source: 'YouTube',
      score: 100 - index * 6,
      viralScore: calculateViralScore(views, growthRate, true),
      growthRate,
      growthTrend: index < 3 ? 'up' : 'stable',
      volume: views,
      volumeLabel: formatVolume(views) + ' vues',
      explanation: '',
      relatedTopics: [],
      isExploding: views > 1000000,
      detectedAt: new Date().toISOString(),
      url: item.url,
      thumbnail: item.thumbnail
    }
  }).map(t => ({ ...t, explanation: generateExplanation(t) }))
}

function transformRedditToTrend(posts: Array<{ title: string; score: number; url: string; subreddit: string }>): TrendItem[] {
  return posts.slice(0, 6).map((item, index) => {
    const score = Number(item.score) || 0
    const growthRate = Math.max(25, 180 - index * 20)
    
    return {
      id: `reddit_${index}_${Date.now()}`,
      name: item.title,
      category: guessCategory(item.title, 'reddit'),
      source: `r/${item.subreddit || 'popular'}`,
      score: 100 - index * 8,
      viralScore: calculateViralScore(score * 100, growthRate, true),
      growthRate,
      growthTrend: index < 2 ? 'up' : 'stable',
      volume: score,
      volumeLabel: formatVolume(score) + ' upvotes',
      explanation: '',
      relatedTopics: [],
      isExploding: score > 10000,
      detectedAt: new Date().toISOString(),
      url: item.url
    }
  }).map(t => ({ ...t, explanation: generateExplanation(t) }))
}

function transformGitHubToTrend(repos: Array<{ name: string; stars: number; url: string; description: string }>): TrendItem[] {
  return repos.slice(0, 5).map((item, index) => {
    const stars = Number(item.stars) || 0
    const growthRate = Math.max(40, 250 - index * 30)
    
    return {
      id: `gh_${index}_${Date.now()}`,
      name: item.name,
      category: 'Tech',
      source: 'GitHub',
      score: 100 - index * 10,
      viralScore: calculateViralScore(stars * 10, growthRate, true),
      growthRate,
      growthTrend: 'up',
      volume: stars,
      volumeLabel: formatVolume(stars) + ' stars',
      explanation: item.description || '',
      relatedTopics: ['Open Source', 'Development'],
      isExploding: stars > 1000,
      detectedAt: new Date().toISOString(),
      url: item.url
    }
  }).map(t => ({ ...t, explanation: t.explanation || generateExplanation(t) }))
}

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Get all trending topics from multiple sources
 */
export async function getTrends(country: string = 'FR'): Promise<TrendServiceResponse> {
  const cacheKey = `trends_${country}`
  const cached = trendCache.get(cacheKey)
  
  if (cached && cached.expiresAt > new Date()) {
    return {
      success: true,
      data: cached.data,
      source: 'cache',
      sources: cached.sources,
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    const response = await fetchTrendsFromAPI(country)
    
    if (!response.success) {
      throw new Error('API returned success: false')
    }
    
    const trends: TrendItem[] = []
    const sources: TrendServiceResponse['sources'] = []
    
    // Transform each source
    if (response.data.news) {
      trends.push(...transformNewsToTrend(response.data.news))
      sources.push({ name: 'News', status: 'success', count: response.data.news.length })
    }
    
    if (response.data.youtube) {
      trends.push(...transformYouTubeToTrend(response.data.youtube))
      sources.push({ name: 'YouTube', status: 'success', count: response.data.youtube.length })
    }
    
    if (response.data.reddit) {
      trends.push(...transformRedditToTrend(response.data.reddit))
      sources.push({ name: 'Reddit', status: 'success', count: response.data.reddit.length })
    }
    
    if (response.data.github) {
      trends.push(...transformGitHubToTrend(response.data.github))
      sources.push({ name: 'GitHub', status: 'success', count: response.data.github.length })
    }
    
    // Sort by viral score
    trends.sort((a, b) => b.viralScore - a.viralScore)
    
    // Cache results
    trendCache.set(cacheKey, {
      data: trends,
      sources,
      expiresAt: new Date(Date.now() + CACHE_DURATION)
    })
    
    return {
      success: true,
      data: trends,
      source: 'live',
      sources,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('[TrendService] Error fetching trends:', error)
    
    if (cached) {
      return {
        success: true,
        data: cached.data,
        source: 'cache',
        sources: cached.sources,
        error: 'Using cached data',
        timestamp: new Date().toISOString()
      }
    }
    
    return {
      success: false,
      data: [],
      source: 'fallback',
      sources: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get trends by category
 */
export async function getTrendsByCategory(category: string, country: string = 'FR'): Promise<TrendServiceResponse> {
  const response = await getTrends(country)
  
  if (!response.success) return response
  
  return {
    ...response,
    data: response.data.filter(t => t.category.toLowerCase() === category.toLowerCase())
  }
}

/**
 * Get exploding trends only
 */
export async function getExplodingTrends(country: string = 'FR'): Promise<TrendServiceResponse> {
  const response = await getTrends(country)
  
  if (!response.success) return response
  
  return {
    ...response,
    data: response.data.filter(t => t.isExploding)
  }
}

/**
 * Search trends
 */
export async function searchTrends(query: string, country: string = 'FR'): Promise<TrendServiceResponse> {
  const response = await getTrends(country)
  
  if (!response.success) return response
  
  const q = query.toLowerCase()
  return {
    ...response,
    data: response.data.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.source.toLowerCase().includes(q)
    )
  }
}

/**
 * Generate content ideas for a trend
 */
export function generateTrendContentIdeas(trend: TrendItem): string[] {
  const ideas: string[] = []
  
  if (trend.isExploding) {
    ideas.push(`URGENT: "${trend.name}" explose - Ma reaction immediate`)
  }
  
  ideas.push(`Pourquoi "${trend.name}" est partout en ce moment`)
  ideas.push(`Mon analyse de "${trend.name}" - Ce qu'il faut savoir`)
  
  switch (trend.category) {
    case 'Tech':
      ideas.push(`Test/Demo: "${trend.name}"`)
      ideas.push(`"${trend.name}" va-t-il changer notre quotidien?`)
      break
    case 'Cinema':
      ideas.push(`Critique sans spoilers: "${trend.name}"`)
      ideas.push(`Theorie sur "${trend.name}"`)
      break
    case 'Musique':
      ideas.push(`Reaction a "${trend.name}"`)
      ideas.push(`Cover de "${trend.name}"`)
      break
    case 'Gaming':
      ideas.push(`Gameplay "${trend.name}" - Premier essai`)
      ideas.push(`Tips & tricks "${trend.name}"`)
      break
    default:
      ideas.push(`Mon point de vue sur "${trend.name}"`)
  }
  
  return ideas.slice(0, 6)
}

// ─── Export Service Object ────────────────────────────────────────────────────

export const TrendService = {
  get: getTrends,
  getByCategory: getTrendsByCategory,
  getExploding: getExplodingTrends,
  search: searchTrends,
  generateContentIdeas: generateTrendContentIdeas
}
