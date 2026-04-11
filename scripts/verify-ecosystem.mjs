#!/usr/bin/env node
/**
 * Vérifie la configuration écosystème (variables, migration SQL) et rappelle les jobs automatiques.
 * Usage : npm run ecosystem:check
 *         npm run ecosystem:check:strict  → exit 1 si Supabase URL sans service role
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

function has(k) {
  const v = process.env[k]
  return v != null && String(v).trim() !== '' && !String(v).includes('your-')
}

console.log('ALGO ecosystem · verification\n')

const platformOk = has('ALGO_PLATFORM_API_KEY') || has('ALGO_PLATFORM_API_KEYS')
console.log(`  ${platformOk ? '[ok]' : '[--]'} ALGO_PLATFORM_API_KEY / ALGO_PLATFORM_API_KEYS · /api/v1/*`)

const rows = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'URL projet Supabase'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Cle publique JWT anon (optionnel si PUBLISHABLE)'],
  ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'Cle publique sb_publishable (optionnel si ANON)'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'Cle secrete JWT service_role (optionnel si SECRET_KEY)'],
  ['SUPABASE_SECRET_KEY', 'Cle secrete sb_secret (optionnel si SERVICE_ROLE)'],
  ['CRON_SECRET', 'Securise GET /api/cron/* (Vercel Cron)'],
]

for (const [key, label] of rows) {
  console.log(`  ${has(key) ? '[ok]' : '[--]'} ${key} · ${label}`)
}

const hasPublicSupabaseKey = has('NEXT_PUBLIC_SUPABASE_ANON_KEY') || has('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
const hasSecretSupabaseKey = has('SUPABASE_SERVICE_ROLE_KEY') || has('SUPABASE_SECRET_KEY')
console.log(
  `  ${hasPublicSupabaseKey ? '[ok]' : '[--]'} Cle publique Supabase (ANON ou PUBLISHABLE) · requise pour le client`
)
console.log(
  `  ${hasSecretSupabaseKey ? '[ok]' : '[--]'} Cle secrete Supabase (SERVICE_ROLE ou SECRET_KEY) · snapshots / radar SQL`
)

console.log(`  ${has('ALGO_SNAPSHOT_PERSIST') ? '[ok]' : '[--]'} ALGO_SNAPSHOT_PERSIST · persistance sur chaque GET /api/v1/trends`)

const regions = process.env.ALGO_SNAPSHOT_CRON_REGIONS
console.log(
  `  ${regions ? '[ok]' : '[--]'} ALGO_SNAPSHOT_CRON_REGIONS · ${regions || 'defaut ALL,FR,US (cron)'}`
)

const radarRegions = process.env.ALGO_RADAR_CRON_REGIONS
console.log(
   `  ${radarRegions ? '[ok]' : '[--]'} ALGO_RADAR_CRON_REGIONS · ${radarRegions || 'defaut FR,US (cron radar)'}`
)

const migs = [
  path.join(root, 'supabase', 'migrations', '20260409120000_algo_ecosystem_snapshots.sql'),
  path.join(root, 'supabase', 'migrations', '20260409130000_intelligence_radar_point.sql'),
]
console.log('')
for (const mig of migs) {
  console.log(`  ${fs.existsSync(mig) ? '[ok]' : '[!!]'} ${path.relative(root, mig)}`)
}

console.log(`  ${has('DATABASE_URL') || has('SUPABASE_DB_URL') ? '[ok]' : '[--]'} DATABASE_URL / SUPABASE_DB_URL · npm run db:apply-ecosystem`)

console.log('\nJobs automatises (code deja en place) :')
console.log('  - Vercel Cron : GET /api/cron/snapshot-trends (toutes les 20 min)')
console.log('  - Vercel Cron : GET /api/cron/radar-snapshot (toutes les 15 min) · historique intelligence')
console.log('  - POST /api/viral-analyzer : insert viral_score_snapshot si service role')
console.log('  - GET /api/v1/trends : insert trend_signal si ALGO_SNAPSHOT_PERSIST=1')

const strict = process.argv.includes('--strict')
if (strict && has('NEXT_PUBLIC_SUPABASE_URL') && !hasSecretSupabaseKey) {
  console.error(
    '\n[strict] SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY requis quand NEXT_PUBLIC_SUPABASE_URL est defini.'
  )
  process.exit(1)
}

process.exit(0)
