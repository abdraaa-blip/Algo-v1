# ALGO · directive maître (direction totale du système)

**Version humaine intégrale** · la couche injectée dans les prompts modèle est la synthèse `ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER` dans `src/lib/ai/algo-directive-synthesis.ts`.

Ce document sert de **référence permanente** pour éviter la divergence des modules (IA, data, UX) et recentrer toute intelligence sur la même vision : **comprendre → décider → agir**.

---

## Vérité rapide (avant tout prompt)

Sans ce cadre, le projet risque :

- d’empiler des fonctionnalités sans fil ;
- de faire diverger les modules ;
- de perdre en cohérence côté IA et produit.

---

## Rôle du système

ALGO est un **système intelligent global**, pas seulement un site ni un module IA isolé.

Capacités visées :

- collecter et lire des données (signaux publics, agrégats) ;
- analyser et structurer ;
- comprendre et contextualiser ;
- anticiper avec prudence (scénarios, pas certitudes) ;
- guider des **décisions** concrètes.

Positionnement : **l’algorithme des algorithmes** au sens **radar et lecture de signaux**, aligné sur la doctrine (pas de mystique, pas de promesses magiques).

---

## Objectif global

Un système **complet dans son intention**, **fluide** pour l’utilisateur, **fiable** sur ce qui est dit et montré, **exploitable** (y compris avec délais et limites affichés quand ce n’est pas du temps réel).

Chaque élément utile doit servir :

1. **comprendre**  
2. **décider**  
3. **agir**

---

## Principes fondamentaux

### 1. Cohérence totale

Alignement entre IA, data, UX, design et fonctionnalités. Pas de contradiction. Pas d’élément décoratif sans utilité décisionnelle.

### 2. Utilité avant complexité

Chaque fonctionnalité doit répondre à : *est-ce que ça aide à comprendre ou à décider ?* Sinon : simplifier, retirer ou reporter.

### 3. Temps réel ou transparence

Si une donnée est présentée comme fraîche ou live, le produit doit le permettre honnêtement. Sinon : **délai, source, agrégat** indiqués. Aucune illusion.

### 4. IA centrale (dans le produit)

L’IA n’est pas une vignette : elle incarne la couche d’**interprétation** et de **recommandation** au-dessus des signaux. Elle analyse ce qui est disponible, explique, propose des actions, anticipe avec prudence.

### 5. Accessibilité d’usage

Mobile et desktop : navigation fluide, compréhension immédiate, pas de surcharge cognitive inutile.

### 6. Structure modulaire mais unifiée

Chaque module (Viral Analyzer, trends, ALGO AI, intelligence, etc.) peut être **indépendant techniquement**, mais partage une **logique centrale** : transparence, indicateurs, décision. Point d’entrée code nommé : `src/core/brain.ts` pour la Q&R ; orchestration data ailleurs, sans confusion des rôles.

### 7. Fiabilité des données

Source identifiable, niveau de confiance ou limite, gestion d’erreur **humaine** (pas de jargon technique brut utilisateur). Donnée manquante → **alternative** ou principe actionnable.

### 8. Décision avant information pure

Le système **interprète**, **priorise**, **recommande** — il ne se contente pas d’afficher des listes sans lecture.

### 9. Simplicité perçue

Complexité interne possible ; ressenti utilisateur : clarté, fluidité, puissance **maîtrisée**.

### 10. Amélioration continue

Détecter les fragilités (données, formulation, parcours), proposer des pistes d’amélioration, faire évoluer sans casser l’existant sans décision explicite.

---

## Fonctionnement attendu (boucle interaction)

Pour une interaction utile type :

1. Comprendre la demande  
2. Récupérer / mobiliser les données utiles (contexte fourni)  
3. Analyser  
4. Répondre clairement  
5. Proposer une action ou une suite  

---

## Gestion des limites

Si une donnée ou une action n’est pas possible :

- ne pas bloquer sans piste ;
- expliquer simplement ;
- proposer une alternative ou une précision à fournir.

(Côté API, repli automatique et formulations non techniques : voir `src/lib/ai/algo-ask-fallback.ts` et route `POST /api/ai/ask`.)

---

## Objectif final perçu

ALGO doit être perçu comme **intelligent**, **clair**, **utile**, **maîtrisé** — pas comme un outil instable ou une accumulation de gadgets.

---

## Contrainte finale

Tout ce qui est construit doit **servir cette vision**. Si un élément ne s’aligne pas : le **corriger**, le **simplifier** ou le **retirer** après décision produit.

**Résultat attendu** : une intelligence **organisée**, pas une empilement de fonctionnalités décorrélées.

---

## Liens code & preuves

| Élément | Chemin |
|--------|--------|
| Couche prompt (synthèse) | `ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER` dans `src/lib/ai/algo-directive-synthesis.ts` |
| Assemblage prompt IA | `buildAlgoSystemPrompt` dans `src/lib/ai/algo-persona.ts` |
| Export anglais (audits / partenaires) | `docs/prompts/ALGO_MASTER_SYSTEM_DIRECTIVE_EXPORT_EN.md` |
| Doctrine courte | `docs/algo-doctrine.md` |
| Checklist état / preuves | `docs/ALGO_CHECKLIST_PROOFS.md` |
| Cerveau Q&R | `src/core/brain.ts` (`BRAIN_MODULE_REGISTRY.masterDirectiveDoc`) |
| Ops / déploiement / packs « prod » génériques **vs** ce dépôt | `docs/ALGO_OPERATIONS_PLAYBOOK.md` (§ **Arbitrage**, § **Blueprints externes**) |
