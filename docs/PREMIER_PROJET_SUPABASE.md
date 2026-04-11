# Nouveau projet Supabase · checklist courte

Tu repars de zéro : **aucune ancienne clé**. Suis l’ordre.

## 1. Créer le projet

1. Va sur [https://supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Choisis région + mot de passe base (note-le dans un gestionnaire, **ne le colle nulle part en public**).
3. Attends que le projet soit **vert / Ready**.

## 2. Récupérer URL + clés (même projet, tout le temps)

1. Menu **Project Settings** (engrenage) → **API** :  
   [https://supabase.com/dashboard/project/_/settings/api](https://supabase.com/dashboard/project/_/settings/api)  
   (remplace par ton projet si besoin.)
2. Copie :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Clé **publique** : soit **anon** (`eyJ…`), soit **Publishable** (`sb_publishable_…`)  
 → `NEXT_PUBLIC_SUPABASE_ANON_KEY` **ou** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Clé **secrète** (serveur uniquement) : **service_role** (`eyJ…`) **ou** **Secret** (`sb_secret_…`)  
     → `SUPABASE_SERVICE_ROLE_KEY` **ou** `SUPABASE_SECRET_KEY`

## 3. Fichier `.env.local` (à la racine du repo ALGO)

Crée le fichier **`.env.local`** (il ne doit **pas** être commité). Modèle :

```env
NEXT_PUBLIC_SUPABASE_URL=https://TON_REF.supabase.co

# UNE des deux (publique) :
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# UNE des deux (secrète, jamais dans le navigateur) :
SUPABASE_SECRET_KEY=sb_secret_...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 4. Créer les tables SQL

1. **Settings → Database** → **Connection string** → URI (Postgres, port **5432** si possible).
2. Mets la ligne dans `.env.local` :  
   `DATABASE_URL=postgresql://postgres.[REF]:[MOT_DE_PASSE]@db.[REF].supabase.co:5432/postgres`
3. Dans le dossier du projet :  
   `npm run db:apply-ecosystem`

## 5. Vercel (si tu déploies là)

**Settings → Environment Variables** : les **mêmes** noms et valeurs que `.env.local` (sans `DATABASE_URL` si tu n’en as pas besoin sur Vercel pour le build).

Ajoute aussi : `CRON_SECRET` (long texte aléatoire) pour les `/api/cron/*`.

## 6. Vérifier

```bash
npm run ecosystem:check
npm run dev
```

Ouvre le site : login / pages qui utilisent Supabase doivent répondre sans erreur « missing Supabase ».

---

**Règle d’or :** une seule URL `*.supabase.co` + les clés **de ce projet-là** uniquement. Ne mélange pas deux projets.
