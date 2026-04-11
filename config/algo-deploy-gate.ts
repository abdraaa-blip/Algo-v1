/**
 * ALGO · garde pré-déploiement (Vercel / CI/CD · validation finale).
 *
 * S’appuie sur :
 * - `docs/ALGO_OFFLINE_EVOLUTION.md` (principe : évolution hors hot path, pas d’auto-patch runtime ; mémoire / conscience ; une seule entrée POST /api/algo App Router — même doc)
 * - `docs/ALGO_CONTROL_ROOM.md` (contrat `/control-room`)
 * - `docs/ALGO_DESIGN_EVOLUTION.md` (pont design → sources canoniques)
 * - `docs/ALGO_UX_CHARTER.md` (expérience globale : lisibilité, fond, motion, a11y)
 * - `docs/ALGO_UX_COGNITIVE_AUDIT.md` (audit par écran + multi-profils heuristique)
 * - `docs/ALGO_RELEASE_READINESS.md` (rubric maturité qualitative — pas de score unique ; CI / ce fichier font foi)
 * - `docs/ALGO_PRODUCTION_BOUNDARIES.md` (limites prod / anti-sketch hors dépôt)
 * - `docs/README.md` (index des docs — ne dispense pas des checklists ci-dessous)
 * - `docs/ALGO_GTM_NOTES.md` (positionnement public — ne dispense pas des checklists ci-dessous)
 * - `docs/ALGO_OPERATIONS_PLAYBOOK.md` (déploiement / smoke / point d’entrée opérations)
 * - `docs/ALGO_CICD_PIPELINE.md` (phases analyse → déploiement · GitHub + Husky + Vercel)
 * - `config/algo-qa-gate.ts` (checklist continue + `verify:release`)
 * - `config/algo-system-rules.ts` (design system)
 * - Workflows : `.github/workflows/ci.yml`, `.github/workflows/release-gate.yml` (`verify:release` / `verify:full` incluent `typecheck` + `lint:strict` ; `verify:release` inclut aussi `verify:api-guards` et `npm audit`)
 *
 * Tests Vitest : `src/lib/__tests__/algo-deploy-gate-config.test.ts`.
 */

export const ALGO_DEPLOY_SOURCES = {
  releaseReadiness: 'docs/ALGO_RELEASE_READINESS.md',
  /** Vue d’ensemble CI/CD (workflows, hooks, Vercel). */
  cicdPipeline: 'docs/ALGO_CICD_PIPELINE.md',
  qaGate: 'config/algo-qa-gate.ts',
  designRules: 'config/algo-system-rules.ts',
  ciWorkflow: '.github/workflows/ci.yml',
  releaseGateWorkflow: '.github/workflows/release-gate.yml',
  packageScripts: 'package.json',
} as const

/** Aligné sur `npm run verify:release` + contrôles release plus stricts si besoin. */
export const ALGO_DEPLOY_COMMANDS = {
  /** Gate standard merge → production (équipe Vercel branchée sur CI vert). */
  minimumBeforeDeploy: 'npm run verify:release',
  /** Gate renforcée (PR vers main/develop déjà couverte par workflow `release-gate.yml`). */
  strictReleasePr: 'npm run verify:full',
} as const

export const ALGO_DEPLOY_PHILOSOPHY = {
  tagline: 'Liberté dans l’évolution · rigueur dans le déploiement.',
  principle:
    'Aucune version expérimentale, incomplète ou non vérifiée ne doit être considérée comme prête pour la production.',
} as const

/** Politique de blocage : si une case critique échoue → pas de déploiement. */
export const ALGO_DEPLOY_BLOCK_POLICY = {
  immediateActions: [
    'Bloquer le déploiement (ne pas merger / ne pas promouvoir le build).',
    'Expliquer le problème (fichier, symptôme, impact).',
    'Proposer un patch minimal, ciblé, à risque limité — pas de refonte globale.',
  ],
  neverDeployWith: [
    'Erreur de build ou TypeScript bloquant.',
    'UI cassée ou divergence manifeste avec le design system central.',
    'Incohérence système critique (flux data, sécurité, crash runtime avéré).',
    'Secrets ou clés API exposés côté client / dans le dépôt.',
  ],
} as const

export const ALGO_DEPLOY_CHECKLIST = {
  buildAndCompilation: [
    'Le projet compile : `npm run build` OK dans le même environnement que la CI (variables publiques Next si requis).',
    'Politique TypeScript Next : `next.config.ts` avec `typescript.ignoreBuildErrors: false` + `npm run typecheck` dans `verify:release` ; voir `docs/ALGO_RELEASE_READINESS.md` (dimension 1).',
    'Pas d’import cassé ni de dépendance manquante (`npm ci` propre).',
    'Pas d’ignorer volontairement des warnings ESLint **critiques** sur le périmètre modifié (voir politique équipe / `lint:strict` pour audits).',
  ],
  architecture: [
    'Cohérence avec la structure ALGO (`src/core`, `src/components`, `config`, `src/lib`, routes `src/app`).',
    'Pas de duplication de modules critiques (second « cerveau » LLM, second orchestrateur tendances, etc.).',
  ],
  uiDesignSystem: [
    'Respect strict des règles dans `config/algo-system-rules.ts` (tokens, `var(--color-*)`, `algo-surface`, animations).',
    'Pas de divergence visuelle majeure entre pages nouvelles et existantes sans décision produit.',
  ],
  performance: [
    'Pas de boucle infinie ni de re-render excessif évident sur vues critiques.',
    'Composants lourds (canvas, 3D, grosses libs) : usage maîtrisé, pas de surcharge sur mobile.',
  ],
  security: [
    'Aucune clé API ou secret dans le code client ou les bundles publics.',
    'Variables sensibles uniquement via env serveur / Vercel ; `NEXT_PUBLIC_*` réservé au non-secret.',
    'Endpoints sensibles : auth / rate limit selon patterns existants du dépôt ; `npm run verify:api-guards` (dans `verify:release`) empêche une nouvelle route `api/.../route.ts` sans garde ; `npm audit` dans la même gate signale les advisories npm connues.',
  ],
  functionalSmoke: [
    'APIs principales du périmètre touché : réponses attendues (200 / schémas) en staging ou via tests.',
    'Parcours critiques (ex. `/`, `/ai`, `/intelligence`, `/intelligence/viral-control` si modifiés) : chargement sans erreur runtime bloquante.',
    'Chaîne IA Q&R : `POST /api/ai/ask` stable (pas de crash handler ; réponse utilisable).',
    'Mémoire / règles agents : `config/algo-system-rules.ts`, `config/algo-qa-gate.ts`, `config/algo-deploy-gate.ts` cohérents et à jour si le comportement produit change.',
  ],
  systemCoherence: [
    'Alignement IA · UI · data (doctrine, checklist preuves, pas de contradiction document/code).',
    'Stabilité des flux : brain → system → routes documentés dans `AGENTS.md`.',
  ],
} as const

export type AlgoDeployChecklist = typeof ALGO_DEPLOY_CHECKLIST
