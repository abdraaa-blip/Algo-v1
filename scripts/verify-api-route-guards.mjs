#!/usr/bin/env node
/**
 * Garde-fou : chaque handler `route.ts` sous `src/app/api` doit référencer une protection
 * anti-abus (rate-limiter partagé ou rateLimitMiddleware security), sauf exclusions connues.
 *
 * Usage : npm run verify:api-guards
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const apiRoot = path.join(root, 'src', 'app', 'api')

function walkRouteFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkRouteFiles(p, out)
    else if (ent.name === 'route.ts') out.push(p)
  }
  return out
}

function posix(p) {
  return p.split(path.sep).join('/')
}

function isExcluded(relPosix) {
  if (relPosix.includes('/api/cron/')) return true
  if (relPosix.endsWith('/api/billing/webhook/route.ts')) return true
  return false
}

function hasRateGuard(content) {
  if (/from\s+['"]@\/lib\/api\/rate-limiter['"]/.test(content)) return true
  if (content.includes('rateLimitMiddleware')) return true
  if (content.includes('withRateLimit')) return true
  return false
}

const files = walkRouteFiles(apiRoot)
const missing = []
let excluded = 0

for (const abs of files) {
  const rel = posix(path.relative(root, abs))
  if (isExcluded(rel)) {
    excluded++
    continue
  }
  const text = fs.readFileSync(abs, 'utf8')
  if (!hasRateGuard(text)) missing.push(rel)
}

if (missing.length > 0) {
  console.error('[verify-api-route-guards] Routes sans garde rate détectées :\n')
  for (const m of missing) console.error(`  - ${m}`)
  console.error(
    '\nAjoutez @/lib/api/rate-limiter (checkRateLimit) ou rateLimitMiddleware (@/lib/security), ou étendez les exclusions documentées (cron, webhook Stripe).\n'
  )
  process.exit(1)
}

console.log(
  `[verify-api-route-guards] OK — ${files.length} fichier(s) route.ts, ${excluded} exclus (cron + webhook), ${files.length - excluded} contrôlé(s).`
)
