/**
 * ALGO VIRAL ENGINE — The Algorithm of Algorithms
 * 
 * Un moteur de détection virale de classe mondiale basé sur:
 * - Velocity Detection (accélération du momentum)
 * - Cross-Platform Signal Fusion (signaux multi-plateformes)
 * - Predictive Trend Analysis (prédiction avant le pic)
 * - Sentiment Amplification (amplification émotionnelle)
 * - Network Effect Modeling (modélisation de la propagation)
 */

import type { Content } from '@/types'

// ============================================================================
// CORE TYPES
// ============================================================================

export interface ViralSignal {
  id: string
  source: 'tiktok' | 'x' | 'instagram' | 'youtube' | 'reddit' | 'google' | 'news'
  keyword: string
  velocity: number           // Taux de croissance par heure
  acceleration: number       // Changement de vélocité (2e dérivée)
  volume: number            // Volume absolu de mentions/recherches
  sentiment: number         // -1 à 1 (négatif à positif)
  emotionalIntensity: number // 0 à 1 (intensité émotionnelle)
  geographicSpread: string[] // Pays où le signal est détecté
  timestamp: number
  rawData?: Record<string, unknown>
}

export interface ViralScore {
  overall: number           // Score final 0-100
  velocity: number          // Composante vélocité
  momentum: number          // Composante momentum
  crossPlatform: number     // Présence multi-plateforme
  sentiment: number         // Score sentiment
  predictedPeak: number     // Heures avant le pic estimé
  confidence: number        // Confiance de la prédiction 0-1
  tier: 'S' | 'A' | 'B' | 'C' | 'D' // Classification tier
}

export interface TrendPrediction {
  willGoViral: boolean
  probability: number       // 0-1
  estimatedPeakTime: Date
  estimatedPeakVolume: number
  recommendedAction: 'post_now' | 'prepare' | 'wait' | 'too_late'
  optimalPostWindow: { start: Date; end: Date }
  reasoning: string[]
}

// ============================================================================
// VELOCITY DETECTION — Détection de l'accélération virale
// ============================================================================

export function calculateVelocity(
  dataPoints: { timestamp: number; value: number }[],
  windowHours: number = 1
): { velocity: number; acceleration: number } {
  if (dataPoints.length < 2) return { velocity: 0, acceleration: 0 }
  
  const now = Date.now()
  const windowMs = windowHours * 60 * 60 * 1000
  
  // Filtrer les points dans la fenêtre
  const recentPoints = dataPoints
    .filter(p => now - p.timestamp < windowMs)
    .sort((a, b) => a.timestamp - b.timestamp)
  
  if (recentPoints.length < 2) return { velocity: 0, acceleration: 0 }
  
  // Calculer la vélocité (première dérivée)
  const firstPoint = recentPoints[0]
  const lastPoint = recentPoints[recentPoints.length - 1]
  const timeDelta = (lastPoint.timestamp - firstPoint.timestamp) / (60 * 60 * 1000) // en heures
  
  if (timeDelta === 0) return { velocity: 0, acceleration: 0 }
  
  const velocity = (lastPoint.value - firstPoint.value) / timeDelta
  
  // Calculer l'accélération (deuxième dérivée)
  if (recentPoints.length < 3) return { velocity, acceleration: 0 }
  
  const midIndex = Math.floor(recentPoints.length / 2)
  const midPoint = recentPoints[midIndex]
  
  const v1 = (midPoint.value - firstPoint.value) / ((midPoint.timestamp - firstPoint.timestamp) / (60 * 60 * 1000))
  const v2 = (lastPoint.value - midPoint.value) / ((lastPoint.timestamp - midPoint.timestamp) / (60 * 60 * 1000))
  
  const acceleration = v2 - v1
  
  return { velocity, acceleration }
}

// ============================================================================
// VIRAL SCORE ALGORITHM — L'algorithme de scoring viral
// ============================================================================

const WEIGHTS = {
  velocity: 0.25,
  acceleration: 0.20,
  crossPlatform: 0.15,
  sentiment: 0.10,
  emotionalIntensity: 0.10,
  geographicSpread: 0.10,
  recency: 0.10
}

export function computeViralScore(signals: ViralSignal[]): ViralScore {
  if (signals.length === 0) {
    return {
      overall: 0,
      velocity: 0,
      momentum: 0,
      crossPlatform: 0,
      sentiment: 0,
      predictedPeak: 0,
      confidence: 0,
      tier: 'D'
    }
  }
  
  // 1. VELOCITY SCORE — Croissance rapide = viral
  const maxVelocity = Math.max(...signals.map(s => s.velocity))
  const avgVelocity = signals.reduce((acc, s) => acc + s.velocity, 0) / signals.length
  const velocityScore = Math.min(100, (avgVelocity / 1000) * 100 + (maxVelocity > 5000 ? 20 : 0))
  
  // 2. ACCELERATION SCORE — Accélération = explosion imminente
  const avgAcceleration = signals.reduce((acc, s) => acc + s.acceleration, 0) / signals.length
  const accelerationBonus = avgAcceleration > 0 ? Math.min(30, avgAcceleration / 100) : 0
  
  // 3. CROSS-PLATFORM SCORE — Multi-plateforme = viral confirmé
  const platforms = new Set(signals.map(s => s.source))
  const crossPlatformScore = Math.min(100, (platforms.size / 7) * 100 + (platforms.size >= 4 ? 20 : 0))
  
  // 4. SENTIMENT SCORE — Émotions fortes = engagement
  const avgSentiment = signals.reduce((acc, s) => acc + Math.abs(s.sentiment), 0) / signals.length
  const avgIntensity = signals.reduce((acc, s) => acc + s.emotionalIntensity, 0) / signals.length
  const sentimentScore = (avgSentiment * 50) + (avgIntensity * 50)
  
  // 5. GEOGRAPHIC SPREAD — Propagation mondiale = mega-viral
  const allCountries = new Set(signals.flatMap(s => s.geographicSpread))
  const geoScore = Math.min(100, (allCountries.size / 50) * 100)
  
  // 6. RECENCY SCORE — Plus récent = plus pertinent
  const now = Date.now()
  const avgAge = signals.reduce((acc, s) => acc + (now - s.timestamp), 0) / signals.length
  const recencyScore = Math.max(0, 100 - (avgAge / (60 * 60 * 1000)) * 10) // -10 par heure
  
  // CALCUL DU SCORE FINAL
  const momentumScore = velocityScore * 0.6 + accelerationBonus * 0.4
  
  const overall = Math.round(
    velocityScore * WEIGHTS.velocity +
    accelerationBonus * WEIGHTS.acceleration +
    crossPlatformScore * WEIGHTS.crossPlatform +
    sentimentScore * WEIGHTS.sentiment +
    avgIntensity * 100 * WEIGHTS.emotionalIntensity +
    geoScore * WEIGHTS.geographicSpread +
    recencyScore * WEIGHTS.recency
  )
  
  // PREDICTION DU PIC
  // Si accélération positive et haute = pic proche
  // Si accélération négative = pic passé
  const predictedPeak = avgAcceleration > 0 
    ? Math.max(1, 24 - (avgAcceleration / 50))  // Plus l'accélération est haute, plus le pic est proche
    : avgAcceleration < -50 ? -1 : 48           // Accélération négative = pic passé
  
  // CONFIANCE basée sur le nombre de signaux et leur cohérence
  const confidence = Math.min(1, 
    (signals.length / 10) * 0.5 +  // Plus de signaux = plus de confiance
    (platforms.size / 7) * 0.3 +   // Plus de plateformes = plus de confiance
    (1 - (Math.max(...signals.map(s => s.velocity)) - Math.min(...signals.map(s => s.velocity))) / 10000) * 0.2
  )
  
  // TIER CLASSIFICATION
  const tier: 'S' | 'A' | 'B' | 'C' | 'D' = 
    overall >= 85 ? 'S' :
    overall >= 70 ? 'A' :
    overall >= 50 ? 'B' :
    overall >= 30 ? 'C' : 'D'
  
  return {
    overall: Math.min(100, Math.max(0, overall)),
    velocity: velocityScore,
    momentum: momentumScore,
    crossPlatform: crossPlatformScore,
    sentiment: sentimentScore,
    predictedPeak,
    confidence,
    tier
  }
}

// ============================================================================
// TREND PREDICTION — Prédiction du potentiel viral
// ============================================================================

export function predictViralPotential(
  signals: ViralSignal[],
  historicalData?: { peakVolume: number; timeToViral: number }[]
): TrendPrediction {
  void historicalData
  const score = computeViralScore(signals)
  
  // Calculer la probabilité de viralité
  let probability = score.overall / 100
  
  // Ajustements basés sur les patterns
  if (score.tier === 'S') probability = Math.min(0.95, probability + 0.15)
  if (signals.some(s => s.acceleration > 100)) probability = Math.min(0.98, probability + 0.1)
  if (signals.length >= 5 && new Set(signals.map(s => s.source)).size >= 3) {
    probability = Math.min(0.99, probability + 0.05)
  }
  
  // Estimation du pic
  const now = new Date()
  const hoursUntilPeak = Math.max(1, score.predictedPeak)
  const estimatedPeakTime = new Date(now.getTime() + hoursUntilPeak * 60 * 60 * 1000)
  
  // Volume estimé au pic
  const currentVolume = signals.reduce((acc, s) => acc + s.volume, 0)
  const growthFactor = 1 + (score.velocity / 100)
  const estimatedPeakVolume = Math.round(currentVolume * Math.pow(growthFactor, hoursUntilPeak))
  
  // Fenêtre optimale de publication
  const optimalStart = new Date(now.getTime() + Math.max(0, (hoursUntilPeak - 6)) * 60 * 60 * 1000)
  const optimalEnd = new Date(now.getTime() + Math.max(1, (hoursUntilPeak - 1)) * 60 * 60 * 1000)
  
  // Action recommandée
  let recommendedAction: TrendPrediction['recommendedAction']
  if (score.predictedPeak < 0) {
    recommendedAction = 'too_late'
  } else if (score.predictedPeak <= 3 && probability >= 0.6) {
    recommendedAction = 'post_now'
  } else if (score.predictedPeak <= 12 && probability >= 0.4) {
    recommendedAction = 'prepare'
  } else {
    recommendedAction = 'wait'
  }
  
  // Raisonnement
  const reasoning: string[] = []
  if (score.tier === 'S') reasoning.push('Signal tier S - Potentiel viral exceptionnel')
  if (score.velocity > 70) reasoning.push('Vélocité très élevée - Croissance explosive')
  if (score.crossPlatform > 60) reasoning.push('Présence multi-plateforme - Propagation confirmée')
  if (signals.some(s => s.acceleration > 50)) reasoning.push('Accélération positive - Momentum en hausse')
  if (score.sentiment > 70) reasoning.push('Engagement émotionnel fort')
  if (probability < 0.3) reasoning.push('Signaux faibles - Surveiller avant d\'agir')
  
  return {
    willGoViral: probability >= 0.5,
    probability,
    estimatedPeakTime,
    estimatedPeakVolume,
    recommendedAction,
    optimalPostWindow: { start: optimalStart, end: optimalEnd },
    reasoning
  }
}

// ============================================================================
// CONTENT RANKING — Classement des contenus
// ============================================================================

export function rankContentByViralPotential(
  contents: Content[],
  signalsByKeyword: Map<string, ViralSignal[]>
): (Content & { viralScore: ViralScore; prediction: TrendPrediction })[] {
  return contents
    .map(content => {
      // Trouver les signaux liés à ce contenu (par tags, titre, etc.)
      const relatedSignals: ViralSignal[] = []
      
      content.tags?.forEach(tag => {
        const signals = signalsByKeyword.get(tag.toLowerCase())
        if (signals) relatedSignals.push(...signals)
      })
      
      // Chercher aussi dans le titre
      const titleWords = content.title.toLowerCase().split(/\s+/)
      titleWords.forEach(word => {
        if (word.length > 3) {
          const signals = signalsByKeyword.get(word)
          if (signals) relatedSignals.push(...signals)
        }
      })
      
      const viralScore = computeViralScore(relatedSignals)
      const prediction = predictViralPotential(relatedSignals)
      
      return { ...content, viralScore, prediction }
    })
    .sort((a, b) => b.viralScore.overall - a.viralScore.overall)
}

// ============================================================================
// REAL-TIME SIGNAL AGGREGATOR — Agrégation des signaux en temps réel
// ============================================================================

export class SignalAggregator {
  private signals: Map<string, ViralSignal[]> = new Map()
  private subscribers: Set<(signals: Map<string, ViralSignal[]>) => void> = new Set()
  
  addSignal(signal: ViralSignal) {
    const existing = this.signals.get(signal.keyword) || []
    existing.push(signal)
    
    // Garder seulement les 24 dernières heures
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const filtered = existing.filter(s => s.timestamp > cutoff)
    
    this.signals.set(signal.keyword, filtered)
    this.notifySubscribers()
  }
  
  addSignals(signals: ViralSignal[]) {
    signals.forEach(s => {
      const existing = this.signals.get(s.keyword) || []
      existing.push(s)
      this.signals.set(s.keyword, existing)
    })
    this.notifySubscribers()
  }
  
  getTopSignals(limit: number = 20): { keyword: string; score: ViralScore; signals: ViralSignal[] }[] {
    const results: { keyword: string; score: ViralScore; signals: ViralSignal[] }[] = []
    
    this.signals.forEach((signals, keyword) => {
      const score = computeViralScore(signals)
      results.push({ keyword, score, signals })
    })
    
    return results
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, limit)
  }
  
  subscribe(callback: (signals: Map<string, ViralSignal[]>) => void) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }
  
  private notifySubscribers() {
    this.subscribers.forEach(cb => cb(this.signals))
  }
}

// Export singleton
export const globalSignalAggregator = new SignalAggregator()
