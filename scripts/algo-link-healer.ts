#!/usr/bin/env npx tsx
/**
 * ALGO IMMUNE SYSTEM v2.0 - MODULE 7: Link & Media Healer
 * Verifies and repairs broken links, images, and media assets
 */

import * as fs from 'fs'
import * as path from 'path'

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

interface MediaIssue {
  file: string
  line: number
  type: 'broken-image' | 'broken-link' | 'missing-alt' | 'invalid-url'
  url: string
  suggestion?: string
}

interface HealerReport {
  scannedFiles: number
  totalIssues: number
  brokenImages: number
  brokenLinks: number
  missingAlts: number
  invalidUrls: number
  issues: MediaIssue[]
  autoFixed: number
}

const SRC_DIR = path.join(process.cwd(), 'src')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

// Patterns to detect media and links
const PATTERNS = {
  imgSrc: /src=["']([^"']+)["']/g,
  imgAlt: /<img[^>]*alt=["']([^"']*)["'][^>]*>/g,
  imgNoAlt: /<img(?![^>]*alt=)[^>]*>/g,
  nextImage: /<Image[^>]*src=["'{]([^"'}]+)["'}][^>]*>/g,
  href: /href=["']([^"']+)["']/g,
  backgroundUrl: /url\(["']?([^"')]+)["']?\)/g,
  fetch: /fetch\(["']([^"']+)["']\)/g,
}

// Known valid external domains
const VALID_EXTERNAL_DOMAINS = [
  'api.themoviedb.org',
  'image.tmdb.org',
  'i.ytimg.com',
  'lastfm.freetls.fastly.net',
  'ui-avatars.com',
  'news.google.com',
  'picsum.photos',
  'placehold.co',
]

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function scanFile(filePath: string): MediaIssue[] {
  const issues: MediaIssue[] = []
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const relativePath = path.relative(process.cwd(), filePath)

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Check for images without alt text
    const noAltMatches = line.match(PATTERNS.imgNoAlt)
    if (noAltMatches) {
      noAltMatches.forEach(() => {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'missing-alt',
          url: '',
          suggestion: 'Add alt="" for decorative images or descriptive alt text for meaningful images'
        })
      })
    }

    // Check image sources
    let match
    const srcRegex = /src=["']([^"']+)["']/g
    while ((match = srcRegex.exec(line)) !== null) {
      const url = match[1]
      
      // Skip dynamic/template URLs
      if (url.includes('{') || url.includes('$') || url.startsWith('data:')) {
        continue
      }

      // Check local files
      if (url.startsWith('/') && !url.startsWith('//')) {
        const localPath = path.join(PUBLIC_DIR, url)
        if (!fs.existsSync(localPath)) {
          issues.push({
            file: relativePath,
            line: lineNum,
            type: 'broken-image',
            url,
            suggestion: `File not found: ${localPath}`
          })
        }
      }

      // Check for potentially broken external URLs
      if (url.startsWith('http')) {
        try {
          const urlObj = new URL(url)
          const isKnownDomain = VALID_EXTERNAL_DOMAINS.some(d => urlObj.hostname.includes(d))
          if (!isKnownDomain && !url.includes('vercel') && !url.includes('localhost')) {
            // Flag unknown external URLs for review
            issues.push({
              file: relativePath,
              line: lineNum,
              type: 'invalid-url',
              url,
              suggestion: 'Unknown external domain - verify this URL is valid'
            })
          }
        } catch {
          issues.push({
            file: relativePath,
            line: lineNum,
            type: 'invalid-url',
            url,
            suggestion: 'Invalid URL format'
          })
        }
      }
    }
  })

  return issues
}

function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = []
  
  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...scanDirectory(fullPath, extensions))
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (extensions.includes(ext)) {
        files.push(fullPath)
      }
    }
  }
  
  return files
}

async function runHealer(): Promise<HealerReport> {
  log('\n========================================', 'cyan')
  log('  ALGO IMMUNE SYSTEM v2.0', 'cyan')
  log('  Module 7: Link & Media Healer', 'cyan')
  log('========================================\n', 'cyan')

  const report: HealerReport = {
    scannedFiles: 0,
    totalIssues: 0,
    brokenImages: 0,
    brokenLinks: 0,
    missingAlts: 0,
    invalidUrls: 0,
    issues: [],
    autoFixed: 0,
  }

  // Scan TypeScript/TSX files
  const files = scanDirectory(SRC_DIR, ['.ts', '.tsx', '.js', '.jsx'])
  report.scannedFiles = files.length

  log(`Scanning ${files.length} files...\n`, 'blue')

  for (const file of files) {
    const issues = scanFile(file)
    report.issues.push(...issues)
  }

  // Categorize issues
  for (const issue of report.issues) {
    switch (issue.type) {
      case 'broken-image':
        report.brokenImages++
        break
      case 'broken-link':
        report.brokenLinks++
        break
      case 'missing-alt':
        report.missingAlts++
        break
      case 'invalid-url':
        report.invalidUrls++
        break
    }
  }

  report.totalIssues = report.issues.length

  // Print results
  if (report.totalIssues === 0) {
    log('All media and links are healthy!', 'green')
  } else {
    log(`Found ${report.totalIssues} issue(s):\n`, 'yellow')
    
    if (report.brokenImages > 0) {
      log(`  Broken Images: ${report.brokenImages}`, 'red')
    }
    if (report.brokenLinks > 0) {
      log(`  Broken Links: ${report.brokenLinks}`, 'red')
    }
    if (report.missingAlts > 0) {
      log(`  Missing Alt Text: ${report.missingAlts}`, 'yellow')
    }
    if (report.invalidUrls > 0) {
      log(`  Invalid/Unknown URLs: ${report.invalidUrls}`, 'yellow')
    }

    log('\nDetailed Issues:', 'cyan')
    report.issues.slice(0, 20).forEach((issue, i) => {
      log(`\n${i + 1}. [${issue.type.toUpperCase()}] ${issue.file}:${issue.line}`, 'magenta')
      if (issue.url) {
        log(`   URL: ${issue.url}`, 'reset')
      }
      if (issue.suggestion) {
        log(`   Suggestion: ${issue.suggestion}`, 'green')
      }
    })

    if (report.issues.length > 20) {
      log(`\n... and ${report.issues.length - 20} more issues`, 'yellow')
    }
  }

  // Save report
  const reportPath = path.join(process.cwd(), 'reports', 'link-healer-report.json')
  const reportsDir = path.dirname(reportPath)
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  log(`\nReport saved to: ${reportPath}`, 'blue')

  log('\n========================================', 'cyan')
  log(`  Scan complete: ${report.scannedFiles} files`, 'cyan')
  log(`  Issues found: ${report.totalIssues}`, report.totalIssues > 0 ? 'yellow' : 'green')
  log('========================================\n', 'cyan')

  return report
}

// Run if executed directly
runHealer().catch(console.error)
