#!/usr/bin/env node
/**
 * Applique **toutes** les migrations `supabase/migrations/*.sql` (ordre alphabétique) sur Postgres.
 *
 * Prérequis : chaîne de connexion **directe** Postgres (pas l’URL REST).
 * Supabase → Project Settings → Database → Connection string → URI
 * (mode "Session" ou "Transaction", port 5432 ; remplacer [YOUR-PASSWORD]).
 *
 * Usage :
 *   DATABASE_URL="postgresql://postgres.xxx:5432/postgres" npm run db:apply-ecosystem
 *
 * Variables acceptées : DATABASE_URL ou SUPABASE_DB_URL
 * Option : DATABASE_SSL_DISABLE=1 si tu dois désactiver SSL (déconseillé en prod).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Client } = pg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function loadDotEnv(name) {
  const p = path.join(root, name)
  if (!fs.existsSync(p)) return
  const text = fs.readFileSync(p, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const k = trimmed.slice(0, eq).trim()
    let v = trimmed.slice(eq + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined) process.env[k] = v
  }
}

loadDotEnv('.env.local')
loadDotEnv('.env')

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
if (!url || /placeholder|your-project/i.test(url)) {
  console.error(`
[db:apply-ecosystem] Aucune DATABASE_URL / SUPABASE_DB_URL utilisable.

1. Ouvre Supabase → ton projet → Settings → Database
2. Sous "Connection string", choisis URI et copie (utilisateur postgres, mot de passe, host db.xxx.supabase.co)
3. Ajoute dans .env.local :

   DATABASE_URL=postgresql://postgres:[MOT-DE-PASSE]@db.xxxxx.supabase.co:5432/postgres

4. Relance : npm run db:apply-ecosystem
`)
  process.exit(1)
}

const migrationsDir = path.join(root, 'supabase', 'migrations')
if (!fs.existsSync(migrationsDir)) {
  console.error('[db:apply-ecosystem] Dossier introuvable:', migrationsDir)
  process.exit(1)
}
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()
if (migrationFiles.length === 0) {
  console.error('[db:apply-ecosystem] Aucun fichier .sql dans', migrationsDir)
  process.exit(1)
}

const ssl =
  process.env.DATABASE_SSL_DISABLE === '1'
    ? undefined
    : url.includes('supabase.co') || url.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined

const client = new Client({
  connectionString: url,
  ...(ssl ? { ssl } : {}),
})

function statementsFromFile(sqlPath) {
  const raw = fs.readFileSync(sqlPath, 'utf8')
  const withoutLineComments = raw.replace(/^\s*--[^\r\n]*$/gm, '')
  return withoutLineComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

async function main() {
  console.log('[db:apply-ecosystem] Connexion…')
  await client.connect()
  let n = 0
  for (const file of migrationFiles) {
    const sqlPath = path.join(migrationsDir, file)
    const statements = statementsFromFile(sqlPath)
    console.log(`[db:apply-ecosystem] Fichier ${file} (${statements.length} instruction(s))`)
    for (const st of statements) {
      await client.query(st + ';')
      n++
      const preview = st.split(/\s+/).slice(0, 4).join(' ')
      console.log(`  [${n}] OK · ${preview}…`)
    }
  }
  await client.end()
  console.log(`[db:apply-ecosystem] Terminé · ${n} instruction(s) sur ${migrationFiles.length} fichier(s).`)
  console.log('Prochaines étapes : coller SUPABASE_SERVICE_ROLE_KEY (Settings → API) dans Vercel + .env.local serveur.')
}

main().catch((err) => {
  console.error('[db:apply-ecosystem] Erreur:', err.message || err)
  client.end().catch(() => {})
  process.exit(1)
})
