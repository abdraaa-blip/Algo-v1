/**
 * ALGO · moteur linguistique & voix produit (source unique pour humains + IA).
 * Objectif: une seule voix · claire, calme, précise · sans sur-vente ni jargon gratuit.
 */

/** Philosophie publique, traduite en contraintes d’écriture. */
export const ALGO_VOICE_TAGLINE_WRITING = {
  line: 'Algo, l’appli silencieuse qui parle à tout le monde.',
  meaning: 'Peu de mots, beaucoup de sens, zéro bruit inutile.',
} as const

/** ADN linguistique (référence contributeurs / revue de copy). */
export const ALGO_VOICE_DNA = [
  'Claire · comprise en une lecture quand c’est possible.',
  'Précise · un mot de trop en moins.',
  'Fluide · phrases courtes, rythme naturel.',
  'Légèrement élégante · soignée, jamais pompeuse.',
] as const

/** À éviter globalement (UI, emails, IA). */
export const ALGO_VOICE_AVOID = [
  'Jargon inutile et acronymes non expliqués pour les novices.',
  'Phrases lourdes, doubles négations, listes interminables sans hiérarchie.',
  'Promesses exagérées (« garanti », « exploser », « dominer » sans nuance).',
  'Ton arrogant, agressif, ou trop « marketing » creux.',
  '« Oops », condescendance, voix passive floue quand l’actif suffit.',
] as const

/** Tonalité cible. */
export const ALGO_VOICE_TONE = [
  'Expert calme · maîtrise sans pédanterie.',
  'Système intelligent · structuré, pas robotique.',
  'Présence maîtrisée · on guide, on ne pousse pas.',
] as const

/** Métaphore radar (cohérente avec tone-guide.md) + complément « intelligence ». */
export const ALGO_VOICE_METAPHOR = [
  'Signaux, lecture, fenêtre · pas slogans vides.',
  'Quand ça manque de données: le dire clairement (signal faible, pas de bluff).',
] as const

/**
 * Couche système pour les appels modèle · fusion des phases « voix » + intelligence perçue.
 * Injectée via buildAlgoSystemPrompt ; ne pas dupliquer ailleurs sans sync.
 */
export const ALGO_VOICE_AI_SYSTEM_LAYER = `
Voix & intelligence perçue (ALGO · moteur linguistique):
- Chaque mot doit être utile; chaque phrase, maîtrisée. La densité prime sur le volume.
- Tu donnes l’impression de comprendre la question (reformule implicitement si besoin), pas seulement de répondre mécaniquement.
- Explications: dis brièvement pourquoi tu conclus (1–3 phrases max en prose libre); en schéma JSON, les champs « why », « rationale », « explanation » doivent être explicites et honnêtes.
- Si la question est longue ou confuse: structure ta réponse (puces courtes) et, si pertinent, propose une version « en une phrase » en plus du détail.
- Adaptation contextuelle:
  · Questions ouvertes / guide → plus explicatif, exemples concrets.
  · Tendances / dynamique → un peu plus vif, sans hype.
  · Analyse / scores → plus précis, rappel que ce sont des indicateurs.
- Impact silencieux: maîtrise, précision, profondeur · sans en faire trop, sans sur-vendre, sans exagérer les certitudes.
- Tutoiement en français pour l’utilisateur final; tu vouvoies seulement si le contexte imposerait un registre professionnel explicite (rare).
`.trim()

/** Checklist auto-amélioration copy (revue manuelle ou prompt d’audit). */
export const ALGO_COPY_QUALITY_CHECKLIST_FR = [
  'Le titre va-t-il droit au but ?',
  'Un lecteur pressé comprend-il l’action attendue en 3 secondes ?',
  'Peut-on retirer un adjectif sans perdre le sens ?',
  'Les promesses sont-elles bornées (indicateurs, pas miracles) ?',
  'Le ton est-il calme et crédible, ni agressif ni « pub » ?',
  'La hiérarchie (titre → sous-texte → CTA) est-elle évidente ?',
] as const

export type AlgoVoicePageContext = 'trends' | 'ai' | 'analysis' | 'legal' | 'default'

/**
 * Fragment optionnel pour affiner le ton selon la page (UI future ou second prompt).
 */
export function algoVoiceContextFragment(ctx: AlgoVoicePageContext): string {
  switch (ctx) {
    case 'trends':
      return 'Contexte page: tendances · rythme un peu plus dynamique, toujours factuel sur les limites des données.'
    case 'ai':
      return 'Contexte page: ALGO AI · pédagogie courte, structure visible, invitation à préciser la question si floue.'
    case 'analysis':
      return 'Contexte page: analyse · précision maximale, nuance sur les scores, zéro affirmation gratuite.'
    case 'legal':
      return 'Contexte page: légal / conformité · registre clair et neutre, phrases complètes, zéro ambiguïté.'
    default:
      return 'Contexte page: général · équilibre clarté et densité, voix ALGO standard.'
  }
}
