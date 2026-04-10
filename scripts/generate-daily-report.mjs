import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const REPORTS_DIR = path.join(ROOT, 'reports')
const PERF_REPORT = path.join(REPORTS_DIR, 'performance-budget.json')
const AUTOPILOT_REPORT = path.join(REPORTS_DIR, 'autopilot-log.json')
const OUT_JSON = path.join(REPORTS_DIR, 'daily-system-report.json')
const OUT_MD = path.join(REPORTS_DIR, 'daily-system-report.md')
const ADAPTIVE_HISTORY = path.join(REPORTS_DIR, 'adaptive-weights-history.json')

function readJsonIfExists(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function detectSeverity(perfReport) {
  const checks = perfReport?.checks || {}
  const failures = Object.values(checks).filter((c) => c && c.pass === false).length
  if (failures > 0) return 'high'
  return 'low'
}

function summarize(perfReport, autopilotReport) {
  const perfSummary = perfReport?.summary || {}
  const latestAutopilotRun = Array.isArray(autopilotReport?.runs)
    ? autopilotReport.runs[autopilotReport.runs.length - 1] || null
    : null

  const baselineWeights = {
    hook: 0.25,
    trend: 0.3,
    format: 0.15,
    emotion: 0.15,
    timing: 0.15,
  }
  const baselineVersion = getWeightVersion(baselineWeights)

  return {
    generatedAt: new Date().toISOString(),
    status: {
      severity: detectSeverity(perfReport),
      releaseReady: Boolean(perfReport?.checks?.totalClientJsKB?.pass && perfReport?.checks?.largestChunkKB?.pass),
    },
    performance: {
      totalClientJsKB: perfSummary.totalClientJsKB ?? null,
      largestChunkKB: perfSummary.largestChunkKB ?? null,
      largestRouteFirstLoadJsKB: perfSummary.largestRouteFirstLoadJsKB ?? null,
      checks: perfReport?.checks ?? {},
    },
    autopilot: {
      hasReport: Boolean(latestAutopilotRun),
      latestRun: latestAutopilotRun,
    },
    adaptiveModelAudit: {
      enabled: true,
      baselineWeights,
      baselineVersion,
      maxWeightShiftPerSignal: 0.03,
      blendStrategy: 'adaptive+baseline mean',
      autoRollbackRule: 'frictionRate > 0.20 OR (frictionRate > 0.12 AND engagementRate < 0.10)',
      safeguards: [
        'weights are clamped per signal family',
        'weights are normalized before scoring',
        'adaptive mode falls back to baseline if signals are unavailable',
        'automatic rollback to baseline on degraded quality signals',
      ],
      runtimeSignals: 'sourced from /api/analytics/events adaptiveSignals',
    },
    recommendations: [
      'Prioriser la reduction du JS partage sur les routes avec first-load eleve.',
      'Surveiller les regressions de taille de bundle a chaque PR.',
      'Analyser les incidents cron et renforcer les retries/idempotence en cas d echec source externe.',
    ],
  }
}

function getWeightVersion(weights) {
  const signature = [
    Number(weights.hook).toFixed(4),
    Number(weights.trend).toFixed(4),
    Number(weights.format).toFixed(4),
    Number(weights.emotion).toFixed(4),
    Number(weights.timing).toFixed(4),
  ].join('|')
  let hash = 0
  for (let i = 0; i < signature.length; i++) {
    hash = (hash << 5) - hash + signature.charCodeAt(i)
    hash |= 0
  }
  return `w_${Math.abs(hash)}`
}

function updateAdaptiveHistory(report) {
  const existing = readJsonIfExists(ADAPTIVE_HISTORY, [])
  const history = Array.isArray(existing) ? existing : []
  history.push({
    generatedAt: report.generatedAt,
    baselineVersion: report.adaptiveModelAudit.baselineVersion,
    baselineWeights: report.adaptiveModelAudit.baselineWeights,
    autoRollbackRule: report.adaptiveModelAudit.autoRollbackRule,
  })
  const trimmed = history.slice(-30)
  fs.writeFileSync(ADAPTIVE_HISTORY, JSON.stringify(trimmed, null, 2))
}

function toMarkdown(report) {
  return [
    '# ALGO Daily System Report',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Severity: ${report.status.severity}`,
    `- Release ready: ${report.status.releaseReady ? 'yes' : 'no'}`,
    '',
    '## Performance',
    `- Total client JS (KB): ${report.performance.totalClientJsKB ?? 'n/a'}`,
    `- Largest chunk (KB): ${report.performance.largestChunkKB ?? 'n/a'}`,
    `- Largest route first-load JS (KB): ${report.performance.largestRouteFirstLoadJsKB ?? 'n/a'}`,
    '',
    '## Autopilot',
    `- Report present: ${report.autopilot.hasReport ? 'yes' : 'no'}`,
    '',
    '## Adaptive Model Audit',
    `- Enabled: ${report.adaptiveModelAudit.enabled ? 'yes' : 'no'}`,
    `- Baseline version: ${report.adaptiveModelAudit.baselineVersion}`,
    `- Baseline weights: ${JSON.stringify(report.adaptiveModelAudit.baselineWeights)}`,
    `- Max shift per signal: ${report.adaptiveModelAudit.maxWeightShiftPerSignal}`,
    `- Blend strategy: ${report.adaptiveModelAudit.blendStrategy}`,
    `- Auto rollback rule: ${report.adaptiveModelAudit.autoRollbackRule}`,
    ...report.adaptiveModelAudit.safeguards.map((item) => `- Safeguard: ${item}`),
    `- Runtime signals: ${report.adaptiveModelAudit.runtimeSignals}`,
    '',
    '## Recommendations',
    ...report.recommendations.map((item) => `- ${item}`),
    '',
  ].join('\n')
}

function main() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
  }

  const perfReport = readJsonIfExists(PERF_REPORT, {})
  const autopilotReport = readJsonIfExists(AUTOPILOT_REPORT, {})
  const report = summarize(perfReport, autopilotReport)
  updateAdaptiveHistory(report)

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2))
  fs.writeFileSync(OUT_MD, toMarkdown(report))

  console.log(`[daily-report] Wrote ${OUT_JSON}`)
  console.log(`[daily-report] Wrote ${OUT_MD}`)
}

main()
