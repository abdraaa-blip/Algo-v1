# Temps réel, WebSocket et cache serveur (ALGO)

## État actuel (Viral Control + YouTube)

- **Polling** navigateur (~30 s) sur `/api/intelligence/viral-control`.  
- **Cache mémoire** :
  - Google YouTube **~90 s** par vidéo.
  - Réponse cockpit **~15 s** par clé `(region, locale, days, videoUrl)`.

## WebSocket

- Les **Route Handlers** Next.js ne fournissent pas un serveur WebSocket “clé en main” comme un serveur Node long-running seul.  
- Options réalistes :
  1. **Service séparé** (Node, Bun, ou fournisseur managé) qui pousse des événements ; le client Next se connecte en WS vers ce domaine.  
  2. **Vercel** : patterns avec **externe** (Ably, Pusher, Supabase Realtime, etc.) plutôt qu’un WS maison sur la même fonction serverless.  
  3. **SSE** (`text/event-stream`) pour un flux unidirectionnel serveur → client, souvent plus simple à opérer derrière CDN.

## Cache dédié (au-delà de la mémoire process)

- **Limite** du cache in-memory : perte au redémarrage, pas partagé entre instances.  
- **Étape suivante** : Redis / Upstash avec TTL identiques aux constantes actuelles, ou cache edge (CDN) pour `GET` idempotents **sans** données utilisateur sensibles.

## Recommandation produit

- Garder **polling + cache court** tant que le coût et la complexité WS ne sont pas justifiés.  
- Passer à **push** quand une source externe (webhook plateforme, job batch) alimente un bus d’événements.
