# Vercel + Supabase (production)

Checklist courte pour éviter les écarts entre « ça build » et « le client voit la base ».

## Variables d’environnement

1. **Source de vérité** : Vercel → Project → **Settings** → **Environment Variables** (Production + Preview si besoin). GitHub ne pousse pas les secrets.
2. **`.env.local`** : uniquement machine locale ; ne monte pas sur Vercel. Après un changement Vercel, tu peux synchroniser avec `vercel env pull`.
3. **Supabase** : copier **Project URL** et la clé **anon** (JWT `eyJ…`) ou **publishable** (`sb_publishable_…`) depuis **Settings → API**, pour le **même** projet que l’URL. Une URL du projet A + clé du projet B → `401` côté REST public.
4. **`NEXT_PUBLIC_*`** : exposé au bundle navigateur. Jamais la **service role** / `sb_secret_` dans un `NEXT_PUBLIC_*`.
5. **Clé serveur** : `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEY` (selon ce que le code lit via `env-keys`) — **Production** uniquement, pas en Preview si tu veux isoler.
6. **`CRON_SECRET`** : obligatoire pour sécuriser les routes `/api/cron/*` en production.
7. Après toute modification de variable : **Redeploy** (le runtime ne relit pas les env à chaud comme un shell local).

## Health check (`GET /api/health`)

- **`checks.hints.supabaseRestStatus`** : statut HTTP de la sonde REST avec la **clé publique**.
- **`checks.hints.supabaseRestSecretStatus`** : sonde avec la clé secrète (si présente).
- **`checks.hints.supabasePublicRestOk`** : `true` si le public suffit ; `false` si le public est refusé (ex. `401`).
- **`checks.hints.supabaseRestNote`** : message court si seule la clé secrète « sauve » la sonde — le **navigateur** peut encore échouer tant que la clé publique est fausse.
- **`status: "degraded"`** : possible quand la base répond côté serveur mais **`supabasePublicRestOk === false`** (incohérence à corriger côté dashboard Supabase / variables Vercel).

## Vercel / URLs

- Ne pas désactiver les **System Environment Variables** (`VERCEL_URL`, `VERCEL_ENV`, etc.) si l’app ou les crons s’en servent.
- **Deployment Protection** sur les previews : `curl` sur une URL de preview peut renvoyer du HTML d’auth ; tester le **domaine de production** ou désactiver la protection pour les checks automatisés.

## Avant une release

```bash
npm run verify:release
```

Sans argument supplémentaire après la commande (npm transmettrait le reste au script).

## Déploiement production (CLI)

```bash
npm run deploy:prod
```

Équivalent à `vercel deploy --prod --yes` (compte / projet liés via `vercel link`).
