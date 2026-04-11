# Maturité release ALGO — rubrique qualitative

Ce document **ne remplace pas** les garde-fous **exécutables** : la décision « déployable ou non » repose sur **CI**, **`config/algo-deploy-gate.ts`**, **`npm run verify:release`** (et **`verify:full`** sur PR protégées), plus **jugement humain**.  
Il **n’introduit pas** de *Product Readiness Score* 0–100 ni de seuil magique : un score unique attribué par un LLM serait **non reproductible** et pourrait **contredire** un build vert ou masquer un risque réel.

## À quoi sert cette rubrique

Structurer une **auto-évaluation ou une revue** avant production : six **dimensions**, chacune avec statut **OK** / **à risque** / **inconnu (à vérifier)** et **preuves** (commande, fichier, log, capture).  
Priorité : **stabilité et sécurité** avant polish visuel.

## Dimensions (avec preuves attendues)

### 1. Stabilité technique

| Contrôle | Où / comment |
|----------|----------------|
| Build & tests | `npm run verify:release` (inclut `ecosystem:check`, `i18n:check`, **`verify:api-guards`**, **`npm audit`**, `typecheck`, `lint:strict`, `test:run`, `build` — voir `package.json`). |
| CI / workflows | **`.github/workflows/ci.yml`** : `npm run verify:release` (bloque sur erreur TS). **`release-gate.yml`** : `npm run verify:full` (même gate + `perf:budget` + `report:daily`). |
| Gate release PR | `npm run verify:full` · workflow `.github/workflows/release-gate.yml`. |
| Runtime / crash | Pas d’erreur runtime bloquante sur parcours fumés ; logs hébergeur après déploiement. |
| **TypeScript au build Next** | **`next.config.ts`** : `typescript.ignoreBuildErrors: false` — le `next build` **échoue** sur les erreurs TS ; **`npm run typecheck`** est aussi exécuté dans **`verify:release`**. |

Voir aussi `ALGO_DEPLOY_CHECKLIST.buildAndCompilation` dans `config/algo-deploy-gate.ts`.

#### Politique `typescript.ignoreBuildErrors`

- **Aujourd’hui** : `ignoreBuildErrors: false` dans **`next.config.ts`** — le build Next **valide** les erreurs TS.
- **CI / gate** : `npm run typecheck` est inclus dans **`verify:release`** (voir `package.json`) ; un échec **bloque** la CI.
- **Commande locale** : `npm run typecheck` (`tsc --noEmit`) — utile avant commit pour le même résultat que la CI sans lancer tout le gate.

### 2. Cohérence UI / design system

| Contrôle | Où / comment |
|----------|----------------|
| Règles persistantes | `config/algo-system-rules.ts` (`ALGO_SYSTEM_RULES`, tokens, fond global). |
| Pont design & UX | `docs/ALGO_DESIGN_EVOLUTION.md`, `docs/ALGO_UX_CHARTER.md`. |

Voir `ALGO_DEPLOY_CHECKLIST.uiDesignSystem`.

### 3. UX / clarté

| Contrôle | Où / comment |
|----------|----------------|
| Audit cognitif & parcours | `docs/ALGO_UX_COGNITIVE_AUDIT.md` (intention, fatigue, multi-profils **heuristique**). |
| Revue humaine | Smoke parcours (playbook) ; pas de substitution par une note chiffrée. |

### 4. Performance perçue & budgets

| Contrôle | Où / comment |
|----------|----------------|
| Budget perf (si gate full) | `npm run perf:budget` · script `scripts/check-performance-budget.mjs`. |
| UI lourde | Checklist deploy « performance » ; pas d’affirmation sans profiler / device réel. |

### 5. IA / logique système

| Contrôle | Où / comment |
|----------|----------------|
| Doctrine & preuves | `docs/algo-doctrine.md`, `docs/ALGO_CHECKLIST_PROOFS.md`. |
| Façades Q&R | `AGENTS.md`, `src/core/system.ts`, `src/core/brain.ts` ; fumée `POST /api/ai/ask` si périmètre touché. |

Voir `ALGO_DEPLOY_CHECKLIST.systemCoherence`, `functionalSmoke`.

### 6. Sécurité & configuration

| Contrôle | Où / comment |
|----------|----------------|
| Secrets | Aucune clé dans le client ; `.env.example` aligné hébergeur. |
| Endpoints sensibles | Rate limit / auth selon patterns du dépôt. |

Voir `ALGO_DEPLOY_BLOCK_POLICY.neverDeployWith`, checklist `security` du deploy gate.

## Synthèse par statut (sans score agrégé)

Pour chaque dimension, noter : **OK** | **à risque** | **inconnu** + **une preuve** (lien CI, extrait log, fichier, commande passée).

**Déploiement** : ne pas promouvoir une release **production** avec les dimensions **1** (stabilité technique) ou **6** (sécurité / config) en **à risque**, sauf **décision explicite** d’acceptation du risque côté équipe — et toujours sans contradiction avec **`ALGO_DEPLOY_BLOCK_POLICY`**. Les dimensions 2–5 peuvent rester « perfectibles » **avec plan** (issues, PR suivantes) : arbitrage **humain**, pas score unique.

Si la **CI est rouge**, la rubrique ne « rattrape » pas le build : **corriger d’abord** les gates exécutables.

## Sortie recommandée (revue écrite)

1. Tableau des six dimensions + statut + preuve courte.  
2. **Points faibles** (liste priorisée : bloquant / important / mineur).  
3. **Actions** minimales (`ALGO_QA_PHILOSOPHY` dans `config/algo-qa-gate.ts`).  
4. **État déploiement** : une phrase du type « aligné CI + deploy gate » ou « bloqué : … » — **sans** pourcentage global.

## Boucle d’amélioration continue

Le produit **évolue** : réexécuter les commandes pertinentes après changements majeurs ; tenir **`docs/ALGO_CHECKLIST_PROOFS.md`** à jour si le comportement annoncé change.

## Liens

| Sujet | Fichier |
|--------|---------|
| Playbook déploiement | `docs/ALGO_OPERATIONS_PLAYBOOK.md` |
| Garde déploiement détaillée | `config/algo-deploy-gate.ts` |
| QA gate & commandes | `config/algo-qa-gate.ts` |
| Checklist état / preuves | `docs/ALGO_CHECKLIST_PROOFS.md` |
| Audit UX / parcours (heuristique) | `docs/ALGO_UX_COGNITIVE_AUDIT.md` |
| GTM / positionnement (brouillon) | `docs/ALGO_GTM_NOTES.md` |
| Index `docs/` | `docs/README.md` |
| Config Next (dont `typescript`) | `next.config.ts` |
