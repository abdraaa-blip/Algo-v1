# ALGO — notes go-to-market & positionnement (brouillon)

**Statut** : matière **produit / marketing** pour cadrer discours, phases et risques.  
**Ne remplace pas** : `docs/algo-doctrine.md`, `docs/ALGO_CHECKLIST_PROOFS.md`, la pile IA (`src/core/brain.ts`, `src/core/system.ts`, `algo-persona`, `algo-directive-synthesis`), la structure **`src/`** (App Router), ni les garde-fous **`config/algo-qa-gate.ts`**, **`config/algo-deploy-gate.ts`**, **`docs/ALGO_RELEASE_READINESS.md`**.

Tout message public doit rester **aligné** avec la doctrine (radar de signaux, **pas** de garantie de résultat, transparence) et la **voix** (`src/lib/copy/algo-voice.ts`, `ui-strings.ts`). Voir aussi **`docs/ALGO_UX_CHARTER.md`** (calme, clarté, pas spectacle).

---

## 1. Positionnement (aligné doctrine)

- **ALGO** : outil de **lecture et d’orientation** sur signaux du monde numérique (données, tendances, analyses), avec **IA** et **visualisations** quand elles sont branchées.
- **À éviter en communication** : « comprendre Internet », « avant tout le monde », « ce que X ne montre pas », promesses **non vérifiables** — elles contredisent la promesse produit §1 de la doctrine et fragilisent la confiance.
- **Formulations possibles** (à valider légal / produit) : cockpit / radar pour **suivre des signaux**, **prioriser**, **gagner du temps** — avec **limites** des sources affichées (carte fiabilité, transparence).

---

## 2. Utilisateurs cibles (priorisation indicative)

| Priorité | Profils |
|----------|-----------|
| 1 | Créateurs de contenu, growth, analystes data, entrepreneurs |
| 2 | Développeurs, designers tech, chercheurs / curieux IA |
| 3 | Grand public tech curieux |

Adapter le **niveau de détail** UI et copy selon le profil (voir **`docs/ALGO_UX_COGNITIVE_AUDIT.md`** — écrans d’entrée vs outils).

---

## 3. Proposition de valeur (simple)

- Aider à **voir** des signaux pertinents, **contextualiser** et **agir** plus vite — sans se présenter comme « vérité unique » du web.
- Différenciation **réaliste** : orchestration des **données disponibles** dans ALGO + transparence + UX maîtrisée — pas un second moteur de recherche générique.

---

## 4. Phases d’adoption (produit / ops)

1. **Accès restreint / early** — stabilité, feedback ciblé, UX prioritaire (`verify:release`, smoke playbook).
2. **Béta élargie** — collecte retours, monitoring, itérations **par PR** (pas de « kit final » figé).
3. **Ouverture** — scale infra / coûts / support selon **preuves** (`ALGO_CHECKLIST_PROOFS`, budgets perf).

Chaque phase doit rester **cohérente** avec `docs/ALGO_OFFLINE_EVOLUTION.md` (pas d’auto-patch runtime, pas de promesses techniques non prouvées).

---

## 5. Lancement & acquisition (cadre)

- **Teasing / démo** : montrer des **parcours réels** (control room, dashboard, tendances) — curiosité par la **clarté** et la **donnée**, pas uniquement par l’effet « choc ».
- **Communauté** : boucle feedback structurée (canal dédié, tickets, sessions) — alignée rituel cohérence / critère d’arrêt (`docs/ALGO_COHERENCE_RITUAL.md`).
- **Contenu** : formats éducatifs (« comment lire ce signal », limites des sources) — renforce la **doctrine** plutôt que le hype.

---

## 6. Monétisation

- **Source de vérité technique** : ce qui est **implémenté** (ex. Stripe, plans, flags dans `AGENTS.md` / `src/lib/billing/` / `.env.example`) — ne pas figer ici des **paliers** FREE / PRO / TEAM si le code diverge.
- Toute offre payante doit être **décrite honnêtement** (périmètre, limites, données utilisées).

---

## 7. Rétention & « système vivant »

Leviers **sains** : données **réellement** mises à jour, insights **traçables**, alertes **actionnables**, pas de boucles décoratives ou de re-fetch sans valeur (voir anti-patterns offline evolution).

---

## 8. Risques à piloter

| Risque | Levier documenté / technique |
|--------|------------------------------|
| Coût IA / quotas | Politique prompts, caches, routes ; monitoring |
| Surcharge UX | `docs/ALGO_UX_CHARTER.md`, `docs/ALGO_UX_COGNITIVE_AUDIT.md` |
| Surcharge système | Perf budget, deploy gate, observabilité (`AGENTS.md`) |
| Dérive marketing vs produit | Relecture **doctrine** + **algo-voice** avant publication |

---

## 9. Ce que ce document **interdit** aux agents

- Réécrire **architecture** (`/brain` à la racine, `/core` parallèle à `src/`, etc.) à partir de brouillons externes.
- Introduire des **prompts canon** en dehors de la chaîne `persona` / `directive-synthesis` / `brain` / `system`.
- Valider un **go-live** sans **CI** + **`docs/ALGO_RELEASE_READINESS.md`** + **`algo-deploy-gate`**.

---

## Liens

| Sujet | Fichier |
|--------|---------|
| Doctrine & promesse | `docs/algo-doctrine.md` |
| Évolution sûre, anti-patterns | `docs/ALGO_OFFLINE_EVOLUTION.md` |
| Playbook déploiement | `docs/ALGO_OPERATIONS_PLAYBOOK.md` |
| Maturité release | `docs/ALGO_RELEASE_READINESS.md` |
| Voix & copy | `src/lib/copy/algo-voice.ts`, `locales/tone-guide.md` |
| Index navigation `docs/` | **`docs/README.md`** |
