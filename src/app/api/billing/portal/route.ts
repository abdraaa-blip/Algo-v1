import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { getSessionBillingSnapshot } from '@/lib/billing/read-plan'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer, isStripeSecretConfigured } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'

function billingBaseUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (env) return env.replace(/\/$/, '')
  return new URL(req.url).origin
}

/**
 * POST /api/billing/portal
 * Session portail client Stripe (facturation / résiliation) · utilisateur Pro avec `stripe_customer_id`.
 */
export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(identifier, { limit: 10, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded' },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  if (!isStripeSecretConfigured()) {
    return NextResponse.json({ ok: false, error: 'Stripe non configuré' }, { status: 503 })
  }

  const snap = await getSessionBillingSnapshot()
  if (!snap.portalAvailable) {
    return NextResponse.json(
      { ok: false, error: 'portal_unavailable', message: 'Portail indisponible (pas de compte Stripe lié ou pas en Pro).' },
      { status: 403, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json(
      { ok: false, error: 'auth_required' },
      { status: 401, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { data: row } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  const customerId = (row as { stripe_customer_id?: string | null } | null)?.stripe_customer_id?.trim()
  if (!customerId) {
    return NextResponse.json({ ok: false, error: 'missing_customer' }, { status: 403, headers: createRateLimitHeaders(rateLimit) })
  }

  const stripe = getStripeServer()
  if (!stripe) {
    return NextResponse.json({ ok: false, error: 'stripe_client' }, { status: 503, headers: createRateLimitHeaders(rateLimit) })
  }

  const base = billingBaseUrl(req)

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/settings`,
    })
    if (!session.url) {
      return NextResponse.json({ ok: false, error: 'no_portal_url' }, { status: 502, headers: createRateLimitHeaders(rateLimit) })
    }
    return NextResponse.json(
      { ok: true, kind: 'algo.billing_portal', url: session.url },
      { headers: createRateLimitHeaders(rateLimit) }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'portal_failed'
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: createRateLimitHeaders(rateLimit) })
  }
}
