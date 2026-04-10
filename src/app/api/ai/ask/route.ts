import { NextRequest, NextResponse } from 'next/server'
import { centralAsk } from '@/core/brain'
import { buildAskTransparencyLines } from '@/lib/ai/ai-transparency'
import { parseAlgoExpertiseLevel } from '@/lib/ai/algo-persona'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'

function sanitizeConversationHistory(raw: unknown): Array<{ role: 'user' | 'assistant'; content: string }> | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const item of raw.slice(-12)) {
    if (!item || typeof item !== 'object') continue
    const role = (item as { role?: string }).role
    const content = (item as { content?: string }).content
    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
      out.push({ role, content: content.trim().slice(0, 6000) })
    }
  }
  return out.length ? out : undefined
}

/**
 * POST /api/ai/ask
 * Q&R ALGO AI — contexte tendances fusionné (client + enrichissement serveur si besoin).
 *
 * Body: `question`, optionnel `context` { currentTrends, userCountry }, `conversationHistory`,
 * `expertiseLevel`, `country` (hint ISO si absent du contexte), `serverEnrich` (false pour désactiver le fetch live).
 * Réponse: `answer`, `structured?` (options / recommendedChoice / nextStep), `contextMeta`, `transparencyLines`.
 */
export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(identifier, { limit: 30, windowMs: 60000 })
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = await req.json()
    const { question, context, conversationHistory, expertiseLevel, country, serverEnrich } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const { answer, structured, meta } = await centralAsk({
      question,
      clientContext: context,
      countryHint: typeof country === 'string' ? country : null,
      conversationHistory: sanitizeConversationHistory(conversationHistory),
      expertiseLevel: parseAlgoExpertiseLevel(expertiseLevel),
      serverEnrich: typeof serverEnrich === 'boolean' ? serverEnrich : undefined,
    })

    return NextResponse.json({
      success: true,
      kind: 'algo.ai_ask',
      answer,
      ...(structured ? { structured } : {}),
      answeredAt: new Date().toISOString(),
      contextMeta: meta,
      transparencyLines: buildAskTransparencyLines(meta),
    }, { headers: createRateLimitHeaders(rateLimit) })
  } catch (error) {
    console.error('[ALGO AI] Ask error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to answer question' },
      { status: 500 }
    )
  }
}
