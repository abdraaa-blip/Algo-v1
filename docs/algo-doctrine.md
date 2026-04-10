# Doctrine ALGO (document unique de cohérence)

Ce fichier complète `docs/ALGO_CHECKLIST_PROOFS.md` (état / preuves) en posant **les règles** qui ne doivent pas être négociées sans décision explicite.

## 1. Promesse produit

- ALGO est un **radar de signaux** (tendances, contenus, outils d’analyse), pas une boule de cristal.
- Les **scores** et sorties IA sont des **indicateurs** : jamais présentés comme garantie de résultat.
- **Transparence** : l’utilisateur doit pouvoir comprendre **ce qui a été pris en compte** (voir `ai-transparency`, UI `/ai`).

## 2. Voix & langage

- Source code : `src/lib/copy/algo-voice.ts`, `src/lib/copy/ui-strings.ts`, guide humain `locales/tone-guide.md`.
- **Tutoiement** (FR), métaphore **radar / signaux**, pas d’« Oops », pas de promesses magiques.
- Garde-fou automatisé : `src/lib/copy/forbidden-ui-copy-scan.ts`.

## 3. IA

- Assemblage des prompts : `algo-persona.ts` + `algo-directive-synthesis.ts` + couche voix.
- **Décision** : consignes pour options + recommandation surtout en **prose ouverte** ; les schémas JSON restent contraints par leur schéma.
- **Q&R** : pipeline **data → modèle** via `src/core/brain.ts` → `orchestrateAskAlgo`.

## 4. Data & fiabilité

- Carte des limites / fallbacks documentée : `src/lib/data/data-reliability-map.ts`.
- Exposition lecture seule : `GET /api/meta/data-reliability`.
- Couverture **pays** = fonction des **sources réellement branchées**, pas d’homogénéité marketing implicite.

## 5. Architecture « cerveau »

- **Central Brain (code)** : `src/core/brain.ts` — point d’entrée **nommé** ; extension future (priorités, dispatch) sans supprimer les modules existants.
- **Orchestrateur data** : `AlgoOrchestrator` + `AlgoCoherenceGuard` — cycle de vie des fetchs, pas le même rôle que le routeur IA.

## 6. Hors scope actuel (sauf décision produit)

- Boutique / paiements.
- Meta-orchestrateur qui **fusionne** toutes les sorties modules avec résolution de conflits (non implémenté ; roadmap).
- « Zéro hasard » sur un système vivant : viser **hasard contrôlé** (tests, monitoring, revues).

## 7. Revue

Toute évolution qui touche **promesse utilisateur**, **voix**, ou **limites data** doit :

1. Mettre à jour ce fichier ou `ALGO_CHECKLIST_PROOFS.md` si le comportement change.
2. Passer `npm run verify:release` avant merge principal.
