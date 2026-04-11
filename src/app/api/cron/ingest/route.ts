import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseSecretApiKey, getSupabaseUrl } from '@/lib/supabase/env-keys'
import {
  businessLevelErrorFromJson,
  normalizeIngestPayload,
} from '@/lib/cron/ingest-payload'

/**
 * Automated Data Ingestion Pipeline
 * Déclenché par Vercel Cron : voir `vercel.json` (ex. 1×/jour à 02:00 UTC sur Hobby).
 * Auth entrante : `Authorization: Bearer ${CRON_SECRET}` (Vercel l’ajoute si CRON_SECRET est défini).
 *
 * Note : cette route agrège surtout des métriques / logs. Les réponses des APIs internes
 * n’ont pas toutes un champ `data` : normalisation dans `src/lib/cron/ingest-payload.ts`.
 * Si une route renvoie **HTTP 200** avec **`success: false`** (ex. Spotify dégradé), le
 * payload `data` est quand même normalisé et **`error`** remonte pour `total_errors`.
 */

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = getSupabaseSecretApiKey()
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL et clé secrète (SERVICE_ROLE ou SUPABASE_SECRET_KEY) requis')
  }
  return createClient(supabaseUrl, supabaseKey)
}

interface PipelineLog {
  startedAt: Date
  completedAt?: Date
  sources: Record<string, {
    fetched: number
    new: number
    errors: string[]
  }>
  totalFetched: number
  totalNew: number
  totalErrors: number
  executionTimeMs: number
}

function getInternalBaseUrl(req: NextRequest): string {
  const publicBase = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (publicBase?.startsWith('http')) {
    return publicBase.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`
  }
  return new URL(req.url).origin
}

async function fetchFromSource(
  sourceUrl: string,
  sourceName: string,
  baseUrl: string,
): Promise<{ data: unknown[]; error?: string }> {
  try {
    const cronSecret = process.env.CRON_SECRET || ''
    const response = await fetch(`${baseUrl}${sourceUrl}`, {
      headers: {
        ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
        'x-cron-secret': cronSecret,
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const json: unknown = await response.json()
    const data = normalizeIngestPayload(json, sourceName)
    const businessErr = businessLevelErrorFromJson(json)
    return { data, error: businessErr }
  } catch (error) {
    console.error(`[ALGO Cron] Failed to fetch ${sourceName}:`, error)
    return { data: [], error: String(error) }
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const log: PipelineLog = {
    startedAt: new Date(),
    sources: {},
    totalFetched: 0,
    totalNew: 0,
    totalErrors: 0,
    executionTimeMs: 0,
  }

  console.log('[ALGO Cron] Starting automated ingestion pipeline...')

  const baseUrl = getInternalBaseUrl(req)

  try {
    // Define data sources
    const sources = [
      { name: 'YouTube', url: '/api/live-videos?limit=50' },
      { name: 'News', url: '/api/live-news?limit=50' },
      { name: 'Trends', url: '/api/live-trends?limit=50' },
      { name: 'Reddit', url: '/api/reddit?limit=30&category=viral' },
      { name: 'GitHub', url: '/api/github?limit=20' },
      { name: 'Twitch', url: '/api/twitch?type=streams&limit=20' },
      { name: 'Spotify', url: '/api/spotify?limit=20' },
      { name: 'Movies', url: '/api/live-movies?limit=30' },
      { name: 'Music', url: '/api/live-music?limit=30' },
    ]

    // Fetch from all sources in parallel
    const results = await Promise.all(
      sources.map(async (source) => {
        const { data, error } = await fetchFromSource(source.url, source.name, baseUrl)
        return { name: source.name, data, error }
      })
    )

    // Process results
    for (const result of results) {
      log.sources[result.name] = {
        fetched: Array.isArray(result.data) ? result.data.length : 0,
        new: 0, // Will be updated after dedup
        errors: result.error ? [result.error] : [],
      }
      log.totalFetched += log.sources[result.name].fetched
      if (result.error) log.totalErrors++
    }

    // Store pipeline log
    const supabase = getSupabaseClient()
    
    // Create pipeline_logs table if it doesn't exist (handled by migration)
    // Just insert the log
    const { error: logError } = await supabase
      .from('pipeline_logs')
      .insert({
        started_at: log.startedAt.toISOString(),
        completed_at: new Date().toISOString(),
        sources: log.sources,
        total_fetched: log.totalFetched,
        total_new: log.totalNew,
        total_errors: log.totalErrors,
        execution_time_ms: Date.now() - startTime,
      })

    if (logError) {
      console.warn('[ALGO Cron] Failed to store log:', logError.message)
    }

    log.completedAt = new Date()
    log.executionTimeMs = Date.now() - startTime

    console.log(`[ALGO Cron] Pipeline completed in ${log.executionTimeMs}ms`)
    console.log(`[ALGO Cron] Fetched: ${log.totalFetched}, New: ${log.totalNew}, Errors: ${log.totalErrors}`)

    return NextResponse.json({
      success: true,
      log,
      baseUrl,
      supabaseLogOk: !logError,
      supabaseLogError: logError?.message ?? null,
      message: `Pipeline completed successfully. Fetched ${log.totalFetched} items in ${log.executionTimeMs}ms.`,
    })
  } catch (error) {
    console.error('[ALGO Cron] Pipeline failed:', error)
    
    log.completedAt = new Date()
    log.executionTimeMs = Date.now() - startTime

    return NextResponse.json({
      success: false,
      log,
      error: String(error),
    }, { status: 500 })
  }
}

// Support POST for manual triggers
export async function POST(req: NextRequest) {
  return GET(req)
}
