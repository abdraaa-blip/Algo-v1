/**
 * Routeur léger Q&R (heuristique mots-clés · évolutif vers NLP / intents).
 * Ne remplace pas les routes HTTP Next : c’est une **intention produit** pour cadrer le prompt.
 */

export type AlgoAskRoute = "TRENDS" | "VIRAL" | "STRATEGY" | "GENERAL";

/**
 * Détecte une route à partir du texte utilisateur (FR + termes techniques courants).
 * Ordre : TENDANCES → VIRAL → STRATÉGIE → défaut.
 */
export function decideAlgoAskRoute(question: string): AlgoAskRoute {
  const q = question.toLowerCase().trim();
  if (!q) return "GENERAL";

  if (
    /\btrends?\b|tendance|tendances|signaux?|veille|émerg|emerg|buzz|radar|what'?s\s+trending/i.test(
      q,
    )
  ) {
    return "TRENDS";
  }

  if (
    /\bviral|viralit|analys|analyze|analyser|hook|format|tiktok|reels?|shorts|youtube|contenu|thumbnail|vignette/i.test(
      q,
    )
  ) {
    return "VIRAL";
  }

  if (
    /\bstrat|stratég|decid|décid|choix|prior|plan\b|objectif|conversion|pitch|business|monétis|monetis|roi\b/i.test(
      q,
    )
  ) {
    return "STRATEGY";
  }

  return "GENERAL";
}
