# Checklist maître ALGO → preuves & chemins code

Document **vivant** : à mettre à jour quand une capacité change.  
**Doctrine** (règles) : `docs/algo-doctrine.md`.  
**Vision globale anti-dérive** (cohérence IA · data · UX) : `docs/ALGO_MASTER_SYSTEM_DIRECTIVE.md`.  
Légende : **OK** = présent et exploitable · **Partiel** = existe mais incomplet ou à valider · **Hors scope** = non prévu ou à traiter hors code.

| # | Thème | Statut réaliste | Où vérifier / preuve |
|---|--------|-----------------|----------------------|
| 1 | Cerveau & architecture | Partiel | **HTTP Q&R** : `POST /api/ai/ask` → `processAlgoAiRequest` (`src/core/system.ts`) · route `router.ts` · indices `system-data.ts` · puis `centralAsk` (`brain.ts`). Prompts : `algo-persona.ts`, `algo-directive-synthesis.ts`, `algo-voice.ts`. Data : `AlgoOrchestrator.ts`, `AlgoCoherenceGuard.ts`. Routeur multi-intents / agents = roadmap. |
| 2 | Data & collecte | Partiel | Carte : `src/lib/data/data-reliability-map.ts` · API `GET /api/meta/data-reliability`. Autres : `src/app/api/live-*`, `real-data-service.ts`, `live-trends-query.ts`. |
| 3 | Analyse & viralité | Partiel | Scores / analyse : `src/lib/ai/algo-brain.ts`, `viral-analyzer`, intelligence globale. Qualité = fonction des données disponibles. |
| 4 | IA ALGO | OK (cadre) | `buildAlgoSystemPrompt`, routes `src/app/api/ai/*`, façade système `processAlgoAiRequest` + QC + `systemRoute` / `systemConfidence`, transparence : `src/lib/ai/ai-transparency.ts`, UI `/ai`, doc `docs/API_AI_ASK.md`. |
| 5 | IA stratégique (décision) | Partiel | Directive « décision » dans `algo-directive-synthesis.ts`, `TASK_ASK_OPEN` dans `algo-persona.ts`. Pas toutes les sorties JSON. |
| 6 | Viral Analyzer | Partiel | `src/app/viral-analyzer/`, `src/app/api/viral-analyzer/`. Vérifier plateformes supportées dans la route. |
| 7 | Couverture mondiale | Partiel | Scope / pays : `ScopeContext`, paramètres API `country` / `region`. Pas d’homogénéité « continent » sans sources. |
| 8–10 | UX / design / émotion | Partiel | Règles persistantes : `config/algo-system-rules.ts` · charte UX **`docs/ALGO_UX_CHARTER.md`** · audit cognitif **`docs/ALGO_UX_COGNITIVE_AUDIT.md`** · tokens `src/design-system/tokens.ts` · `@theme` `src/app/globals.css` · règle Cursor `.cursor/rules/algo-design-system.mdc`. Revue manuelle + tests utilisateurs. Perf : Lighthouse / Profiler (non automatisé ici). |
| 11 | Langage & écriture | OK (process) | `algo-voice.ts`, `ui-strings.ts`, `locales/tone-guide.md`, scan : `src/lib/copy/forbidden-ui-copy-scan.ts` + test associé. |
| 12 | Personnalité IA | OK (cadre) | Même pile que §4 + niveaux `expertiseLevel`. |
| 13 | Performance & technique | Partiel | CI `verify:release` (voir `.github/workflows/ci.yml`) · `typecheck` + `verify:full` + `perf:budget` sur release gate PR · garde doc `config/algo-deploy-gate.ts` · rubrique **`docs/ALGO_RELEASE_READINESS.md`**. **`next.config.ts`** : `typescript.ignoreBuildErrors: false` — build + gate reflètent les erreurs TS. Pas de garantie 60 FPS / zéro leak sans profilage. |
| 14 | Sécurité | Partiel | `src/lib/security/`, `src/lib/api/rate-limiter.ts` — limites sur routes sensibles (`api/ai/*`, **`api/intelligence/*`** couverture large : `global`, `predictive`, `memory`, `health`, `products`, `learning-history`, `execute`, `simulate`, `learn`, `feedback`, `core`, `viral-control`, `radar-history`, `viral-fusion`, `autonomy`, `decision-log`, `ops-alerts`, `ops-incidents`, `ops-runbook`). **`GET /api/intelligence/ops-runbook`** exige la même auth que `POST` (token ops ou `Authorization: Bearer CRON_SECRET`) — plus de snapshot interne sans auth. Autres limites : `GET/POST` **`/api/analytics/events`** (GET 300/min pour chaîne interne), **`/api/live`**, **`/api/context`**, **`/api/model/weights`**, **`POST /api/viral-analyzer`**, **`/api/status`** (24/min · **plus de `keyPreview` de clés**), **`/api/health`**, **`/api/v1/*`**, agrégats **`live-*`**, **`news`**, **`trends`**, **`youtube`**, **`tmdb`**, **`movies`**, **`videos`**, **`viral-content`**, **`realtime/trends`**, **`rising-stars`**, **`content`**, **`feed/rss`**, **`comments`**, **`reports`**, **`billing/status`**, **`observability/logs`** (si dashboard activé). Exclus : **`billing/webhook`**, **`api/cron/*`** (Bearer `CRON_SECRET`), **`log-error`** (limite `lib/security`). **`/api/monitoring/events`** : runtime **Node** + rate limit (plus Edge seul). En-têtes `X-RateLimit-Limit` alignés sur le plafond effectif (`rate-limiter`). Audit sécurité pro = hors ce document. |
| 15 | Auto-optimisation | Partiel | Crons, logs, self-healing résilience · pas de correction auto universelle. |
| 16 | Cohérence globale | Partiel | `docs/algo-doctrine.md` + ce fichier + `AGENTS.md` + directive maître (entrée n°24) + revues copy/IA. **Composants** (2026-04) : `ViralScoreRing` — source unique `ui/` + réexport `algo/` ; `LiveCurve` — wrapper `algo/` → `ui/` ; doublon `GeolocationPrompt` supprimé ; **`InsightPanel`** — source unique `ui/` + adaptateur **`src/lib/creator-mode/creator-insight-panel.ts`** pour `/creator-mode`. **`ScopeSelector`** : prod = `layout/ScopeSelector.tsx` uniquement (variante `ui/` retirée) — **`docs/ALGO_DESIGN_EVOLUTION.md`**. |
| 17 | Monétisation | Hors scope | Non décrit comme modèle produit dans le dépôt (sauf évolution future). |
| 18 | SEO & visibilité | Partiel | `src/lib/seo/`, métadonnées par page · stratégie acquisition = produit / contenu. |
| 19 | E-commerce | Hors scope commerce | Signaux uniquement : `src/app/api/intelligence/products/`, UI intelligence « Radar produit » · pas de boutique. |
| 20 | Scalabilité & futur | Partiel | Architecture Next/API extensible ; mobile / partenaires = roadmap. |
| 21 | ZIP / extraction | Hors scope | Non mappé · ajouter une ligne si une pipeline ZIP existe. |
| 22 | Zéro hasard | Process | Objectif : `verify:release` + revues + ce tableau à jour · jamais « tout coches » sans preuves. Checklist QA agents : `config/algo-qa-gate.ts` · règle Cursor `.cursor/rules/algo-qa-intelligent.mdc`. |
| 23 | Viral Control Center | Partiel | UI `/intelligence/viral-control` · API `GET /api/intelligence/viral-control` (+ `videoUrl` YouTube) · `GET /api/social/youtube/video-metrics` · logique `viral-control-cockpit.ts` + `viral-control-youtube.ts` · cache serveur (bundle 15 s, Google 90 s) · courbe vues = observations ALGO · doc `docs/integrations/YOUTUBE_VIRAL_CONTROL.md`. OAuth / WS / persistance longue = roadmap. |
| 24 | Directive maître (vision système) | OK (cadre) | Doc `docs/ALGO_MASTER_SYSTEM_DIRECTIVE.md` · couche `ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER` · ordre dans `buildAlgoSystemPrompt` (avant Core Intelligence) · registre `BRAIN_MODULE_REGISTRY.masterDirectiveDoc` · tests `src/lib/__tests__/algo-directive-persona.test.ts` · export EN `docs/prompts/ALGO_MASTER_SYSTEM_DIRECTIVE_EXPORT_EN.md`. |

## Commandes utiles

- Qualité release : `npm run verify:release` (inclut `lint:strict`, garde **`npm run verify:api-guards`** — chaque `src/app/api/.../route.ts` hors cron/webhook Stripe doit référencer le rate limiting)
- TypeScript : `npm run typecheck` (inclus dans `verify:release` ; `next.config.ts` : `ignoreBuildErrors: false`)
- Tests unitaires : `npm run test:run`
- Écosystème : `npm run ecosystem:check`
- i18n : `npm run i18n:check`

## Mise à jour

Quand une ligne passe de **Partiel** à **OK**, indiquer le **fichier ou la PR** dans la colonne preuve (une courte note suffit).
