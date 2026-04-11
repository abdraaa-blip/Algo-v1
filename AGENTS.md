<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes · APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## QA intelligent (avant validation / build / fin de session)

- **Index navigation `docs/`** : **`docs/README.md`** (carte vers doctrine, UX, ops, intégrations — pas un second wiki).
- **Checklist + philosophie + commandes** : `config/algo-qa-gate.ts` (`ALGO_QA_CHECKLIST`, `ALGO_QA_SOURCES`, `ALGO_QA_RELEASE_COMMANDS`, `ALGO_QA_COMMIT_CLASSIFICATION`).
- **Design évolutif sans 2ᵉ charte** : **`docs/ALGO_DESIGN_EVOLUTION.md`** (renvoie vers `algo-system-rules.ts`, tokens, control room, offline evolution).
- **Opérations & déploiement** : **`docs/ALGO_OPERATIONS_PLAYBOOK.md`** — point d’entrée unique (évite les pavés de directives Cursor parallèles) ; sections **Arbitrage** et **Blueprints externes** si un pack « prod / ops » générique diverge du dépôt ; Vercel / smoke / `verify:release` ; pas d’auto-réparation du code hors PR ; caches build locaux sûrs : `npm run clean` ou `node scripts/clear-cache.js` (ajouter `--dry-run` pour simulation).
- Toujours croiser le design avec **`config/algo-system-rules.ts`**. Règle Cursor : `.cursor/rules/algo-qa-intelligent.mdc` (**alwaysApply**).
- Gate release typique : `npm run verify:release` (inclut **`npm run verify:api-guards`**, **`npm audit`**, **`npm run typecheck`** et **`npm run lint:strict`** avant tests / `build`). Approfondissement : `npm run verify:full` (voir `ALGO_QA_RELEASE_COMMANDS.optionalDeeper` dans `config/algo-qa-gate.ts`).
- **Git hooks (Husky)** : après `npm install`, `prepare` active Husky — **`.husky/pre-commit`** (si `.ts`/`.tsx` stagés : `tsc`, `eslint` sur fichiers stagés, `autopilot:quick`) · **`.husky/pre-push`** (`typecheck` + `lint:strict`). La gate complète reste **`npm run verify:release`** (alignée CI `.github/workflows/ci.yml`) avant merge / release.
- **Validation avant commit (classification)** : **`docs/ALGO_GIT_COMMIT_PROTOCOL.md`** — analyse du diff, niveaux **SAFE / RISKY / CRITICAL**, commandes Git attendues, maintenance post-changement ; complète les hooks (jugement d’impact, pas seulement TS/ESLint).

## Rituel cohérence (audit ciblé · optionnel)

- **Guide** : `docs/ALGO_COHERENCE_RITUAL.md` — périmètre + critère d’arrêt + questions courtes ; ne remplace pas doctrine / QA gate.
- **Règle Cursor** : `.cursor/rules/algo-coherence-review.mdc` (**alwaysApply: false**) — invoquer pour une revue « sens produit » / anti-dérive hors diff minimal.

## Évolution du système (hors hot path)

- **Position produit** : pas de boucle LLM « méta » ni d’auto-patch sur chaque réponse / runtime web — voir **`docs/ALGO_OFFLINE_EVOLUTION.md`** (levier : CI, observabilité, scripts, revues humaines) · synthèse anti-sketch **`docs/ALGO_PRODUCTION_BOUNDARIES.md`**.
- **Mémoire / « conscience »** : pas de tableau RAM + `saveMemory` sur chaque `processAlgoAiRequest` ; mémoire structurée et bornée → **`src/lib/autonomy/knowledge-memory.ts`**, historique **`learning-history`**, doc **mémoire & feedback** dans le même fichier offline evolution.
- **Cockpit / 3D « live conscient »** : pas de polling `fetchAlgo` ni d’extraits de prompts comme « souvenirs » visuels — **`docs/ALGO_OFFLINE_EVOLUTION.md`** (tableau anti-patterns + control room).
- **Control room** : contrat produit / deux mondes / sondes autorisées — **`docs/ALGO_CONTROL_ROOM.md`** (`/control-room`, `AlgoControlRoomClient`).
- **API Algo / viral** : une seule entrée **`src/app/api/algo/route.ts`** → `processAlgoAiRequest` ; pas de **`pages/api/algo`** ni de second score viral ad hoc — canon **`src/lib/ai/canonical-viral-score.ts`** (voir doc offline evolution).

## Produit & go-to-market (brouillon)

- **Notes positionnement / phases / ICP / risques marketing** : **`docs/ALGO_GTM_NOTES.md`** — **non normatif** pour le code : ne remplace pas **`docs/algo-doctrine.md`**, la pile IA (`brain`, `system`, `algo-persona`), ni la structure **`src/`** ; toute com’ publique doit passer par **voix** (`algo-voice`, `ui-strings`) et **transparence**.

## Dashboard cockpit (`/dashboard`)

- UI : `src/app/dashboard/` + composants `src/components/dashboard/` (courbe Recharts, score, insight). Région radar = **scope** navbar (`ScopeContext`) si code ∈ Viral Control, sinon **FR** · horodatage locale dernière synchro radar · bouton **Rafraîchir la lecture** (re-`fetchAlgo` sans recharger).
- Séries graph : `src/lib/dashboard/viral-chart-series.ts` (`toViralChartPoints`) — tests `src/lib/__tests__/viral-chart-series.test.ts`.
- Pont IA : `src/lib/api.ts` → `POST /api/algo` (`src/app/api/algo/route.ts`) → **`processAlgoAiRequest`** (`src/core/system.ts`) — tests `src/lib/__tests__/api-algo-route.test.ts`. Données temps réel : `GET /api/intelligence/viral-control` (polling 10s côté client).
- Fusion tendances + YouTube (sans `google-trends-api` non officiel) : `GET /api/intelligence/viral-fusion` · logique `src/lib/intelligence/viral-fusion.ts` (réutilise `fetchGoogleTrends`, YouTube Data API search + `videos.list` batch, `computeCanonicalViralScore`) · UI `FusionContextPanel` · poll ~45s.

## Facturation (Stripe · optionnel)

- Migration : `supabase/migrations/20260411120000_profiles_billing.sql` (`profiles.billing_plan`, ids Stripe, fin de période).
- API : `GET /api/billing/status` · `POST /api/billing/checkout` (session Supabase) · `POST /api/billing/webhook` · `POST /api/billing/portal` (portail client Stripe si Pro + `stripe_customer_id`).
- Snapshot session : `src/lib/billing/read-plan.ts` (`getSessionBillingSnapshot`).
- Freemium technique optionnel : `ALGO_FUSION_YOUTUBE_REQUIRE_PRO=1` → `GET /api/intelligence/viral-fusion` n’appelle YouTube que si plan `pro`.
- Logique : `src/lib/monetization/plan.ts`, `src/lib/billing/*`, `src/lib/stripe/server.ts` · UI `/settings` (bloc ALGO Pro + portail).
- Checklist déploiement : commentaires regroupés dans `.env.example` (section Stripe).

## Observabilité (lecture seule)

- Tampon circulaire + métriques dérivées : `src/core/observability/` (`addLog`, `getLogs`, `getCriticalErrors`, `computeObservabilityMetrics`, `detectLogAnomalies`).
- API : `GET` / `POST` `/api/observability/logs` · UI `/observability` · **désactivés en prod** sauf `ALGO_OBSERVABILITY_DASHBOARD=1` (voir `.env.example`).
- Instrumentation exemple : logs structurés sur `POST /api/ai/ask` (latence, dégradations, erreurs) · ne pas y mettre de secrets ni de corps utilisateur complet.

## Pré-déploiement (Vercel / CI/CD)

- **Maturité release (qualitative)** : **`docs/ALGO_RELEASE_READINESS.md`** — six axes + statuts OK / à risque / inconnu ; **pas** de score global 0–100 ; la **CI** et **`config/algo-deploy-gate.ts`** font foi. **TypeScript** : `next.config.ts` a **`typescript.ignoreBuildErrors: false`** et **`npm run typecheck`** fait partie de **`verify:release`** — build et gate reflètent l’état TS réel ; voir dimension 1 du même doc.
- **Garde finale** : `config/algo-deploy-gate.ts` (`ALGO_DEPLOY_CHECKLIST`, blocage, smoke, sécurité). Règle Cursor workflows : `.cursor/rules/algo-deploy-gate.mdc`.
- **CI GitHub** (push/PR `main`/`master`) : **`npm run verify:release`** (inclut `verify:api-guards`, `npm audit`, typecheck, lint, tests, build) · env publique Next en job `env`.
- **Release Gate PR** (`main`/`develop`) : `.github/workflows/release-gate.yml` → **`npm run verify:full`** (hérite du même gate + perf budget + rapport).
- **Pipeline CI/CD** (phases analyse → déploiement Vercel, règles, workflows) : **`docs/ALGO_CICD_PIPELINE.md`** (`ALGO_QA_SOURCES.cicdPipeline` dans `config/algo-qa-gate.ts`).

## Design system & UI (règles persistantes)

- **Charte UX globale** (fluidité, lisibilité, fond unique, motion, accessibilité, anti-surcharge ; **alignement cognitif** agents pour UI/copy — pas la persona Q&R) : **`docs/ALGO_UX_CHARTER.md`** — à croiser avec `algo-system-rules` et le pont **`docs/ALGO_DESIGN_EVOLUTION.md`**.
- **Audit cognitif & parcours** (checklist par page : intention, fatigue, scroll, cohérence ; **revue multi-profils** sans scores fictifs) : **`docs/ALGO_UX_COGNITIVE_AUDIT.md`**.
- **Mémoire centralisée (agents + humains)** : `config/algo-system-rules.ts` · contient `ALGO_SYSTEM_RULES`, les chemins `ALGO_DESIGN_SOURCES`, et réexporte `tokens` depuis `src/design-system/tokens.ts`.
- **Ne pas** recopier les couleurs/durées ailleurs : étendre `tokens.ts` + `src/app/globals.css` ; en UI utiliser surtout `var(--color-*)`, `algo-surface`, `algo-interactive`.
- Règle Cursor associée : `.cursor/rules/algo-design-system.mdc` (fichiers `*.tsx`, `*.css`).

## Copy & voix ALGO (FR)

- Référence code : `src/lib/copy/algo-voice.ts` (ADN, checklist, couche IA). Humain : `locales/tone-guide.md`.
- Chaînes UI partagées : `src/lib/copy/ui-strings.ts`. Scan copy interdit : `src/lib/copy/forbidden-ui-copy-scan.ts`.
- Tutoiement, radar/signaux, pas d’« Oops », pas de promesses magiques. Clarté > volume.

## IA & transparence

- Vision système (anti-dérive modules) : `docs/ALGO_MASTER_SYSTEM_DIRECTIVE.md` · couche prompt `ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER` dans `algo-directive-synthesis.ts` · export anglais : `docs/prompts/ALGO_MASTER_SYSTEM_DIRECTIVE_EXPORT_EN.md`.
- Assemblage prompt : `src/lib/ai/algo-persona.ts` + `src/lib/ai/algo-directive-synthesis.ts` (dont `ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER`, `ALGO_AI_CORE_INTELLIGENCE_LAYER`, directive opérationnelle). Export anglais Core Intelligence : `docs/prompts/ALGO_AI_CORE_INTELLIGENCE_EXPORT_EN.md`.
- Couche système Q&R : `src/core/system.ts` → `processAlgoAiRequest` (route `src/core/router.ts`, indices `src/core/system-data.ts`, puis `centralAsk` · enveloppe + QC). `POST /api/ai/ask` appelle cette façade.
- Ask orchestré (contexte tendances) : `src/lib/ai/algo-ask-orchestrate.ts` → `askAlgo`. Repli sans « erreur technique » : `src/lib/ai/algo-ask-fallback.ts` + try/catch chaîne jusqu’à la route.
- Transparence utilisateur (textes + lignes API) : `src/lib/ai/ai-transparency.ts`.

## Checklist maître → réalité produit

- Tableau **état / preuves / chemins** : `docs/ALGO_CHECKLIST_PROOFS.md` (à tenir à jour).
- **Doctrine** (règles non négociables) : `docs/algo-doctrine.md`.
- **Central Brain (exécution Q&R)** : `src/core/brain.ts` → `centralAsk` → enrichissement + modèle · façade HTTP : `processAlgoAiRequest` dans `src/core/system.ts`.
- **Fiabilité data (carte)** : `src/lib/data/data-reliability-map.ts`.
- **Viral Control × YouTube** : `docs/integrations/YOUTUBE_VIRAL_CONTROL.md` · routes `/api/intelligence/viral-control` (query `videoUrl`) et `/api/social/youtube/video-metrics`.
