import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer, isStripeProPriceConfigured, isStripeSecretConfigured } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'

function billingBaseUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (env) return env.replace(/\/$/, '')
  return new URL(req.url).origin
}

/**
 * POST /api/billing/checkout
 * Session Stripe Checkout (abonnement PRO) · utilisateur connecté requis (`metadata.supabase_user_id` pour le webhook).
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

  if (!isStripeSecretConfigured() || !isStripeProPriceConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: 'Stripe non configuré (STRIPE_SECRET_KEY + STRIPE_PRICE_PRO_MONTHLY).',
      },
      { status: 503, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  let userId: string
  let userEmail: string | undefined
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: 'auth_required', message: 'Connecte-toi pour souscrire au plan Pro.' },
        { status: 401, headers: createRateLimitHeaders(rateLimit) }
      )
    }
    userId = user.id
    userEmail = user.email ?? undefined
  } catch {
    return NextResponse.json(
      { ok: false, error: 'auth_unavailable', message: 'Session indisponible. Réessaie ou reconnecte-toi.' },
      { status: 503, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const stripe = getStripeServer()
  const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY!.trim()
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: 'Client Stripe indisponible' },
      { status: 503, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const base = billingBaseUrl(req)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/settings?billing=success`,
      cancel_url: `${base}/settings?billing=cancel`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      automatic_tax: { enabled: false },
      client_reference_id: userId,
      customer_email: userEmail,
      metadata: { supabase_user_id: userId },
      subscription_data: {
        metadata: { supabase_user_id: userId },
      },
    })

    if (!session.url) {
      return NextResponse.json(
        { ok: false, error: 'Session Stripe sans URL' },
        { status: 502, headers: createRateLimitHeaders(rateLimit) }
      )
    }

    return NextResponse.json(
      { ok: true, kind: 'algo.billing_checkout', url: session.url },
      { headers: createRateLimitHeaders(rateLimit) }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'checkout_failed'
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502, headers: createRateLimitHeaders(rateLimit) }
    )
  }
}
