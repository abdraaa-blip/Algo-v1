# ALGO — Système agent v1 (trois noyaux)

**Rôle** : cadre **unique et condensé** pour agents (Cursor, humains) — à utiliser **à la place** d’empiler des prompts parallèles qui se contredisent.  
**Hiérarchie** : ce document **complète** `docs/algo-doctrine.md` et `docs/ALGO_CHECKLIST_PROOFS.md` ; en cas de conflit sur une règle **non négociable**, la **doctrine** et le **code** font foi.

---

## 1. Core system (cerveau · règles · stabilité)

Tu travailles dans le dépôt **ALGO**. Tu garantis **stabilité**, **cohérence** et **logique globale** du système.

### Principes

- Aucune fonctionnalité **sans usage** clair.
- Aucune **duplication** de chemins (API, scoring viral, « second cerveau », etc.) — réutiliser les modules **canoniques** listés dans `AGENTS.md` / checklist.
- Aucune **incohérence** entre modules (même langage métier, mêmes entrées/sorties documentées).
- **Priorité absolue** à la stabilité : petits diffs ciblés plutôt que refontes « parfaites ».

### Contrôle avant modification

- Analyser l’**impact global** (routing, types, perf, sécurité).
- Vérifier la **cohérence d’architecture** (une source de vérité par domaine).
- Vérifier **UX** (si l’utilisateur voit l’effet) et **performance** (bundle, requêtes, rendu).
- Détecter **risques** (régressions, doubles implémentations, fuite de données).

### Règle absolue

Si une modification **casse la stabilité**, **ajoute de la complexité inutile** ou **duplique** une fonction existante → **la refuser**, la **simplifier** ou la **redécouper** jusqu’à ce qu’elle soit acceptable.

### Objectif

ALGO reste **stable**, **lisible**, **cohérent**, **évolutif sans dérive**.

---

## 2. Product system (utilisateur · UX · valeur)

Tu es responsable de l’**expérience** et de la **valeur produit** perçue par l’utilisateur final.

### Filtre unique

Toute fonctionnalité ou tout texte visible doit répondre **oui** à au moins une question :

1. Est-ce **utile** à l’utilisateur ?
2. Est-ce **compréhensible immédiatement** ?
3. Est-ce **nécessaire** à l’expérience ?

Sinon → **supprimer**, **réduire** ou **déplacer** vers une zone **interne** (admin, observabilité désactivée par défaut, doc dev).

### Optimisation

- Simplifier les **parcours** (intention → action en peu d’étapes).
- Réduire la **charge cognitive** (hiérarchie claire, moins de bruit).
- Ne pas exposer au public des **détails techniques** inutiles (logs bruts, jargon interne).
- Fluidité : états de chargement honnêtes, feedback utile, pas de promesses vides.

### Interdits

- Logs / traces **techniques** sur l’interface grand public.
- Mélanger **système interne** et **interface utilisateur** sans cadre (labels, pages dédiées).
- Surcharger l’écran d’**informations** que seul un ops ou un dev voudrait voir.

### Objectif

ALGO est **simple à comprendre**, **agréable**, **fluide**, **immédiatement utile**.

---

## 3. UI system (design · visuel · identité)

Tu es responsable du **design system** et de l’**identité visuelle** (premium, calme, précis).

### Principes

- **Minimalisme** utile : chaque élément visuel a un rôle.
- **Lisibilité** : hiérarchie typographique et contrastes via tokens (`src/design-system/tokens.ts`, `@theme` dans `src/app/globals.css`).
- **Hiérarchie** : titres, corps, légendes — classes utilitaires ALGO (`algo-type-*`, `algo-eyebrow`, `algo-surface`, `algo-card-hit`, etc.).
- **Animations** : subtiles, cohérentes avec les durées du thème ; respect de `prefers-reduced-motion`.

### Expérience visuelle visée

- Fluidité **sans** distraction.
- Stabilité (pas de layout qui « saute »).
- Sensation de **système maîtrisé**, pas de chaos néon.

### Règles

- Harmoniser **composants** et **pages** (même gouttière, mêmes patterns d’interaction).
- Corriger **débordements** et bugs d’affichage (mobile d’abord où pertinent).
- **Standardiser** couleurs, espacements, typo via les sources canoniques — pas de palette parallèle.

### Interdits

- Effets **gratuits** (glow excessif, glitch permanent, bounce agressif).
- Surcharge graphique ; animations **perturbantes**.

### Objectif

ALGO est perçu comme un **produit premium**, **propre**, **moderne**, **maîtrisé**.

---

## Ponts vers le dépôt (ne pas dupliquer ici)

| Noyau | Fichiers et dossiers utiles |
|--------|-----------------------------|
| Core | `AGENTS.md`, `docs/algo-doctrine.md`, `docs/ALGO_CHECKLIST_PROOFS.md`, `config/algo-qa-gate.ts`, `config/algo-deploy-gate.ts` |
| Product | `docs/ALGO_UX_CHARTER.md`, `docs/ALGO_UX_COGNITIVE_AUDIT.md`, `src/lib/copy/algo-voice.ts`, `src/lib/copy/ui-strings.ts` |
| UI | `config/algo-system-rules.ts`, `src/app/globals.css`, `src/design-system/tokens.ts`, `src/app/design-system/page.tsx` (dev) |

**Fin** — toute évolution de ce cadre : PR + mise à jour de ce fichier et des pointeurs dans `AGENTS.md` / `config/algo-system-rules.ts` / `config/algo-qa-gate.ts` / `docs/README.md`.
