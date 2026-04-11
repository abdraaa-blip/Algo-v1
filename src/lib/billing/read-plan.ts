import { DEFAULT_BILLING_PLAN, type AlgoBillingPlan } from '@/lib/monetization/plan'
import { createClient } from '@/lib/supabase/server'
import { isStripeSecretConfigured } from '@/lib/stripe/server'

export type SessionBillingSnapshot = {
  plan: AlgoBillingPlan
  /** True si l’utilisateur peut ouvrir le portail Stripe (Pro + customer id + Stripe configuré). */
  portalAvailable: boolean
}

/**
 * Plan et portail : lecture via session Supabase + colonnes `profiles` (RLS utilisateur).
 */
export async function getSessionBillingSnapshot(): Promise<SessionBillingSnapshot> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { plan: DEFAULT_BILLING_PLAN, portalAvailable: false }
    }

    const { data } = await supabase
      .from('profiles')
      .select('billing_plan, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    const row = data as { billing_plan?: string; stripe_customer_id?: string | null } | null
    const plan: AlgoBillingPlan = row?.billing_plan === 'pro' ? 'pro' : 'free'
    const portalAvailable =
      plan === 'pro' &&
      Boolean(row?.stripe_customer_id?.trim()) &&
      isStripeSecretConfigured()

    return { plan, portalAvailable }
  } catch {
    return { plan: DEFAULT_BILLING_PLAN, portalAvailable: false }
  }
}
