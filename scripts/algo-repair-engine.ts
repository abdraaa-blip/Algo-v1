import fs from "fs"
import path from "path"
import { glob } from "glob"

const PROJECT_ROOT = process.cwd()

type Issue = {
  file: string
  url: string
  status: number | null
  fix?: string
}

const issues: Issue[] = []

// Colors for console output
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
}

// Extract URLs from file content
function extractUrls(content: string): string[] {
  const regex = /(https?:\/\/[^\s"'<>\)\]]+)/g
  const matches = content.match(regex) || []
  // Filter out common false positives
  return matches.filter(url => 
    !url.includes('localhost') &&
    !url.includes('127.0.0.1') &&
    !url.includes('example.com') &&
    !url.includes('placeholder') &&
    !url.endsWith('.') &&
    !url.endsWith(',')
  )
}

// Check URL status using fetch
async function checkUrl(url: string): Promise<number | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ALGO-Repair-Engine/1.0'
      }
    })
    
    clearTimeout(timeoutId)
    return res.status
  } catch {
    // Try GET if HEAD fails
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const res = await fetch(url, { 
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ALGO-Repair-Engine/1.0'
        }
      })
      
      clearTimeout(timeoutId)
      return res.status
    } catch {
      return null
    }
  }
}

// Get fix strategy based on URL type
function getFix(url: string): string | null {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return null // Manual check needed - video might be private or removed
  }

  if (url.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i)) {
    return "/images/fallback-image.webp"
  }

  if (url.match(/\.(mp3|wav|ogg)(\?|$)/i)) {
    return "/audio/fallback-audio.mp3"
  }

  if (url.match(/\.(mp4|webm|mov)(\?|$)/i)) {
    return "/video/fallback-video.mp4"
  }

  return null
}

// Get suggestion for manual fix
function getSuggestion(url: string, status: number | null): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "Verifier si la video est privee ou supprimee"
  }
  
  if (status === 403) {
    return "Acces interdit - verifier les permissions ou CORS"
  }
  
  if (status === 404) {
    return "Ressource introuvable - mettre a jour l'URL ou utiliser un fallback"
  }
  
  if (status === 500 || status === 502 || status === 503) {
    return "Erreur serveur externe - reessayer plus tard"
  }
  
  if (status === null) {
    return "Aucune reponse - verifier si le domaine existe"
  }
  
  return "Verification manuelle requise"
}

// Apply fix to file
async function applyFix(file: string, brokenUrl: string, fix: string): Promise<boolean> {
  try {
    let content = fs.readFileSync(file, "utf-8")
    const escapedUrl = brokenUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    content = content.replace(new RegExp(escapedUrl, "g"), fix)
    fs.writeFileSync(file, content)
    return true
  } catch {
    return false
  }
}

// Main function
async function run() {
  console.log(colors.blue("\n╔══════════════════════════════════════════════════════════════╗"))
  console.log(colors.blue("║          ALGO REPAIR ENGINE v1.0                              ║"))
  console.log(colors.blue("║          Scanning for broken URLs and media...                ║"))
  console.log(colors.blue("╚══════════════════════════════════════════════════════════════╝\n"))

  const files = await glob("src/**/*.{ts,tsx,js,jsx}", {
    cwd: PROJECT_ROOT,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.next/**']
  })

  console.log(colors.cyan(`Found ${files.length} files to scan\n`))

  let scannedUrls = 0
  let brokenUrls = 0
  let fixedUrls = 0

  for (const file of files) {
    const relativePath = path.relative(PROJECT_ROOT, file)
    const content = fs.readFileSync(file, "utf-8")
    const urls = extractUrls(content)

    if (urls.length === 0) continue

    // Deduplicate URLs in this file
    const uniqueUrls = [...new Set(urls)]

    for (const url of uniqueUrls) {
      scannedUrls++
      
      // Skip API endpoints and dynamic URLs
      if (url.includes('/api/') || url.includes('${') || url.includes('process.env')) {
        continue
      }

      const status = await checkUrl(url)

      if (!status || status >= 400) {
        brokenUrls++
        const fix = getFix(url)
        const suggestion = getSuggestion(url, status)

        issues.push({ 
          file: relativePath, 
          url, 
          status, 
          fix: fix || undefined 
        })

        console.log(colors.red(`[BROKEN] ${url}`))
        console.log(colors.yellow(`  File: ${relativePath}`))
        console.log(colors.yellow(`  Status: ${status || "no response"}`))
        console.log(colors.yellow(`  Suggestion: ${suggestion}`))

        if (fix) {
          const success = await applyFix(file, url, fix)
          if (success) {
            fixedUrls++
            console.log(colors.green(`  [FIXED] Replaced with: ${fix}`))
          }
        }
        console.log("")
      }
    }
  }

  // Generate report
  console.log(colors.blue("\n╔══════════════════════════════════════════════════════════════╗"))
  console.log(colors.blue("║                         REPORT                                ║"))
  console.log(colors.blue("╚══════════════════════════════════════════════════════════════╝\n"))

  console.log(colors.cyan(`URLs scanned: ${scannedUrls}`))
  console.log(colors.red(`Broken URLs found: ${brokenUrls}`))
  console.log(colors.green(`URLs auto-fixed: ${fixedUrls}`))
  console.log(colors.yellow(`URLs needing manual fix: ${brokenUrls - fixedUrls}`))

  if (issues.length > 0) {
    console.log(colors.yellow("\n[ISSUES DETAIL]"))
    issues.forEach((issue, index) => {
      console.log(colors.yellow(`\n${index + 1}. ${issue.file}`))
      console.log(`   URL: ${issue.url}`)
      console.log(`   Status: ${issue.status || "no response"}`)
      console.log(`   Fixed: ${issue.fix ? "Yes -> " + issue.fix : "No (manual fix required)"}`)
    })
  }

  // Write report to file
  const reportPath = path.join(PROJECT_ROOT, 'reports', 'repair-report.json')
  const reportsDir = path.dirname(reportPath)
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      urlsScanned: scannedUrls,
      brokenUrls: brokenUrls,
      fixedUrls: fixedUrls,
      manualFixNeeded: brokenUrls - fixedUrls
    },
    issues
  }, null, 2))

  console.log(colors.green(`\nReport saved to: ${reportPath}`))
  console.log(colors.blue("\n[ALGO REPAIR ENGINE] Complete.\n"))
}

run().catch(console.error)
