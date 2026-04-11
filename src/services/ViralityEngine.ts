// =============================================================================
// ALGO V1 · Virality Engine
// Core service for calculating viral scores and predicting content performance
// =============================================================================

export type ViralityLevel = 'exploding' | 'viral' | 'rising' | 'emerging' | 'stable' | 'fading'
export type MomentumType = 'accelerating' | 'climbing' | 'stable' | 'decelerating' | 'crashing'
export type FreshnessLevel = 'breaking' | 'fresh' | 'recent' | 'aging' | 'stale'
export type SaturationLevel = 'untapped' | 'low' | 'moderate' | 'high' | 'saturated'
export type TimingAdvice = 'post_now' | 'prepare' | 'wait' | 'too_late' | 'missed'

export interface ViralityScore {
  value: number           // 0-100
  level: ViralityLevel
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  confidence: number      // 0-1
}

export interface MomentumData {
  type: MomentumType
  velocity: number        // Change rate per hour
  acceleration: number    // Change in velocity
  trend: 'up' | 'down' | 'stable'
}

export interface FreshnessData {
  level: FreshnessLevel
  ageMinutes: number
  peakWindow: boolean     // Is this within optimal posting window?
  remainingMinutes?: number // Minutes left in optimal window
}

export interface SaturationData {
  level: SaturationLevel
  competitorCount: number
  coverageScore: number   // 0-1, how much coverage exists
  opportunityScore: number // 0-1, remaining opportunity
}

export interface ViralityAnalysis {
  score: ViralityScore
  momentum: MomentumData
  freshness: FreshnessData
  saturation: SaturationData
  timing: {
    advice: TimingAdvice
    label: string
    urgency: 'critical' | 'high' | 'medium' | 'low' | 'none'
    optimalWindow: { start: Date; end: Date } | null
  }
  prediction: {
    peakScore: number
    timeToP5eak: number    // Minutes
    confidence: number
  }
  recommendations: string[]
}

// =============================================================================
// Score Calculations
// =============================================================================

/**
 * Calculate base viral score from engagement metrics
 */
export function calculateViralScore(metrics: {
  views?: number
  likes?: number
  shares?: number
  comments?: number
  mentions?: number
  growthRate?: number
  ageMinutes?: number
}): ViralityScore {
  const { 
    views = 0, 
    likes = 0, 
    shares = 0, 
    comments = 0, 
    mentions = 0,
    growthRate = 0,
    ageMinutes = 60
  } = metrics

  // Base score from raw numbers (logarithmic scale)
  const viewScore = views > 0 ? Math.min(30, Math.log10(views) * 6) : 0
  const engagementScore = Math.min(25, Math.log10(Math.max(1, likes + shares + comments)) * 5)
  const mentionScore = Math.min(20, Math.log10(Math.max(1, mentions)) * 5)
  
  // Growth multiplier (exponential growth gets bonus)
  const growthBonus = Math.min(15, growthRate > 0 ? Math.sqrt(growthRate) * 2 : 0)
  
  // Freshness bonus (newer content gets boost)
  const freshnessBonus = ageMinutes < 30 ? 10 : 
                        ageMinutes < 60 ? 8 :
                        ageMinutes < 180 ? 5 :
                        ageMinutes < 360 ? 3 : 0
  
  // Calculate final score
  let value = Math.round(viewScore + engagementScore + mentionScore + growthBonus + freshnessBonus)
  value = Math.max(0, Math.min(100, value))
  
  // Determine level and tier
  const level = getViralityLevel(value)
  const tier = getViralityTier(value)
  
  // Confidence based on data quality
  const dataPoints = [views, likes, shares, comments, mentions].filter(v => v > 0).length
  const confidence = Math.min(1, 0.3 + (dataPoints * 0.14))
  
  return { value, level, tier, confidence }
}

/**
 * Get virality level from score
 */
export function getViralityLevel(score: number): ViralityLevel {
  if (score >= 90) return 'exploding'
  if (score >= 80) return 'viral'
  if (score >= 70) return 'rising'
  if (score >= 60) return 'emerging'
  if (score >= 40) return 'stable'
  return 'fading'
}

/**
 * Get tier from score
 */
export function getViralityTier(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 85) return 'S'
  if (score >= 70) return 'A'
  if (score >= 55) return 'B'
  if (score >= 40) return 'C'
  return 'D'
}

/**
 * Calculate momentum from time series data
 */
export function calculateMomentum(
  currentValue: number,
  previousValues: number[],
  intervalMinutes: number = 15
): MomentumData {
  if (previousValues.length === 0) {
    return { type: 'stable', velocity: 0, acceleration: 0, trend: 'stable' }
  }

  // Calculate velocity (change per hour)
  const recentValue = previousValues[previousValues.length - 1] || currentValue
  const velocity = ((currentValue - recentValue) / intervalMinutes) * 60

  // Calculate acceleration (change in velocity)
  let acceleration = 0
  if (previousValues.length >= 2) {
    const prevVelocity = ((previousValues[previousValues.length - 1] - previousValues[previousValues.length - 2]) / intervalMinutes) * 60
    acceleration = velocity - prevVelocity
  }

  // Determine momentum type
  let type: MomentumType
  if (velocity > 50 && acceleration > 10) {
    type = 'accelerating'
  } else if (velocity > 20) {
    type = 'climbing'
  } else if (velocity > -20 && velocity <= 20) {
    type = 'stable'
  } else if (velocity > -50) {
    type = 'decelerating'
  } else {
    type = 'crashing'
  }

  const trend = velocity > 5 ? 'up' : velocity < -5 ? 'down' : 'stable'

  return { type, velocity, acceleration, trend }
}

/**
 * Calculate freshness from publication time
 */
export function calculateFreshness(publishedAt: Date | string): FreshnessData {
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt
  const now = new Date()
  const ageMinutes = Math.floor((now.getTime() - published.getTime()) / 60000)

  let level: FreshnessLevel
  let peakWindow = false
  let remainingMinutes: number | undefined

  if (ageMinutes < 15) {
    level = 'breaking'
    peakWindow = true
    remainingMinutes = 60 - ageMinutes // Optimal window is first hour
  } else if (ageMinutes < 60) {
    level = 'fresh'
    peakWindow = true
    remainingMinutes = 60 - ageMinutes
  } else if (ageMinutes < 180) {
    level = 'recent'
    peakWindow = ageMinutes < 120
    remainingMinutes = peakWindow ? 120 - ageMinutes : undefined
  } else if (ageMinutes < 720) {
    level = 'aging'
  } else {
    level = 'stale'
  }

  return { level, ageMinutes, peakWindow, remainingMinutes }
}

/**
 * Calculate content saturation level
 */
export function calculateSaturation(
  competitorCount: number,
  totalMentions: number,
  _topCompetitorMentions: number
): SaturationData {
  void _topCompetitorMentions
  // Coverage score based on existing content
  const coverageScore = Math.min(1, totalMentions / 10000)
  
  // Opportunity score (inverse of saturation)
  const opportunityScore = Math.max(0, 1 - coverageScore)

  let level: SaturationLevel
  if (competitorCount < 5 && coverageScore < 0.1) {
    level = 'untapped'
  } else if (competitorCount < 20 && coverageScore < 0.3) {
    level = 'low'
  } else if (competitorCount < 50 && coverageScore < 0.5) {
    level = 'moderate'
  } else if (coverageScore < 0.8) {
    level = 'high'
  } else {
    level = 'saturated'
  }

  return { level, competitorCount, coverageScore, opportunityScore }
}

/**
 * Get timing advice based on freshness and saturation
 */
export function getTimingAdvice(
  freshness: FreshnessData,
  saturation: SaturationData,
  momentum: MomentumData
): {
  advice: TimingAdvice
  label: string
  urgency: 'critical' | 'high' | 'medium' | 'low' | 'none'
  optimalWindow: { start: Date; end: Date } | null
} {
  const now = new Date()
  
  // Determine optimal window
  let optimalWindow: { start: Date; end: Date } | null = null
  if (freshness.peakWindow && freshness.remainingMinutes) {
    optimalWindow = {
      start: now,
      end: new Date(now.getTime() + freshness.remainingMinutes * 60000)
    }
  }

  // Determine advice
  if (saturation.level === 'saturated') {
    return { advice: 'too_late', label: 'Trop tard', urgency: 'none', optimalWindow: null }
  }
  
  if (freshness.level === 'stale') {
    return { advice: 'missed', label: 'Opportunite manquee', urgency: 'none', optimalWindow: null }
  }

  if (freshness.level === 'breaking' && saturation.level === 'untapped') {
    return { advice: 'post_now', label: 'Poster maintenant!', urgency: 'critical', optimalWindow }
  }

  if (freshness.level === 'fresh' && saturation.opportunityScore > 0.7) {
    return { advice: 'post_now', label: 'Fenêtre optimale', urgency: 'high', optimalWindow }
  }

  if (freshness.level === 'recent' && momentum.type === 'accelerating') {
    return { advice: 'post_now', label: 'Accélération détectée', urgency: 'high', optimalWindow }
  }

  if (saturation.opportunityScore > 0.5) {
    return { advice: 'prepare', label: 'Préparer le contenu', urgency: 'medium', optimalWindow }
  }

  return { advice: 'wait', label: 'Observer', urgency: 'low', optimalWindow: null }
}

/**
 * Generate recommendations based on analysis
 */
export function generateRecommendations(
  score: ViralityScore,
  momentum: MomentumData,
  freshness: FreshnessData,
  saturation: SaturationData
): string[] {
  const recommendations: string[] = []

  // Score-based recommendations
  if (score.tier === 'S') {
    recommendations.push('Contenu à fort potentiel viral — priorité absolue')
  } else if (score.tier === 'A') {
    recommendations.push('Bon potentiel — réagir rapidement')
  }

  // Momentum recommendations
  if (momentum.type === 'accelerating') {
    recommendations.push('Croissance exponentielle détectée — surfer sur la vague')
  } else if (momentum.type === 'climbing') {
    recommendations.push('Tendance montante - bon timing pour se positionner')
  } else if (momentum.type === 'decelerating') {
    recommendations.push('Ralentissement observé — agir vite ou passer')
  }

  // Freshness recommendations
  if (freshness.peakWindow) {
    recommendations.push(`Fenêtre optimale : ${freshness.remainingMinutes || 60} minutes restantes`)
  } else if (freshness.level === 'aging') {
    recommendations.push('Sujet vieillissant - apporter un angle nouveau')
  }

  // Saturation recommendations
  if (saturation.level === 'untapped') {
    recommendations.push('Territoire vierge — opportunité unique')
  } else if (saturation.level === 'low') {
    recommendations.push('Peu de concurrence - excellent potentiel')
  } else if (saturation.level === 'high') {
    recommendations.push('Forte concurrence - se differencier absolument')
  } else if (saturation.level === 'saturated') {
    recommendations.push('Marche sature - considerer un angle de niche')
  }

  return recommendations.slice(0, 5)
}

/**
 * Full virality analysis
 */
export function analyzeVirality(
  metrics: {
    views?: number
    likes?: number
    shares?: number
    comments?: number
    mentions?: number
    growthRate?: number
    publishedAt: Date | string
  },
  competition: {
    competitorCount?: number
    totalMentions?: number
    topCompetitorMentions?: number
  } = {},
  historicalScores: number[] = []
): ViralityAnalysis {
  const publishedAt = typeof metrics.publishedAt === 'string' 
    ? new Date(metrics.publishedAt) 
    : metrics.publishedAt
  
  const ageMinutes = Math.floor((Date.now() - publishedAt.getTime()) / 60000)
  
  const score = calculateViralScore({ ...metrics, ageMinutes })
  const momentum = calculateMomentum(score.value, historicalScores)
  const freshness = calculateFreshness(metrics.publishedAt)
  const saturation = calculateSaturation(
    competition.competitorCount || 10,
    competition.totalMentions || 1000,
    competition.topCompetitorMentions || 500
  )
  const timing = getTimingAdvice(freshness, saturation, momentum)
  const recommendations = generateRecommendations(score, momentum, freshness, saturation)

  // Predict peak
  const peakScore = Math.min(100, score.value + (momentum.velocity > 0 ? momentum.velocity * 2 : 0))
  const timeToPeak = momentum.velocity > 0 ? Math.floor(60 / Math.max(1, momentum.velocity) * (100 - score.value)) : 0

  return {
    score,
    momentum,
    freshness,
    saturation,
    timing,
    prediction: {
      peakScore,
      timeToP5eak: timeToPeak,
      confidence: score.confidence * 0.8
    },
    recommendations
  }
}

// =============================================================================
// French Labels
// =============================================================================

export const VIRALITY_LABELS_FR: Record<ViralityLevel, { label: string; description: string }> = {
  exploding: { label: 'Explosion', description: 'Ce contenu explose en ce moment' },
  viral: { label: 'Viral', description: 'Forte viralité en cours' },
  rising: { label: 'Montant', description: 'Signal en forte croissance' },
  emerging: { label: 'Émergent', description: 'Signal précoce détecté' },
  stable: { label: 'Stable', description: 'Intérêt stable' },
  fading: { label: 'Déclin', description: 'Intérêt en baisse' }
}

export const MOMENTUM_LABELS_FR: Record<MomentumType, string> = {
  accelerating: 'Accélération',
  climbing: 'Croissance',
  stable: 'Stable',
  decelerating: 'Ralentissement',
  crashing: 'Chute'
}

export const FRESHNESS_LABELS_FR: Record<FreshnessLevel, string> = {
  breaking: 'Très frais',
  fresh: 'Frais',
  recent: 'Récent',
  aging: 'Vieillissant',
  stale: 'Ancien'
}

export const SATURATION_LABELS_FR: Record<SaturationLevel, string> = {
  untapped: 'Inexploré',
  low: 'Peu saturé',
  moderate: 'Saturation moyenne',
  high: 'Très concurrentiel',
  saturated: 'Saturé'
}

const viralityEngineExports = {
  calculateViralScore,
  calculateMomentum,
  calculateFreshness,
  calculateSaturation,
  getTimingAdvice,
  generateRecommendations,
  analyzeVirality,
  getViralityLevel,
  getViralityTier,
  VIRALITY_LABELS_FR,
  MOMENTUM_LABELS_FR,
  FRESHNESS_LABELS_FR,
  SATURATION_LABELS_FR,
}

export default viralityEngineExports
