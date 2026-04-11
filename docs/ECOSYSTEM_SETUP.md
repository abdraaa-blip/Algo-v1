# Faisons la mise en place écosystème (Supabase + Vercel)

Check-list courte pour activer snapshots, cron et `/api/v1/*`.

## 1. Migration SQL sur Supabase

**Option A · script (recommandé si tu as le mot de passe DB)**

1. Supabase → **Project Settings** → **Database** → **Database password** (ou reset si besoin).
2. **Connection string** → onglet **URI** → copie la chaîne `postgresql://postgres.[ref]:[PASSWORD]@aws-0-...pooler.supabase.com:6543/postgres`  
   - Pour les migrations DDL, préfère souvent l’hôte **`db.[PROJECT_REF].supabase.co`** port **5432** (connexion directe), disponible dans la même page.
3. Dans `.env.local` :

   ```bash
   DATABASE_URL=postgresql://postgres:TON_MOT_DE_PASSE@db.xxxxx.supabase.co:5432/postgres
   ```

4. Depuis la racine du repo :

   ```bash
   npm run db:apply-ecosystem
   ```

**Option B · éditeur SQL**

1. Ouvre **SQL Editor** dans Supabase.
2. Colle le contenu de `supabase/migrations/20260409120000_algo_ecosystem_snapshots.sql`.
3. Exécute.

## 2. Clés à configurer

| Variable | Où la trouver | Usage |
|----------|----------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API | Déjà souvent en place |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon public | Client / analytics |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → **service_role** (secret) | Snapshots, cron, RLS bypass · **jamais** côté navigateur |
| `CRON_SECRET` | Génère un secret long (ex. `openssl rand -hex 32`) | Vercel Cron → `/api/cron/*` |
| `ALGO_PLATFORM_API_KEY` ou `ALGO_PLATFORM_API_KEYS` | Génère toi-même | Apps externes → `/api/v1/trends`, `/api/v1/snapshot`, ingest |

Sur **Vercel** : *Project* → *Settings* → *Environment Variables* → ajoute tout ce qui précède pour Production (et Preview si besoin).

## 3. Vérifier

```bash
npm run ecosystem:check
```

Après déploiement : `GET https://ton-domaine/api/v1/health` doit indiquer `platformKeysConfigured: true` si les clés plateforme sont définies.

## 4. Cron

`vercel.json` inclut déjà `GET /api/cron/snapshot-trends` toutes les 20 minutes. Assure-toi que **`CRON_SECRET`** est identique à ce que Vercel envoie (header `Authorization: Bearer …` · Vercel le fait automatiquement pour les crons).

## 5. Optionnel

- `ALGO_SNAPSHOT_PERSIST=1` · persistance à chaque `GET /api/v1/trends`.
- `ALGO_SNAPSHOT_CRON_REGIONS=ALL,FR,US` · régions du cron (voir `.env.example`).

Guide détaillé des API : `docs/ECOSYSTEM_PLATFORM.md`.
