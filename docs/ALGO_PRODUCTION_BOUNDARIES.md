# ALGO — limites prod (anti-sketch, anti-double vérité)

**Rôle** : répondre en **une lecture courte** aux « plans phase finale / production ready » (souvent générés hors dépôt) qui proposent RAM + `any`, second score viral, `pages/api`, ou mémoire sur le hot path.

**Ce document ne remplace pas** la doctrine ni le détail des anti-patterns : il **oriente** vers les sources canoniques.

## Ce qu’on garde comme règles d’or

| Sujet | Faire | Ne pas faire |
|--------|--------|----------------|
| Entrée Q&R / Algo | **`src/app/api/algo/route.ts`** → `processAlgoAiRequest` / `centralAsk` | Second handler **`pages/api`**, second `processRequest` parallèle |
| Score viral | **`src/lib/ai/canonical-viral-score.ts`** (et chaîne associée) | `computeViralScore` ad hoc dans `core/` ou l’API « pour simplifier » |
| Mémoire | Structurée, bornée, **hors** réponse synchrone par défaut — voir chemins dans **`docs/ALGO_OFFLINE_EVOLUTION.md`** | Tableau global RAM + `saveMemory` à chaque requête |
| Évolution | **PR + CI** (`npm run verify:release`), scripts, observabilité | Auto-patch runtime, boucle « conscience » non bornée |

## Fond global & pages d’erreur

- **Fond de vérité** : `html` / `body` + tokens dans **`src/app/globals.css`** ; couches animées dans **`ClientLayout`** (`AlgoLivingBackground`, `AlgoDataPlanet`) — pas un second « fond page » en dur sans raison.
- **Erreurs segment** : utiliser **`bg-[var(--color-bg-primary)]`** et **`min-h-dvh`** pour rester aligné sur le body (évite décalage de teinte / « trou » visuel). Ne pas réintroduire des hex `#0a0a0f` / `#0a0a12` en parallèle des tokens.

## Sources à lire avant d’implémenter un « simplifié »

1. **`docs/ALGO_OFFLINE_EVOLUTION.md`** — tableau des anti-patterns (dont checklists « phase finale » packagées).
2. **`docs/algo-doctrine.md`** — règles non négociables.
3. **`docs/ALGO_OPERATIONS_PLAYBOOK.md`** — point d’entrée unique ops / déploiement (y compris **Blueprints externes** si un pack « prod » générique diverge du dépôt).
4. **`AGENTS.md`** — pile réelle (`brain`, `system`, mémoire autonomy, control room).

## Gate avant merge

`npm run verify:release` (voir `package.json`) : **typecheck**, **lint:strict**, tests, build — pas de « vert » sans cette barre.

**Caches de build locaux** (stale Next / Turbopack) : `npm run clean:dry` puis `npm run clean` — `scripts/clear-cache.js` uniquement (`.next`, caches outils) ; **pas** de « garbage collector » sur le code source ni les données (voir section *Arbitrage* dans `docs/ALGO_OPERATIONS_PLAYBOOK.md`).
