# Index documentation ALGO

**Rôle** : carte de **navigation** vers les sources déjà canoniques du dépôt — **pas** un second wiki ni une arborescence parallèle (`/docs/core/...`) à maintenir à la main.

## Principe

- **Vérité d’exécution** : code sous `src/`, migrations Supabase, **`npm run verify:release`** (dont **`verify:api-guards`** sur les routes `api` et **`npm audit`**), workflows `.github/workflows/`.
- **Vérité produit / règles** : `docs/algo-doctrine.md`, `docs/ALGO_CHECKLIST_PROOFS.md`, `AGENTS.md`, fichiers sous `config/`.
- Les pages ici **expliquent et cadr**ent ; en cas de doute sur un comportement, le **code** et la **CI** font foi. Mettre à jour ce **index** quand un **nouveau document canonique majeur** apparaît à la racine de `docs/`.

---

## Racine & agents

| Sujet | Chemin |
|--------|--------|
| Pile Next, QA, design, IA, billing, observabilité | **`AGENTS.md`** (racine du dépôt) |
| Règles agents / Cursor | **`CLAUDE.md`**, **`.cursor/rules/`** (ex. **`algo-qa-intelligent.mdc`**, **`algo-cicd-guardian.mdc`** — revue pré-push / IA safety pipeline) |

---

## Configuration exécutable (à lire avant d’inventer des « vérités »)

| Sujet | Chemin |
|--------|--------|
| QA gate, checklist, sources, commandes release | **`config/algo-qa-gate.ts`** |
| Garde pré-déploiement, smoke, sécurité | **`config/algo-deploy-gate.ts`** |
| Design system, règles UI, `ALGO_DESIGN_SOURCES` | **`config/algo-system-rules.ts`** |
| Gates QA / déploiement (scripts npm) | **`package.json`** (`verify:release`, `verify:full`, `typecheck`, `clean`, `clean:dry`, etc.) |

### CI GitHub (aperçu)

- **`.github/workflows/ci.yml`** : **`npm run verify:release`** (inclut **`npm run typecheck`**, **`npm run lint:strict`**, tests, build — voir `package.json`).
- **`.github/workflows/release-gate.yml`** : **`npm run verify:full`** (hérite du gate + perf budget + rapport).

---

## Doctrine, preuves, évolution

| Sujet | Chemin |
|--------|--------|
| Règles non négociables | **`docs/algo-doctrine.md`** |
| État produit / preuves / chemins code | **`docs/ALGO_CHECKLIST_PROOFS.md`** |
| **Vue produit synthèse** (pitch / onboarding 2–20 min, fidèle au dépôt) | **`docs/product/master-overview.md`** |
| Évolution sûre, anti-patterns, hors hot path | **`docs/ALGO_OFFLINE_EVOLUTION.md`** |
| Limites prod / anti-sketch « phase finale » | **`docs/ALGO_PRODUCTION_BOUNDARIES.md`** |
| Rituel cohérence (audit ciblé) | **`docs/ALGO_COHERENCE_RITUAL.md`** |

---

## Design, UX, release

| Sujet | Chemin |
|--------|--------|
| Pont design → sources (éviter 2ᵉ charte) | **`docs/ALGO_DESIGN_EVOLUTION.md`** |
| Charte UX globale (dont alignement cognitif agents / copy) | **`docs/ALGO_UX_CHARTER.md`** |
| Audit cognitif & multi-profils (heuristique) | **`docs/ALGO_UX_COGNITIVE_AUDIT.md`** |
| Maturité release (rubric qualitative, politique TS build Next) | **`docs/ALGO_RELEASE_READINESS.md`** |

---

## Opérations, déploiement, GTM

| Sujet | Chemin |
|--------|--------|
| Playbook unique (Vercel, smoke, anti-pavés, arbitrage, **blueprints externes**) | **`docs/ALGO_OPERATIONS_PLAYBOOK.md`** |
| Protocole Git · SAFE / RISKY / CRITICAL avant commit | **`docs/ALGO_GIT_COMMIT_PROTOCOL.md`** |
| Pipeline CI/CD (GitHub, Husky, Vercel, phases) | **`docs/ALGO_CICD_PIPELINE.md`** |
| Control room (`/control-room`) | **`docs/ALGO_CONTROL_ROOM.md`** |
| Positionnement / GTM (brouillon, sous doctrine) | **`docs/ALGO_GTM_NOTES.md`** |

---

## IA (vision système & API)

| Sujet | Chemin |
|--------|--------|
| Directive maître (vision anti-dérive) | **`docs/ALGO_MASTER_SYSTEM_DIRECTIVE.md`** |
| Export EN (prompt layer) | **`docs/prompts/ALGO_MASTER_SYSTEM_DIRECTIVE_EXPORT_EN.md`**, **`docs/prompts/ALGO_AI_CORE_INTELLIGENCE_EXPORT_EN.md`** |
| Contrat / usage Ask | **`docs/API_AI_ASK.md`** |
| Implémentation (sources de vérité code) | `src/core/brain.ts`, `src/core/system.ts`, `src/lib/ai/algo-persona.ts`, `src/lib/ai/algo-directive-synthesis.ts` |

---

## Intégrations & specs produit

| Sujet | Chemin |
|--------|--------|
| YouTube × Viral Control | **`docs/integrations/YOUTUBE_VIRAL_CONTROL.md`** |
| Temps réel & cache | **`docs/integrations/REALTIME_AND_CACHE.md`** |
| Spec Viral Control Center | **`docs/VIRAL_CONTROL_CENTER_SPEC.md`** |

---

## Écosystème, données, runbooks

| Sujet | Chemin |
|--------|--------|
| Plateforme écosystème | **`docs/ECOSYSTEM_PLATFORM.md`** |
| Setup écosystème | **`docs/ECOSYSTEM_SETUP.md`** |
| Supabase / premier projet | **`docs/PREMIER_PROJET_SUPABASE.md`** |
| Runbook auto-mastery | **`docs/AUTO_MASTERY_RUNBOOK.md`** |
| Planète data (produit / UX data) | **`docs/algo-data-planet.md`** |

---

## Copy & ton (hors `docs/`)

| Sujet | Chemin |
|--------|--------|
| Voix & checklist code | **`src/lib/copy/algo-voice.ts`**, **`src/lib/copy/ui-strings.ts`** |
| Guide humain ton | **`locales/tone-guide.md`** |

---

## Fichiers à la racine de `docs/`

Les fichiers préfixés `ALGO_` et `algo-doctrine.md` (listés dans les sections ci-dessus) couvrent l’essentiel des garde-fous agents. Les sous-dossiers **`docs/integrations/`**, **`docs/prompts/`** complètent pour intégrations et exports.

Pour une **nouvelle** capacité majeure : ajouter une ligne dans ce README **et** mettre à jour **`docs/ALGO_CHECKLIST_PROOFS.md`** (ou la doctrine) si le comportement annoncé change.
