import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import {
  addKnowledgeMemory,
  getDurableKnowledgeMemory,
  persistKnowledgeMemory,
} from '@/lib/autonomy/knowledge-memory'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`intelligence-memory-get:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') || 100)
  const domain = searchParams.get('domain') as
    | 'viral'
    | 'behavior'
    | 'product'
    | 'economic'
    | 'science'
    | 'ux'
    | null
  const durable = await getDurableKnowledgeMemory(limit, domain || undefined)
  return NextResponse.json({
    success: true,
    data: durable,
  })
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`intelligence-memory-post:${identifier}`, { limit: 30, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = (await request.json()) as {
      region: string
      domain: 'viral' | 'behavior' | 'product' | 'economic' | 'science' | 'ux'
      summary: string
      signals?: string[]
      confidence?: number
      outcome?: 'positive' | 'neutral' | 'negative'
      tags?: string[]
    }
    if (!body?.region || !body?.domain || !body?.summary) {
      return NextResponse.json({ success: false, error: 'region, domain, summary are required' }, { status: 400 })
    }
    const entry = addKnowledgeMemory({
      region: body.region.toUpperCase(),
      domain: body.domain,
      summary: body.summary,
      signals: Array.isArray(body.signals) ? body.signals.slice(0, 20) : [],
      confidence: typeof body.confidence === 'number' ? Math.max(0, Math.min(1, body.confidence)) : 0.6,
      outcome: body.outcome,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 12) : [],
    })
    void persistKnowledgeMemory(entry)
    return NextResponse.json({ success: true, data: entry })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to store memory' },
      { status: 500 }
    )
  }
}
