#!/usr/bin/env node
/**
 * ALGO — nettoyage des caches de build locaux (répertoires régénérés au prochain `dev` / `build`).
 *
 * Usage:
 *   npm run clean
 *   node scripts/clear-cache.js
 *   node scripts/clear-cache.js --dry-run
 *
 * Ne supprime pas `node_modules` entier, pas de données utilisateur, pas de quarantaine runtime :
 * uniquement `.next`, `node_modules/.cache`, `.turbo` s’ils existent.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CACHE_DIRS = ['.next', 'node_modules/.cache', '.turbo'];

const dryRun = process.argv.includes('--dry-run');

const projectRoot = path.resolve(__dirname, '..');

console.log('ALGO cache clear');
console.log('================');
if (dryRun) {
  console.log('(dry-run: aucune suppression)\n');
} else {
  console.log('');
}

for (const dir of CACHE_DIRS) {
  const fullPath = path.join(projectRoot, dir);

  if (!fs.existsSync(fullPath)) {
    console.log(`- Skipped: ${dir} (not found)`);
    continue;
  }

  if (dryRun) {
    console.log(`Would delete: ${dir}`);
    continue;
  }

  try {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Deleted: ${dir}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Failed: ${dir} — ${message}`);
  }
}

console.log('');
if (dryRun) {
  console.log('Dry-run done. Remove --dry-run to delete.');
} else {
  console.log('Done. Run npm run dev or npm run build as needed.');
}
