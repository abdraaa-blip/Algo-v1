-- Colonnes facturation Stripe / plan ALGO (mise à jour via webhook service role).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_current_period_end TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.billing_plan IS 'free | pro — source de vérité côté serveur (webhook Stripe).';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe Customer id (cus_…).';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stripe Subscription id (sub_…).';

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON public.profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
