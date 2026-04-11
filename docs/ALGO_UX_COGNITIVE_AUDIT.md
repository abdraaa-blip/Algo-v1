# Audit charge cognitive & parcours ALGO

**Protocole** pour agents et humains : simuler un utilisateur qui **découvre** ou **réutilise** une page / un module. Il **complète** la charte **`docs/ALGO_UX_CHARTER.md`** (principes + **alignement cognitif** pour copy / structure de réponse agent) sans la remplacer.

## Rôle

Vérifier si l’interface est **compréhensible**, **confortable mentalement**, **fluide à parcourir**, **peu fatigante**, et **cohérente** visuellement et logiquement avec le reste d’ALGO.

## Objectif du test

Pour le périmètre audité, se demander :

- Est-ce qu’on comprend **le rôle** de l’écran ?
- Est-ce qu’on **se perd** (navigation, titres, états) ?
- Est-ce qu’on se sent **fatigué** (densité, répétition, mouvement) ?
- L’intention produit reste-t-elle **claire** ?

**Heuristique « quelques secondes »** : sur les **écrans d’entrée** ou parcours principal (accueil, onboarding, action marketing), le but doit être saisissable **très vite**. Sur les **écrans outil** (logs, ops, légal, paramètres denses), viser plutôt : **une phrase de contexte + structure scannable** (titres, groupes, états) — pas la même barre que pour une landing.

### Heuristique vs usage réel

Un agent (ou une revue sans navigateur) **ne remplace pas** des humains en conditions réelles : pas de mesure de latence réelle, pas de « vrais clics ». La revue reste **lecture de code, de copy, de navigation et de structure** — éventuellement complétée par un **test manuel** ou E2E (Playwright, etc.) hors de ce document. Ne pas inventer de **notes chiffrées** (ex. 0–10) comme si elles étaient des métriques : utiliser des **niveaux qualitatifs** et une **confiance** (forte si aligné code + patterns connus ; faible si hypothèse).

## Revue multi-profils (heuristique)

Même périmètre audité, **quatre lunettes** successives. Pour chaque profil, produire un court bloc : **ce qui va** / **écarts** / **fatigue ou confusion** (pas de score numérique obligatoire).

### 1. Utilisateur débutant

- Ne connaît pas ALGO ; première lecture de l’écran ou du parcours.
- Cherche **le but** et **la prochaine action** sans jargon.
- Signale tout ce qui suppose un **contexte non affiché** (acronymes, « évident » pour l’équipe).

### 2. Utilisateur analytique

- Cherche **efficacité** : structure des sections, redondances, incohérences de libellés ou de flux.
- Détecte **lenteur perçue** possible (trop de requêtes évidentes dans le code client, absence de squelette / état de chargement).

### 3. Utilisateur expert technique (revue code / UI)

- **Architecture UI** : duplication de patterns, risques de dette (composants géants, props implicites).
- **Robustesse** : états erreur / vide, clés de listes, conditions de bord, couplage fragile à une API.
- **Accessibilité** : focus, sémantique, annonces utiles si contenu dynamique critique.
- Ne confond pas avec un **profil de perf** : pas d’affirmation chiffrée sans profiler ou réseau réel.

### 4. Utilisateur « normal » (parcours simple)

- Objectif **modeste** : comprendre et naviguer sans effort.
- Sensible à la **clarté**, à la **hiérarchie**, au **bruit visuel** inutile.

### Parcours smoke recommandé (quand l’audit est « premier contact » ou pré-release)

À appliquer **surtout** pour une release sensible, un onboarding, ou une grosse surface navigation — **pas** systématiquement sur chaque micro-PR (voir `docs/ALGO_COHERENCE_RITUAL.md` : périmètre + critère d’arrêt).

1. Point d’entrée public (ex. **accueil** `/`) : objectif produit lisible ?
2. **Control Room** (`/control-room`) ou autre hub « système » pertinent au produit : le lien y est-il trouvable depuis la nav / l’intelligence ?
3. **Une action principale** du périmètre (ex. lancer une lecture, ouvrir un panneau clé) : chemin et retour visuel clairs ?
4. **Retour à la navigation globale** (header, footer, retour arrière logique) : pas de impasse.

Adapter les étapes si le périmètre est une **route isolée** (auth, légal) : le smoke devient « entrer → accomplir la tâche → sortir / continuer ».

### Synthèse croisée (obligatoire après les quatre profils)

- **Tous** signalent la même confusion → risque **structurel** (titres, nav, intention de page).
- **Experts** OK sur le code, **débutants** perdus → risque **d’onboarding / jargon** ou hiérarchie trop technique.
- **Fatigue** citée par plusieurs profils → **simplifier** (densité, répétition, animation, nombre de choix).
- **Aucun écart majeur** aligné entre profils → périmètre probablement **stable** pour cette passe (rester prudent sur ce que la lecture seule ne voit pas).

### Gabarit de restitution (qualitatif)

Pour chaque profil : **forces** (bullet) · **écarts** (bullet + fichier ou zone si connu) · **sévérité** (bloquant / important / mineur) · **confiance** (forte / faible).

### Boucle d’amélioration

1. Passer les **quatre profils** + synthèse croisée.  
2. Prioriser les écarts (impact utilisateur × faisabilité).  
3. **Correction ciblée** (alignée `ALGO_QA_PHILOSOPHY` : minimal, expliqué).  
4. Re-vérifier le périmètre (code + smoke manuel si disponible).  
5. Mettre à jour preuves ou tests si le comportement produit change (`docs/ALGO_CHECKLIST_PROOFS.md`, Vitest).

## 1. Check cognitif (par page ou module)

### Compréhension

- Peut-on formuler **en une phrase** ce que permet cet écran ?
- L’**action principale** (s’il y en a une) est-elle identifiable sans chercher ?
- Les **états** chargement / vide / erreur sont-ils **explicites** (pas seulement un spinner silencieux) ?

### Charge mentale

- Y a-t-il **trop d’éléments** au même niveau d’importance visuelle ?
- Textes ou blocs **redondants** ou **doublonnés** avec un autre bloc de la même page ?
- **Animations** non décoratives qui tournent en permanence sans apporter d’info ?
- **Hiérarchie** : essentiel / secondaire / décoratif reste-t-il lisible ?

### Fluidité visuelle

- Le **premier regard** tombe-t-il sur le titre ou l’objectif, puis sur l’action ou les données clés ?
- Le **parcours** (haut → bas, ou Z de lecture) est-il naturel ?
- Les **transitions** aident-elles la compréhension ou distraient pendant la lecture ?

### Équilibre

- Trop vide (pas de repère) vs trop chargé (pas de respiration) ?
- **Mobile** : zones d’action principales accessibles sans gymnastique (pouce, scroll infini d’options) ?

### Accessibilité (à croiser avec la charte UX)

- **Focus clavier** : ordre de tabulation logique, anneau de focus visible.
- **Couleur seule** : pas d’information critique uniquement par la teinte ; combiner texte / icône / libellé.
- **`prefers-reduced-motion`** : pas d’animation indispensable au sens bloquée quand l’utilisateur réduit le mouvement.

## 2. Stress test de scroll

En défilant le contenu :

- Le texte et les données restent-ils **lisibles** (taille, contraste, lignes trop longues) ?
- Y a-t-il des **ruptures** brutales (fond qui change, largeur qui saute, header qui masque le contenu) ?
- Le **fond global** reste-t-il stable (pas de double couche opaque inutile) ?
- Les **sections** s’enchaînent-elles avec des titres ou séparateurs cohérents ?

## 3. Fatigue cognitive

Signaler notamment :

- **Répétitions** inutiles (même phrase, même métrique en boucle).
- **Informations doublées** entre hero, sidebar et pied sans valeur ajoutée.
- **Surcharge** de couleurs d’accent ou contrastes **hors tokens** sans raison.
- **Blocs trop denses** : absence de listes, respiration, ou regroupement logique.

## 4. Intention claire

Pour l’écran :

- Quelle est l’**action ou l’info principale** ?
- Est-elle **visible tôt** (above the fold quand c’est pertinent) ?
- Plusieurs **intentions concurrentes** au même niveau (ex. trois CTA « principaux ») → **risque UX** : prioriser ou découper (sans refonte globale hors scope).

## 5. Cohérence globale

- **Espacements** et **typographie** alignés avec le reste du site (tokens, `algo-surface`, etc.).
- **Comportements** (hover, focus, ouverture de panneau) cohérents avec les patterns existants.
- Aucune page ne doit **casser** l’expérience globale (palette parallèle, layout « autre marque »).

## 6. Lecture « émotionnelle » (observable)

Préférer des **signaux vérifiables** au jugement vague :

- L’utilisateur a-t-il des **repères** (titre, fil d’Ariane, section) ?
- Le ton est-il **calme** (voix ALGO) ou **anxiogène** (urgence artificielle, promesses magiques) ?
- Les erreurs sont-elles **actionnables** (quoi faire ensuite) ?

Objectif ressenti cible : **calme + clarté + puissance sans bruit** (voir charte UX).

## 7. Signaux critiques (à traiter en priorité)

À **signaler** et corriger par **patch minimal** quand c’est dans le scope :

- Surcharge visuelle qui **masque** l’objectif de la page.
- Navigation ou libellés **confus** (même destination, noms différents).
- Action principale **invisible** ou noyée parmi des secondaires au même poids.
- Animation qui **gêne la lecture** (boucle sur le texte, mouvement fort au scroll).
- **Scroll horizontal involontaire**, fond ou layout **instable** (flash, saut de largeur).

Alignement avec la philosophie QA : **`ALGO_QA_PHILOSOPHY`** dans `config/algo-qa-gate.ts` — signaler clairement, proposer une **correction minimale**, ne pas réécrire tout un sous-système sans nécessité.

## 8. Actions autorisées (agents)

- Simplifier la **hiérarchie** visuelle, retirer l’**inutile**, clarifier **titres / regroupements**.
- Réduire ou **conditionner** les animations ; améliorer **lisibilité** (espacement, taille, contrastes via tokens).
- Clarifier le **parcours** (un CTA principal, états explicites).

## 9. Limites strictes

- Ne pas **casser** l’architecture existante ni les **contrats** API / données.
- Ne pas **changer le design system global** (tokens, thème) sans décision explicite — étendre proprement si besoin.
- Ne pas **surcharger** en ajoutant widgets ou sections « pour remplir ».
- Ne pas modifier la **logique métier / IA** dans un audit purement UX — PR séparée si nécessaire.

## 10. Philosophie

ALGO doit être perçu comme **simple à comprendre**, **agréable à utiliser**, **puissant sans bruit**, **intelligent mais calme**.

## Liens

| Document | Rôle |
|----------|------|
| `docs/ALGO_UX_CHARTER.md` | Principes UX globaux |
| `config/algo-system-rules.ts` | Règles UI techniques |
| `docs/ALGO_COHERENCE_RITUAL.md` | Rituel cohérence produit (périmètre, critère d’arrêt) |
| `config/algo-qa-gate.ts` | Checklist QA & sources |
| `docs/ALGO_RELEASE_READINESS.md` | Maturité release (rubric qualitative, CI / deploy gate) |
| `docs/README.md` | Index navigation `docs/` |
