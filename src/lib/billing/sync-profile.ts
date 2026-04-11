import type { SupabaseClient } from "@supabase/supabase-js";
import type { AlgoBillingPlan } from "@/lib/monetization/plan";

export type ProfileBillingRow = {
  billing_plan: AlgoBillingPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_current_period_end: string | null;
};

/**
 * Met à jour le profil utilisateur (client service role, hors RLS).
 */
export async function updateProfileBilling(
  admin: SupabaseClient,
  userId: string,
  patch: Partial<ProfileBillingRow>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await admin
    .from("profiles")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
