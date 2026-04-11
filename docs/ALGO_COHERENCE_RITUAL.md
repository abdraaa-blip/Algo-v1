# Rituel cohérence ALGO

Guide **humain + agents** pour audits ciblés, validation avant mise en prod sensible, ou nettoyage progressif.  
Complète le portail QA (`config/algo-qa-gate.ts`, `npm run verify:release`) sans le remplacer.

## Quand l’utiliser

- Avant une release majeure ou une surface utilisateur sensible (auth, paiement, IA, données personnelles).
- Après une grosse PR : relecture « sens produit » + doublons.
- Quand tu sens de la **dérive** (copy, patterns UI, routes qui se chevauchent).

## Avant de commencer

1. **Périmètre** : quels dossiers / features / tickets ?
2. **Critère d’arrêt** : ex. « 5 correctifs max » ou « 1 journée max ».
3. **Non-objectifs** : ce qui ne doit **pas** être modifié dans ce passage.

## Checklist courte

| Question | Références |
|----------|------------|
| Valeur utilisateur réelle ? | Doctrine `docs/algo-doctrine.md` · positionnement brouillon `docs/ALGO_GTM_NOTES.md` (ne contredit pas la doctrine) |
| Preuves / état produit à jour ? | `docs/ALGO_CHECKLIST_PROOFS.md` |
| Voix & interdits copy ? | `src/lib/copy/algo-voice.ts`, scan `forbidden-ui-copy-scan` |
| Design cohérent ? | `config/algo-system-rules.ts`, `docs/ALGO_UX_CHARTER.md` |
| Parcours / charge cognitive ? | `docs/ALGO_UX_COGNITIVE_AUDIT.md` |
| Pas de double source de vérité ? | `AGENTS.md`, routes `src/app/api/` |
| Gate technique OK ? | `npm run verify:release` |
| Build Next « bizarre » / cache stale ? | `npm run clean:dry` puis `npm run clean` (`scripts/clear-cache.js`) |
| Maturité release (hors score LLM) ? | `docs/ALGO_RELEASE_READINESS.md` + `config/algo-deploy-gate.ts` |

## Sortie attendue de l’audit

- Ce qui est **solide**.
- Les **écarts** (avec chemins).
- Les **actions** minimales et ordonnées.
- Ce qui est **hors scope** volontairement.

## Ce qu’il ne faut pas faire

- Chasser une « perfection absolue » au détriment des livraisons.
- Réécrire des sous-systèmes entiers sans mesure du gain.
- Introduire une deuxième doctrine contradictoire avec l’existant.

## Règle Cursor associée

Fichier **optionnel** (non `alwaysApply`) : `.cursor/rules/algo-coherence-review.mdc` — à invoquer pour caler le comportement de l’agent sur ce rituel.

## Évolution du système (sans « self-LLM » sur chaque réponse)

Pour l’amélioration continue **sans** brancher une analyse LLM dans le Core à chaud : **`docs/ALGO_OFFLINE_EVOLUTION.md`** (outils existants, garde-fous, ce qu’on évite — y compris **mémoire RAM + boucle « consciente »** sur le pipeline Q&R vs autonomie structurée).

Pour **déploiement / smoke / éviter les directives parallèles** : **`docs/ALGO_OPERATIONS_PLAYBOOK.md`**.
