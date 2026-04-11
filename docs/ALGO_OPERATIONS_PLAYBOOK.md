# ALGO — playbook opérations & déploiement (point d’entrée unique)

Ce document **ne remplace** pas les garde-fous exécutables : il **oriente** vers eux. Évite les longues « directives Cursor » parallèles (design + QA + deploy + observabilité + self-heal) qui **dupliquent** ou **contredisent** le dépôt.

## Arbitrage quand plusieurs systèmes tirent différemment

En cas de conflit (ex. une optimisation UI vs une règle du deploy gate, ou une idée « intelligente » qui alourdit le hot path), appliquer dans l’ordre :

1. **Stabilité** — ne pas casser prod, ne pas contourner la CI, pas de refonte transversale sans besoin mesuré.
2. **Simplicité** — livrer moins pour la même utilité ; une seule source de vérité par sujet.
3. **Intelligence / sophistication** — seulement si 1 et 2 sont préservés.

**Priorité des garde-fous exécutables** (quand il faut trancher vite) :

1. Deploy gate + secrets / env (`config/algo-deploy-gate.ts`, `.env.example`, workflows).
2. QA release (`config/algo-qa-gate.ts`, `npm run verify:release`).
3. Design system (`config/algo-system-rules.ts`, chartes UX listées dans la cartographie).
4. Résilience runtime (`src/lib/resilience/`, etc.) — **sans** « auto-réparation » du code source hors PR (voir `ALGO_OFFLINE_EVOLUTION.md`).
5. Observabilité (lecture seule, pas de boucle corrective automatique sur le repo).
6. Analyses multi-agents / prompts longs — **orientateurs**, pas loi au-dessus de 1–5.

**Nettoyage / « garbage collector »** : il n’y a pas de module runtime `core/maintenance/*` qui scanne ou supprime du code. Le nettoyage **sûr et local** des artefacts de build = `npm run clean` → `scripts/clear-cache.js` (`.next`, `node_modules/.cache`, `.turbo` ; option `--dry-run`). Tout le reste (fichiers source, données) passe par **décision humaine + PR**.

## Cartographie (une ligne = une source de vérité)

| Besoin | Où |
|--------|-----|
| Design / UI / tokens | `config/algo-system-rules.ts`, `docs/ALGO_DESIGN_EVOLUTION.md`, `docs/ALGO_UX_CHARTER.md`, `docs/ALGO_UX_COGNITIVE_AUDIT.md` |
| Index navigation `docs/` (carte, pas wiki parallèle) | **`docs/README.md`** |
| Checklist agent + release | `config/algo-qa-gate.ts` → `npm run verify:release` |
| Pré-déploiement / philosophie CD | `config/algo-deploy-gate.ts`, `.github/workflows/` (CI + release gate via `verify:release` / `verify:full` incluent **`npm run typecheck`**) |
| Maturité release (rubric qualitative, pas score unique) | **`docs/ALGO_RELEASE_READINESS.md`** |
| Évolution hors hot path, anti-patterns | `docs/ALGO_OFFLINE_EVOLUTION.md` |
| Control room | `docs/ALGO_CONTROL_ROOM.md` |
| Observabilité (lecture seule, env) | `src/core/observability/`, `AGENTS.md` (section observabilité), `.env.example` |
| Doctrine & preuves | `docs/algo-doctrine.md`, `docs/ALGO_CHECKLIST_PROOFS.md` |
| Limites prod / anti-double vérité (sketchs hors repo) | **`docs/ALGO_PRODUCTION_BOUNDARIES.md`** |
| Positionnement / GTM (brouillon, non normatif) | **`docs/ALGO_GTM_NOTES.md`** |
| Caches build locaux (`.next`, `node_modules/.cache`, `.turbo`) | **`npm run clean`** / **`npm run clean:dry`** → **`scripts/clear-cache.js`** |

## Blueprints « production / ops / autonomous » externes

Des prompts ou checklists **génériques** (arborescence `app/` à la racine **sans** `src/`, dossiers `core/meta`, `core/maintenance` type garbage collector sur le **code**, `core/ops/*`, **Mode Coherence Governor** / **MCG**, **Global Orchestrator** sous `core/governance/` ou `core/orchestration/`, pack **« Complete Product Launch Kit »** (structure finale marketing, pricing, prompts « orchestrateur » comme loi), route **`/brain`** dédiée type IRM système, page `/control-room/ops` avec **polling** agressif, « mode autonome » qui modifie le dépôt avec scores de confiance, prompt **« Human Cognitive Alignment System »** / module runtime dédié à la charge cognitive) **ne sont pas** la carte officielle de ce dépôt.

**Règle** : n’en faire qu’**extraire les principes** (build propre, secrets server-only, validation d’entrées, pas de double fond) s’ils **ne contredisent** pas les chemins de la cartographie ci-dessus.

| Souvent proposé (pack externe) | Où c’est vraiment dans ALGO |
|-------------------------------|-----------------------------|
| `app/`, `components/` à la racine | **`src/app/`**, **`src/components/`** |
| `config/design-system.ts` isolé | **`config/algo-system-rules.ts`** + tokens dans **`src/app/globals.css`** + chartes `docs/ALGO_*` |
| `core/ai`, `core/meta`, `core/healing`, `core/maintenance` | **`src/core/`** (`brain`, `system`, `observability/`) + **`src/lib/`** (IA, autonomy, résilience) — **pas** d’arborescence obligatoire parallèle « meta / ops / GC » |
| Dashboard ops temps réel + `setInterval` court | **`docs/ALGO_CONTROL_ROOM.md`** + **`/control-room`** — pas de boucle lourde sur Q&R ou IA (voir `ALGO_OFFLINE_EVOLUTION.md`) |
| GC runtime sur sources / rollback auto sur le repo | **Hors scope** — `npm run clean` pour artefacts de build ; **PR + humain** pour le code |
| « Check » = seulement `npm run build` | Gate complet : **`npm run verify:release`** (voir `package.json`) |
| **MCG** / **Mode Coherence Governor** / couche qui « valide toute action système » au-dessus des modes | **Pas** de fichier runtime unique : arbitrage documenté en **section Arbitrage** ; cohérence produit côté code via **`src/services/AlgoCoherenceGuard.ts`**, rituel **`docs/ALGO_COHERENCE_RITUAL.md`**, gate **`npm run verify:release`** — pas d’immunitaire global exécutable en plus sans besoin mesuré |
| **Global Orchestrator** (`core/orchestration/*`) chef d’orchestre temps réel des modes | L’orchestration **documentée** passe par **`src/core/system.ts`**, **`src/core/brain.ts`**, libs métier ; une **fusion meta** de toutes les sorties modules avec résolution de conflits est **hors scope** aujourd’hui (voir **`docs/algo-doctrine.md`** — roadmap explicite) |
| Checklist **« production readiness final »** / **GO–NO GO** comme processus automatisé unique | Rubrique humaine + preuves : **`docs/ALGO_RELEASE_READINESS.md`**, **`config/algo-deploy-gate.ts`**, CI — pas de second moteur d’audit parallèle |
| **Launch strategy** / **business domination** / one-liners marketing comme **norme** du dépôt | Brouillon **non normatif** : **`docs/ALGO_GTM_NOTES.md`** (sous **`docs/algo-doctrine.md`**) ; ne pas en faire une config exécutable ni contredire la voix / transparence |
| **Complete Product Launch Kit** (tout-en-un : arborescence, landing copy, pricing, prompts IA + « Global Orchestrator » textuel, checklist GO live **comme** constitution) | **Pas** de kit unique canonical dans le code : mêmes renvois que ci-dessus + **`config/algo-qa-gate.ts`** ; le **positionnement** et les **brouillons copy** restent dans **`docs/ALGO_GTM_NOTES.md`** — la **vérité** exécutable reste **CI + doctrine + persona / synthesis** (`src/lib/ai/`) |
| Route **`/brain`** (cerveau wireframe + flux internes + modules « temps réel » lourd) | **Pas** de route produit standard sous ce nom : le contrat visuel « cerveau + lecture » = **`/control-room`** + **`docs/ALGO_CONTROL_ROOM.md`** ; éviter un second parcours **doublon** (charge, promesse monitoring non cadrée) |
| **Human Cognitive Alignment** / « optimise tout contenu et interface » comme **sous-système code** séparé (`core/cognitive/*`, second meta-module) | **Non** — les principes (charge cognitive, hiérarchie, progression simple → complexe, résumé avant détail) sont déjà **implémentés comme discipline** : **`docs/ALGO_UX_CHARTER.md`**, **`docs/ALGO_UX_COGNITIVE_AUDIT.md`**, **`config/algo-system-rules.ts`** (`experience.cognitiveAlignment` / `cognitiveAudit`), copy **`src/lib/copy/algo-voice.ts`** + **`ui-strings.ts`**, rituels agents **`AGENTS.md`** + **`.cursor/rules/algo-coherence-review.mdc`** (question charge cognitive) |

En cas de doute entre un **pack** et le dépôt : **le dépôt et la CI font foi** ; reprendre aussi la section **Arbitrage** en tête de ce fichier.

## Avant merge ou release

1. `npm run verify:release` (écosystème, i18n, **`verify:api-guards`**, `typecheck`, `lint:strict`, tests, build — voir `ALGO_QA_RELEASE_COMMANDS.steps` dans `config/algo-qa-gate.ts`).
2. TypeScript : `npm run typecheck` seul si tu veux un retour rapide (déjà dans `verify:release`) ; voir `docs/ALGO_RELEASE_READINESS.md` (dimension 1).
3. Pas de **secrets** dans le client ni de clés commitées : suivre `.env.example` et la checklist deploy gate.

## Déploiement (ex. Vercel)

- **Build** : `npm run build` · **Node** : `>=20` (voir `package.json` `engines`).
- Renseigner les **variables d’environnement** requises sur le tableau de bord hébergeur (aligné `.env.example`).
- Après premier déploiement : **smoke manuel** court — accueil, `/control-room`, route Q&R ou santé publique selon ton déploiement — puis surveiller les **logs** hébergeur.

## Ce qu’on **n’ajoute** pas ici

- **Self-healing** / `applySafeFix` automatique sur le code : la stabilité = **PR + CI + humain** (`ALGO_OFFLINE_EVOLUTION.md`).
- **Nouveau** fichier central design si `config/algo-system-rules.ts` existe déjà.
- Chemins fantaisistes type `/core` à la racine : le code vit sous **`src/`** (App Router, `src/app/api/`, etc.).

## Voir aussi

- `docs/README.md` (carte des docs canoniques)
- `docs/ALGO_RELEASE_READINESS.md` (six axes + preuves ; CI / deploy gate font foi)
- `docs/ALGO_GTM_NOTES.md` (GTM / positionnement brouillon — aligné doctrine)
- `AGENTS.md`
- `docs/ALGO_COHERENCE_RITUAL.md`
