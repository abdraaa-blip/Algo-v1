# Charte UX ALGO — expérience globale

Document de **cadrage produit / UX** pour agents et humains. Il **complète** (ne remplace pas) `config/algo-system-rules.ts`, `docs/algo-doctrine.md` et `docs/ALGO_DESIGN_EVOLUTION.md`.

Pour une **revue structurée par écran** (compréhension, fatigue, scroll, intention, **lecture multi-profils heuristique**), utiliser **`docs/ALGO_UX_COGNITIVE_AUDIT.md`**.

## Rôle attendu (agents & contributeurs)

Améliorer l’**expérience utilisateur** (fluidité, lisibilité, cohérence visuelle, interactions, accessibilité) et la **stabilité** du système — **sans** le déstabiliser ni le fragmenter.

## Objectif principal

Une expérience :

- **Fluide** — transitions et retours visuels cohérents avec le design system.
- **Lisible** — hiérarchie claire, texte et données immédiatement exploitables.
- **Immersive mais maîtrisée** — profondeur (fond vivant, données) sans spectacle gratuit.
- **Stable** — pas de régression layout, pas de surprises sur mobile / desktop.
- **Non intrusive** — le décor guide ou respire ; il ne compète pas le contenu.
- **Cognitivement confortable** — charge mentale maîtrisée ; l’utilisateur se sent guidé, pas bombardé.

Le but n’est pas de « sur-impressionner », mais une sensation de **maîtrise** et d’**intelligence fluide** (« wow calme », pas « wow chaos »).

## Règle absolue d’évolution

**Autorisé :** améliorer design, animations (dans l’échelle du thème), simplifier layouts, corriger incohérences, renforcer lisibilité et accessibilité.

**Interdit sans nécessité forte :** casser une structure stable, changer radicalement l’esthétique globale ALGO, ajouter effets visuels inutiles, surcharger l’interface, introduire une deuxième palette ou une charte parallèle non branchée sur les tokens.

## Principes design (human-first)

### Clarté cognitive

Chaque zone d’écran importante doit être **compréhensible en quelques secondes** : titres, actions primaires, états (chargement, vide, erreur) explicites — pas d’information **uniquement** par la couleur (prévoir texte, icône + label ou pattern).

### Fluidité

Transitions **douces**, durées alignées sur `@theme` / `ALGO_SYSTEM_RULES.animation` ; courbes naturelles, pas de bounce agressif.

### Hiérarchie

Distinguer clairement :

1. **Essentiel** — objectif de la page, action principale.
2. **Secondaire** — contexte, filtres, métadonnées.
3. **Décoratif** — minimal ; sert la lecture ou l’ambiance, pas l’ego du composant.

Viser au plus **trois niveaux visuels dominants** simultanés sur un viewport (évite la « tapisserie »).

### Respiration visuelle

Espacements cohérents (grille implicite, tokens) ; éviter compression excessive et murs de texte sans structure.

## Alignement cognitif (agents · interface & communication)

**Périmètre** : lorsqu’un **agent** (ou un contributeur) réorganise du **copy**, de l’**aide en ligne**, une **réponse d’interface** ou une **structure d’écran** — **pas** un remplacement de la **persona IA utilisateur** (`algo-persona`, `algo-directive-synthesis`, `brain` / `system` pour le Q&R produit). Deux contextes : **UX / produit** ici ; **couche modèle** dans le code IA dédié.

**Lentilles** (inspirées charge cognitive, hiérarchie, progression simple → complexe) :

- **Simplifier** sans perdre le sens ; retirer redondances **inutiles**.
- **Structurer** en blocs lisibles ; mettre l’**actionnable** et l’**essentiel** avant le détail.
- **Hiérarchiser** ce qui sert à décider vs ce qui est contexte.
- **Réduire** friction de lecture (titres, listes, étapes) et décisions **faciles à comprendre**.

**Structure de sortie recommandée** (explications, revues, textes longs) : **résumé** → **détails** → **options** si besoin → **action recommandée** (quand applicable).

**« Engageant »** ici = **pertinent, clair, naturel** — jamais pression artificielle, rareté mensongère, ou manipulation émotionnelle ; aligné **`algo-voice`** et la doctrine (pas de promesses magiques).

**Interdits** : surcharger pour impressionner, complexifier pour « paraître intelligent », créer de la **confusion volontaire**.

Pour une **revue par écran** (fatigue, intention, multi-profils), utiliser **`docs/ALGO_UX_COGNITIVE_AUDIT.md`**.

## Fond & calques (critique)

- **Un seul fond « plein viewport » perceptible** : `html` / `body` (`globals.css`, variables thème) + **`AlgoLivingBackground`** dans `ClientLayout` (`fixed`, `inset-0`, `pointer-events: none`, empilement sous le contenu — implémentation actuelle : `z-0`, pas une obligation de `z-index: -10` partout).
- **Ne pas** empiler un second fond opaque pleine page (`bg-[var(--color-bg-primary)]` sur chaque racine) sauf **exception documentée** (export, plein écran isolé, contrainte technique).
- **Débordement** : pas de **scroll horizontal involontaire** ; les débords contrôlés (ombres, focus ring, tooltips) restent acceptables s’ils ne cassent pas la mise en page.

## Motion

**Autorisé** si le mouvement améliore la compréhension, guide l’attention ou feedback une action — et reste **subtil**.

**À éviter** : animations agressives, boucles décoratives constantes sans sens, parallax lourd sur chemins chauds.

**Obligatoire** : respecter **`prefers-reduced-motion: reduce`** — le vivant canvas se replie déjà sur un gradient statique dans `AlgoLivingBackground` ; le CSS global contient un bloc `reduce` ; toute nouvelle animation doit s’y conformer.

## Accessibilité & confort

- **Focus clavier visible** — ne pas retirer `:focus-visible` sans alternative ; ordre de tabulation logique.
- **Contrastes** — s’appuyer sur les couleurs tokenisées prévues pour fond sombre ; ne pas griser arbitrairement le texte hors `--color-text-*`.
- **Réduire la charge** — libellés clairs, regroupements logiques, pas de jargon opaque pour une action simple.
- **Composants interactifs** — boutons / liens **nommables** (éviter icône seule sans `aria-label` quand le texte n’est pas visible).

## Structure UI par page

- Un **centre d’attention** clair (pourquoi je suis ici ?).
- Hiérarchie simple ; lisibilité **mobile et desktop** dès la première lecture.
- Cohérence avec **header / footer** et patterns existants (`algo-surface`, etc.).

## Cohérence globale

Même design system, mêmes règles d’espacement et de layout ; les divergences doivent être **exception** justifiée, pas la norme.

## Amélioration continue (contrôlée)

Proposer simplifications, réduction de complexité UI, lisibilité, perf perçue — **à condition** de préserver la continuité visuelle ALGO et de livrer des **diffs minimaux** quand le sujet est localisé.

## Anti–sur-ingénierie

Si une amélioration n’améliore ni la compréhension, ni la fluidité, ni la stabilité / a11y — **la rejeter** ou la reporter.

## Philosophie

ALGO n’est pas un site « spectacle ». C’est un système **intelligent, vivant, lisible, maîtrisé**. L’utilisateur doit pouvoir y accorder **confiance**, **clarté** et **puissance silencieuse**.

## Liens utiles

| Sujet | Fichier |
|--------|---------|
| Règles UI techniques & checklist code | `config/algo-system-rules.ts` |
| Pont design (éviter 2ᵉ constitution) | `docs/ALGO_DESIGN_EVOLUTION.md` |
| Audit cognitif & parcours (protocole, multi-profils) | **`docs/ALGO_UX_COGNITIVE_AUDIT.md`** |
| Doctrine non négociable | `docs/algo-doctrine.md` |
| QA & commandes release | `config/algo-qa-gate.ts` |
| Maturité release (qualitative) | **`docs/ALGO_RELEASE_READINESS.md`** |
| GTM / discours public (brouillon) | **`docs/ALGO_GTM_NOTES.md`** (aligné calme & doctrine) |
| Index navigation `docs/` | **`docs/README.md`** |
| Voix & copy | `src/lib/copy/algo-voice.ts`, `src/lib/copy/ui-strings.ts` |
