# Viral Control Center : prompt produit (ALGO)

Document de référence pour concevoir un module **Viral Control Center** : cockpit de décision (pas un simple tableau de bord décoratif). À utiliser avec la doctrine ALGO (`docs/algo-doctrine.md`) et la voix produit (`src/lib/copy/algo-voice.ts`).

## Titre de travail

**ALGO · Viral Control Center prompt**

## Rôle attendu (équipe combinée)

- Data engineers spécialisés temps réel
- Experts réseaux sociaux (TikTok, YouTube, Instagram)
- UX designers spécialisés dashboards décisionnels
- Analystes en détection de viralité et signaux faibles

## Objectif

Créer un module nommé **Viral Control Center** dans ALGO : un cockpit intelligent pour visualiser, comprendre et anticiper la performance de contenus sur les réseaux sociaux en temps réel ou quasi temps réel.

## Contraintes critiques

- Aucune surcharge visuelle
- Chaque donnée affichée doit mener à une décision
- Interface simple mais puissante
- Temps réel ou quasi temps réel
- Design premium, fluide, lisible
- Rester honnête sur les limites des signaux publics (alignement transparence ALGO)

## Fonctionnalités obligatoires

### Courbes et métriques de performance

- Vues, likes, commentaires, partages
- Croissance (delta temps réel)
- Graphiques dynamiques

### Scores et dynamique

- Score de viralité
- Score global
- Vitesse de propagation
- Accélération
- Momentum

### Détection d’anomalies

- Pics anormaux
- Croissance soudaine
- Chutes brutales

### Corrélation tendances

- Comparaison avec tendances globales
- Alignement ou décalage

### Recommandations IA

- Actions concrètes à prendre
- Timing optimal
- Suggestions d’amélioration

### UX / UI

- Dashboard clair
- Jauges lisibles
- Courbes élégantes
- Responsive

## Architecture attendue

- Système modulaire
- API temps réel ou polling intelligent
- Cache optimisé
- Gestion des erreurs explicite

## Livrables attendus (pour une implémentation)

- Structure du module (frontend + backend)
- Exemples de composants React
- Logique de calcul des scores (documentée, calibrable)
- Organisation des données (schémas / flux)
- Recommandations UX (hiérarchie d’information, états vides, erreurs)

## Objectif final

Un **cockpit de décision intelligent** : chaque élément affiché sert à comprendre, décider ou anticiper, pas à remplir l’écran.

## Implémentation dans le dépôt

- **Page** : `/intelligence/viral-control` (UI cockpit, rafraîchissement ~30 s, sélecteur région, champ YouTube optionnel + courbe vues).
- **API** : `GET /api/intelligence/viral-control?region=FR&locale=fr&days=7&videoUrl=` (rate limit 45/min) · cache bundle mémoire **15 s** par clé.
- **API YouTube** : `GET /api/social/youtube/video-metrics?videoUrl=` ou `videoId=` · cache réponse Google **~90 s**.
- **Logique** : `viral-control-cockpit.ts` (radar) · `viral-control-youtube.ts` + `social/youtube-*.ts` (URL, fetch, observations).
- **Données** : radar inchangé · YouTube = **Data API v3** publique si `YOUTUBE_API_KEY` · courbe = **points relevés par ALGO**, pas l’historique interne YouTube.
- **Tests** : `viral-control-cockpit.test.ts` · `youtube-video-id.test.ts`.
- **Navigation** : **Intelligence** (`Navbar`) · liens Radar / Ops · `viral-control-regions.ts`.
- **Écosystème** : `intelligence.viral_control` + `social.youtube.video_metrics` dans `ECOSYSTEM_ENDPOINT_CATALOG`.
- **Roadmap** : `docs/integrations/YOUTUBE_VIRAL_CONTROL.md` · temps réel / cache partagé : `docs/integrations/REALTIME_AND_CACHE.md`.
