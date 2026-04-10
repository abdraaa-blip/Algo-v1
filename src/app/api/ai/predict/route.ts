import { NextRequest, NextResponse } from 'next/server'
import { predictViralPotential } from '@/lib/ai/algo-brain'
import { AI_TRANSPARENCY_PREDICT_LINES_FR } from '@/lib/ai/ai-transparency'
import { parseAlgoExpertiseLevel } from '@/lib/ai/algo-persona'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'

/**
 * POST /api/ai/predict
 * Predict viral potential for content ideas
 */
export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(identifier, { limit: 20, windowMs: 60000 })
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = await req.json()
    const { title, description, format, platform, targetAudience, expertiseLevel } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const prediction = await predictViralPotential(
      {
        title,
        description,
        format: format || 'video',
        platform: platform || 'tiktok',
        targetAudience,
      },
      { expertiseLevel: parseAlgoExpertiseLevel(expertiseLevel) }
    )

    const predictedAt = new Date().toISOString()
    return NextResponse.json({
      success: true,
      prediction,
      predictedAt,
      transparencyLines: [
        ...AI_TRANSPARENCY_PREDICT_LINES_FR,
        `Horodatage de l’estimation : ${predictedAt}.`,
      ],
    }, { headers: createRateLimitHeaders(rateLimit) })
  } catch (error) {
    console.error('[ALGO AI] Predict error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to predict viral potential' },
      { status: 500 }
    )
  }
}
