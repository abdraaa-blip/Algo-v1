import { NextRequest, NextResponse } from 'next/server'
import { runAlgoCoreIntelligence, type AlgoCoreUserContext } from '@/lib/algo-core-intelligence'
import { buildLiveRawItemsForCore } from '@/lib/algo-core-intelligence/live-items'
import type { RawContentInput } from '@/lib/algo-engine'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { sanitizeInput, validators } from '@/lib/security'

export const dynamic = 'force-dynamic'

const CONTENT_TYPES = new Set<RawContentInput['type']>(['trend', 'news', 'video', 'music', 'movie'])
const POST_MAX_ITEMS = 60
const STR_MAX = { id: 160, title: 600, description: 4000, source: 120, category: 80 }

function normalizePostedItem(raw: unknown, index: number): RawContentInput | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = sanitizeInput(String(o.id || `item-${index}`)).slice(0, STR_MAX.id)
  const title = sanitizeInput(String(o.title || '')).slice(0, STR_MAX.title)
  if (!title.trim()) return null
  const type = String(o.type || 'trend').toLowerCase() as RawContentInput['type']
  if (!CONTENT_TYPES.has(type)) return null

  const num = (v: unknown): number | undefined => {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }

  return {
    id: id || `item-${index}`,
    title,
    description: o.description != null ? sanitizeInput(String(o.description)).slice(0, STR_MAX.description) : undefined,
    growthRate: num(o.growthRate),
    engagement: num(o.engagement),
    views: num(o.views),
    publishedAt: o.publishedAt != null ? String(o.publishedAt).slice(0, 40) : undefined,
    source: o.source != null ? sanitizeInput(String(o.source)).slice(0, STR_MAX.source) : undefined,
    category: o.category != null ? sanitizeInput(String(o.category)).slice(0, STR_MAX.category) : undefined,
    type,
  }
}

/**
 * GET — rapport Core Intelligence à partir des tendances + news live (pays).
 * Query: region=FR (ISO2)
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, { limit: 40, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const region = (request.nextUrl.searchParams.get('region') || 'FR').toUpperCase()
  if (!validators.countryCode(region)) {
    return NextResponse.json({ success: false, error: 'Invalid region code' }, { status: 400 })
  }

  try {
    const items = await buildLiveRawItemsForCore(region, { maxTrends: 12, maxNews: 10 })
    const userContext: AlgoCoreUserContext = {
      regionHint: region,
      locale: 'fr',
    }
    const data = runAlgoCoreIntelligence(items, userContext)
    return NextResponse.json(
      {
        success: true,
        meta: {
          source: 'live_aggregate',
          region,
          itemCount: items.length,
        },
        data,
      },
      { headers: createRateLimitHeaders(rateLimit) }
    )
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Core intelligence failed' },
      { status: 500, headers: createRateLimitHeaders(rateLimit) }
    )
  }
}

/**
 * POST — rapport à partir d’un tableau `items` (RawContentInput partiels acceptés).
 * Body: { items: [...], userContext?: { locale?, regionHint?, interestByCategory? } }
 */
export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`core-post:${identifier}`, { limit: 30, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = (await request.json()) as {
      items?: unknown[]
      userContext?: AlgoCoreUserContext
    }
    const rawList = Array.isArray(body.items) ? body.items : []
    if (rawList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'items must be a non-empty array' },
        { status: 400, headers: createRateLimitHeaders(rateLimit) }
      )
    }
    if (rawList.length > POST_MAX_ITEMS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${POST_MAX_ITEMS} items` },
        { status: 400, headers: createRateLimitHeaders(rateLimit) }
      )
    }

    const items: RawContentInput[] = []
    for (let i = 0; i < rawList.length; i++) {
      const one = normalizePostedItem(rawList[i], i)
      if (one) items.push(one)
    }
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid items after validation' },
        { status: 400, headers: createRateLimitHeaders(rateLimit) }
      )
    }

    const ctx = body.userContext
    const userContext: AlgoCoreUserContext | undefined = ctx
      ? {
          locale: ctx.locale ? sanitizeInput(String(ctx.locale)).slice(0, 12) : undefined,
          regionHint: ctx.regionHint ? sanitizeInput(String(ctx.regionHint)).slice(0, 8).toUpperCase() : undefined,
          interestByCategory:
            ctx.interestByCategory && typeof ctx.interestByCategory === 'object'
              ? Object.fromEntries(
                  Object.entries(ctx.interestByCategory)
                    .slice(0, 24)
                    .map(([k, v]) => [
                      sanitizeInput(k).slice(0, STR_MAX.category),
                      Math.min(100, Math.max(0, Number(v) || 0)),
                    ])
                )
              : undefined,
        }
      : undefined

    const data = runAlgoCoreIntelligence(items, userContext)
    return NextResponse.json(
      {
        success: true,
        meta: { source: 'post_body', itemCount: items.length },
        data,
      },
      { headers: createRateLimitHeaders(rateLimit) }
    )
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Invalid JSON body' },
      { status: 400, headers: createRateLimitHeaders(rateLimit) }
    )
  }
}
