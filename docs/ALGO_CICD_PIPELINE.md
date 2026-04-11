# ALGO — pipeline CI/CD (GitHub · Vercel · qualité)

**Objectif** : chaque changement est analysé avant commit, validé avant push, vérifié sur GitHub, puis déployé sur Vercel sans casser l’architecture ALGO.

Ce document **orchestre** les pièces déjà dans le dépôt ; il ne remplace pas `config/algo-qa-gate.ts`, `config/algo-deploy-gate.ts`, ni les hooks Husky.

---

## Vue d’ensemble (phases → outils)

| Phase | Rôle | Où ça vit |
|-------|------|-----------|
| **1 — Analyse** | Diff, impacts (archi, IA, UI, perf, sécu), erreurs potentielles | Agents / humains + **`docs/ALGO_GIT_COMMIT_PROTOCOL.md`** (SAFE / RISKY / CRITICAL) |
| **2 — Validation** | Bloquer le critique ; exiger `verify:release` si RISKY+ | **`.husky/pre-commit`**, **`.husky/pre-push`**, **`npm run verify:release`** |
| **3 — Git** | Versionner proprement | `git add` → `git commit` → `git push` vers **`main`** ou **`master`** (branches suivies par la CI ci-dessous) |
| **4 — Déploiement** | Build prod sur Vercel | **Intégration Git ↔ Vercel** (push sur branche de production) ; en secours CLI : **`npm run deploy:prod`** |

---

## GitHub Actions (vérité CI distante)

| Workflow | Déclencheur | Commande principale |
|----------|-------------|------------------------|
| **`ci.yml`** | Push / PR sur **`main`** ou **`master`** | **`npm run verify:release`** (écosystème, i18n, `verify:api-guards`, `npm audit`, typecheck, `lint:strict`, tests, `next build`) |
| **`release-gate.yml`** | PR vers **`main`** / **`develop`**, ou manuel | **`npm run verify:full`** (= release + perf budget + rapport) |
| **`algo-autopilot.yml`** | PR, push **`main`**, cron, manuel | Scan / garde-fous autopilot (complément, pas substitut à `verify:release`) |

Variables d’environnement **publiques** minimalistes pour le build CI : voir `env` dans **`ci.yml`** / **`release-gate.yml`** (placeholders Supabase — suffisant pour compiler ; la prod reste sur Vercel).

---

## Hooks locaux (Husky)

- **Pre-commit** (fichiers `.ts` / `.tsx` stagés) : `tsc`, ESLint sur lots stagés, `autopilot:quick` (mode lenient).
- **Pre-push** : `npm run typecheck` + **`npm run lint:strict`**.

Ils **complètent** la phase 2 ; ils ne remplacent pas le jugement **RISKY** ni **`verify:release`** avant merge sensible.

---

## Vercel (déploiement automatique)

1. **Lier le dépôt GitHub** au projet Vercel : **Settings → Git** → branche de **Production** = `main` ou `master` (alignée sur `.github/workflows/ci.yml`).
2. Chaque **push** sur cette branche déclenche un **build + déploiement** Vercel (comportement standard ; aucun workflow GitHub obligatoire pour déclencher Vercel si l’intégration Git est active).
3. **Secrets / env** : uniquement dans le dashboard Vercel (pas dans Git). Checklist : **`docs/VERCEL_SUPABASE_PRODUCTION.md`**, **`.env.example`**.
4. **Crons** : définition dans **`vercel.json`** (chemins `/api/cron/*`) — vérifier **`CRON_SECRET`** en prod.
5. **Après échec de build Vercel** : corriger à partir des logs ; ne pas « forcer » un contournement (ignore TS, suppression de tests).

CLI manuel : **`npm run deploy:prod`** (`vercel deploy --prod --yes`) si le projet est déjà `vercel link`.

---

## Contrôle qualité avant push (rappel)

- **Build Next.js** : inclus dans **`npm run verify:release`** et dans la CI.
- **TypeScript** : `typecheck` + build avec `typescript.ignoreBuildErrors: false` (voir `next.config.ts`, **`docs/ALGO_RELEASE_READINESS.md`**).
- **Variables d’environnement** : pas de secrets dans le client ; parité prod documentée (`VERCEL_SUPABASE` + `.env.example`).
- **UI / UX** : `config/algo-system-rules.ts`, **`docs/ALGO_UX_CHARTER.md`**.
- **Performance** : budget dans **`verify:full`** ; garde **`config/algo-deploy-gate.ts`**.

---

## Règles absolues

- Ne pas pousser du code **cassant** volontairement.
- Ne pas bypasser une **erreur** sans correction (CI, lint, tests, build).
- **Stabilité > vitesse** ; architecture **propre et cohérente** (doctrine, pas de double source de vérité).

---

## Liens croisés

- Classification commit : **`docs/ALGO_GIT_COMMIT_PROTOCOL.md`**
- Constantes exportées : **`config/algo-qa-gate.ts`** (`ALGO_QA_SOURCES` dont `cicdPipeline` et `gitCommitProtocol`, `ALGO_QA_COMMIT_CLASSIFICATION`, `ALGO_QA_RELEASE_COMMANDS`)
- Garde déploiement : **`config/algo-deploy-gate.ts`** (`ALGO_DEPLOY_SOURCES.cicdPipeline`, checklists blocage)
- Playbook ops : **`docs/ALGO_OPERATIONS_PLAYBOOK.md`**
- Index docs : **`docs/README.md`**
- Agents : **`AGENTS.md`**
