# Control room ALGO — contrat produit & technique

Route : **`/control-room`**. Composant principal : `src/components/control-room/AlgoControlRoomClient.tsx`.

## Rôle (deux mondes)

| Monde | Rôle |
|--------|------|
| **Parcours classique** (home, dashboard, tendances, Q&R) | Rapide, orienté tâche, peu de métaphore système. |
| **Control room** | **Lecture** d’état et **schéma** pour power users / équipe : perception, pas « pensée du modèle ». |

Ne pas fusionner les deux : pas de graphe lourd ni de jargon « cognitif » sur les pages grand public sans besoin explicite.

## Ce que la page **fait** (V1 actuelle)

- **Barre d’état** : mode, intensité, flux — dérivés d’une **probe légère** `GET /api/v1/health` (intervalle long, pas d’IA lourde).
- **Cerveau visuel** : panneau `AlgoControlRoomBrainCore` (contours wireframe illustratifs + `AlgoControlRoomBrain` + exploration liée aux modules via `CONTROL_ROOM_MODULE_ROUTES`), `prefers-reduced-motion` respecté.
- **Schéma modules** : graphe **statique** (`AlgoControlRoomModuleGraph`) — décor, pas topologie runtime.
- **Navigation rapide** : liens vers les zones utiles du site (pas une mini-carte exhaustive obligatoire).

## Ce que la page **ne fait pas** (garde-fous)

- **Pas** de `POST /api/algo` ni d’autre route IA en **boucle** pour animer l’UI.
- **Pas** de « mémoire visuelle » à partir d’**extraits de prompts** utilisateur sans cadre légal / produit.
- **Pas** de module dans `src/core/` du type `evolutionLayer` / `consciousness` branché sur cette UI.
- **Pas** de second score viral : les scores produit passent par les libs **canoniques** (`src/lib/ai/canonical-viral-score.ts`, intelligence, etc.) — pas un `computeViralScore` parallèle ici.
- **Pas** de route parallèle type `/control-room/ops` avec **polling court** et flux « IRM live » lourds : même famille de risque (charge, fuite données, promesse de diagnostic auto) — les blueprints externes se mappent sur ce contrat via **`docs/ALGO_OPERATIONS_PLAYBOOK.md`** (§ **Blueprints externes**).

Détail des anti-patterns : **`docs/ALGO_OFFLINE_EVOLUTION.md`**.

## Évolution (V2+)

- Enrichir **lecture** (métriques déjà exposées ailleurs, agrégats consentis) avant d’ajouter **WebGL** (poids bundle, perf, accessibilité).
- Toute suggestion « intelligente » vers l’utilisateur : **non intrusive**, opt-in ou texte discret — pas de réorganisation auto du layout sans validation humaine.

## Accessibilité

- Conserver des **landmarks** (`main`, `nav`, titres de section).
- Panneau modules : `<nav aria-labelledby="cr-module-explorer-label">` + **focus visible** sur les cartes lien (`AlgoControlRoomBrainCore`).
- Ne pas lier l’information critique à la **seule** animation (couleur + texte ou valeurs numériques lisibles).

## Voir aussi

- `docs/ALGO_OFFLINE_EVOLUTION.md`
- `docs/ALGO_OPERATIONS_PLAYBOOK.md` (déploiement, garde-fous, **Blueprints externes**)
- `docs/ALGO_DESIGN_EVOLUTION.md` (pont design / évolution UI)
- `docs/ALGO_UX_CHARTER.md` (expérience globale, motion, accessibilité)
- `docs/ALGO_UX_COGNITIVE_AUDIT.md` (audit par écran, intention, fatigue)
- `docs/ALGO_RELEASE_READINESS.md` (maturité release qualitative)
- `docs/ALGO_GTM_NOTES.md` (positionnement / GTM brouillon)
- `docs/README.md` (index navigation `docs/`)
- `AGENTS.md` (section control room / cockpit)
- `config/algo-qa-gate.ts` (`ALGO_QA_SOURCES.controlRoom`)
