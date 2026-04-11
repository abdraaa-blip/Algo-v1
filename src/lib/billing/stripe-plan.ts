import type { AlgoBillingPlan } from '@/lib/monetization/plan'

/** Mappe le statut Stripe Subscription → plan ALGO. */
export function planFromStripeSubscriptionStatus(status: string | undefined | null): AlgoBillingPlan {
  if (status === 'active' || status === 'trialing') return 'pro'
  return 'free'
}
