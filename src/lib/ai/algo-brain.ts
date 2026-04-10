import { generateText, Output } from 'ai'
import { z } from 'zod'
import type { AlgoExpertiseLevel } from '@/lib/ai/algo-persona'
import {
  algoAskResponseSchema,
  toPublicStructured,
} from '@/lib/ai/algo-ask-contract'
import type { AlgoAskStructured } from '@/lib/ai/algo-ask-contract'
import {
  ALGO_FALLBACK_ASK,
  TASK_ANALYZE_VIRAL_CONTENT,
  TASK_ASK_OPEN,
  TASK_CLUSTER_TRENDS,
  TASK_DAILY_BRIEFING,
  TASK_PREDICT_VIRAL,
  TASK_SENTIMENT,
  buildAlgoSystemPrompt,
  algoConversationFragment,
  getContentAnalysisFallback,
  FALLBACK_BRIEFING_STRINGS,
  FALLBACK_PREDICTION,
} from '@/lib/ai/algo-persona'

export type { AlgoExpertiseLevel } from '@/lib/ai/algo-persona'
export type { AlgoAskStructured } from '@/lib/ai/algo-ask-contract'

/**
 * ALGO AI Brain - Intelligence Layer (personnalité et garde-fous: `algo-persona.ts`)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContentAnalysis {
  whyViral: string
  creatorTip: string
  riskAssessment: 'starting' | 'peaking' | 'fading'
  culturalContext: string
  viralPotential: number // 0-100
  predictedPeak: string // "24h" | "48h" | "72h" | "already peaked"
  audienceSegments: string[]
  recommendedFormats: string[]
}

export interface TrendCluster {
  id: string
  name: string
  description: string
  relatedContent: string[]
  evolutionStage: 'emerging' | 'growing' | 'mainstream' | 'declining'
  predictedLifespan: string
}

export interface DailyBriefing {
  date: string
  topSignals: Array<{
    title: string
    category: string
    viralScore: number
    whyImportant: string
  }>
  emergingTrends: string[]
  predictedBreakouts: string[]
  creatorOpportunities: string[]
  personalizedInsights: string[]
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const contentAnalysisSchema = z.object({
  whyViral: z.string().describe('Une phrase claire: pourquoi ce contenu peut performer (français)'),
  creatorTip: z.string().describe('Conseil actionnable et concret pour un créateur (français)'),
  riskAssessment: z.enum(['starting', 'peaking', 'fading']).describe('Phase du cycle: démarrage / pic / déclin'),
  culturalContext: z.string().describe('Pourquoi ça résonne maintenant avec le public (français)'),
  viralPotential: z.number().min(0).max(100).describe('Potentiel estimé 0-100 (indicateur, pas une garantie)'),
  predictedPeak: z.string().describe('Fenêtre probable: 24h, 48h, 72h, ou déjà pic'),
  audienceSegments: z.array(z.string()).describe('Segments d’audience pertinents (français)'),
  recommendedFormats: z.array(z.string()).describe('Formats à privilégier (français)'),
})

const viralPredictionSchema = z.object({
  score: z.number().min(0).max(100).describe('Potentiel viral estimé 0-100'),
  confidence: z.number().min(0).max(1).describe('Confiance 0-1, cohérente avec la quantité d’info'),
  reasoning: z.string().max(900).describe('Raisonnement court, direct, en français'),
  improvements: z.array(z.string()).max(6).describe('Pistes d’amélioration concrètes en français'),
})

const dailyBriefingSchema = z.object({
  topSignals: z.array(z.object({
    title: z.string(),
    category: z.string(),
    viralScore: z.number(),
    whyImportant: z.string(),
  })).describe('Jusqu’à 5 signaux du jour — textes en français'),
  emergingTrends: z.array(z.string()).describe('Tendances émergentes (français)'),
  predictedBreakouts: z.array(z.string()).describe('Breakouts plausibles 24-48h (français), formulés avec prudence'),
  creatorOpportunities: z.array(z.string()).describe('Opportunités créateur concrètes (français)'),
  personalizedInsights: z.array(z.string()).describe('Insights liés aux intérêts utilisateur (français)'),
})

// ─── AI Functions ─────────────────────────────────────────────────────────────

/**
 * Analyze why a piece of content is going viral
 */
export async function analyzeContent(
  content: {
    title: string
    description?: string
    platform: string
    category: string
    metrics: {
      views?: number
      likes?: number
      comments?: number
      shares?: number
      velocity?: number
    }
  },
  brainOpts?: { expertiseLevel?: AlgoExpertiseLevel }
): Promise<ContentAnalysis> {
  const prompt = `Analyse ce contenu et renseigne le schéma JSON (tous les champs textuels en français).

Titre: ${content.title}
Description: ${content.description || 'N/A'}
Plateforme: ${content.platform}
Catégorie: ${content.category}
Métriques:
- Vues: ${content.metrics.views?.toLocaleString() || 'N/A'}
- Likes: ${content.metrics.likes?.toLocaleString() || 'N/A'}
- Commentaires: ${content.metrics.comments?.toLocaleString() || 'N/A'}
- Partages: ${content.metrics.shares?.toLocaleString() || 'N/A'}
- Vélocité: ${content.metrics.velocity || 'N/A'}`

  try {
    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: buildAlgoSystemPrompt(TASK_ANALYZE_VIRAL_CONTENT, {
        expertiseLevel: brainOpts?.expertiseLevel,
        voicePageContext: 'analysis',
      }),
      prompt,
      output: Output.object({ schema: contentAnalysisSchema }),
      maxOutputTokens: 1000,
      temperature: 0.65,
    })

    return output as ContentAnalysis
  } catch (error) {
    console.error('[ALGO AI] Content analysis failed:', error)
    return getContentAnalysisFallback() as ContentAnalysis
  }
}

/**
 * Cluster related trends together
 */
export async function clusterTrends(trends: Array<{
  title: string
  category: string
  viralScore: number
}>): Promise<TrendCluster[]> {
  const trendList = trends.map(t => `- ${t.title} (${t.category}, score: ${t.viralScore})`).join('\n')

  const prompt = `Sujets tendance à regrouper:

${trendList}

Produis 3 à 5 clusters. Pour chaque cluster, donne un titre clair puis un paragraphe court sur ce qui les unit et la durée de vie probable. Numérote les clusters (1., 2., …).`

  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: buildAlgoSystemPrompt(TASK_CLUSTER_TRENDS, { voicePageContext: 'trends' }),
      prompt,
      maxOutputTokens: 1500,
      temperature: 0.65,
    })

    // Parse the response into clusters
    const clusters: TrendCluster[] = []
    const lines = text.split('\n').filter(l => l.trim())
    let currentCluster: Partial<TrendCluster> | null = null

    for (const line of lines) {
      if (line.match(/^\d+\.|^-\s*\*\*|^###/)) {
        if (currentCluster?.name) {
          clusters.push({
            id: `cluster_${Date.now()}_${clusters.length}`,
            name: currentCluster.name,
            description: currentCluster.description || '',
            relatedContent: [],
            evolutionStage: currentCluster.evolutionStage || 'growing',
            predictedLifespan: currentCluster.predictedLifespan || '1-2 weeks',
          })
        }
        currentCluster = { name: line.replace(/^\d+\.|^-\s*\*\*|^###|\*\*/g, '').trim() }
      } else if (currentCluster) {
        currentCluster.description = (currentCluster.description || '') + ' ' + line.trim()
      }
    }

    // Add last cluster
    if (currentCluster?.name) {
      clusters.push({
        id: `cluster_${Date.now()}_${clusters.length}`,
        name: currentCluster.name,
        description: currentCluster.description || '',
        relatedContent: [],
        evolutionStage: 'growing',
        predictedLifespan: '1-2 weeks',
      })
    }

    return clusters.slice(0, 5)
  } catch (error) {
    console.error('[ALGO AI] Trend clustering failed:', error)
    return []
  }
}

/**
 * Generate personalized daily briefing
 */
export async function generateDailyBriefing(params: {
  userInterests: string[]
  userCountry: string
  topContent: Array<{
    title: string
    category: string
    viralScore: number
    platform: string
  }>
  expertiseLevel?: AlgoExpertiseLevel
}): Promise<DailyBriefing> {
  const contentList = params.topContent
    .slice(0, 20)
    .map(c => `- ${c.title} (${c.platform}, ${c.category}, score: ${c.viralScore})`)
    .join('\n')

  const prompt = `Briefing pour un utilisateur ALGO.

Centres d’intérêt: ${params.userInterests.join(', ') || 'général'}
Pays: ${params.userCountry}

Contenu du jour (extrait):
${contentList}

Construis un briefing utile: signaux clés, émergences, breakouts prudents, opportunités créateur, insights personnalisés — sans verbosité.`

  try {
    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: buildAlgoSystemPrompt(TASK_DAILY_BRIEFING, {
        expertiseLevel: params.expertiseLevel,
        voicePageContext: 'trends',
      }),
      prompt,
      output: Output.object({ schema: dailyBriefingSchema }),
      maxOutputTokens: 1500,
      temperature: 0.75,
    })

    return {
      date: new Date().toISOString().split('T')[0],
      ...(output as Omit<DailyBriefing, 'date'>),
    }
  } catch (error) {
    console.error('[ALGO AI] Daily briefing generation failed:', error)
    const fb = FALLBACK_BRIEFING_STRINGS
    return {
      date: new Date().toISOString().split('T')[0],
      topSignals: params.topContent.slice(0, 5).map(c => ({
        title: c.title,
        category: c.category,
        viralScore: c.viralScore,
        whyImportant: `${fb.whyPrefix} ${c.platform} — détail IA indisponible, croise avec /trends.`,
      })),
      emergingTrends: [...fb.emerging],
      predictedBreakouts: [...fb.breakouts],
      creatorOpportunities: [...fb.opportunities],
      personalizedInsights: [
        params.userInterests[0]
          ? `Avec ton intérêt « ${params.userInterests[0]} », ${fb.insight}`
          : fb.insight,
      ],
    }
  }
}

/**
 * Réponses ouvertes — personnalité ALGO AI, contexte tendances, historique optionnel.
 */
export async function askAlgo(
  question: string,
  context?: {
    currentTrends?: string[]
    userCountry?: string
  },
  options?: {
    expertiseLevel?: AlgoExpertiseLevel
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  }
): Promise<{ answer: string; structured?: AlgoAskStructured }> {
  const contextInfo = context
    ? `
Contexte ALGO (ne pas inventer de données hors de ce bloc):
- Tendances (titres): ${context.currentTrends?.join(' · ') || 'non fourni'}
- Pays / région: ${context.userCountry || 'global'}
`
    : ''

  const historyBlock = algoConversationFragment(options?.conversationHistory)

  const prompt = `${historyBlock ? `${historyBlock}\n\n` : ''}${contextInfo}
Question: ${question}

Réponds avec la présence ALGO AI: conclusion et préférence claire si plusieurs voies, puis bref pourquoi, puis une action concrète (et options comparées si la question appelle un choix).`

  const system = buildAlgoSystemPrompt(TASK_ASK_OPEN, {
    expertiseLevel: options?.expertiseLevel,
    voicePageContext: 'ai',
  })

  try {
    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      system,
      prompt,
      output: Output.object({ schema: algoAskResponseSchema }),
      maxOutputTokens: 1200,
      temperature: 0.68,
    })

    const parsed = output as z.infer<typeof algoAskResponseSchema>
    return {
      answer: parsed.answer,
      structured: toPublicStructured(parsed),
    }
  } catch (error) {
    console.error('[ALGO AI] Question answering (structured) failed:', error)
    try {
      const { text } = await generateText({
        model: 'openai/gpt-4o-mini',
        system,
        prompt,
        maxOutputTokens: 900,
        temperature: 0.68,
      })
      return { answer: text?.trim() || ALGO_FALLBACK_ASK }
    } catch (e2) {
      console.error('[ALGO AI] Question answering (plain) failed:', e2)
      return { answer: ALGO_FALLBACK_ASK }
    }
  }
}

/**
 * Predict viral potential for new content
 */
export async function predictViralPotential(
  content: {
    title: string
    description: string
    format: string
    platform: string
    targetAudience?: string
  },
  brainOpts?: { expertiseLevel?: AlgoExpertiseLevel }
): Promise<{
  score: number
  confidence: number
  reasoning: string
  improvements: string[]
}> {
  const prompt = `Évalue le potentiel viral de cette idée (schéma structuré).

Titre: ${content.title}
Description: ${content.description}
Format: ${content.format}
Plateforme: ${content.platform}
Audience: ${content.targetAudience || 'général'}`

  try {
    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: buildAlgoSystemPrompt(TASK_PREDICT_VIRAL, {
        expertiseLevel: brainOpts?.expertiseLevel,
        voicePageContext: 'analysis',
      }),
      prompt,
      output: Output.object({ schema: viralPredictionSchema }),
      maxOutputTokens: 700,
      temperature: 0.65,
    })

    return {
      score: Math.min(100, Math.max(0, output.score)),
      confidence: Math.min(1, Math.max(0, output.confidence)),
      reasoning: output.reasoning,
      improvements: output.improvements.length ? output.improvements : [...FALLBACK_PREDICTION.improvements],
    }
  } catch (error) {
    console.error('[ALGO AI] Viral prediction failed:', error)
    return {
      score: FALLBACK_PREDICTION.score,
      confidence: FALLBACK_PREDICTION.confidence,
      reasoning: FALLBACK_PREDICTION.reasoning,
      improvements: [...FALLBACK_PREDICTION.improvements],
    }
  }
}

/**
 * Analyze sentiment of comments/reactions
 */
export async function analyzeSentiment(texts: string[]): Promise<{
  overall: 'positive' | 'negative' | 'neutral' | 'mixed'
  score: number // -1 to 1
  breakdown: {
    positive: number
    negative: number
    neutral: number
  }
}> {
  if (texts.length === 0) {
    return {
      overall: 'neutral',
      score: 0,
      breakdown: { positive: 0, negative: 0, neutral: 100 },
    }
  }

  const sampleTexts = texts.slice(0, 50).join('\n---\n')

  const prompt = `Textes (commentaires / réactions) à interpréter:

${sampleTexts}

Donne une lecture globale et un détail % positif / négatif / neutre (approximatif mais cohérent avec le corpus).`

  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: buildAlgoSystemPrompt(TASK_SENTIMENT, { voicePageContext: 'analysis' }),
      prompt,
      maxOutputTokens: 320,
      temperature: 0.28,
    })

    // Parse sentiment from response
    const positiveMatch = text.match(/positive[:\s]+(\d+)/i)
    const negativeMatch = text.match(/negative[:\s]+(\d+)/i)
    
    const positive = positiveMatch ? parseInt(positiveMatch[1]) : 50
    const negative = negativeMatch ? parseInt(negativeMatch[1]) : 20
    const neutral = 100 - positive - negative

    const score = (positive - negative) / 100

    let overall: 'positive' | 'negative' | 'neutral' | 'mixed'
    if (Math.abs(score) < 0.1) overall = 'neutral'
    else if (score > 0.3) overall = 'positive'
    else if (score < -0.3) overall = 'negative'
    else overall = 'mixed'

    return {
      overall,
      score,
      breakdown: { positive, negative, neutral: Math.max(0, neutral) },
    }
  } catch (error) {
    console.error('[ALGO AI] Sentiment analysis failed:', error)
    return {
      overall: 'neutral',
      score: 0,
      breakdown: { positive: 33, negative: 33, neutral: 34 },
    }
  }
}
