import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const NEXT_DIR = path.join(ROOT, '.next')
const CHUNKS_DIR = path.join(NEXT_DIR, 'static', 'chunks')
const ROUTE_STATS_PATH = path.join(NEXT_DIR, 'diagnostics', 'route-bundle-stats.json')
const REPORTS_DIR = path.join(ROOT, 'reports')
const REPORT_PATH = path.join(REPORTS_DIR, 'performance-budget.json')

const BUDGET = {
  totalClientJsKB: 2200,
  largestChunkKB: 350,
  maxRouteFirstLoadJsKB: 1200,
}

function listJsFiles(dir) {
  if (!fs.existsSync(dir)) return []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listJsFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath)
    }
  }
  return files
}

function kb(bytes) {
  return bytes / 1024
}

function readRouteFirstLoadStats() {
  if (!fs.existsSync(ROUTE_STATS_PATH)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(ROUTE_STATS_PATH, 'utf8'))
    const routes = parsed?.routes && typeof parsed.routes === 'object' ? parsed.routes : parsed
    if (!routes || typeof routes !== 'object') return []

    return Object.entries(routes)
      .map(([route, value]) => {
        const obj = value && typeof value === 'object' ? value : {}
        const bytes =
          Number(obj.firstLoadJsBytes) ||
          Number(obj.firstLoadJSBytes) ||
          Number(obj.firstLoadJsSize) ||
          Number(obj.firstLoadJSSize) ||
          Number(obj.firstLoadJs) ||
          Number(obj.firstLoadJS) ||
          0
        return {
          route,
          firstLoadJsKB: Number(kb(bytes).toFixed(2)),
        }
      })
      .filter((r) => r.firstLoadJsKB > 0)
      .sort((a, b) => b.firstLoadJsKB - a.firstLoadJsKB)
  } catch {
    return []
  }
}

function main() {
  if (!fs.existsSync(NEXT_DIR)) {
    console.error('[perf-budget] Missing .next output. Run `npm run build` first.')
    process.exit(1)
  }

  const files = listJsFiles(CHUNKS_DIR)
  const stats = files.map((filePath) => {
    const size = fs.statSync(filePath).size
    return {
      file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
      sizeBytes: size,
      sizeKB: Number(kb(size).toFixed(2)),
    }
  })

  const totalClientJsKB = Number(kb(stats.reduce((acc, item) => acc + item.sizeBytes, 0)).toFixed(2))
  const largest = stats.sort((a, b) => b.sizeBytes - a.sizeBytes)[0] ?? null
  const largestChunkKB = largest ? largest.sizeKB : 0
  const routeStats = readRouteFirstLoadStats()
  const largestRoute = routeStats[0] ?? null

  const checks = {
    totalClientJsKB: {
      value: totalClientJsKB,
      budget: BUDGET.totalClientJsKB,
      pass: totalClientJsKB <= BUDGET.totalClientJsKB,
    },
    largestChunkKB: {
      value: largestChunkKB,
      budget: BUDGET.largestChunkKB,
      pass: largestChunkKB <= BUDGET.largestChunkKB,
      file: largest?.file ?? null,
    },
    maxRouteFirstLoadJsKB: {
      value: largestRoute?.firstLoadJsKB ?? 0,
      budget: BUDGET.maxRouteFirstLoadJsKB,
      pass: !largestRoute || largestRoute.firstLoadJsKB <= BUDGET.maxRouteFirstLoadJsKB,
      route: largestRoute?.route ?? null,
    },
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      chunksCount: stats.length,
      totalClientJsKB,
      largestChunkKB,
      largestRouteFirstLoadJsKB: largestRoute?.firstLoadJsKB ?? 0,
    },
    budget: BUDGET,
    checks,
    top10LargestChunks: stats.slice(0, 10),
    top10LargestRoutesByFirstLoad: routeStats.slice(0, 10),
  }

  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  console.log('[perf-budget] totalClientJsKB:', totalClientJsKB, `(budget ${BUDGET.totalClientJsKB})`)
  console.log('[perf-budget] largestChunkKB:', largestChunkKB, `(budget ${BUDGET.largestChunkKB})`)
  if (largest?.file) {
    console.log('[perf-budget] largest chunk:', largest.file)
  }
  if (largestRoute?.route) {
    console.log('[perf-budget] largest route first-load:', largestRoute.route, `${largestRoute.firstLoadJsKB}KB`)
  }
  console.log(`[perf-budget] report: ${REPORT_PATH}`)

  const allPass =
    checks.totalClientJsKB.pass &&
    checks.largestChunkKB.pass &&
    checks.maxRouteFirstLoadJsKB.pass
  if (!allPass) {
    console.error('[perf-budget] Budget exceeded.')
    process.exit(1)
  }

  console.log('[perf-budget] OK')
}

main()
