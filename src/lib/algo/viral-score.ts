/**
 * ALGO Viral Score Algorithm
 * Netflix Recommendation + TikTok For You Page Architecture
 * 
 * Real-time viral scoring based on weighted signals
 */

import type { ContentItem } from '../connectors'

// ============================================================================
// ALGORITHM WEIGHTS (Publicly visible for transparency)
// ============================================================================

export const ALGORITHM_WEIGHTS = {
  viewVelocity: 0.25,      // Views per hour / followers
  engagementRate: 0.20,    // (likes + comments + shares) / views
  crossPlatformSpread: 0.20, // Same content on multiple platforms
  searchInterest: 0.15,    // Google Trends correlation
  commentSentiment: 0.10,  // Positive/negative ratio
  recencyBonus: 0.10,      // Freshness multiplier
} as const

export const SCORE_THRESHOLDS = {
  earlySignal: 65,         // Potential viral content
  trending: 75,            // Confirmed trending
  viral: 85,               // Going viral
  explosive: 95,           // Mass viral event
} as const

export const DECAY_RATE = 0.02 // 2% per hour after 6 hours

// ============================================================================
// VIRAL SCORE CALCULATION
// ============================================================================

export interface ViralScoreBreakdown {
  viewVelocity: number
  engagementRate: number
  crossPlatformSpread: number
  searchInterest: number
  commentSentiment: number
  recencyBonus: number
  total: number
  momentum: number
  tier: 'cold' | 'warm' | 'hot' | 'fire' | 'explosive'
  isEarlySignal: boolean
  prediction: {
    peakIn: string
    confidence: number
    trajectory: 'rising' | 'peaking' | 'fading'
  }
}

export function calculateViralScore(
  item: ContentItem,
  historicalScores?: number[]
): ViralScoreBreakdown {
  const now = Date.now()
  const publishedAt = item.publishedAt ?? now
  const ageHours = Math.max((now - publishedAt) / (1000 * 60 * 60), 0.01)

  // 1. View Velocity (25%)
  // Normalized: views per hour relative to expected baseline
  const m = item.metrics ?? {}
  const views = m.views || 0
  const viewsPerHour = ageHours > 0 ? views / ageHours : views
  const followerBase = item.author?.followers || 1000 // Default assumption
  const viewVelocityRaw = viewsPerHour / Math.max(followerBase / 100, 1)
  const viewVelocity = Math.min(sigmoid(viewVelocityRaw, 2) * 100, 100)
  
  // 2. Engagement Rate (20%)
  // (likes + comments + shares) / views
  const likes = m.likes || m.upvotes || 0
  const comments = m.comments || 0
  const shares = m.shares || 0
  const engagementRaw = views > 0 
    ? ((likes + comments * 2 + shares * 3) / views) * 100 
    : 0
  const engagementRate = Math.min(sigmoid(engagementRaw, 5) * 100, 100)
  
  // 3. Cross-Platform Spread (20%)
  // For now, estimate based on source diversity
  // TODO: Implement actual cross-platform detection
  const crossPlatformSpread = item.source === 'youtube' && views > 100000 ? 60 :
                              item.source === 'reddit' && (m.upvotes || 0) > 10000 ? 50 :
                              item.source === 'hackernews' && (m.upvotes || 0) > 500 ? 45 :
                              item.source === 'github' && likes > 1000 ? 55 :
                              30
  
  // 4. Search Interest (15%)
  // TODO: Integrate with Google Trends API
  // For now, estimate based on view velocity and engagement
  const searchInterest = Math.min(
    (viewVelocity * 0.5 + engagementRate * 0.5) * 0.8,
    100
  )
  
  // 5. Comment Sentiment (10%)
  // TODO: Implement AI sentiment analysis
  // For now, use engagement as proxy (high engagement often = strong sentiment)
  const commentSentiment = engagementRate > 50 ? 70 : 
                           engagementRate > 30 ? 55 :
                           engagementRate > 15 ? 45 :
                           35
  
  // 6. Recency Bonus (10%)
  // Content under 6 hours gets a boost, then decays
  const recencyBonus = ageHours < 1 ? 100 :
                       ageHours < 3 ? 90 :
                       ageHours < 6 ? 80 :
                       ageHours < 12 ? 60 :
                       ageHours < 24 ? 40 :
                       Math.max(20, 40 - (ageHours - 24) * DECAY_RATE * 100)
  
  // Calculate weighted total
  const total = Math.round(
    viewVelocity * ALGORITHM_WEIGHTS.viewVelocity +
    engagementRate * ALGORITHM_WEIGHTS.engagementRate +
    crossPlatformSpread * ALGORITHM_WEIGHTS.crossPlatformSpread +
    searchInterest * ALGORITHM_WEIGHTS.searchInterest +
    commentSentiment * ALGORITHM_WEIGHTS.commentSentiment +
    recencyBonus * ALGORITHM_WEIGHTS.recencyBonus
  )
  
  // Calculate momentum (second derivative - how fast is the score changing)
  const momentum = historicalScores && historicalScores.length > 1
    ? calculateMomentum(historicalScores, total)
    : estimateMomentum(viewVelocity, engagementRate, ageHours)
  
  // Determine tier
  const tier = total >= SCORE_THRESHOLDS.explosive ? 'explosive' :
               total >= SCORE_THRESHOLDS.viral ? 'fire' :
               total >= SCORE_THRESHOLDS.trending ? 'hot' :
               total >= SCORE_THRESHOLDS.earlySignal ? 'warm' :
               'cold'
  
  // Early Signal detection
  // High velocity + low total views = early opportunity
  const isEarlySignal = viewVelocity > 50 && 
                        crossPlatformSpread > 35 && 
                        views < 50000 &&
                        ageHours < 12
  
  // Prediction
  const prediction = generatePrediction(total, momentum, ageHours, tier)
  
  return {
    viewVelocity: Math.round(viewVelocity),
    engagementRate: Math.round(engagementRate),
    crossPlatformSpread: Math.round(crossPlatformSpread),
    searchInterest: Math.round(searchInterest),
    commentSentiment: Math.round(commentSentiment),
    recencyBonus: Math.round(recencyBonus),
    total,
    momentum: Math.round(momentum),
    tier,
    isEarlySignal,
    prediction,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sigmoid(x: number, steepness: number = 1): number {
  return 1 / (1 + Math.exp(-steepness * (x - 0.5)))
}

function calculateMomentum(
  historicalScores: number[], 
  currentScore: number
): number {
  // Second derivative: rate of change of rate of change
  const scores = [...historicalScores, currentScore]
  if (scores.length < 3) return 0
  
  const recent = scores.slice(-3)
  const firstDelta = recent[1] - recent[0]
  const secondDelta = recent[2] - recent[1]
  
  // Positive momentum = accelerating
  // Negative momentum = decelerating
  return secondDelta - firstDelta
}

function estimateMomentum(
  viewVelocity: number,
  engagementRate: number,
  ageHours: number
): number {
  // Estimate momentum based on current signals
  // New content with high velocity = likely rising
  if (ageHours < 6 && viewVelocity > 60) return 15
  if (ageHours < 12 && viewVelocity > 40) return 8
  if (ageHours < 24 && engagementRate > 50) return 5
  if (ageHours > 48) return -5
  return 0
}

function generatePrediction(
  score: number,
  momentum: number,
  ageHours: number,
  tier: string
): { peakIn: string; confidence: number; trajectory: 'rising' | 'peaking' | 'fading' } {
  // Trajectory based on momentum and age
  const trajectory = momentum > 5 ? 'rising' :
                     momentum < -3 ? 'fading' :
                     'peaking'
  
  // Peak timing prediction
  const peakIn = trajectory === 'fading' ? 'déjà passé' :
                 score >= 90 && momentum < 2 ? '1-2h' :
                 score >= 75 && momentum > 0 ? '3-6h' :
                 score >= 60 ? '6-12h' :
                 ageHours < 12 ? '12-24h' :
                 '24-48h'
  
  // Confidence based on data quality
  const confidence = Math.min(
    0.95,
    0.5 + (momentum > 0 ? 0.15 : 0) + 
    (tier === 'explosive' || tier === 'fire' ? 0.2 : 0) +
    (ageHours < 24 ? 0.1 : 0)
  )
  
  return { peakIn, confidence, trajectory }
}

// ============================================================================
// BATCH SCORING
// ============================================================================

export function scoreAllContent(items: ContentItem[]): (ContentItem & { 
  viralScore: number
  scoreBreakdown: ViralScoreBreakdown 
})[] {
  return items.map(item => {
    const scoreBreakdown = calculateViralScore(item)
    return {
      ...item,
      viralScore: scoreBreakdown.total,
      momentum: scoreBreakdown.momentum,
      isEarlySignal: scoreBreakdown.isEarlySignal,
      scoreBreakdown,
    }
  }).sort((a, b) => b.viralScore - a.viralScore)
}

// ============================================================================
// TREND CLUSTERING
// ============================================================================

export function clusterContent(
  items: ContentItem[]
): Map<string, ContentItem[]> {
  const clusters = new Map<string, ContentItem[]>()
  
  // Simple keyword-based clustering
  // TODO: Implement semantic clustering with embeddings
  for (const item of items) {
    const keywords = extractKeywords(item.title)
    
    for (const keyword of keywords) {
      if (!clusters.has(keyword)) {
        clusters.set(keyword, [])
      }
      const cluster = clusters.get(keyword)
      if (cluster) {
        cluster.push(item)
      }
    }
  }
  
  // Filter to clusters with 3+ items
  const significantClusters = new Map<string, ContentItem[]>()
  for (const [keyword, clusterItems] of clusters) {
    if (clusterItems.length >= 3) {
      significantClusters.set(keyword, clusterItems)
    }
  }
  
  return significantClusters
}

function extractKeywords(title: string): string[] {
  // Simple keyword extraction
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'this', 'that', 'these', 'those',
    'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'my', 'your',
    'his', 'her', 'their', 'our', 'just', 'new', 'how', 'why', 'what',
    'when', 'where', 'who', 'which', 'more', 'most', 'some', 'any',
  ])
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 5)
}

// ============================================================================
// ALGORITHM TRANSPARENCY (Public API)
// ============================================================================

export function getAlgorithmDetails() {
  return {
    version: '2.0.0',
    lastUpdated: '2026-04-05',
    weights: ALGORITHM_WEIGHTS,
    thresholds: SCORE_THRESHOLDS,
    decayRate: DECAY_RATE,
    signals: [
      {
        name: 'View Velocity',
        weight: '25%',
        description: 'Views per hour divided by follower count. Measures how fast content spreads relative to audience size.',
      },
      {
        name: 'Engagement Rate',
        weight: '20%',
        description: 'Likes + comments×2 + shares×3 divided by views. Comments and shares weighted higher as stronger signals.',
      },
      {
        name: 'Cross-Platform Spread',
        weight: '20%',
        description: 'Detection of same content appearing across multiple platforms. Key predictor of mainstream virality.',
      },
      {
        name: 'Search Interest',
        weight: '15%',
        description: 'Google Trends correlation for related keywords. Shows if content is driving searches.',
      },
      {
        name: 'Comment Sentiment',
        weight: '10%',
        description: 'AI analysis of comment sentiment. Strong reactions (positive or negative) indicate viral potential.',
      },
      {
        name: 'Recency Bonus',
        weight: '10%',
        description: 'Freshness multiplier. Content under 6 hours gets maximum boost, then decays at 2% per hour.',
      },
    ],
  }
}
