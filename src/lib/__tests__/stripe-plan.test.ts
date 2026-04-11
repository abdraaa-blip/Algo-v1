import { describe, it, expect } from 'vitest'
import { planFromStripeSubscriptionStatus } from '@/lib/billing/stripe-plan'

describe('planFromStripeSubscriptionStatus', () => {
  it('active et trialing → pro', () => {
    expect(planFromStripeSubscriptionStatus('active')).toBe('pro')
    expect(planFromStripeSubscriptionStatus('trialing')).toBe('pro')
  })

  it('autres statuts → free', () => {
    expect(planFromStripeSubscriptionStatus('canceled')).toBe('free')
    expect(planFromStripeSubscriptionStatus('past_due')).toBe('free')
    expect(planFromStripeSubscriptionStatus(undefined)).toBe('free')
  })
})
