#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- script Node en CommonJS */
/**
 * ALGO Cache Clear Script
 * Clears Next.js/Turbopack cache to fix stale compilation errors
 * 
 * Usage: node scripts/clear-cache.js
 */

const fs = require('fs');
const path = require('path');

const CACHE_DIRS = [
  '.next',
  'node_modules/.cache',
  '.turbo'
];

console.log('🧹 ALGO Cache Clear');
console.log('==================\n');

const projectRoot = path.resolve(__dirname, '..');

for (const dir of CACHE_DIRS) {
  const fullPath = path.join(projectRoot, dir);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✓ Deleted: ${dir}`);
    } catch (error) {
      console.log(`✗ Failed to delete ${dir}: ${error.message}`);
    }
  } else {
    console.log(`- Skipped: ${dir} (not found)`);
  }
}

console.log('\n✅ Cache cleared! Run "pnpm dev" to restart.\n');
