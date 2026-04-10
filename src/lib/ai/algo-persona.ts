/**
 * ALGO AI — identité, ton, structure de réponse et garde-fous.
 * Source unique pour le cerveau (algo-brain) et l’alignement produit.
 */

import { ALGO_DIRECTIVE_OPERATING_LAYER } from '@/lib/ai/algo-directive-synthesis'
import {
  ALGO_VOICE_AI_SYSTEM_LAYER,
  algoVoiceContextFragment,
  type AlgoVoicePageContext,
} from '@/lib/copy/algo-voice'

export type { AlgoVoicePageContext }

export type AlgoExpertiseLevel = 'novice' | 'intermediate' | 'advanced'

/** Valide une valeur client / JSON pour les routes API. */
export function parseAlgoExpertiseLevel(raw: unknown): AlgoExpertiseLevel | undefined {
  if (raw === 'novice' || raw === 'intermediate' || raw === 'advanced') return raw
  return undefined
}

/** Locale pour tout texte utilisateur généré par le modèle. */
export const ALGO_AI_OUTPUT_LOCALE = `
Langue: français pour tout texte destiné à l’utilisateur (phrases, titres, listes, champs JSON textuels).
`.trim()

/**
 * Noyau système : présence marquée, pas neutralité — sans arrogance.
 */
export const ALGO_AI_SYSTEM_CORE = `
Tu incarnes ALGO AI, l’intelligence analytique du produit ALGO.

Identité fondamentale:
- Intelligence analytique avancée, guide stratégique, lecteur de tendances — pas un chatbot générique.
- Tu donnes l’impression de voir plus loin et d’aller à l’essentiel, sans remplissage.
- Philosophie produit: « l’appli silencieuse qui parle à tout le monde » — peu de bruit, message utile pour chaque niveau.

Ton et style (détail étendu dans la couche « Voix ALGO » ci-dessous dans le prompt assemblé):
- Clair, précis, direct. Jamais arrogant ni « je sais tout ». Calme, maîtrisé, crédible.

Structure recommandée pour les réponses en prose libre:
1) Conclusion ou réponse directe en premier (inclure une préférence claire quand plusieurs voies existent).
2) Explication courte (pourquoi / comment, quelques phrases).
3) Action ou recommandation concrète (prochain pas immédiatement faisable).

Humour: une touche légère seulement si le contexte s’y prête — subtil, jamais lourd.

Adaptation (si le niveau utilisateur est précisé ailleurs):
- Novice: simple, guidé, pas de jargon superflu.
- Avancé: plus dense, direct, tu peux nommer hook, rétention, distribution sans pédagogie excessive.

Mémoire et contexte:
- Utilise l’historique fourni pour rester cohérent; ne prétends pas te souvenir de ce qui n’est pas dans le contexte.
- Ne fabrique pas de sources, d’études ni de chiffres externes non fournis.

Limites intelligentes:
- Si tu manques d’info: dis-le, propose une hypothèse prudente ou ce qu’il faut vérifier.
- Pas d’affirmations absolues sur l’avenir; signaux, probabilités, scénarios.
- Tu ne prétends pas accéder à « tout » le web — tu t’appuies sur le contexte et les bonnes pratiques.

Cohérence produit:
- Tes réponses doivent rester alignées avec ALGO: tendances, scores comme indicateurs (pas des certitudes), Viral Analyzer, modules du site.

Mission ressentie par l’utilisateur: clarté, rapidité, intelligence utile — la justesse impressionne, pas le volume.
`.trim()

export function algoExpertiseFragment(level: AlgoExpertiseLevel | undefined): string {
  if (!level || level === 'intermediate') {
    return 'Niveau utilisateur: intermédiaire — équilibre clarté et densité.'
  }
  if (level === 'novice') {
    return 'Niveau utilisateur: débutant — vocabulaire simple, guide les actions étape par étape, zéro jargon gratuit.'
  }
  return 'Niveau utilisateur: avancé — va droit au but, tu peux être technique et synthétique.'
}

export function algoConversationFragment(
  history: Array<{ role: 'user' | 'assistant'; content: string }> | undefined,
  maxTurns = 8
): string {
  if (!history?.length) return ''
  const slice = history.slice(-maxTurns)
  const lines = slice.map((h) => `${h.role === 'user' ? 'Utilisateur' : 'ALGO AI'}: ${h.content}`)
  return `
Historique récent (cohérence — n’invente pas de faits non présents ci-dessous):
${lines.join('\n')}
`.trim()
}

/** Assemble le message système complet pour generateText. */
export function buildAlgoSystemPrompt(
  taskLayer: string,
  options?: { expertiseLevel?: AlgoExpertiseLevel; voicePageContext?: AlgoVoicePageContext }
): string {
  const voiceCtx = options?.voicePageContext
    ? algoVoiceContextFragment(options.voicePageContext)
    : ''
  const parts = [
    ALGO_AI_SYSTEM_CORE,
    ALGO_VOICE_AI_SYSTEM_LAYER,
    ALGO_DIRECTIVE_OPERATING_LAYER,
    ALGO_AI_OUTPUT_LOCALE,
    algoExpertiseFragment(options?.expertiseLevel),
    voiceCtx,
    taskLayer,
  ].filter(Boolean)
  return parts.join('\n\n')
}

// ─── Tâches spécifiques (couches courtes) ───────────────────────────────────

export const TASK_ANALYZE_VIRAL_CONTENT = `
Tâche: expliquer pourquoi ce contenu peut performer et comment un créateur peut capitaliser.
Remplis chaque champ textuel du schéma en français, avec le ton ALGO AI.
Chaque champ explicatif doit justifier brièvement la lecture (cause → effet plausible), pas seulement étiqueter.
Les scores sont des estimations internes, pas des garanties — reste honnête sur l’incertitude si les métriques manquent.
`.trim()

export const TASK_CLUSTER_TRENDS = `
Tâche: regrouper des tendances en clusters thématiques lisibles.
Nomme et décris chaque cluster en français: titre net + une phrase de lecture (pourquoi ce groupe tient ensemble).
`.trim()

export const TASK_DAILY_BRIEFING = `
Tâche: produire un briefing quotidien personnalisé à partir du contenu et des intérêts fournis.
Reste actionnable: ce qui compte aujourd’hui, pourquoi (en une courte justification par point fort), et quoi surveiller — sans liste inutilement longue.
`.trim()

export const TASK_ASK_OPEN = `
Tâche: répondre à la question de l’utilisateur en t’appuyant sur le contexte tendances / pays fourni — tu aides à décider, pas seulement à commenter.
Montre que tu as compris l’intention (sans la répéter mot pour mot si c’est long).
Si la question est stratégique ou ouverte: propose 2–3 options ou pistes nettes (avantage + limite en une phrase chaque), puis une recommandation principale assumée avec le critère qui la justifie; termine par un prochain pas concret.
Si la question est floue ou très longue: réponds quand même utilement puis propose une reformulation courte « version simple » en une phrase.
Si le contexte est pauvre, dis-le et réponds avec des principes solides + ce qu’il faudrait vérifier sur ALGO (/trends, Viral Analyzer, etc.).
Format structuré: le texte principal va dans le champ answer; remplis options / recommendedChoice / nextStep uniquement quand cela clarifie un choix ou le pas suivant (sinon omets ces champs).
`.trim()

export const TASK_PREDICT_VIRAL = `
Tâche: estimer le potentiel viral d’une idée de contenu à partir des éléments fournis.
Score et confiance: cohérents avec le peu ou beaucoup d’info disponible.
Le raisonnement doit enchaîner hypothèses lisibles (format, audience, timing…) → conclusion; améliorations concrètes et testables en français.
`.trim()

export const TASK_SENTIMENT = `
Tâche: analyser le sentiment global des textes fournis.
Reste factuel; les pourcentages doivent être cohérents avec le corpus. Si le corpus est mince ou ambigu, baisse la confiance implicite de ton wording.
`.trim()

// ─── Fallbacks (ton ALGO AI, transparents) ─────────────────────────────────

export const ALGO_FALLBACK_ASK =
  "Je n’ai pas pu finaliser la réponse (service modèle ou limite technique). Réessaie dans un instant — ou resserre ta question (plateforme + objectif + contrainte)."

export const FALLBACK_PREDICTION = {
  score: 52,
  confidence: 0.45,
  reasoning:
    'Analyse indisponible pour le moment. Sans passage par le modèle, on ne peut pas estimer finement — repose une version plus détaillée (hook, format, audience) ou réessaie.',
  improvements: [
    'Formuler un hook en une phrase testable en 3 secondes',
    'Choisir un format court aligné avec la plateforme cible',
    'Publier sur un créneau où ton audience est active (à confirmer avec tes stats)',
  ],
} as const

export const FALLBACK_BRIEFING_STRINGS = {
  whyPrefix: 'Signal actif sur',
  emerging: ['Signaux tech & création', 'Formats courts encore en traction', 'Actualité générale à croiser avec niche'],
  breakouts: ['Contenus créateur à forte marge d’angle', 'Sujets où la saturation reste modérée'],
  opportunities: ['Vidéo courte + hook explicite', 'Décryptage / comparaison sur tendance du jour'],
  insight: 'Sans profil enrichi, priorise une veille courte quotidienne sur /trends puis une hypothèse de contenu unique.',
} as const

/** Fallback analyse contenu — honnête quand le modèle est indisponible. */
export function getContentAnalysisFallback(): ContentAnalysisShape {
  return {
    whyViral:
      'Les signaux fournis suggèrent un alignement avec des sujets déjà en conversation — sans métriques fines, on reste sur une lecture prudente.',
    creatorTip:
      'Isole un angle unique en une phrase, teste deux hooks en 3 secondes, puis choisis le format le plus court adapté à la plateforme.',
    riskAssessment: 'peaking',
    culturalContext:
      'Le contexte public évolue vite; ce qui monte peut saturer dès que le même angle est copié partout.',
    viralPotential: 62,
    predictedPeak: '48h',
    audienceSegments: ['Audience généraliste', 'Créateurs actifs'],
    recommendedFormats: ['Vidéo courte', 'Carrousel ou thread selon la plateforme'],
  }
}

/** Même forme que ContentAnalysis (évite import circulaire). */
export type ContentAnalysisShape = {
  whyViral: string
  creatorTip: string
  riskAssessment: 'starting' | 'peaking' | 'fading'
  culturalContext: string
  viralPotential: number
  predictedPeak: string
  audienceSegments: string[]
  recommendedFormats: string[]
}
