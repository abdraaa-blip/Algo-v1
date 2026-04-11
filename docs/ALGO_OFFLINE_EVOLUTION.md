# Évolution du système ALGO (hors hot path)

**Synthèse courte** (plans « prod ready » hors dépôt) : **`docs/ALGO_PRODUCTION_BOUNDARIES.md`**.

Ce document **ancre** l’idée d’« auto-amélioration » dans une pratique **contrôlée, déterministe et réversible** — sans boucle LLM sur chaque réponse utilisateur et sans patch automatique du code en production.

## Ce qu’on ne met pas dans le Core (délibérément)

- **Pas** d’appel LLM « méta » après chaque sortie (`centralAsk` / routes Q&R) : latence, coût, non-déterminisme, surface de fuite données.
- **Pas** d’`autoPatch` ou de modification automatique du dépôt depuis le runtime web : risque irréversible, audit Git difficile.

### Anti-patterns fréquents (à éviter même « en safe »)

| Idée séduisante | Pourquoi ce n’est pas un garde-fou suffisant |
|-----------------|-----------------------------------------------|
| `autonomousCycle` / `selfEvaluate` après chaque réponse | Deuxième LLM = deuxième source d’hallucination ; pas d’oracle ; boucle de confiance fragile. |
| `safeGate` sur des sous-chaînes (`includes("delete")`) | Contournable ; ne couvre pas le sens ; donne une fausse impression de sécurité. |
| Boîte « insights » alimentée par ce méta-LLM à chaud | Bruit UX, coût, et mélange « réponse utile » / « commentaire auto-généré » sans preuve mesurable. |
| **Mémoire** = tableau global en RAM dans `core/` + `saveMemory` à chaque requête | Fausse « persistance » (perte au redémarrage), fuite PII (entrées / sorties brutes), latence et RGPD mal cadrés. |
| **Boucle de conscience** (`consciousLoop` + `memory.length` → « évolution ») | Signal arbitraire, discours « cognitif » trompeur, couplage hot path / viz. |
| « Vector memory » avec **pseudo-embedding** (hash, caractères → vecteur fixe) | Aucune similarité sémantique ; retrieval arbitraire ; risque de vendre un RAG **faux**. |
| Index vectoriel **natif** (ex. `hnswlib-node`) dans le **même process** que le handler Q&R | Bindings natifs, friction serverless / build multi-plateforme ; sans store **géré** + sauvegardes ce n’est pas une mémoire **long terme** fiable. |
| **Persona** dérivée seule des routes les plus fréquentes + champ `consciousness` à chaque réponse | La route dominante ≠ l’intention du message courant ; fuite d’agrégats ; attente « système conscient » mal cadrée. |
| **Cockpit « live »** : `setInterval` + `fetchAlgo` / analyse IA lourde **pour animer** un fond 3D | Coût, charge serveur, bruit ; le décor ne doit pas piloter le modèle. |
| **Mémoire visuelle** = extraits `input.slice(...)` affichés comme « souvenirs » | PII visible sans cadre consentement / effacement / minimisation ; confusion avec une mémoire cognitive. |
| Boost d’**intensité** ou de « niveau d’intelligence » = `f(memory.length)` | Métrique décorrélée de la qualité ; surexcitation UX (« plus c’est gros, plus c’est intelligent »). |
| Viz 3D qui mélange **patterns** (stats) et **entrées mémoire** dans les mêmes props | Deux sources de vérité visuelles ; risque d’afficher le mauvais objet (ex. `patterns` passé comme `memory`). |
| **Checklist « phase finale »** qui valide *en bloc* mémoire RAM + vector + conscious + 3D dans le Core | Mélange marketing et réalité du dépôt ; risque de réintroduire tout ce qu’on exclut ici sous prétexte de « production ready ». |
| **Doublon** `pages/api/algo` + un second `processRequest` parallèle à `processAlgoAiRequest` | Deux chemins HTTP, deux comportements, dette Next (App Router vs Pages) — **une seule** entrée documentée. |
| Second **`computeViralScore`** ad hoc dans `core/` (ou dans l’API) | Conflit avec le **score viral canonique** du repo ; deux métriques « officielles » pour la même promesse. |
| **Pavé de directives Cursor** (design + QA + deploy + observabilité + auto-réparation) **en parallèle** du repo | Fragmentation, chemins faux (`/core` racine…), risque de **contredire** les garde-fous réels — utiliser **`docs/ALGO_OPERATIONS_PLAYBOOK.md`** comme **seul** point d’entrée texte (y compris § **Blueprints externes**). |
| **Pack « prod / ops / autonomous »** : `app/` sans `src/`, `mkdir core/{meta,healing,maintenance,ops,autonomous}`, cockpit `/control-room/ops` + polling 2 s, auto-patch avec « confidence score » | Arbre et comportements **non alignés** sur ce monorepo ; doublon avec **`src/core/observability/`**, **`/api/intelligence/*`**, **`/control-room`** — ne pas refondre pour coller au pack ; voir playbook § **Blueprints externes**. |
| **MCG** / **Global Orchestrator** : fichier unique au-dessus de tous les « modes » qui valide ou ordonnance chaque action | Risque de **second cerveau** opaque + latence ; cohérence = playbook, guard, CI ; meta-fusion conflits inter-modules = **roadmap** doctrine — voir playbook § **Blueprints externes**. |
| **Launch kit** tout-en-un + route **`/brain`** + prompts « orchestrateur ALGO » comme nouvelle loi | Doublon **control room** / promesse infra ; orchestration textuelle en **parallèle** de `algo-persona` / `algo-directive-synthesis` — **non** ; voir playbook § **Blueprints externes**. |
| **Human Cognitive Alignment System** comme module runtime / « optimise tout » hors charte | Doublon avec **`docs/ALGO_UX_CHARTER.md`**, **`docs/ALGO_UX_COGNITIVE_AUDIT.md`**, règles **`config/algo-system-rules.ts`** et copy **`algo-voice`** — ne pas ajouter un second « cerveau cognitif » en code ; voir playbook § **Blueprints externes**. |
| **Auto-réparation** du code (`healEngine`, `applySafeFix`…) sans PR | Même risque que l’auto-patch : opacité, régressions — **hors scope** ALGO. |

### Mémoire & feedback : où le faire proprement

- **Pas sur** `processAlgoAiRequest` / `centralAsk` : ne pas journaliser tout le corps Q&R dans un buffer process pour nourrir une « conscience » ou un 3D.
- **RAG / recherche vectorielle** (si un jour produit) : **vrais** embeddings, store **géré** (ex. pgvector, service externe), rétention et consentement cadrés — en **asynchrone** ou **hors** réponse synchrone par défaut, pas un vecteur « hash » dans `core/`.
- **Autonomie / intelligence** (hors hot path utilisateur typique) : `src/lib/autonomy/knowledge-memory.ts` (résumés bornés + option Supabase), `learning-history`, routes `/api/intelligence/memory`, `/api/intelligence/learn`, etc. — **contrat** (domaine, limite, pas de verbatim obligatoire).
- **Analytics** agrégées : `src/lib/analytics/event-store.ts` et politiques de consentement — pas équivalent à une « mémoire du modèle ».
- **Control room** : rester sur **probes légères** + schéma statique ; **interdit** d’y brancher `fetchAlgo` / `POST /api/algo` en boucle pour un rendu « conscient » (voir impl. actuelle : `GET /api/v1/health` seulement, intervalle long).

## Ce qu’on utilise à la place (déjà dans le repo)

| Levier | Rôle |
|--------|------|
| `npm run verify:release` | Gate technique (écosystème, i18n, **`verify:api-guards`**, **`npm audit`**, typecheck, lint strict, tests, build). |
| `config/algo-qa-gate.ts` + `.cursor/rules/algo-qa-intelligent.mdc` | Checklist continue, anti-fragmentation. |
| `docs/ALGO_COHERENCE_RITUAL.md` + `.cursor/rules/algo-coherence-review.mdc` | Audit cadré (périmètre + critère d’arrêt). |
| `config/algo-deploy-gate.ts` + workflows CI | Garde pré-prod / release. |
| `src/core/observability/` + routes observabilité (selon env) | Signaux runtime **structurés**, pas du jugement LLM. |
| `scripts/algo-autopilot.ts`, `npm run report:daily`, etc. | Analyse / rapports **hors requête utilisateur**. |
| `src/lib/autonomy/knowledge-memory.ts` + `/api/intelligence/memory` | Mémoire **métier** (résumés, bornes, persistance optionnelle) — **pas** dump brut de chaque Q&R dans le Core. |
| `src/lib/autonomy/learning-history.ts` + `/api/intelligence/learning-history` | Historique d’apprentissage / garde-fous côté intelligence. |
| `/control-room` (`AlgoControlRoomClient`) | Contrat **`docs/ALGO_CONTROL_ROOM.md`** · visualisation + probes légères + **schéma statique** (`AlgoControlRoomModuleGraph`) — **pas** de méta-LLM, pas de topologie serveur réelle, pas d’auto-patch. |
| `POST /api/algo` (`src/app/api/algo/route.ts`) → **`processAlgoAiRequest`** | **Seul** pont dashboard / outil vers le pipeline Q&R documenté — ne pas dupliquer via `pages/api/`. |
| Score viral **canonique** | `src/lib/ai/canonical-viral-score.ts` + modules intelligence / fusion — ne pas ajouter un score parallèle « maison » dans le Core. |

## Rituel d’évolution recommandé

1. Mesurer ou observer (logs, métriques, retours utilisateurs, échecs CI).
2. Découper un **petit** changement (une PR, un module).
3. Passer **verify:release** (+ rituel cohérence si surface sensible).
4. Merger / déployer · documenter dans `docs/ALGO_CHECKLIST_PROOFS.md` si la checklist produit l’exige.

## Si un jour tu veux du « scoring » qualité

- Reste **offline** : agrégats sur logs, couverture de tests, budgets perf (`npm run perf:budget`), pas un `qualityScore` LLM opaque sur le chemin critique.

## Voir aussi

- Playbook opérations & déploiement (point d’entrée unique) : `docs/ALGO_OPERATIONS_PLAYBOOK.md`
- Pont design évolutif (sans dupliquer la charte) : `docs/ALGO_DESIGN_EVOLUTION.md`
- Charte UX globale : `docs/ALGO_UX_CHARTER.md`
- Audit cognitif & parcours : `docs/ALGO_UX_COGNITIVE_AUDIT.md`
- Maturité release (qualitative) : `docs/ALGO_RELEASE_READINESS.md`
- Positionnement / GTM (brouillon, aligné doctrine) : `docs/ALGO_GTM_NOTES.md`
- Index navigation `docs/` : `docs/README.md`
- Control room (contrat dédié) : `docs/ALGO_CONTROL_ROOM.md`
- Doctrine : `docs/algo-doctrine.md`
- Preuves checklist : `docs/ALGO_CHECKLIST_PROOFS.md`
