# Checklist maître ALGO → preuves & chemins code

Document **vivant** : à mettre à jour quand une capacité change.  
**Doctrine** (règles) : `docs/algo-doctrine.md`.  
Légende : **OK** = présent et exploitable · **Partiel** = existe mais incomplet ou à valider · **Hors scope** = non prévu ou à traiter hors code.

| # | Thème | Statut réaliste | Où vérifier / preuve |
|---|--------|-----------------|----------------------|
| 1 | Cerveau & architecture | Partiel | **Entrée Q&R** : `src/core/brain.ts` (`centralAsk`). Prompts : `algo-persona.ts`, `algo-directive-synthesis.ts`, `algo-voice.ts`. Data : `AlgoOrchestrator.ts`, `AlgoCoherenceGuard.ts`. Routeur priorité multi-modules = roadmap. |
| 2 | Data & collecte | Partiel | Carte : `src/lib/data/data-reliability-map.ts` · API `GET /api/meta/data-reliability`. Autres : `src/app/api/live-*`, `real-data-service.ts`, `live-trends-query.ts`. |
| 3 | Analyse & viralité | Partiel | Scores / analyse : `src/lib/ai/algo-brain.ts`, `viral-analyzer`, intelligence globale. Qualité = fonction des données disponibles. |
| 4 | IA ALGO | OK (cadre) | `buildAlgoSystemPrompt`, routes `src/app/api/ai/*`, transparence : `src/lib/ai/ai-transparency.ts`, UI `/ai`. |
| 5 | IA stratégique (décision) | Partiel | Directive « décision » dans `algo-directive-synthesis.ts`, `TASK_ASK_OPEN` dans `algo-persona.ts`. Pas toutes les sorties JSON. |
| 6 | Viral Analyzer | Partiel | `src/app/viral-analyzer/`, `src/app/api/viral-analyzer/`. Vérifier plateformes supportées dans la route. |
| 7 | Couverture mondiale | Partiel | Scope / pays : `ScopeContext`, paramètres API `country` / `region`. Pas d’homogénéité « continent » sans sources. |
| 8–10 | UX / design / émotion | Partiel | Revue manuelle + tests utilisateurs. Perf : Lighthouse / Profiler (non automatisé ici). |
| 11 | Langage & écriture | OK (process) | `algo-voice.ts`, `ui-strings.ts`, `locales/tone-guide.md`, scan : `src/lib/copy/forbidden-ui-copy-scan.ts` + test associé. |
| 12 | Personnalité IA | OK (cadre) | Même pile que §4 + niveaux `expertiseLevel`. |
| 13 | Performance & technique | Partiel | `npm run verify:release` (ecosystem, i18n, lint, tests, build). Pas de garantie 60 FPS / zéro leak sans profilage. |
| 14 | Sécurité | Partiel | `src/lib/security/`, rate limits sur routes sensibles. Audit sécurité pro = hors ce document. |
| 15 | Auto-optimisation | Partiel | Crons, logs, self-healing résilience — pas de correction auto universelle. |
| 16 | Cohérence globale | Partiel | `docs/algo-doctrine.md` + ce fichier + `AGENTS.md` + revues copy/IA. |
| 17 | Monétisation | Hors scope | Non décrit comme modèle produit dans le dépôt (sauf évolution future). |
| 18 | SEO & visibilité | Partiel | `src/lib/seo/`, métadonnées par page — stratégie acquisition = produit / contenu. |
| 19 | E-commerce | Hors scope commerce | Signaux uniquement : `src/app/api/intelligence/products/`, UI intelligence « Radar produit » — pas de boutique. |
| 20 | Scalabilité & futur | Partiel | Architecture Next/API extensible ; mobile / partenaires = roadmap. |
| 21 | ZIP / extraction | Hors scope | Non mappé — ajouter une ligne si une pipeline ZIP existe. |
| 22 | Zéro hasard | Process | Objectif : `verify:release` + revues + ce tableau à jour — jamais « tout coches » sans preuves. |

## Commandes utiles

- Qualité release : `npm run verify:release`
- Tests unitaires : `npm run test:run`
- Écosystème : `npm run ecosystem:check`
- i18n : `npm run i18n:check`

## Mise à jour

Quand une ligne passe de **Partiel** à **OK**, indiquer le **fichier ou la PR** dans la colonne preuve (une courte note suffit).
