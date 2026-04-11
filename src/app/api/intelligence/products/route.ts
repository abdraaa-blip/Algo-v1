import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { buildGlobalIntelligence } from '@/lib/intelligence/global-intelligence'

export const dynamic = 'force-dynamic'

const PRODUCT_KEYWORDS = [
  'beauty',
  'skincare',
  'fitness',
  'gaming',
  'camera',
  'headphone',
  'microphone',
  'phone case',
  'kitchen',
  'pet',
  'baby',
]

function scoreProductKeyword(keyword: string, textCorpus: string): number {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const hits = (textCorpus.match(new RegExp(escaped, 'gi')) || []).length
  return Math.min(100, 40 + hits * 20)
}

function potentialLabelFr(potential: 'high' | 'medium' | 'emerging'): string {
  if (potential === 'high') return 'Signal fort'
  if (potential === 'medium') return 'Signal moyen'
  return 'Émergent'
}

function rationaleFr(potential: 'high' | 'medium' | 'emerging'): string {
  if (potential === 'high') {
    return 'Recoupement net avec les flux tendances et opportunités du radar · angle à creuser avec prudence.'
  }
  if (potential === 'medium') {
    return 'Alignement partiel avec la conversation du moment · à valider avec ta niche et ton offre.'
  }
  return 'Signal encore léger dans le corpus actuel · à surveiller plutôt qu’à prendre comme feu vert seul.'
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`intelligence-products:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region') || 'FR'
  const locale = searchParams.get('locale') || 'fr'

  try {
    const snapshot = await buildGlobalIntelligence({ region, locale })
    const corpus = [
      ...snapshot.categories.map((c) => `${c.name} ${c.signals.join(' ')}`),
      ...snapshot.opportunities.map((o) => o.title),
    ]
      .join(' ')
      .toLowerCase()

    const products = PRODUCT_KEYWORDS.map((keyword) => {
      const score = scoreProductKeyword(keyword, corpus)
      const potential = (score >= 75 ? 'high' : score >= 55 ? 'medium' : 'emerging') as
        | 'high'
        | 'medium'
        | 'emerging'
      return {
        keyword,
        score,
        potential,
        potentialLabel: potentialLabelFr(potential),
        rationale: rationaleFr(potential),
      }
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        region: region.toUpperCase(),
        locale,
        products,
        note:
          'Signals are derived from public trends and first-party engagement. No private marketplace data is collected without explicit access.',
        missionFr:
          'Aider à repérer des angles marché cohérents avec le radar ALGO · sans vendre de produits ni promettre de revenus.',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build product opportunities',
      },
      { status: 500 }
    )
  }
}
