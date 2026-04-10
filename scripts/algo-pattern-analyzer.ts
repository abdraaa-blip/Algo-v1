#!/usr/bin/env npx tsx
/**
 * ALGO Pattern Analyzer
 * Learns from autopilot runs and suggests architectural improvements
 * 
 * Run: npx tsx scripts/algo-pattern-analyzer.ts
 */

import * as fs from 'fs'

const CONFIG = {
  LOG_FILE: 'reports/autopilot-log.json',
  PATTERNS_FILE: 'reports/patterns-analysis.json',
  SUGGESTIONS_FILE: 'reports/suggestions.md',
}

interface AutopilotLog {
  runs: Array<{
    timestamp: string
    totalIssues: number
    totalFixed: number
    duration: number
  }>
  patterns: Record<string, number>
  lastRun: string
}

interface PatternAnalysis {
  mostCommonIssues: Array<{ type: string; count: number; percentage: number }>
  trendsOverTime: Array<{ week: string; totalIssues: number }>
  hotspotFiles: Array<{ file: string; issueCount: number }>
  suggestions: string[]
  generatedAt: string
}

function log(message: string, type: 'info' | 'success' | 'warning' = 'info') {
  const colors = { info: '\x1b[36m', success: '\x1b[32m', warning: '\x1b[33m' }
  console.log(`${colors[type]}[ANALYZER]${'\x1b[0m'} ${message}`)
}

function loadLog(): AutopilotLog | null {
  try {
    if (!fs.existsSync(CONFIG.LOG_FILE)) return null
    return JSON.parse(fs.readFileSync(CONFIG.LOG_FILE, 'utf-8'))
  } catch {
    return null
  }
}

function analyzePatterns(log: AutopilotLog): PatternAnalysis {
  const analysis: PatternAnalysis = {
    mostCommonIssues: [],
    trendsOverTime: [],
    hotspotFiles: [],
    suggestions: [],
    generatedAt: new Date().toISOString(),
  }

  // Calculate most common issues
  const totalPatterns = Object.values(log.patterns).reduce((a, b) => a + b, 0)
  analysis.mostCommonIssues = Object.entries(log.patterns)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalPatterns) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Generate suggestions based on patterns
  analysis.suggestions = generateSuggestions(analysis.mostCommonIssues)

  return analysis
}

function generateSuggestions(issues: Array<{ type: string; count: number; percentage: number }>): string[] {
  const suggestions: string[] = []

  for (const issue of issues) {
    if (issue.percentage > 20) {
      switch (issue.type) {
        case 'unused-import':
          suggestions.push(
            `**High unused imports (${issue.percentage}%)**: Consider adding eslint-plugin-unused-imports with auto-fix on save.`
          )
          break
        case 'any-type':
          suggestions.push(
            `**High 'any' usage (${issue.percentage}%)**: Enable strict TypeScript mode and add type generation for API responses.`
          )
          break
        case 'console-log':
          suggestions.push(
            `**Console statements (${issue.percentage}%)**: Add ESLint rule 'no-console' with error severity.`
          )
          break
        case 'hardcoded-string':
          suggestions.push(
            `**Hardcoded strings (${issue.percentage}%)**: Consider implementing i18n extraction tool for automatic locale key generation.`
          )
          break
        case 'missing-alt':
          suggestions.push(
            `**Missing alt text (${issue.percentage}%)**: Add eslint-plugin-jsx-a11y with 'alt-text' rule.`
          )
          break
        case 'typescript-error':
          suggestions.push(
            `**TypeScript errors (${issue.percentage}%)**: Review tsconfig.json strict settings and add pre-commit TypeScript check.`
          )
          break
      }
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Codebase is healthy! No major pattern issues detected.')
  }

  return suggestions
}

function generateReport(analysis: PatternAnalysis): string {
  let report = `# ALGO Pattern Analysis Report\n\n`
  report += `Generated: ${new Date().toLocaleString()}\n\n`

  report += `## Most Common Issues\n\n`
  report += `| Issue Type | Count | Percentage |\n`
  report += `|------------|-------|------------|\n`
  for (const issue of analysis.mostCommonIssues) {
    report += `| ${issue.type} | ${issue.count} | ${issue.percentage}% |\n`
  }
  report += `\n`

  report += `## Architectural Suggestions\n\n`
  for (const suggestion of analysis.suggestions) {
    report += `- ${suggestion}\n`
  }
  report += `\n`

  report += `## Recommended ESLint Rules\n\n`
  report += `\`\`\`json
{
  "rules": {
    "no-console": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "jsx-a11y/alt-text": "error",
    "import/no-unused-modules": "error"
  }
}
\`\`\`\n\n`

  report += `## Recommended TypeScript Settings\n\n`
  report += `\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
\`\`\`\n`

  return report
}

async function main() {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║        ALGO Pattern Analyzer - Learning System             ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('\n')

  const autopilotLog = loadLog()

  if (!autopilotLog) {
    log('No autopilot log found. Run autopilot first.', 'warning')
    process.exit(1)
  }

  log(`Analyzing ${autopilotLog.runs.length} autopilot runs...`)

  const analysis = analyzePatterns(autopilotLog)

  // Save analysis
  fs.writeFileSync(CONFIG.PATTERNS_FILE, JSON.stringify(analysis, null, 2))
  log(`Analysis saved to ${CONFIG.PATTERNS_FILE}`, 'success')

  // Generate markdown report
  const report = generateReport(analysis)
  fs.writeFileSync(CONFIG.SUGGESTIONS_FILE, report)
  log(`Suggestions saved to ${CONFIG.SUGGESTIONS_FILE}`, 'success')

  // Print summary
  console.log('\n' + '═'.repeat(60))
  console.log('TOP ISSUES:')
  for (const issue of analysis.mostCommonIssues.slice(0, 5)) {
    console.log(`  ${issue.type}: ${issue.count} (${issue.percentage}%)`)
  }
  console.log('\nSUGGESTIONS:')
  for (const suggestion of analysis.suggestions.slice(0, 3)) {
    console.log(`  • ${suggestion.replace(/\*\*/g, '')}`)
  }
  console.log('═'.repeat(60) + '\n')

  log('Pattern analysis complete!', 'success')
}

main().catch(console.error)
