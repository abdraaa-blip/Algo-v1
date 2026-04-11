/**
 * One-off: replace spaced em dash (U+2014) with middle dot + spaces in src/.
 * Run: node scripts/replace-em-dash-spaced.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', 'src')
const EM = '\u2014'
const NEEDLE = ` ${EM} `

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (/\.(tsx?|json|css)$/.test(p)) acc.push(p)
  }
  return acc
}

let n = 0
for (const p of walk(root)) {
  const s = fs.readFileSync(p, 'utf8')
  if (!s.includes(NEEDLE)) continue
  fs.writeFileSync(p, s.split(NEEDLE).join(' · '))
  n++
  console.log(p)
}
console.log(`Updated ${n} files.`)
