import { describe, it, expect } from 'vitest'
import { planAllowsFeature, DEFAULT_BILLING_PLAN } from '@/lib/monetization/plan'

describe('monetization plan', () => {
  it('FREE n’ouvre pas les capacités PRO listées', () => {
    expect(planAllowsFeature('free', 'full_viral_analysis')).toBe(false)
    expect(planAllowsFeature('free', 'ai_unlimited')).toBe(false)
  })

  it('PRO ouvre toutes les capacités connues', () => {
    expect(planAllowsFeature('pro', 'full_viral_analysis')).toBe(true)
    expect(planAllowsFeature('pro', 'dashboard_alerts')).toBe(true)
  })

  it('défaut documenté', () => {
    expect(DEFAULT_BILLING_PLAN).toBe('free')
  })
})
