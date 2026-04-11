/**
 * ALGO · portail QA intelligent (checklist agent + humain avant merge / build / fin de session).
 *
 * Toujours croiser avec :
 * - `config/algo-system-rules.ts` (design / UI / cohérence visuelle)
 * - `docs/algo-doctrine.md` + `docs/ALGO_CHECKLIST_PROOFS.md`
 * - `docs/ALGO_COHERENCE_RITUAL.md` (audit ciblé / pré-prod, optionnel)
 * - `docs/ALGO_OFFLINE_EVOLUTION.md` (évolution sûre : hors hot path, pas de LLM méta sur chaque réponse ; mémoire / conscience ; pas de doublon pages/api/algo — même doc)
 * - `docs/ALGO_PRODUCTION_BOUNDARIES.md` (synthèse anti-sketch « prod ready » hors dépôt → renvoie ici + offline evolution)
 * - `docs/ALGO_CONTROL_ROOM.md` (contrat `/control-room` : deux mondes, sondes autorisées, interdits)
 * - `docs/ALGO_DESIGN_EVOLUTION.md` (pont design évolutif → sources canoniques, pas 2ᵉ charte)
 * - `docs/ALGO_UX_CHARTER.md` (expérience globale : fond, motion, a11y, charge cognitive)
 * - `docs/ALGO_UX_COGNITIVE_AUDIT.md` (protocole audit par écran : intention, fatigue, scroll, revue multi-profils heuristique)
 * - `docs/ALGO_RELEASE_READINESS.md` (maturité release qualitative ; CI / deploy gate font foi)
 * - `docs/ALGO_OPERATIONS_PLAYBOOK.md` (déploiement / smoke / anti-directives parallèles ; arbitrage priorités ; nettoyage caches `npm run clean` ; blueprints externes vs packs génériques)
 * - `docs/ALGO_GTM_NOTES.md` (positionnement / GTM brouillon — ne remplace pas doctrine ni prompts)
 * - `docs/README.md` (index navigation des docs canoniques)
 * - `AGENTS.md` (pile IA, copy, brain)
 *
 * Gate standard : `verify:release` inclut `verify:api-guards` (chaque `route.ts` sous `src/app/api`, hors cron et webhook Stripe) puis `npm audit`. Approfondissement : voir `ALGO_QA_RELEASE_COMMANDS.optionalDeeper` (`verify:full`, etc.).
 *
 * Tests Vitest : `src/lib/__tests__/algo-qa-gate-config.test.ts`.
 *
 * Garde **déploiement** (Vercel / CD) : `config/algo-deploy-gate.ts`.
 */

/** Chemins de référence architecture & produit. */
export const ALGO_QA_SOURCES = {
  designAndUiRules: 'config/algo-system-rules.ts',
  doctrine: 'docs/algo-doctrine.md',
  checklistProofs: 'docs/ALGO_CHECKLIST_PROOFS.md',
  coherenceRitual: 'docs/ALGO_COHERENCE_RITUAL.md',
  coherenceCursorRule: '.cursor/rules/algo-coherence-review.mdc',
  offlineEvolution: 'docs/ALGO_OFFLINE_EVOLUTION.md',
  productionBoundaries: 'docs/ALGO_PRODUCTION_BOUNDARIES.md',
  controlRoom: 'docs/ALGO_CONTROL_ROOM.md',
  designEvolution: 'docs/ALGO_DESIGN_EVOLUTION.md',
  uxCharter: 'docs/ALGO_UX_CHARTER.md',
  uxCognitiveAudit: 'docs/ALGO_UX_COGNITIVE_AUDIT.md',
  operationsPlaybook: 'docs/ALGO_OPERATIONS_PLAYBOOK.md',
  releaseReadiness: 'docs/ALGO_RELEASE_READINESS.md',
  gtmNotes: 'docs/ALGO_GTM_NOTES.md',
  docsIndex: 'docs/README.md',
  /** Synthèse présentation produit (pitch / onboarding) — secondaire vs checklist & doctrine. */
  productMasterOverview: 'docs/product/master-overview.md',
  agents: 'AGENTS.md',
  centralBrain: 'src/core/brain.ts',
  systemLayer: 'src/core/system.ts',
  masterDirective: 'docs/ALGO_MASTER_SYSTEM_DIRECTIVE.md',
  deployGate: 'config/algo-deploy-gate.ts',
} as const

/** Commandes à lancer avant de considérer une release « propre » (voir `package.json`). */
export const ALGO_QA_RELEASE_COMMANDS = {
  fullGate: 'npm run verify:release',
  steps: [
    'npm run ecosystem:check',
    'npm run i18n:check',
    'npm run verify:api-guards',
    'npm audit',
    'npm run typecheck',
    'npm run lint:strict',
    'npm run test:run',
    'npm run build',
  ] as const,
  optionalDeeper: ['npm run verify:full', 'npm run typecheck', 'npm run lint:strict'] as const,
} as const

export const ALGO_QA_PHILOSOPHY = {
  tagline: 'Système vivant mais structuré : il peut évoluer, pas se fragmenter.',
  neverValidate: [
    'Code instable ou non compilable sans correction planifiée.',
    'UI incohérente avec le design system central.',
    'Module cassé ou divergence volontaire avec la doctrine ALGO.',
  ],
  whenAnomaly: [
    'Signaler clairement (quoi, où, pourquoi).',
    'Proposer une correction minimale à impact limité.',
    'Ne pas réécrire tout un sous-système sans nécessité.',
  ],
} as const

/** Checklist obligatoire avant « terminé » / PR / build sensible. */
export const ALGO_QA_CHECKLIST = {
  technique: [
    'TypeScript / build : pas d’erreurs de compilation ; imports résolus ; pas de dead code évident introduit.',
    'Dépendances : pas d’incohérence manifeste (versions, doublons de logique métier).',
    'Composants : pas de régression sur les routes ou pages touchées ; éviter les composants orphelins inutiles.',
    'Mise en prod / release sensible : rubrique qualitative `docs/ALGO_RELEASE_READINESS.md` en complément de CI + `config/algo-deploy-gate.ts` (pas de score global LLM).',
    'Next `typescript.ignoreBuildErrors: false` (`next.config.ts`) + `npm run typecheck` dans `verify:release` — le build et la CI échouent sur les erreurs TS ; voir `docs/ALGO_RELEASE_READINESS.md` (dimension 1).',
  ],
  uiUx: [
    'Consulter `config/algo-system-rules.ts` + `docs/ALGO_UX_CHARTER.md` + `docs/ALGO_UX_COGNITIVE_AUDIT.md` (si revue parcours / charge cognitive) + respect `ALGO_SYSTEM_RULES` (variables CSS, algo-surface, animations).',
    'Hiérarchie visuelle lisible ; pas de surcharge (densité, contrastes, micro-texte abusif).',
    'Copy : voix ALGO (`algo-voice`, `ui-strings`) · pas d’interdits scan (`forbidden-ui-copy-scan`).',
  ],
  logicSystem: [
    'Flux de données : pas de duplication de source de vérité ; orchestration alignée (`brain`, `system`, routes API).',
    'Pas de conflit entre modules (noms, contrats JSON, chemins dupliqués pour la même capacité).',
    'Architecture : préférer extension au remplacement brutal des pipelines existants.',
  ],
  performance: [
    'Éviter boucles ou re-renders inutiles sur chemins chauds ; pas de fetch N+1 évident côté client.',
    'Composants lourds : lazy / dynamic import si pertinent (Next) ; images / assets raisonnables.',
  ],
} as const

export type AlgoQaChecklist = typeof ALGO_QA_CHECKLIST
