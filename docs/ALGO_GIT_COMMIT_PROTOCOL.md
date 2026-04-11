# Protocole Git · validation avant commit (ALGO)

**Objectif** : chaque changement est analysé avant d’être versionné, aligné sur la CI (`npm run verify:release`), et ne part pas sur GitHub dans un état incohérent ou cassant.

**Rôle** : cadrage pour humains et agents (Cursor). Les **hooks Husky** et la **CI** restent la preuve mécanique ; ce document définit le **jugement** (SAFE / RISKY / CRITICAL) et le **flux** associé.

---

## 1. Analyse obligatoire avant commit (agent ou humain)

Sur le **diff réel** (fichiers modifiés / stagés) :

1. **Périmètre** : quels modules, routes, composants, prompts, migrations ?
2. **Impacts** : architecture, chemins IA (`src/core/`, `src/lib/ai/`), UI/UX, perfs (bundles, requêtes), sécurité (secrets, surface API, auth).
3. **Risques** : conflit avec doctrine (`docs/algo-doctrine.md`), duplication de logique, régression évidente sur un flux critique (auth, billing, cron, Ask).
4. **Refactor** : nécessaire ou hors-sujet ? Préférer le **diff minimal** utile.
5. **Tests / corrections** : ajuster ou ajouter des tests ciblés si le comportement public change ; lancer au minimum ce que les hooks ne couvrent pas entièrement.

**Gate technique complète avant merge / release** : `npm run verify:release` (voir `AGENTS.md`, `package.json`, `.github/workflows/ci.yml`).

---

## 2. Classification (SAFE · RISKY · CRITICAL)

| Niveau | Définition | Action |
|--------|------------|--------|
| **SAFE** | Typo doc, commentaire, correction locale sans impact runtime ; ou changement couvert par tests + lint + build déjà verts ; pas de secret, pas de surface API élargie. | Commit autorisé après **hooks** (pre-commit / pre-push si push). |
| **RISKY** | Nouvelle route API, changement de contrat client/serveur, migration SQL, logique IA / scoring, gros refactor partiel, dépendance majeure — ou doute sur un edge case. | Corriger ou réduire le périmètre **avant** commit ; puis **`npm run verify:release`** (ou au minimum `typecheck` + `lint:strict` + tests ciblés) ; ensuite commit + push. |
| **CRITICAL** | Build cassé, tests rouges, fuite de secret, contournement de garde API, désactivation de checks TS/ESLint, incohérence volontaire avec la doctrine produit. | **Ne pas commit** ; plan de correction priorisé ; pas de push pour « débloquer vite ». |

Les hooks **`.husky/pre-commit`** (TS + ESLint sur fichiers stagés + autopilot quick) et **`.husky/pre-push`** (typecheck + `lint:strict`) filtrent une grande partie des erreurs **mécaniques** ; ils ne remplacent pas le jugement **RISKY** (revue d’impact, `verify:release`).

---

## 3. Processus Git (quand le niveau est connu)

**SAFE** (après hooks OK) :

```bash
git add -A   # ou chemins précis
git status
git commit -m "type(scope): description courte"
git push origin main   # ou la branche de travail
```

**RISKY** (après corrections + `npm run verify:release` ou équivalent convenu) :

```bash
git add …
npm run verify:release
git commit -m "…"
git push origin <branche>
```

**CRITICAL** : pas de `git commit` tant que les points bloquants ne sont pas résolus ; documenter le plan (tickets, commentaires de PR).

---

## 4. Maintenance après modification importante

- Cohérence globale : croiser `docs/ALGO_CHECKLIST_PROOFS.md`, `config/algo-system-rules.ts` si UI.
- Duplication : éviter un second chemin pour la même capacité (ex. score viral, Ask) — voir `docs/ALGO_OFFLINE_EVOLUTION.md`.
- Vercel / build : `next build` est dans `verify:release` ; vérifier variables d’environnement si nouveau besoin runtime (`docs/VERCEL_SUPABASE_PRODUCTION.md`, `.env.example`).
- Documentation : mettre à jour **un** doc canonique touché (checklist, intégration, playbook) plutôt que multiplier les fichiers parallèles ; indexer dans `docs/README.md` si nouveau doc majeur.

---

## 5. Règles absolues

- Ne pas pousser du code **volontairement** cassant ou contournant les garde-fous.
- Ne pas ignorer un **conflit logique** ou une régression identifiée.
- Ne pas réduire la qualité pour gagner du temps sur un commit : préférer un **commit plus tard** et un état **stable**.

---

## 6. Liens utiles

- `AGENTS.md` — QA gate, hooks, IA, copy.
- `docs/README.md` — index documentation.
- `docs/ALGO_OPERATIONS_PLAYBOOK.md` — déploiement, smoke, arbitrage.
- `config/algo-qa-gate.ts` — checklist exécutable et philosophie QA.
