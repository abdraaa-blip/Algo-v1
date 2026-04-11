import Stripe from 'stripe'

type StripeClientOptions = NonNullable<ConstructorParameters<typeof Stripe>[1]>

/** Aligné sur la version API embarquée du SDK Stripe installé. */
const STRIPE_OPTIONS = {
  apiVersion: '2026-03-25.dahlia',
} as StripeClientOptions

let stripeSingleton: Stripe | null = null

export function isStripeSecretConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

export function isStripeProPriceConfigured(): boolean {
  return Boolean(process.env.STRIPE_PRICE_PRO_MONTHLY?.trim())
}

/**
 * Client Stripe serveur. `null` si `STRIPE_SECRET_KEY` absent (déploiements sans paiement).
 */
export function getStripeServer(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, STRIPE_OPTIONS)
  }
  return stripeSingleton
}
