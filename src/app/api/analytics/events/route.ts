import { NextRequest, NextResponse } from 'next/server'
import { parseDefaultedListLimit } from '@/lib/api/query-limit'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import {
  analyticsEventStore,
  appendAnalyticsEvents,
  hashIpForAnalytics,
} from '@/lib/analytics/event-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = body as { events: unknown }
    const ipHash = hashIpForAnalytics(
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    )
    const userAgent = request.headers.get('user-agent') || null

    const result = await appendAnalyticsEvents(events, {
      ipHash,
      userAgent,
      source: 'web_analytics',
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
    })
  } catch (error) {
    console.error('[ALGO Analytics Error]', error)
    return NextResponse.json({ error: 'Failed to process events' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`analytics-events-get:${identifier}`, { limit: 300, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const hours = parseDefaultedListLimit(searchParams.get('hours'), 24, 168)
  const cutoff = Date.now() - hours * 60 * 60 * 1000

  const recentEvents = analyticsEventStore.filter((e) => e.timestamp > cutoff)

  const stats = {
    totalEvents: recentEvents.length,
    uniqueSessions: new Set(recentEvents.map((e) => e.sessionId)).size,
    eventTypes: {} as Record<string, number>,
    topContent: {} as Record<string, number>,
  }

  for (const event of recentEvents) {
    stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1

    if (event.type === 'content_interaction') {
      const contentId = event.data.contentId as string
      if (contentId) {
        stats.topContent[contentId] = (stats.topContent[contentId] || 0) + 1
      }
    }
  }

  const engagementEvents =
    (stats.eventTypes.content_interaction || 0) +
    (stats.eventTypes.content_like || 0) +
    (stats.eventTypes.content_share || 0)
  const frictionEvents = (stats.eventTypes.error || 0) + (stats.eventTypes.api_error || 0)
  const adaptiveSignals = {
    engagementRate: stats.totalEvents > 0 ? Number((engagementEvents / stats.totalEvents).toFixed(4)) : 0,
    frictionRate: stats.totalEvents > 0 ? Number((frictionEvents / stats.totalEvents).toFixed(4)) : 0,
  }

  return NextResponse.json({
    period: `${hours}h`,
    stats,
    adaptiveSignals,
    updatedAt: new Date().toISOString(),
  })
}
