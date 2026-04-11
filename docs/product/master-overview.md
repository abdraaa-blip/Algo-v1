# ALGO — Master Product Overview

**Rôle** : synthèse **présentation / onboarding / pitch** (2 à 20 minutes), **alignée sur le code et la doc canoniques**.  
**Ce document ne remplace pas** : `docs/algo-doctrine.md` (règles), `docs/ALGO_CHECKLIST_PROOFS.md` (état / preuves ligne par ligne), ni `AGENTS.md` (pile technique détaillée). En cas de divergence, **doctrine + checklist + code** font foi.

---

## 1. Vision

ALGO est un **radar de signaux** sur le monde numérique : tendances, contenus, analyses et outils d’aide à la décision — avec une **IA** qui structure et explique, **sans** promesse de résultat magique.  
Vision système plus large (ton, limites, évolution) : **`docs/ALGO_MASTER_SYSTEM_DIRECTIVE.md`**.

---

## 2. Problem Statement

- Volume d’informations et de plateformes **difficile à prioriser**.
- Besoin de **lire des signaux** (croissance, viralité, contexte) plutôt que d’empiler des métriques opaques.
- Attente d’**explications traçables** : ce qui est pris en compte, ce qui ne l’est pas, et où sont les limites des données.

---

## 3. Solution

Une application **Next.js** (App Router sous `src/app/`) qui combine :

- **Données** agrégées / live selon les connecteurs réellement branchés ;
- **Scores et analyses** comme **indicateurs** (score viral canonique, intelligence, dashboards) ;
- **Q&R IA** avec façade système, transparence utilisateur et voix produit maîtrisée.

---

## 4. Product Description

- **Front** : React 19, Tailwind v4, tokens design (`src/design-system/tokens.ts`, `src/app/globals.css`), layout client (fond global, planète / arrière-plans selon règles design).
- **Back** : routes API sous `src/app/api/` (algo, intelligence, live, meta, billing optionnel Stripe, etc.).
- **Persistance / option cloud** : Supabase selon migrations et configuration ; écosystème vérifiable par scripts (`npm run ecosystem:check`).

---

## 5. Key Features (réellement présentes dans le dépôt)

| Zone | Exemples de surface ou API | Remarque réaliste |
|------|---------------------------|-------------------|
| Accueil & flux | `/`, tendances, contenus, vidéos, news, recherche | Qualité = **sources** + scope géo |
| IA Q&R | `/ai`, `POST /api/ai/ask` → `processAlgoAiRequest` → `centralAsk` | Cadre **OK** ; JSON décisionnel partiellement roadmap |
| Intelligence | `/intelligence`, routes `/api/intelligence/*`, learning, ops | Beaucoup de surfaces **partielles** selon checklist |
| Viral Analyzer | `/viral-analyzer` + API associée | **Partiel** (plateformes / jeux de données à valider) |
| Viral Control | `/intelligence/viral-control`, APIs dédiées, doc YouTube | **Partiel** (OAuth / WS / persistance longue = roadmap) |
| Control room | `/control-room` | Lecture d’état, **pas** « conscience » temps réel lourde (voir doc contrat) |
| Dashboard | `/dashboard` | Cockpit métriques + ponts IA documentés dans `AGENTS.md` |
| Créateur | `/creator-mode` | Signaux agrégés, insight via **`ui/InsightPanel`** + adaptateur `creator-insight-panel` |
| Design system lab | `/design-system` | Vitrine composants |
| Conformité / copy | `algo-voice`, `ui-strings`, scan interdits | Process **OK** côté discipline |

Liste exhaustive des **statuts** : **`docs/ALGO_CHECKLIST_PROOFS.md`**.

---

## 6. AI & System Architecture (high level)

| Couche | Rôle | Fichiers / entrées clés |
|--------|------|-------------------------|
| Brain | Exécution Q&R, registre modules | `src/core/brain.ts` |
| System | Façade HTTP, route léger, QC, confiance heuristique | `src/core/system.ts`, `router.ts`, `system-data.ts` |
| Prompts | Persona, directive maître, synthèse, voix | `algo-persona.ts`, `algo-directive-synthesis.ts`, `algo-voice.ts` |
| Transparence | Textes + contrats utilisateur | `src/lib/ai/ai-transparency.ts`, UI `/ai` |
| Data runtime | Orchestration fetch, cohérence | `AlgoOrchestrator`, `AlgoCoherenceGuard` |
| Observabilité | Métriques / logs côté core | `src/core/observability/` |
| Autonomie / mémoire (hors hot path) | Historique, apprentissage, APIs intelligence | `src/lib/autonomy/*`, routes documentées |

**Une seule** entrée Q&R documentée pour le flux principal algo (pas de second `pages/api` parallèle). Score viral : **`src/lib/ai/canonical-viral-score.ts`**.

---

## 7. User Experience

- **Charte** : `docs/ALGO_UX_CHARTER.md` — fond unique, motion maîtrisée, accessibilité, charge cognitive.
- **Audit par écran** : `docs/ALGO_UX_COGNITIVE_AUDIT.md`.
- **Règles UI** : `config/algo-system-rules.ts` + pont `docs/ALGO_DESIGN_EVOLUTION.md`.
- **Pas de** promesse « système conscient » ou polling IA lourd pour animer un décor : voir `docs/ALGO_OFFLINE_EVOLUTION.md` et `docs/ALGO_CONTROL_ROOM.md`.

---

## 8. Target Users (réaliste, non contractuel)

- **Créateurs / analystes** de signaux (mode créateur, viral analyzer, dashboards).
- **Curieux tech** explorant tendances, intelligence, control room.
- **Équipe produit / dev** utilisant docs + `verify:release` pour shipper sans dérive.

Positionnement marketing **brouillon** (non normatif code) : **`docs/ALGO_GTM_NOTES.md`**.

---

## 9. Value Proposition

- **Prioriser** et **lire** des tendances / contenus avec une couche d’analyse.
- **Transparence** sur ce que l’IA et les données font (et ne font pas).
- **Cadre de release** : `npm run verify:release` + gates — le produit peut évoluer sans se fragmenter (playbook ops, doctrine).

---

## 10. Differentiation

- **Radar & signaux** plutôt que « oracle » — aligné doctrine.
- **Preuves** : checklist maître avec chemins fichier ; pas de score unique « maturité LLM ».
- **Anti-dérive** : `docs/ALGO_OFFLINE_EVOLUTION.md`, `docs/ALGO_PRODUCTION_BOUNDARIES.md`, section **Blueprints externes** dans `docs/ALGO_OPERATIONS_PLAYBOOK.md` (évite les packs génériques contradictoires).

---

## 11. System Modules Overview

| Module | Doc ou code |
|--------|----------------|
| Doctrine & promesse | `docs/algo-doctrine.md` |
| Checklist état | `docs/ALGO_CHECKLIST_PROOFS.md` |
| Ops & déploiement | `docs/ALGO_OPERATIONS_PLAYBOOK.md` |
| Limites prod | `docs/ALGO_PRODUCTION_BOUNDARIES.md` |
| Data reliability | `src/lib/data/data-reliability-map.ts`, `GET /api/meta/data-reliability` |
| Sécurité (partielle) | `src/lib/security/`, rate limits sur routes sensibles |
| Billing (optionnel) | `AGENTS.md` section Stripe, migrations listées |

---

## 12. Current Status

Synthèse alignée sur la **légende** de la checklist : **OK (cadre)** vs **Partiel** vs **Hors scope**.

- **OK (cadre)** : IA ALGO (pipeline Q&R), personnalité / copy process, directive maître injectée, zéro hasard = process (`verify:release` + revues).
- **Partiel** (exemples) : cerveau & routeur multi-intents, data & collecte, analyse viralité, viral analyzer, couverture geo, UX/perf mesurée en profondeur, sécurité audit pro, scalabilité mobile, SEO acquisition, Viral Control avancé, etc. — **voir tableau ligne par ligne** dans `ALGO_CHECKLIST_PROOFS.md`.
- **Hors scope** déclaré : monétisation produit type boutique, e-commerce complet, ZIP pipeline (sauf ajout futur checklist).

**Qualité release** qualitative : `docs/ALGO_RELEASE_READINESS.md`. **TypeScript** : `next.config.ts` avec `ignoreBuildErrors: false`.

---

## 13. Roadmap (optional)

La roadmap **concrète** est portée par :

- les lignes **Partiel / roadmap** de `docs/ALGO_CHECKLIST_PROOFS.md` ;
- `docs/ALGO_OFFLINE_EVOLUTION.md` (anti-patterns, évolution hors hot path) ;
- `docs/algo-doctrine.md` § hors scope (ex. meta-fusion modules).

Pas de dates engagées dans ce document : elles dépendent des priorités produit.

---

## 14. Conclusion

ALGO est un **produit logiciel vivant** avec une **architecture Next + IA + data** exigeante sur la **cohérence** et la **transparence**. Ce *master overview* sert de **porte d’entrée narrative** ; pour implémenter ou auditer une capacité, repartir toujours de la **checklist preuves**, de la **doctrine**, et du **code**.

**Mise à jour** : réviser ce fichier après **évolution majeure** visible utilisateur (nouvelle zone produit, changement de promesse, gros module IA) — et tenir **`ALGO_CHECKLIST_PROOFS.md`** synchronisé.

---

## Voir aussi

- `docs/README.md` — index navigation
- `AGENTS.md` — pile agent / technique
- `config/algo-qa-gate.ts` — commandes release
- `docs/ALGO_OPERATIONS_PLAYBOOK.md` — arbitrage & blueprints externes
