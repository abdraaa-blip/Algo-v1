# Doctrine ALGO (document unique de cohérence)

Ce fichier complète `docs/ALGO_CHECKLIST_PROOFS.md` (état / preuves) en posant **les règles** qui ne doivent pas être négociées sans décision explicite.

Checklist QA agents (auto-audit avant validation) : `config/algo-qa-gate.ts`. Garde déploiement (CI/CD) : `config/algo-deploy-gate.ts`. Rubrique maturité release (qualitative, sans score unique) : **`docs/ALGO_RELEASE_READINESS.md`**. Notes GTM / positionnement (brouillon, sous doctrine) : **`docs/ALGO_GTM_NOTES.md`**. Index navigation `docs/` : **`docs/README.md`**.

## 1. Promesse produit

- ALGO est un **radar de signaux** (tendances, contenus, outils d’analyse), pas une boule de cristal.
- Les **scores** et sorties IA sont des **indicateurs** : jamais présentés comme garantie de résultat.
- **Transparence** : l’utilisateur doit pouvoir comprendre **ce qui a été pris en compte** (voir `ai-transparency`, UI `/ai`).

## 2. Voix & langage

- Design / UI transverse : `config/algo-system-rules.ts` (règles persistantes + lien vers `tokens` / `globals.css`) · cadrage expérience (fond, motion, accessibilité, charge cognitive) : **`docs/ALGO_UX_CHARTER.md`** (complète les règles TS, pas une charte parallèle isolée) · protocole revue par écran : **`docs/ALGO_UX_COGNITIVE_AUDIT.md`**.
- Source code : `src/lib/copy/algo-voice.ts`, `src/lib/copy/ui-strings.ts`, guide humain `locales/tone-guide.md`.
- **Tutoiement** (FR), métaphore **radar / signaux**, pas d’« Oops », pas de promesses magiques.
- Garde-fou automatisé : `src/lib/copy/forbidden-ui-copy-scan.ts`.

## 3. IA

- **Directive maître (vision système)** : `docs/ALGO_MASTER_SYSTEM_DIRECTIVE.md` · export anglais `docs/prompts/ALGO_MASTER_SYSTEM_DIRECTIVE_EXPORT_EN.md` · couche `ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER` dans `algo-directive-synthesis.ts` (injectée avant Core Intelligence dans `buildAlgoSystemPrompt`).
- Assemblage des prompts : `algo-persona.ts` + `algo-directive-synthesis.ts` + couche voix.
- **Décision** : consignes pour options + recommandation surtout en **prose ouverte** ; les schémas JSON restent contraints par leur schéma.
- **Q&R** : façade HTTP **`processAlgoAiRequest`** (`src/core/system.ts`) · exécution **`centralAsk`** → `orchestrateAskAlgo` → `askAlgo` · pas de second point d’appel LLM parallèle.

## 4. Data & fiabilité

- Carte des limites / fallbacks documentée : `src/lib/data/data-reliability-map.ts`.
- Exposition lecture seule : `GET /api/meta/data-reliability`.
- Couverture **pays** = fonction des **sources réellement branchées**, pas d’homogénéité marketing implicite.

## 5. Architecture « cerveau »

- **Central Brain (code)** : `src/core/brain.ts` · point d’entrée **nommé** pour l’exécution Q&R (`centralAsk`).
- **Couche système (orchestration produit)** : `src/core/system.ts` · route léger (`router.ts`), indices (`system-data.ts`), enveloppe **comprehension / reponse / action**, QC, confiance heuristique ; **ne remplace pas** le brain sur le plan data/modèle.
- **Orchestrateur data** : `AlgoOrchestrator` + `AlgoCoherenceGuard` · cycle de vie des fetchs, pas le même rôle que le routeur heuristique Q&R.

## 6. Hors scope actuel (sauf décision produit)

- Boutique / paiements.
- Meta-orchestrateur qui **fusionne** toutes les sorties modules avec résolution de conflits (non implémenté ; roadmap).
- « Zéro hasard » sur un système vivant : viser **hasard contrôlé** (tests, monitoring, revues).

## 7. Revue

Toute évolution qui touche **promesse utilisateur**, **voix**, ou **limites data** doit :

1. Mettre à jour ce fichier ou `ALGO_CHECKLIST_PROOFS.md` si le comportement change.
2. Passer `npm run verify:release` avant merge principal.
