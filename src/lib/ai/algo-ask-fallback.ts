/**
 * Réponses de secours Q&R ALGO AI : toujours une piste utile, jamais un message d’échec technique brut.
 */

/** Quand aucune question n’est disponible (parse body, etc.). */
export const ALGO_ASK_FALLBACK_NO_QUESTION =
  "Je n’ai pas reçu de question claire. En une ligne : que veux-tu décider, sur quelle plateforme, avec quel délai ? Ensuite ouvre /trends pour caler l’angle.";

/** Dernier filet si aucun contexte question (import legacy / tests). */
export const ALGO_ASK_FALLBACK_MINIMAL =
  "Version courte : précise plateforme, objectif et délai en une phrase, puis ouvre /trends pour caler ton angle. Je reprends dès que c’est cadré.";

/**
 * Fallback principal : compréhension implicite + direction + invitation à préciser.
 */
export function buildAlgoAskFallbackResponse(
  question: string,
  opts?: { userCountry?: string; firstTrendTitle?: string },
): string {
  const raw = question.trim();
  const preview = raw
    ? raw.length > 180
      ? `${raw.slice(0, 180)}…`
      : raw
    : "ton sujet";
  const zone =
    opts?.userCountry &&
    opts.userCountry.trim() &&
    opts.userCountry.trim().toLowerCase() !== "global"
      ? opts.userCountry.trim()
      : "ta zone";
  const trend = opts?.firstTrendTitle?.trim().slice(0, 100);

  const p1 = `Je te réponds en mode **synthèse** à partir de « ${preview} » : avant tout, clarifie en toi **objectif** (vue, engagement, conversion), **plateforme** et **fenêtre temps** ; c’est ce triplet qui permet de trancher sans blabla.`;

  const p2 = trend
    ? `**Piste tout de suite** : croise avec le signal « ${trend} » sur /trends (${zone}), puis teste **un hook en une phrase** et un format court.`
    : `**Piste tout de suite** : ouvre **/trends** pour ${zone}, repère un sujet qui monte, puis renvoie une question ciblée du type « TikTok 60s · tuto · jeudi soir ».`;

  const p3 =
    "Si tu bloques encore : envoie **une seule phrase** avec plateforme + objectif + contrainte ; je reformule en recommandation nette.";

  return [p1, p2, p3].join("\n\n");
}
