/**
 * ALGO ENGINE · Central Intelligence System
 * 
 * Lightweight, efficient analysis modules for content intelligence.
 * NO heavy AI, NO complex simulations · just smart, fast logic.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ViralPhase = 'early' | 'rising' | 'peak' | 'saturated' | 'declining'
export type EmotionType = 'curiosity' | 'anger' | 'humor' | 'inspiration' | 'fear' | 'neutral'
export type ContentType = 'trend' | 'news' | 'video' | 'music' | 'movie'

export interface ViralScore {
  score: number          // 0-100
  phase: ViralPhase
  label: string
  confidence: number     // 0-1
}

export interface EmotionAnalysis {
  primary: EmotionType
  secondary?: EmotionType
  intensity: number      // 0-1
  keywords: string[]
}

export interface ActionSuggestion {
  id: string
  action: string
  format: string
  urgency: 'immediate' | 'soon' | 'flexible'
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ContentIntelligence {
  viralScore: ViralScore
  emotion: EmotionAnalysis
  actions: ActionSuggestion[]
  isEarlySignal: boolean
  freshness: 'live' | 'recent' | 'stale'
  confidence: number
}

export interface RawContentInput {
  id: string
  title: string
  description?: string
  growthRate?: number
  engagement?: number
  views?: number
  publishedAt?: string
  source?: string
  category?: string
  type: ContentType
}

// ═══════════════════════════════════════════════════════════════════════════
// VIRAL SCORE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate viral score from 0-100 based on available metrics.
 * Simple, deterministic logic · no AI needed.
 */
export function calculateViralScore(input: {
  growthRate?: number
  engagement?: number
  novelty?: number
  views?: number
  ageHours?: number
}): ViralScore {
  const { growthRate = 0, engagement = 0, novelty = 50, views = 0, ageHours = 24 } = input
  
  // Normalize inputs to 0-100 scale
  const normalizedGrowth = Math.min(100, Math.max(0, growthRate))
  const normalizedEngagement = Math.min(100, engagement)
  const normalizedNovelty = Math.min(100, novelty)
  
  // Views factor (logarithmic scale)
  const viewsFactor = views > 0 ? Math.min(100, Math.log10(views) * 15) : 0
  
  // Age decay (newer content scores higher)
  const ageDecay = Math.max(0, 1 - (ageHours / 168)) // 1 week decay
  
  // Weighted score calculation
  const rawScore = (
    normalizedGrowth * 0.35 +
    normalizedEngagement * 0.25 +
    normalizedNovelty * 0.20 +
    viewsFactor * 0.10 +
    (ageDecay * 100) * 0.10
  )
  
  const score = Math.round(Math.min(100, Math.max(0, rawScore)))
  
  // Determine phase based on score and age
  let phase: ViralPhase
  let label: string
  
  if (score >= 80 && ageHours < 12) {
    phase = 'peak'
    label = 'Au sommet'
  } else if (score >= 60) {
    phase = ageHours < 24 ? 'rising' : 'peak'
    label = ageHours < 24 ? 'En hausse' : 'Populaire'
  } else if (score >= 40) {
    phase = ageHours < 48 ? 'rising' : 'saturated'
    label = ageHours < 48 ? 'Emergence' : 'Sature'
  } else if (score >= 20) {
    phase = 'early'
    label = 'Signal precoce'
  } else {
    phase = 'declining'
    label = 'En declin'
  }
  
  // Confidence based on available data
  const dataPoints = [growthRate, engagement, views].filter(v => v !== undefined && v > 0).length
  const confidence = Math.min(1, 0.3 + (dataPoints * 0.23))
  
  return { score, phase, label, confidence }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMOTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

// Keyword dictionaries for emotion detection (French + English)
const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  curiosity: [
    'decouverte', 'secret', 'revele', 'pourquoi', 'comment', 'mystere', 'incroyable',
    'discover', 'secret', 'revealed', 'why', 'how', 'mystery', 'incredible', 'hidden',
    'etonnant', 'surprenant', 'inattendu', 'nouveaute', 'exclusif', 'premiere'
  ],
  anger: [
    'scandale', 'outrage', 'inacceptable', 'honte', 'revolte', 'injustice', 'choquant',
    'scandal', 'outrage', 'unacceptable', 'shame', 'revolt', 'injustice', 'shocking',
    'colere', 'furieux', 'inadmissible', 'denonce', 'accuse', 'controverse'
  ],
  humor: [
    'drole', 'hilarant', 'mdr', 'lol', 'blague', 'humour', 'comique', 'parodie',
    'funny', 'hilarious', 'joke', 'comedy', 'parody', 'meme', 'ridicule', 'absurde',
    'marrant', 'rigolo', 'tordant', 'fail', 'epic', 'wtf'
  ],
  inspiration: [
    'inspirant', 'motivation', 'succes', 'reussite', 'courage', 'espoir', 'reve',
    'inspiring', 'motivation', 'success', 'achievement', 'courage', 'hope', 'dream',
    'victoire', 'triomphe', 'lecon', 'conseil', 'astuce', 'transformation'
  ],
  fear: [
    'danger', 'alerte', 'urgence', 'menace', 'crise', 'catastrophe', 'peur',
    'danger', 'alert', 'urgent', 'threat', 'crisis', 'catastrophe', 'fear',
    'inquietant', 'effrayant', 'terrible', 'grave', 'attention', 'warning'
  ],
  neutral: []
}

/**
 * Analyze text to detect dominant emotion.
 * Simple keyword matching · fast and predictable.
 */
export function analyzeEmotion(text: string): EmotionAnalysis {
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Count keyword matches for each emotion
  const scores: Record<EmotionType, number> = {
    curiosity: 0,
    anger: 0,
    humor: 0,
    inspiration: 0,
    fear: 0,
    neutral: 0
  }
  
  const matchedKeywords: string[] = []
  
  for (const emotion of Object.keys(EMOTION_KEYWORDS) as EmotionType[]) {
    for (const keyword of EMOTION_KEYWORDS[emotion]) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (normalizedText.includes(normalizedKeyword)) {
        scores[emotion] += 1
        matchedKeywords.push(keyword)
      }
    }
  }
  
  // Find primary and secondary emotions
  const sortedEmotions = (Object.entries(scores) as [EmotionType, number][])
    .filter(([e]) => e !== 'neutral')
    .sort((a, b) => b[1] - a[1])
  
  const primary = sortedEmotions[0]?.[1] > 0 ? sortedEmotions[0][0] : 'neutral'
  const secondary = sortedEmotions[1]?.[1] > 0 ? sortedEmotions[1][0] : undefined
  
  // Calculate intensity
  const maxScore = Math.max(...Object.values(scores))
  const intensity = maxScore > 0 ? Math.min(1, maxScore / 5) : 0
  
  return {
    primary,
    secondary,
    intensity,
    keywords: matchedKeywords.slice(0, 5)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

// Action templates by content type and emotion
const ACTION_TEMPLATES: Record<ContentType, ActionSuggestion[]> = {
  trend: [
    { id: 'trend-1', action: 'Créer une vidéo courte sur ce sujet', format: 'Short/Reel', urgency: 'immediate', difficulty: 'easy' },
    { id: 'trend-2', action: 'Faire un thread explicatif', format: 'Thread', urgency: 'soon', difficulty: 'medium' },
    { id: 'trend-3', action: 'Donner ton opinion en story', format: 'Story', urgency: 'immediate', difficulty: 'easy' },
    { id: 'trend-4', action: 'Créer un carrousel informatif', format: 'Carousel', urgency: 'flexible', difficulty: 'medium' },
  ],
  news: [
    { id: 'news-1', action: 'Reagir rapidement avec ton analyse', format: 'Video/Post', urgency: 'immediate', difficulty: 'easy' },
    { id: 'news-2', action: 'Expliquer le contexte simplement', format: 'Thread', urgency: 'soon', difficulty: 'medium' },
    { id: 'news-3', action: 'Créer une infographie résumée', format: 'Image', urgency: 'flexible', difficulty: 'hard' },
  ],
  video: [
    { id: 'video-1', action: 'Faire un duet/stitch reaction', format: 'Short/Reel', urgency: 'immediate', difficulty: 'easy' },
    { id: 'video-2', action: 'Analyser ce qui fonctionne', format: 'Post', urgency: 'flexible', difficulty: 'medium' },
    { id: 'video-3', action: 'Adapter le format a ta niche', format: 'Video', urgency: 'soon', difficulty: 'medium' },
  ],
  music: [
    { id: 'music-1', action: 'Utiliser ce son dans ta prochaine video', format: 'Short/Reel', urgency: 'immediate', difficulty: 'easy' },
    { id: 'music-2', action: 'Créer un challenge avec ce son', format: 'Challenge', urgency: 'soon', difficulty: 'medium' },
    { id: 'music-3', action: 'Faire un cover ou remix', format: 'Video', urgency: 'flexible', difficulty: 'hard' },
  ],
  movie: [
    { id: 'movie-1', action: 'Partager ta critique rapide', format: 'Story/Post', urgency: 'soon', difficulty: 'easy' },
    { id: 'movie-2', action: 'Créer un top 5 thématique', format: 'Carousel/Video', urgency: 'flexible', difficulty: 'medium' },
    { id: 'movie-3', action: 'Analyser une scene marquante', format: 'Video', urgency: 'flexible', difficulty: 'hard' },
  ],
}

/**
 * Generate actionable suggestions based on content type and context.
 */
export function generateActions(
  contentType: ContentType,
  viralScore: ViralScore,
  emotion: EmotionAnalysis
): ActionSuggestion[] {
  const baseActions = ACTION_TEMPLATES[contentType] || ACTION_TEMPLATES.trend
  
  // Filter and prioritize based on viral phase
  let actions = [...baseActions]
  
  if (viralScore.phase === 'early' || viralScore.phase === 'rising') {
    // Prioritize immediate actions for trending content
    actions = actions.sort((a, b) => {
      const urgencyOrder = { immediate: 0, soon: 1, flexible: 2 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    })
  }
  
  // Add emotion-specific action if applicable
  if (emotion.primary !== 'neutral' && emotion.intensity > 0.5) {
    const emotionActions: Record<EmotionType, ActionSuggestion> = {
      curiosity: { id: 'emo-1', action: 'Reveler les details caches', format: 'Video', urgency: 'immediate', difficulty: 'medium' },
      anger: { id: 'emo-2', action: 'Donner ton avis authentique', format: 'Video/Post', urgency: 'immediate', difficulty: 'easy' },
      humor: { id: 'emo-3', action: 'Surfer sur l\'humour avec un meme', format: 'Image/Short', urgency: 'immediate', difficulty: 'easy' },
      inspiration: { id: 'emo-4', action: 'Partager ta propre histoire', format: 'Story/Post', urgency: 'soon', difficulty: 'medium' },
      fear: { id: 'emo-5', action: 'Rassurer ton audience', format: 'Video', urgency: 'immediate', difficulty: 'medium' },
      neutral: { id: 'emo-6', action: 'Informer de maniere factuelle', format: 'Post', urgency: 'flexible', difficulty: 'easy' },
    }
    actions.unshift(emotionActions[emotion.primary])
  }
  
  return actions.slice(0, 4) // Return top 4 actions
}

// ═══════════════════════════════════════════════════════════════════════════
// TREND DETECTOR (Early Signals)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect if content is an early signal worth highlighting.
 */
export function isEarlySignal(input: {
  growthRate?: number
  ageHours?: number
  engagement?: number
  novelty?: number
}): boolean {
  const { growthRate = 0, ageHours = 24, engagement = 0, novelty = 50 } = input
  
  // Early signal criteria:
  // 1. High growth rate (> 50%) AND
  // 2. Recent content (< 24h) AND
  // 3. Either high novelty or good engagement
  
  if (growthRate < 50) return false
  if (ageHours > 24) return false
  
  return novelty > 60 || engagement > 30
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA FRESHNESS
// ═══════════════════════════════════════════════════════════════════════════

export type FreshnessStatus = 'live' | 'recent' | 'stale'

/**
 * Determine data freshness based on age.
 */
export function getFreshness(fetchedAt: string | Date | null): FreshnessStatus {
  if (!fetchedAt) return 'stale'
  
  const date = typeof fetchedAt === 'string' ? new Date(fetchedAt) : fetchedAt
  const ageMs = Date.now() - date.getTime()
  const ageMinutes = ageMs / (1000 * 60)
  
  if (ageMinutes < 5) return 'live'
  if (ageMinutes < 30) return 'recent'
  return 'stale'
}

/**
 * Format freshness as human-readable string.
 */
export function formatFreshness(fetchedAt: string | Date | null): string {
  if (!fetchedAt) return 'Données non disponibles'
  
  const date = typeof fetchedAt === 'string' ? new Date(fetchedAt) : fetchedAt
  const ageMs = Date.now() - date.getTime()
  const ageMinutes = Math.floor(ageMs / (1000 * 60))
  
  if (ageMinutes < 1) return 'A l\'instant'
  if (ageMinutes < 60) return `Il y a ${ageMinutes} min`
  
  const ageHours = Math.floor(ageMinutes / 60)
  if (ageHours < 24) return `Il y a ${ageHours}h`
  
  return `Il y a ${Math.floor(ageHours / 24)} jour(s)`
}

// ═══════════════════════════════════════════════════════════════════════════
// COHERENCE GUARD
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate content data to prevent broken UI.
 */
export function validateContent(content: Partial<RawContentInput>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required fields
  if (!content.id) errors.push('ID manquant')
  if (!content.title || content.title.trim().length === 0) errors.push('Titre manquant')
  
  // Warnings for incomplete data
  if (!content.description) warnings.push('Description manquante')
  if (content.growthRate === undefined) warnings.push('Taux de croissance non disponible')
  if (!content.publishedAt) warnings.push('Date de publication manquante')
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Create a safe fallback for invalid content.
 */
export function createFallback(partial: Partial<RawContentInput>): RawContentInput {
  return {
    id: partial.id || `fallback-${Date.now()}`,
    title: partial.title || 'Contenu non disponible',
    description: partial.description || '',
    growthRate: partial.growthRate ?? 0,
    engagement: partial.engagement ?? 0,
    views: partial.views ?? 0,
    publishedAt: partial.publishedAt || new Date().toISOString(),
    source: partial.source || 'unknown',
    category: partial.category || 'general',
    type: partial.type || 'trend'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process raw content and return full intelligence analysis.
 * This is the main entry point for the ALGO Engine.
 */
export function processContent(input: RawContentInput): ContentIntelligence {
  // Calculate age in hours
  const ageHours = input.publishedAt 
    ? (Date.now() - new Date(input.publishedAt).getTime()) / (1000 * 60 * 60)
    : 24
  
  // Calculate viral score
  const viralScore = calculateViralScore({
    growthRate: input.growthRate,
    engagement: input.engagement,
    views: input.views,
    novelty: 50, // Default novelty
    ageHours
  })
  
  // Analyze emotion from title + description
  const textToAnalyze = `${input.title} ${input.description || ''}`
  const emotion = analyzeEmotion(textToAnalyze)
  
  // Generate actions
  const actions = generateActions(input.type, viralScore, emotion)
  
  // Check if early signal
  const earlySignal = isEarlySignal({
    growthRate: input.growthRate,
    ageHours,
    engagement: input.engagement
  })
  
  // Determine freshness
  const freshness = getFreshness(input.publishedAt || null)
  
  // Overall confidence
  const confidence = (viralScore.confidence + (emotion.intensity > 0 ? 0.8 : 0.5)) / 2
  
  return {
    viralScore,
    emotion,
    actions,
    isEarlySignal: earlySignal,
    freshness,
    confidence
  }
}

/**
 * Process multiple content items efficiently.
 */
export function processContentBatch(items: RawContentInput[]): Map<string, ContentIntelligence> {
  const results = new Map<string, ContentIntelligence>()
  
  for (const item of items) {
    const validation = validateContent(item)
    if (validation.isValid) {
      results.set(item.id, processContent(item))
    } else {
      // Process with fallback for invalid items
      const fallback = createFallback(item)
      results.set(fallback.id, processContent(fallback))
    }
  }
  
  return results
}
