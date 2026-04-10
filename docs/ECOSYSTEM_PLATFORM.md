# ALGO — Plateforme écosystème (intégrations externes)

**Mise en place pas à pas (migration + clés)** : voir [`ECOSYSTEM_SETUP.md`](./ECOSYSTEM_SETUP.md).

Ce document décrit comment connecter une application (web, mobile, backend) à **ALGO** en tant que hub de données et de capacités. Il reflète l’implémentation actuelle du dépôt ; les phases « base SQL unifiée », « GraphQL » et « WebSocket » sont **indiquées comme non implémentées** dans le manifest API.

## 1. Versionnement

- **Contrat écosystème** : `ecosystemApiVersion` dans les réponses `/api/v1/*` et champ `algoEcosystemVersion` dans `GET /api/v1/manifest`.
- **Gel schéma documenté** : `schemaDate` dans le manifest.

## 2. Découverte

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/v1/manifest` | Aucune | Catalogue des routes, domaines de données, vues cibles. |
| `GET /api/v1/health` | Aucune | Santé légère + indicateur `platformKeysConfigured`. |

## 3. Authentification plateforme

Variables d’environnement (serveur) :

- `ALGO_PLATFORM_API_KEY` — une clé secrète (ex. démo / un client).
- `ALGO_PLATFORM_API_KEYS` — liste séparée par des **virgules** pour plusieurs clients.

En-têtes acceptés :

- `Authorization: Bearer <clé>`
- `X-ALGO-Platform-Key: <clé>`

Sans clé configurée, les routes protégées répondent **503** avec un message explicite.

## 4. Lecture — tendances

`GET /api/v1/trends`

- **Query** : `country=FR` (optionnel, code ISO), `format=json` (défaut) ou `format=csv`.
- **Auth** : clé plateforme.
- **Limite** : 120 requêtes / minute / clé (empreinte) + identité client (voir rate limiter en mémoire).

Réponse JSON : même enveloppe que le cœur `buildLiveTrendsPayload` (données + `meta` + `status` + champ `ecosystem`).

## 4ter. Automatisation (déjà câblée dans le code)

| Déclencheur | Effet |
|-------------|--------|
| **Vercel Cron** `GET /api/cron/snapshot-trends` (toutes les 20 min, voir `vercel.json`) | Enregistre `trend_signal` pour les régions `ALGO_SNAPSHOT_CRON_REGIONS` (défaut `ALL,FR,US`) + nouvelle ligne `model_weight_version` si la version de poids change. Auth : `Authorization: Bearer ${CRON_SECRET}`. |
| **POST `/api/viral-analyzer`** | Si `SUPABASE_SERVICE_ROLE_KEY` est défini : insert dans `viral_score_snapshot` (sans bloquer la réponse). |
| **GET `/api/v1/trends`** | Si `ALGO_SNAPSHOT_PERSIST=1` : insert `trend_signal` après chaque réponse réussie (complément au cron). |

Vérifier localement la config : `npm run ecosystem:check` (option `npm run ecosystem:check:strict` pour échouer si URL Supabase sans service role).

## 4bis. Export incrémental — snapshot Supabase

Appliquer la migration SQL : `supabase/migrations/20260409120000_algo_ecosystem_snapshots.sql` (éditeur SQL Supabase ou CLI).

Variables serveur :

- `SUPABASE_SERVICE_ROLE_KEY` — **obligatoire** pour `GET /api/v1/snapshot` (ne jamais exposer au client).
- `ALGO_SNAPSHOT_PERSIST=1` — optionnel : enregistre un lot dans `trend_signal` après chaque `GET /api/v1/trends` réussi.

`GET /api/v1/snapshot`

- **Auth** : clé plateforme (comme `/api/v1/trends`).
- **Query** :
  - `since` — ISO 8601 (défaut : il y a 24 h)
  - `types` — sous-ensemble parmi `trend_signal`, `viral_score_snapshot`, `model_weight_version`
  - `limit` — max lignes **par type** (1–500, défaut 100)
- **Réponse** : objets par table + `counts` + métadonnées de requête.

Tables :

| Table | Rôle |
|-------|------|
| `trend_signal` | Lots de tendances (payload JSON aligné sur live-trends). |
| `viral_score_snapshot` | Scores persistés (0–100) + `subject_type` / `subject_key`. |
| `model_weight_version` | Versions de poids / config modèle. |

RLS activé sans politique publique : seul le **service role** lit/écrit via l’API Next.

## 5. Écriture — événements

`POST /api/v1/ingest/events`

- **Auth** : clé plateforme.
- **Corps** : identique à `POST /api/analytics/events` :

```json
{
  "events": [
    {
      "type": "content_interaction",
      "timestamp": 1710000000000,
      "sessionId": "sess_abc",
      "data": { "contentId": "x", "pagePath": "/trends" }
    }
  ]
}
```

- Stockage : file **mémoire process** + insertion **Supabase** `analytics_events` si `NEXT_PUBLIC_SUPABASE_*` est défini. Champ `ingestSource: ecosystem_v1` ajouté dans `properties`.

## 6. Routes publiques existantes (sans clé)

Beaucoup d’endpoints sous `/api/*` restent orientés **navigateur** avec limitation par IP (ex. `/api/live-trends`). Le manifest liste les principaux ; ne pas les confondre avec le contrat `/api/v1` qui impose une clé pour les flux « partenaire ».

## 7. Sécurité — pratiques recommandées

- Ne jamais embarquer la clé plateforme dans une app mobile **grand public** ; passer par votre backend proxy.
- Faire tourner les clés via `ALGO_PLATFORM_API_KEYS` et retirer l’ancienne clé côté serveur.
- Les IP sont hashées pour l’analytics ; limiter les PII dans `events[].data`.

## 8. Limites actuelles (honnêtes)

- Pas de **GraphQL** ni **WebSocket** exposés pour l’écosystème.
- Rate limiting **in-memory** : en cluster multi-instances, utiliser Redis / Upstash (déjà noté dans `rate-limiter.ts`).
- Pas de schéma SQL unique dans ce repo pour tous les domaines : voir `dataLandscape` dans le manifest pour l’audit.

## 9. Feuille de route suggérée

1. Matérialiser les vues `targetEntityViews` du manifest en tables Supabase / Postgres.
2. OAuth2 client credentials pour remplacer ou compléter les clés statiques.
3. Export incrémental (cursor / `updatedSince`) pour éviter doublons inter-apps.
4. OpenAPI 3.1 généré à partir de `ECOSYSTEM_ENDPOINT_CATALOG`.

## 10. Test rapide (curl)

```bash
# Manifest
curl -s https://TON_DOMAINE/api/v1/manifest | jq .algoEcosystemVersion

# Tendances (remplacer LA_CLE)
curl -s -H "Authorization: Bearer LA_CLE" "https://TON_DOMAINE/api/v1/trends?country=FR"

# Snapshot incrémental (service role requis côté serveur)
curl -s -H "Authorization: Bearer LA_CLE" "https://TON_DOMAINE/api/v1/snapshot?since=2026-04-01T00:00:00.000Z&types=trend_signal&limit=50"
```
