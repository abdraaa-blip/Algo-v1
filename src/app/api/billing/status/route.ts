import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { getSessionBillingSnapshot } from '@/lib/billing/read-plan'
import { isStripeProPriceConfigured, isStripeSecretConfigured } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/billing/status
 * Plan (`profiles.billing_plan`) + portail Stripe + checkout disponibles côté serveur.
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-billing-status:${identifier}`, { limit: 90, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const checkoutAvailable = isStripeSecretConfigured() && isStripeProPriceConfigured()
  const snap = await getSessionBillingSnapshot()

  return NextResponse.json({
    ok: true,
    kind: 'algo.billing_status',
    plan: snap.plan,
    checkoutAvailable,
    portalAvailable: snap.portalAvailable,
  })
}
