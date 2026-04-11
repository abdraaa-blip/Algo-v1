/**
 * ALGO AI Brain Layer
 * Perplexity AI / Google Discover Architecture
 * 
 * AI-powered explanations, predictions, and personalization
 */

import type { ContentItem } from '../connectors'
import type { ViralScoreBreakdown } from './viral-score'

// ============================================================================
// AI CONTENT ANALYSIS
// ============================================================================

export interface AIAnalysis {
  explanation: string          // Why this is going viral
  creatorTip: string           // How to replicate this
  riskAssessment: 'rising' | 'peaking' | 'fading'
  culturalContext: string      // Why it resonates now
  sentiment: 'positive' | 'neutral' | 'negative'
  targetAudience: string[]
  contentFormat: string
  predictedPeakTime: string
  confidence: number
}

/**
 * Generate AI analysis for content
 * Uses heuristics when AI API is unavailable
 */
export function generateAIAnalysis(
  item: ContentItem,
  scoreBreakdown: ViralScoreBreakdown
): AIAnalysis {
  // Template-based analysis (no API key required)
  // In production, this would call GPT-4/Claude API
  
  const { prediction } = scoreBreakdown
  const source = item.source
  const category = item.category || 'general'
  const publishedAt = item.publishedAt ?? Date.now()
  const ageHours = Math.max((Date.now() - publishedAt) / (1000 * 60 * 60), 0.01)
  
  // Generate explanation based on signals
  const explanation = generateExplanation(item, scoreBreakdown, ageHours)
  
  // Generate creator tip
  const creatorTip = generateCreatorTip(item, scoreBreakdown, source)
  
  // Cultural context
  const culturalContext = generateCulturalContext(item, category)
  
  // Target audience
  const targetAudience = inferTargetAudience(item, source, category)
  
  // Content format detection
  const contentFormat = detectContentFormat(item)
  
  // Sentiment (based on engagement patterns)
  const sentiment = inferSentiment(item, scoreBreakdown)
  
  return {
    explanation,
    creatorTip,
    riskAssessment: prediction.trajectory,
    culturalContext,
    sentiment,
    targetAudience,
    contentFormat,
    predictedPeakTime: prediction.peakIn,
    confidence: prediction.confidence,
  }
}

// ============================================================================
// EXPLANATION GENERATOR
// ============================================================================

function generateExplanation(
  item: ContentItem,
  score: ViralScoreBreakdown,
  ageHours: number
): string {
  const { tier, momentum, isEarlySignal, viewVelocity, engagementRate } = score
  const views = item.metrics?.views || 0
  const source = item.source
  
  // Early signal explanation
  if (isEarlySignal) {
    return `Signal précoce détecté : ce contenu montre une vélocité anormalement haute (${viewVelocity}/100) pour son âge (${Math.round(ageHours)} h). Le taux d'engagement de ${engagementRate} % suggère un potentiel viral dans les prochaines heures.`
  }
  
  // Tier-based explanations
  if (tier === 'explosive') {
    return `Phénomène viral en cours : ce contenu a atteint ${formatNumber(views)} vues avec un momentum de +${momentum}. La vitesse de propagation dépasse 95 % des contenus de cette catégorie.`
  }
  
  if (tier === 'fire') {
    return `Contenu en forte croissance avec ${formatNumber(views)} vues. Le ratio d'engagement de ${engagementRate} % et la vélocité de ${viewVelocity}/100 indiquent une viralité confirmée.`
  }
  
  if (tier === 'hot') {
    const reason = viewVelocity > 50 
      ? `une vélocité élevée (${viewVelocity}/100)`
      : `un engagement fort (${engagementRate}%)`
    return `Ce contenu trend grace a ${reason}. Il pourrait exploser dans les prochaines ${momentum > 0 ? '6-12h' : '12-24h'} si la tendance se maintient.`
  }
  
  if (tier === 'warm') {
    return `Signal émergent : ce contenu montre des signes de traction avec ${formatNumber(views)} vues. À surveiller pour une potentielle accélération.`
  }
  
  return `Contenu actif sur ${source} avec des métriques standards. Pas de signal viral détecté actuellement.`
}

// ============================================================================
// CREATOR TIP GENERATOR
// ============================================================================

function generateCreatorTip(
  item: ContentItem,
  score: ViralScoreBreakdown,
  source: string
): string {
  const { tier, engagementRate } = score
  const format = detectContentFormat(item)
  
  // Platform-specific tips
  const platformTips: Record<string, string> = {
    youtube: 'Créer une vidéo de 8–12 minutes avec un hook dans les 3 premières secondes',
    reddit: 'Poster avec un titre provocateur ou une question ouverte pour maximiser les commentaires',
    hackernews: 'Presenter l\'angle technique ou startup de maniere concise et factuelle',
    github: 'Ajouter un README clair avec demo GIF et badges pour maximiser les stars',
    news: 'Reagir rapidement avec une analyse ou un thread explicatif',
  }
  
  // Format-specific tips
  const formatTips: Record<string, string> = {
    video: 'Format vertical 9:16 pour TikTok/Reels, hook visuel dans la premiere seconde',
    article: 'Thread Twitter avec les points cles + lien vers l\'article complet',
    post: 'Repost avec valeur ajoutee: ton analyse, une infographie, ou un angle unique',
    repo: 'Créer un tutoriel ou une vidéo démo montrant le use case principal',
  }
  
  const platformTip = platformTips[source] || 'Adapter le format a ta plateforme principale'
  const formatTip = formatTips[format] || 'Choisir le format qui engage le plus ton audience'
  
  // Engagement-based tips
  if (engagementRate > 50) {
    return `${platformTip}. L'engagement eleve suggere un sujet polarisant - prendre position pour maximiser les reactions.`
  }
  
  if (tier === 'fire' || tier === 'explosive') {
    return `URGENCE: Ce sujet explose maintenant. ${formatTip}. Publier dans les 2 prochaines heures pour surfer sur la vague.`
  }
  
  return `${platformTip}. ${formatTip}.`
}

// ============================================================================
// CULTURAL CONTEXT GENERATOR
// ============================================================================

function generateCulturalContext(
  item: ContentItem,
  category: string
): string {
  const title = item.title.toLowerCase()
  const tags = item.tags || []
  
  // Detect cultural themes
  const themes = {
    gaming: ['game', 'gamer', 'esport', 'twitch', 'streaming'],
    tech: ['ai', 'tech', 'startup', 'crypto', 'software'],
    politics: ['election', 'president', 'government', 'vote', 'political'],
    entertainment: ['movie', 'series', 'netflix', 'film', 'actor'],
    sports: ['football', 'basketball', 'soccer', 'nba', 'championship'],
    music: ['song', 'album', 'artist', 'concert', 'spotify'],
    science: ['study', 'research', 'discovery', 'science', 'space'],
  }
  
  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(k => title.includes(k) || tags.some(t => t.toLowerCase().includes(k)))) {
      return getThemeContext(theme)
    }
  }
  
  // Default context based on category
  return getCategoryContext(category)
}

function getThemeContext(theme: string): string {
  const contexts: Record<string, string> = {
    gaming: 'La communauté gaming réagit fortement aux nouveautés et controverses. Ce contenu touche une audience jeune et très engagée sur les réseaux.',
    tech: 'Le secteur tech amplifie rapidement les innovations disruptives. Ce contenu résonne avec les early adopters et influenceurs tech.',
    politics: 'Les sujets politiques génèrent des réactions intenses et polarisées. Le timing électoral ou une actualité chaude explique la viralité.',
    entertainment: 'Le divertissement domine les conversations sociales. Ce contenu profite du buzz autour d\'une sortie ou d\'une actualité people.',
    sports: 'Les événements sportifs créent des pics d\'engagement massifs. Ce contenu surfe sur une compétition ou une polémique en cours.',
    music: 'La musique virale crée des trends TikTok et des challenges. Ce contenu pourrait devenir un son viral dans les prochains jours.',
    science: 'Les découvertes scientifiques fascinent quand elles sont accessibles. Ce contenu vulgarise un sujet complexe de manière engageante.',
  }
  return contexts[theme] || 'Ce contenu touche un sujet d\'actualité qui résonne avec l\'audience cible.'
}

function getCategoryContext(category: string): string {
  return `Ce contenu s'inscrit dans la catégorie « ${category} » qui montre actuellement une activité élevée sur les réseaux sociaux.`
}

// ============================================================================
// INFERENCE HELPERS
// ============================================================================

function inferTargetAudience(
  item: ContentItem,
  source: string,
  category: string
): string[] {
  const audiences = []
  
  // Source-based audience
  const sourceAudiences: Record<string, string[]> = {
    youtube: ['Gen Z', 'Millennials', 'Video enthusiasts'],
    reddit: ['Tech-savvy', 'Niche communities', 'Early adopters'],
    hackernews: ['Developers', 'Entrepreneurs', 'Tech professionals'],
    github: ['Software engineers', 'Open source contributors'],
    news: ['Informed adults', 'News followers'],
  }
  audiences.push(...(sourceAudiences[source] || ['General audience']))
  
  // Category-based audience
  const categoryAudiences: Record<string, string[]> = {
    gaming: ['Gamers', 'Esports fans'],
    tech: ['Tech enthusiasts', 'Early adopters'],
    entertainment: ['Pop culture fans', 'Social media users'],
    sports: ['Sports fans', 'Athletes'],
    music: ['Music lovers', 'Playlist curators'],
  }
  if (categoryAudiences[category]) {
    audiences.push(...categoryAudiences[category])
  }
  
  return [...new Set(audiences)].slice(0, 4)
}

function detectContentFormat(item: ContentItem): string {
  if (item.type === 'video') return 'video'
  if (item.type === 'article') return 'article'
  if (item.type === 'repo') return 'repo'
  if (item.type === 'stream') return 'stream'
  if (item.type === 'track') return 'audio'
  return 'post'
}

function inferSentiment(
  item: ContentItem,
  score: ViralScoreBreakdown
): 'positive' | 'neutral' | 'negative' {
  // High engagement + high viral score often = strong positive or negative
  // This is a simplification - real implementation would use NLP
  const { engagementRate, tier } = score
  
  if (tier === 'explosive' && engagementRate > 60) return 'positive'
  if (engagementRate > 40) return 'positive'
  if (engagementRate < 10) return 'neutral'
  return 'neutral'
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

// ============================================================================
// DAILY BRIEFING GENERATOR
// ============================================================================

export interface DailyBriefing {
  date: string
  greeting: string
  topSignals: Array<{
    title: string
    source: string
    viralScore: number
    explanation: string
    url: string
  }>
  emergingTrends: string[]
  predictions: Array<{
    topic: string
    prediction: string
    confidence: number
  }>
  personalRecommendations: string[]
}

export function generateDailyBriefing(
  items: ContentItem[],
  userInterests: string[] = []
): DailyBriefing {
  const now = new Date()
  const hour = now.getHours()
  
  const greeting = hour < 12 
    ? 'Bonjour ! Voici ce qui explose ce matin.'
    : hour < 18 
    ? 'Bon après-midi ! Voici les tendances du moment.'
    : 'Bonsoir ! Récap des signaux de la journée.'
  
  // Top 5 signals by viral score
  const topItems = items
    .filter(i => i.viralScore && i.viralScore > 60)
    .slice(0, 5)
  
  const topSignals = topItems.map(item => ({
    title: item.title,
    source: item.source,
    viralScore: item.viralScore || 0,
    explanation: item.aiExplanation || 'Signal viral détecté',
    url: item.url,
  }))
  
  // Extract emerging trends from titles
  const keywords = items
    .flatMap((i) => i.tags || [])
    .reduce((acc: Map<string, number>, tag: string) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
      return acc
    }, new Map<string, number>())

  const pairs: [string, number][] = Array.from(keywords.entries())
  const emergingTrends = pairs
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword]) => keyword)
  
  // Predictions based on early signals
  const predictions = items
    .filter(i => i.isEarlySignal)
    .slice(0, 3)
    .map(item => ({
      topic: item.title.slice(0, 50),
      prediction: 'Pourrait exploser dans les 24 prochaines heures',
      confidence: 0.7,
    }))
  
  // Personal recommendations based on interests
  const personalRecommendations = userInterests.length > 0
    ? items
        .filter((i) => i.tags?.some((t: string) => userInterests.includes(t.toLowerCase())))
        .slice(0, 3)
        .map(i => i.title)
    : ['Connectez-vous pour des recommandations personnalisees']
  
  return {
    date: now.toISOString().split('T')[0],
    greeting,
    topSignals,
    emergingTrends,
    predictions,
    personalRecommendations,
  }
}
