import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales')
const BASE_LOCALE = 'fr.json'

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function flattenKeys(obj, prefix = '', out = []) {
  if (!isObject(obj)) return out
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key
    if (isObject(value)) {
      flattenKeys(value, next, out)
    } else {
      out.push(next)
    }
  }
  return out
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}

function main() {
  const files = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()

  if (!files.includes(BASE_LOCALE)) {
    console.error(`[i18n-check] Base locale missing: ${BASE_LOCALE}`)
    process.exit(1)
  }

  const base = readJson(path.join(LOCALES_DIR, BASE_LOCALE))
  const baseKeys = new Set(flattenKeys(base))

  let hasError = false

  for (const file of files) {
    if (file === BASE_LOCALE) continue
    const localeData = readJson(path.join(LOCALES_DIR, file))
    const localeKeys = new Set(flattenKeys(localeData))

    const missing = [...baseKeys].filter((k) => !localeKeys.has(k))
    const extra = [...localeKeys].filter((k) => !baseKeys.has(k))

    if (missing.length || extra.length) {
      hasError = true
      console.error(`\n[i18n-check] ${file}`)
      if (missing.length) {
        console.error(`  Missing keys (${missing.length}):`)
        missing.slice(0, 25).forEach((k) => console.error(`    - ${k}`))
      }
      if (extra.length) {
        console.error(`  Extra keys (${extra.length}):`)
        extra.slice(0, 25).forEach((k) => console.error(`    - ${k}`))
      }
    }
  }

  if (hasError) {
    console.error('\n[i18n-check] Locale mismatch detected.')
    process.exit(1)
  }

  console.log(`[i18n-check] OK (${files.length} locale files checked)`)
}

main()
