/**
 * Modèle d’offre ALGO (FREE / PRO) — matrice d’entitlements pour paywalls futurs.
 * La résolution du plan réel (Stripe + webhook + profil) viendra plus tard : ne pas faire confiance au client seul.
 */

export type AlgoBillingPlan = "free" | "pro";

/** Capacités réservées ou étendues en PRO (noms stables pour le code et la doc). */
export type AlgoProFeature =
  | "full_viral_analysis"
  | "cross_platform_history"
  | "advanced_prediction"
  | "strategic_recommendations"
  | "ai_unlimited"
  | "dashboard_alerts";

/** Aujourd’hui tout ce qui est typé `AlgoProFeature` est réservé au plan payant. */
export function planAllowsFeature(
  plan: AlgoBillingPlan,
  feature: AlgoProFeature,
): boolean {
  void feature;
  return plan === "pro";
}

/** Tout utilisateur sans preuve serveur de souscription active est traité en FREE. */
export const DEFAULT_BILLING_PLAN: AlgoBillingPlan = "free";
