#!/usr/bin/env npx tsx
/**
 * ALGO Autopilot - Automatic Codebase Cleaning & Correction System
 * 
 * This script automatically:
 * 1. Detects all code issues (TypeScript, ESLint, accessibility, etc.)
 * 2. Fixes issues automatically where possible
 * 3. Verifies all fixes are correct
 * 4. Generates comprehensive reports
 * 
 * Run: npx tsx scripts/algo-autopilot.ts
 *
 * CI (GITHUB_ACTIONS / CI=true) : mode **lecture + correctifs minimaux** par défaut
 * (pas de `eslint --fix` massif, pas de Prettier sur tout `src/`, pas de suppression
 * d’imports « inutilisés » ni de mutation des `console.*`) — ces étapes cassent
 * souvent `tsc` à cause de faux positifs. Forcer l’ancien comportement :
 * `AUTOPILOT_AGGRESSIVE=1`.
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  MAX_CYCLES: 10,
  PROJECT_ROOT: process.cwd(),
  SRC_DIR: 'src',
  LOCALES_DIR: 'locales',
  REPORT_DIR: 'reports',
  LOG_FILE: 'reports/autopilot-log.json',
}

/** Sur CI (GitHub Actions, etc.) : évite les auto-fix destructeurs qui cassent `tsc`. */
function isCiSafeMode(): boolean {
  const ci = process.env.CI
  const onCiRunner =
    process.env.GITHUB_ACTIONS === 'true' ||
    ci === 'true' ||
    ci === '1' ||
    String(ci).toLowerCase() === 'true'
  const aggressive = process.env.AUTOPILOT_AGGRESSIVE
  return (
    onCiRunner &&
    aggressive !== '1' &&
    aggressive !== 'true'
  )
}

/**
 * `autopilot:quick` : ne pas bloquer sur les centaines de signalements « style » /
 * i18n / couleurs — même logique qu’en CI. Défini par `.husky/pre-commit` via
 * `AUTOPILOT_PRE_COMMIT=1` pour ne pas exiger un dépôt entièrement « clean ».
 */
function isAutopilotQuickLenient(): boolean {
  if (process.env.AUTOPILOT_AGGRESSIVE === '1' || process.env.AUTOPILOT_AGGRESSIVE === 'true') {
    return false
  }
  return isCiSafeMode() || process.env.AUTOPILOT_PRE_COMMIT === '1'
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Issue {
  type: string
  file: string
  line: number
  column?: number
  message: string
  severity: 'error' | 'warning' | 'info'
  fixable: boolean
  fixed?: boolean
}

interface Report {
  timestamp: string
  cycle: number
  issues: Issue[]
  fixed: Issue[]
  remaining: Issue[]
  stats: {
    totalIssues: number
    totalFixed: number
    totalRemaining: number
    byType: Record<string, number>
  }
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

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
  }
  const reset = '\x1b[0m'
  const prefix = {
    info: 'INFO',
    success: 'OK',
    error: 'ERROR',
    warning: 'WARN',
  }
  console.log(`${colors[type]}[AUTOPILOT ${prefix[type]}]${reset} ${message}`)
}

function runCommand(command: string, ignoreError = false): string {
  try {
    return execSync(command, { 
      encoding: 'utf-8', 
      cwd: CONFIG.PROJECT_ROOT,
      stdio: ['pipe', 'pipe', 'pipe']
    })
  } catch (error: unknown) {
    if (ignoreError) {
      const execError = error as { stdout?: string; stderr?: string }
      return execError.stdout || execError.stderr || ''
    }
    throw error
  }
}

function ensureDir(dir: string) {
  const fullPath = path.join(CONFIG.PROJECT_ROOT, dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }
}

function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = []
  const fullPath = path.join(CONFIG.PROJECT_ROOT, dir)
  
  if (!fs.existsSync(fullPath)) return files
  
  function walk(currentPath: string) {
    const items = fs.readdirSync(currentPath)
    for (const item of items) {
      const itemPath = path.join(currentPath, item)
      const stat = fs.statSync(itemPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(itemPath)
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(itemPath)
      }
    }
  }
  
  walk(fullPath)
  return files
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: AUTOMATIC DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

class IssueDetector {
  private issues: Issue[] = []

  async detectAll(): Promise<Issue[]> {
    log('Starting automatic detection...')
    this.issues = []

    await Promise.all([
      this.detectTypeScriptErrors(),
      this.detectESLintWarnings(),
      this.detectUnusedImports(),
      this.detectHardcodedStrings(),
      this.detectHardcodedColors(),
      this.detectMissingAltText(),
      this.detectMissingAriaLabels(),
      this.detectAnyTypes(),
      this.detectConsoleLogs(),
      this.detectTodoComments(),
      this.detectMissingTranslations(),
    ])

    log(`Detection complete: ${this.issues.length} issues found`, 'info')
    return this.issues
  }

  private async detectTypeScriptErrors() {
    log('Checking TypeScript errors...')
    try {
      const output = runCommand('npx tsc --noEmit 2>&1', true)
      const lines = output.split('\n')
      
      for (const line of lines) {
        const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS\d+: (.+)$/)
        if (match) {
          this.issues.push({
            type: 'typescript-error',
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            message: match[4],
            severity: 'error',
            fixable: false,
          })
        }
      }
    } catch {
      log('TypeScript check failed', 'warning')
    }
  }

  private async detectESLintWarnings() {
    log('Checking ESLint warnings...')
    try {
      const output = runCommand('npx eslint src --format json 2>&1', true)
      try {
        const results = JSON.parse(output)
        for (const result of results) {
          for (const msg of result.messages || []) {
            this.issues.push({
              type: 'eslint',
              file: result.filePath,
              line: msg.line || 0,
              column: msg.column,
              message: msg.message,
              severity: msg.severity === 2 ? 'error' : 'warning',
              fixable: msg.fix !== undefined,
            })
          }
        }
      } catch {
        // ESLint output not JSON, skip
      }
    } catch {
      log('ESLint check skipped', 'warning')
    }
  }

  private async detectUnusedImports() {
    log('Checking unused imports...')
    const files = getAllFiles(CONFIG.SRC_DIR, ['.ts', '.tsx'])
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const importMatches = content.matchAll(/import\s+(?:{([^}]+)}|(\w+))\s+from/g)
      
      for (const match of importMatches) {
        const imports = (match[1] || match[2] || '').split(',').map(s => s.trim().split(' as ')[0].trim())
        
        for (const imp of imports) {
          if (!imp || imp === 'type') continue
          
          // Check if import is used (simple check)
          const restOfFile = content.slice(content.indexOf(match[0]) + match[0].length)
          const usageRegex = new RegExp(`\\b${imp}\\b`)
          
          if (!usageRegex.test(restOfFile)) {
            const lineNum = content.slice(0, content.indexOf(match[0])).split('\n').length
            this.issues.push({
              type: 'unused-import',
              file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
              line: lineNum,
              message: `Unused import: ${imp}`,
              severity: 'warning',
              fixable: true,
            })
          }
        }
      }
    }
  }

  private async detectHardcodedStrings() {
    log('Checking hardcoded strings...')
    const files = getAllFiles(CONFIG.SRC_DIR, ['.tsx'])
    const uiStringPattern = />\s*["']([A-Z][a-zA-Z\s]{10,})["']\s*</g
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.matchAll(uiStringPattern)
      
      for (const match of matches) {
        const lineNum = content.slice(0, match.index).split('\n').length
        this.issues.push({
          type: 'hardcoded-string',
          file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
          line: lineNum,
          message: `Hardcoded string should be in locales: "${match[1].slice(0, 30)}..."`,
          severity: 'info',
          fixable: false,
        })
      }
    }
  }

  private async detectHardcodedColors() {
    log('Checking hardcoded colors...')
    const files = getAllFiles(CONFIG.SRC_DIR, ['.tsx', '.ts'])
    // Match hex colors not in CSS variables or Tailwind
    const colorPattern = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g
    
    for (const file of files) {
      if (file.includes('globals.css')) continue
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.matchAll(colorPattern)
      
      for (const match of matches) {
        const lineNum = content.slice(0, match.index).split('\n').length
        // Skip if it's in a comment or CSS variable definition
        const line = content.split('\n')[lineNum - 1]
        if (line.includes('//') || line.includes('--') || line.includes('hsl(')) continue
        
        this.issues.push({
          type: 'hardcoded-color',
          file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
          line: lineNum,
          message: `Hardcoded color ${match[0]} should use design token`,
          severity: 'info',
          fixable: false,
        })
      }
    }
  }

  private async detectMissingAltText() {
    log('Checking missing alt text...')
    const files = getAllFiles(CONFIG.SRC_DIR, ['.tsx'])
    const imgPattern = /<(?:img|Image)[^>]*(?!alt=)[^>]*>/g
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.matchAll(imgPattern)
      
      for (const match of matches) {
        if (match[0].includes('alt=')) continue
        const lineNum = content.slice(0, match.index).split('\n').length
        this.issues.push({
          type: 'missing-alt',
          file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
          line: lineNum,
          message: 'Image missing alt attribute',
          severity: 'warning',
          fixable: true,
        })
      }
    }
  }

  private async detectMissingAriaLabels() {
    log('Checking missing aria-labels...')
    const files = getAllFiles(CONFIG.SRC_DIR, ['.tsx'])
    const buttonPattern = /<button[^>]*(?!aria-label)[^>]*>[^<]*<\/button>/g
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.matchAll(buttonPattern)
      
      for (const match of matches) {
        // Skip if button has text content
        if (match[0].includes('>') && !match[0].match(/>[\s]*<\/button>/)) continue
        if (match[0].includes('aria-label')) continue
        
        const lineNum = content.slice(0, match.index).split('\n').length
        this.issues.push({
          type: 'missing-aria-label',
          file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
          line: lineNum,
          message: 'Icon-only button missing aria-label',
          severity: 'warning',
          fixable: true,
        })
      }
    }
  }

  private async detectAnyTypes() {
    log('Checking any types...')
    const files = getAllFiles(CONFIG.SRC_DIR, ['.ts', '.tsx'])
    const anyPattern = /:\s*any\b/g
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.matchAll(anyPattern)
      
      for (const match of matches) {
        const lineNum = content.slice(0, match.index).split('\n').length
        this.issues.push({
          type: 'any-type',
          file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
          line: lineNum,
          message: 'Usage of "any" type - should use specific type',
          severity: 'warning',
          fixable: false,
        })
      }
    }
  }

  private async detectConsoleLogs() {
    log('Checking console.log statements...')
    const files = getAllFiles(CONFIG.SRC_DIR, ['.ts', '.tsx'])
    const consolePattern = /console\.(log|warn|error|info|debug)\(/g
    
    for (const file of files) {
      // Skip service files that might need logging
      if (file.includes('Service') || file.includes('api/')) continue
      
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.matchAll(consolePattern)
      
      for (const match of matches) {
        // Skip if it's a [v0] debug log or in a catch block
        const lineNum = content.slice(0, match.index).split('\n').length
        const line = content.split('\n')[lineNum - 1]
        if (line.includes('[v0]') || line.includes('[ALGO]')) continue
        
        this.issues.push({
          type: 'console-log',
          file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
          line: lineNum,
          message: `console.${match[1]} should be removed in production`,
          severity: 'info',
          fixable: true,
        })
      }
    }
  }

  private async detectTodoComments() {
    log('Checking TODO comments...')
    const files = getAllFiles(CONFIG.SRC_DIR, ['.ts', '.tsx'])
    const todoPattern = /\/\/\s*(TODO|FIXME|HACK|XXX):/gi
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.matchAll(todoPattern)
      
      for (const match of matches) {
        const lineNum = content.slice(0, match.index).split('\n').length
        const line = content.split('\n')[lineNum - 1]
        this.issues.push({
          type: 'todo-comment',
          file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
          line: lineNum,
          message: line.trim(),
          severity: 'info',
          fixable: false,
        })
      }
    }
  }

  private async detectMissingTranslations() {
    log('Checking missing translations...')
    
    // Load existing translations
    const frPath = path.join(CONFIG.PROJECT_ROOT, CONFIG.LOCALES_DIR, 'fr.json')
    const enPath = path.join(CONFIG.PROJECT_ROOT, CONFIG.LOCALES_DIR, 'en.json')
    
    if (!fs.existsSync(frPath) || !fs.existsSync(enPath)) return
    
    const frJson = JSON.parse(fs.readFileSync(frPath, 'utf-8'))
    const enJson = JSON.parse(fs.readFileSync(enPath, 'utf-8'))
    
    // Find all translation keys used in code
    const files = getAllFiles(CONFIG.SRC_DIR, ['.tsx', '.ts'])
    const tPattern = /t\(['"]([^'"]+)['"]\)/g
    
    function hasKey(obj: Record<string, unknown>, keyPath: string): boolean {
      const keys = keyPath.split('.')
      let current: unknown = obj
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = (current as Record<string, unknown>)[key]
        } else {
          return false
        }
      }
      return true
    }
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.matchAll(tPattern)
      
      for (const match of matches) {
        const key = match[1]
        const lineNum = content.slice(0, match.index).split('\n').length
        
        if (!hasKey(frJson, key)) {
          this.issues.push({
            type: 'missing-translation-fr',
            file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
            line: lineNum,
            message: `Missing French translation for key: ${key}`,
            severity: 'warning',
            fixable: true,
          })
        }
        
        if (!hasKey(enJson, key)) {
          this.issues.push({
            type: 'missing-translation-en',
            file: file.replace(CONFIG.PROJECT_ROOT + '/', ''),
            line: lineNum,
            message: `Missing English translation for key: ${key}`,
            severity: 'warning',
            fixable: true,
          })
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: AUTOMATIC CORRECTION
// ═══════════════════════════════════════════════════════════════════════════════

class IssueFixer {
  private fixed: Issue[] = []

  async fixAll(issues: Issue[]): Promise<Issue[]> {
    log('Starting automatic correction...')
    this.fixed = []

    const fixSafe = isAutopilotQuickLenient()
    if (fixSafe) {
      log(
        'Autopilot lenient (CI ou pre-commit): skip eslint --fix global, Prettier, unused-import et mutations console (AUTOPILOT_AGGRESSIVE=1 pour forcer).',
        'warning',
      )
    } else {
      await this.runESLintFix()
    }

    for (const issue of issues) {
      if (!issue.fixable) continue

      switch (issue.type) {
        case 'unused-import':
          if (!fixSafe) await this.fixUnusedImport(issue)
          break
        case 'console-log':
          if (!fixSafe) await this.fixConsoleLog(issue)
          break
        case 'missing-alt':
          await this.fixMissingAlt(issue)
          break
        case 'missing-aria-label':
          await this.fixMissingAriaLabel(issue)
          break
      }
    }

    if (!fixSafe) {
      await this.runPrettier()
    }

    log(`Correction complete: ${this.fixed.length} issues fixed`, 'success')
    return this.fixed
  }

  private async runESLintFix() {
    log('Running ESLint auto-fix...')
    try {
      runCommand('npx eslint src --fix 2>&1', true)
    } catch {
      log('ESLint auto-fix completed with some issues', 'warning')
    }
  }

  private async runPrettier() {
    log('Running Prettier...')
    try {
      runCommand('npx prettier --write "src/**/*.{ts,tsx}" 2>&1', true)
    } catch {
      log('Prettier formatting completed', 'info')
    }
  }

  private async fixUnusedImport(issue: Issue) {
    try {
      const filePath = path.join(CONFIG.PROJECT_ROOT, issue.file)
      if (!fs.existsSync(filePath)) return

      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      
      // Find the import line
      const importMatch = issue.message.match(/Unused import: (\w+)/)
      if (!importMatch) return
      
      const importName = importMatch[1]
      let modified = false
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.includes('import') && line.includes(importName)) {
          // Remove just this import from the line
          const newLine = line
            .replace(new RegExp(`\\b${importName}\\b,?\\s*`), '')
            .replace(new RegExp(`,?\\s*\\b${importName}\\b`), '')
            .replace(/{\s*,/, '{')
            .replace(/,\s*}/, '}')
            .replace(/{\s*}/, '')
          
          if (newLine.match(/import\s+{\s*}\s+from/) || newLine.match(/import\s+from/)) {
            lines.splice(i, 1) // Remove entire line
          } else {
            lines[i] = newLine
          }
          modified = true
          break
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, lines.join('\n'))
        issue.fixed = true
        this.fixed.push(issue)
      }
    } catch (error) {
      log(`Failed to fix unused import in ${issue.file}: ${error}`, 'warning')
    }
  }

  private async fixConsoleLog(issue: Issue) {
    try {
      const filePath = path.join(CONFIG.PROJECT_ROOT, issue.file)
      if (!fs.existsSync(filePath)) return

      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      
      // Comment out the console.log line instead of removing it
      const lineIndex = issue.line - 1
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex]
        if (line.includes('console.') && !line.trim().startsWith('//')) {
          lines[lineIndex] = line.replace(/console\.(log|warn|info|debug)\([^)]*\);?/, '/* removed console.$1 */')
          fs.writeFileSync(filePath, lines.join('\n'))
          issue.fixed = true
          this.fixed.push(issue)
        }
      }
    } catch (error) {
      log(`Failed to fix console.log in ${issue.file}: ${error}`, 'warning')
    }
  }

  private async fixMissingAlt(issue: Issue) {
    try {
      const filePath = path.join(CONFIG.PROJECT_ROOT, issue.file)
      if (!fs.existsSync(filePath)) return

      const content = fs.readFileSync(filePath, 'utf-8')
      
      // Add alt="" to images without alt
      const newContent = content.replace(
        /<(img|Image)([^>]*)(?<!alt=["'][^"']*["'])(\s*\/?>)/g,
        (match, tag, attrs, end) => {
          if (attrs.includes('alt=')) return match
          return `<${tag}${attrs} alt=""${end}`
        }
      )
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent)
        issue.fixed = true
        this.fixed.push(issue)
      }
    } catch (error) {
      log(`Failed to fix missing alt in ${issue.file}: ${error}`, 'warning')
    }
  }

  private async fixMissingAriaLabel(issue: Issue) {
    void issue
    // Skip - aria-labels need context to be meaningful
    // Flag for manual review instead
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: AUTOMATIC VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

class Verifier {
  async verifyAll(): Promise<{ passed: boolean; errors: string[] }> {
    log('Starting verification...')
    const errors: string[] = []

    // TypeScript check
    try {
      runCommand('npx tsc --noEmit')
      log('TypeScript check passed', 'success')
    } catch {
      errors.push('TypeScript check failed')
      log('TypeScript check failed', 'error')
    }

    // ESLint check
    try {
      runCommand('npx eslint src --max-warnings=0')
      log('ESLint check passed', 'success')
    } catch {
      // Don't fail on ESLint warnings, just log
      log('ESLint has warnings', 'warning')
    }

    // Build check (ne pas ignorer les erreurs : sinon le build est toujours « OK »)
    try {
      runCommand('npx next build')
      log('Build check passed', 'success')
    } catch {
      errors.push('Build failed')
      log('Build check failed', 'error')
    }

    return {
      passed: errors.length === 0,
      errors,
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: PREVENTION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

class PreventionSetup {
  async setupHooks() {
    log('Setting up prevention hooks...')

    // Create pre-commit hook
    await this.createPreCommitHook()
    
    // Create GitHub Actions workflow
    await this.createGitHubWorkflow()

    log('Prevention hooks installed', 'success')
  }

  private async createPreCommitHook() {
    const hookDir = path.join(CONFIG.PROJECT_ROOT, '.husky')
    const hookFile = path.join(hookDir, 'pre-commit')

    ensureDir('.husky')

    const hookContent = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running ALGO Autopilot pre-commit checks..."
npx tsx scripts/algo-autopilot.ts --quick

if [ $? -ne 0 ]; then
  echo "Pre-commit checks failed. Please fix issues before committing."
  exit 1
fi
`

    fs.writeFileSync(hookFile, hookContent)
    fs.chmodSync(hookFile, '755')
    log('Pre-commit hook created', 'info')
  }

  private async createGitHubWorkflow() {
    const workflowDir = path.join(CONFIG.PROJECT_ROOT, '.github', 'workflows')
    const workflowFile = path.join(workflowDir, 'algo-autopilot.yml')

    ensureDir('.github/workflows')

    const workflowContent = `name: ALGO Autopilot

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Run daily at midnight

jobs:
  autopilot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ALGO Autopilot
        run: npx tsx scripts/algo-autopilot.ts
      
      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: autopilot-report
          path: reports/
`

    fs.writeFileSync(workflowFile, workflowContent)
    log('GitHub Actions workflow created', 'info')
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

class ReportGenerator {
  generateReport(issues: Issue[], fixed: Issue[], cycle: number): Report {
    const remaining = issues.filter(i => !i.fixed)
    const byType: Record<string, number> = {}
    
    for (const issue of issues) {
      byType[issue.type] = (byType[issue.type] || 0) + 1
    }

    const report: Report = {
      timestamp: new Date().toISOString(),
      cycle,
      issues,
      fixed,
      remaining,
      stats: {
        totalIssues: issues.length,
        totalFixed: fixed.length,
        totalRemaining: remaining.length,
        byType,
      },
    }

    // Save report
    ensureDir(CONFIG.REPORT_DIR)
    const reportPath = path.join(CONFIG.PROJECT_ROOT, CONFIG.REPORT_DIR, `report-${Date.now()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // Print summary
    console.log('\n' + '═'.repeat(60))
    console.log('ALGO AUTOPILOT REPORT')
    console.log('═'.repeat(60))
    console.log(`Cycle: ${cycle}`)
    console.log(`Total Issues Found: ${report.stats.totalIssues}`)
    console.log(`Issues Fixed: ${report.stats.totalFixed}`)
    console.log(`Issues Remaining: ${report.stats.totalRemaining}`)
    console.log('\nIssues by Type:')
    for (const [type, count] of Object.entries(report.stats.byType)) {
      console.log(`  ${type}: ${count}`)
    }
    console.log('═'.repeat(60) + '\n')

    return report
  }

  updateLog(report: Report, duration: number) {
    const logPath = path.join(CONFIG.PROJECT_ROOT, CONFIG.LOG_FILE)
    let log: AutopilotLog = {
      runs: [],
      patterns: {},
      lastRun: new Date().toISOString(),
    }

    if (fs.existsSync(logPath)) {
      try {
        log = JSON.parse(fs.readFileSync(logPath, 'utf-8'))
      } catch {
        // Use default
      }
    }

    // Add run
    log.runs.push({
      timestamp: new Date().toISOString(),
      totalIssues: report.stats.totalIssues,
      totalFixed: report.stats.totalFixed,
      duration,
    })

    // Keep only last 100 runs
    if (log.runs.length > 100) {
      log.runs = log.runs.slice(-100)
    }

    // Update patterns
    for (const [type, count] of Object.entries(report.stats.byType)) {
      log.patterns[type] = (log.patterns[type] || 0) + count
    }

    log.lastRun = new Date().toISOString()

    ensureDir(CONFIG.REPORT_DIR)
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2))
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN AUTOPILOT
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const startTime = Date.now()
  const isQuick = process.argv.includes('--quick')
  const setupOnly = process.argv.includes('--setup')
  
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║           ALGO AUTOPILOT - Codebase Guardian               ║')
  console.log('║     Automatic Detection, Correction & Verification         ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('\n')

  const detector = new IssueDetector()
  const fixer = new IssueFixer()
  const verifier = new Verifier()
  const prevention = new PreventionSetup()
  const reporter = new ReportGenerator()

  // Setup only mode
  if (setupOnly) {
    await prevention.setupHooks()
    log('Setup complete!', 'success')
    return
  }

  let cycle = 0
  let allPassed = false

  while (cycle < CONFIG.MAX_CYCLES && !allPassed) {
    cycle++
    log(`\n=== CYCLE ${cycle} ===\n`, 'info')

    // Step 1: Detect
    const issues = await detector.detectAll()

    // Step 2: Fix
    const fixed = await fixer.fixAll(issues)

    // Generate report
    const report = reporter.generateReport(issues, fixed, cycle)

    // Quick mode - just detect and fix, no verification
    if (isQuick) {
      reporter.updateLog(report, Date.now() - startTime)

      if (isAutopilotQuickLenient()) {
        const tsErrors = issues.filter((i) => i.type === 'typescript-error')
        if (tsErrors.length > 0) {
          log(`Quick check (lenient): ${tsErrors.length} TypeScript error(s) from scan`, 'error')
          process.exit(1)
        }
        log(
          `Quick check (lenient): scan found ${report.stats.totalRemaining} non-blocking findings (translations, style, etc.) — voir reports/.`,
          'warning',
        )
        process.exit(0)
      }

      if (report.stats.totalRemaining > 0) {
        log(`${report.stats.totalRemaining} issues require manual attention`, 'warning')
        process.exit(1)
      }

      log('Quick check passed!', 'success')
      process.exit(0)
    }

    // Step 3: Verify
    const verification = await verifier.verifyAll()
    const ciSafe = isCiSafeMode()
    // En CI on ne peut pas « tout corriger » (centaines de traductions / couleurs) : succès = vérif compil.
    allPassed =
      verification.passed && (ciSafe || report.stats.totalRemaining === 0)

    if (!allPassed && cycle < CONFIG.MAX_CYCLES) {
      log(`Cycle ${cycle} did not pass all checks. Running another cycle...`, 'warning')
    }

    reporter.updateLog(report, Date.now() - startTime)
  }

  // Step 5: Setup prevention (local uniquement — sur CI cela écraserait le workflow du dépôt)
  if (cycle === 1 && !isCiSafeMode()) {
    await prevention.setupHooks()
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  if (allPassed) {
    console.log('\n')
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║                    ALL CHECKS PASSED                       ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log(`\nCompleted in ${duration}s after ${cycle} cycle(s)`)
    log('Codebase is clean and healthy!', 'success')
    process.exit(0)
  } else {
    console.log('\n')
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║              MANUAL REVIEW REQUIRED                        ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log(`\nMax cycles (${CONFIG.MAX_CYCLES}) reached. Some issues require human attention.`)
    console.log('Check reports/ directory for details.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Autopilot crashed:', error)
  process.exit(1)
})
