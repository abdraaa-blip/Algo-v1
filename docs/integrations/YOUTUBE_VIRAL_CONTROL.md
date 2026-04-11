# YouTube × Viral Control Center — plan technique minimal

Objectif : rapprocher le cockpit de **métriques réelles** par URL, en commençant par **YouTube** (API publique la plus simple).

## Phase 1 (implémentée dans le dépôt)

- **Données** : `videos.list` (parts `snippet`, `statistics`) avec `YOUTUBE_API_KEY` (serveur uniquement).  
- **Routes** :
  - `GET /api/social/youtube/video-metrics?videoId=` ou `?videoUrl=`
  - `GET /api/intelligence/viral-control?...&videoUrl=` (enrichit la réponse avec un bloc `youtube`)
- **Cache** :
  - Réponse Google **~90 s** par `videoId` (mémoire process, `youtube-public-metrics.ts`).
  - **Bundle** cockpit **~15 s** pour la même combinaison `region + locale + days + videoUrl` (`viral-control/route.ts`).
- **Courbe “réelle”** : **série d’observations** côté ALGO à chaque fetch réussi (`youtube-observation-series.ts`). Ce n’est **pas** l’historique interne YouTube ; pour ça il faut persistance longue durée ou Analytics API.

## Phase 2 — Persistance courbe

- Table Supabase (ex. `youtube_metric_snapshot` : `video_id`, `captured_at`, `views`, `likes`, `comments`) + insert depuis la route ou un cron léger.  
- Permet des courbes sur **jours/semaines** même après redémarrage du serveur.

## Phase 3 — OAuth / chaîne propriétaire

- **YouTube Analytics API** (OAuth 2.0 Google) pour audiences, rétention, revenus, etc.  
- Nécessite **consentement utilisateur**, écran de login, refresh tokens stockés de façon sécurisée.  
- Hors scope du “public URL only” actuel.

## Phase 4 — Temps quasi réel

- **WebSocket** ou **SSE** : voir `REALTIME_AND_CACHE.md`.  
- Next.js : souvent **client polling** ou **worker dédié** pour pousser des mises à jour ; le polling ~30 s du cockpit reste un premier pas honnête.

## Variables

- `YOUTUBE_API_KEY` — déjà documentée dans `.env.example`.

## Quotas

- Respecter les quotas **YouTube Data API v3** ; le cache 90 s et le rate limit route réduisent les appels.
