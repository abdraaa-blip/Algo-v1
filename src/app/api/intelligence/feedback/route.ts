import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { recordFeedback } from '@/lib/autonomy/telemetry'
import { getSupabasePublicApiKey, getSupabaseUrl } from '@/lib/supabase/env-keys'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const url = getSupabaseUrl()
  const anon = getSupabasePublicApiKey()
  if (!url || !anon) return null
  return createClient(url, anon)
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`intelligence-feedback:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = (await request.json()) as {
      decisionId: string
      feedback: 'helpful' | 'wrong' | 'neutral'
      region?: string
      note?: string
    }
    if (!body?.decisionId || !body?.feedback) {
      return NextResponse.json({ success: false, error: 'decisionId and feedback are required' }, { status: 400 })
    }
    if (!['helpful', 'wrong', 'neutral'].includes(body.feedback)) {
      return NextResponse.json({ success: false, error: 'Invalid feedback value' }, { status: 400 })
    }

    recordFeedback(body.feedback)

    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from('analytics_events').insert({
        event_type: 'decision_feedback',
        event_name: 'intelligence_feedback',
        page_path: '/intelligence/logs',
        user_agent: request.headers.get('user-agent') || null,
        properties: {
          decisionId: body.decisionId,
          feedback: body.feedback,
          region: body.region || 'NA',
          note: body.note || null,
          at: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to store feedback' },
      { status: 500 }
    )
  }
}
