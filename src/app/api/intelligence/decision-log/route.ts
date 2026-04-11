import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { createHash } from 'node:crypto'
import { getSupabasePublicApiKey, getSupabaseUrl } from '@/lib/supabase/env-keys'

interface DecisionItem {
  id: string
  level: 'action_now' | 'watch' | 'ignore'
  title: string
  reason: string
  riskLevel?: 'low' | 'medium' | 'high'
  requiresApproval?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'not_required'
  executionStatus?: 'not_executed' | 'simulated' | 'executed' | 'blocked'
  policyReason?: string
}

interface DecisionLogEntry {
  at: string
  region: string
  viralityScore: number | null
  confidence: number | null
  items: DecisionItem[]
  mode?: 'advisory' | 'guarded_auto' | 'manual_only'
  source?: string
  feedback?: 'helpful' | 'wrong' | 'neutral' | null
  executedAt?: string | null
}

interface SealedDecisionLogEntry extends DecisionLogEntry {
  entryHash: string
  prevHash: string
}

/** Row `properties` may use legacy `capturedAt` instead of `at`. */
type DurableDecisionProperties = Partial<SealedDecisionLogEntry> & { capturedAt?: string }

interface DecisionLogPayload {
  source?: string
  entries: DecisionLogEntry[]
}

const memoryStore: SealedDecisionLogEntry[] = []
const MAX_MEMORY_ENTRIES = 1500
const MAX_BATCH_SIZE = 30
const RETENTION_WINDOW_MS = 48 * 60 * 60 * 1000

function getOpsTokenFromRequest(request: NextRequest): string | null {
  const headerToken = request.headers.get('x-intelligence-ops-token')
  if (headerToken) return headerToken
  return request.cookies.get('intelligence_ops_token')?.value || null
}

function requireOpsToken(request: NextRequest): NextResponse | null {
  const expectedToken = process.env.INTELLIGENCE_DASHBOARD_TOKEN
  if (!expectedToken) {
    return NextResponse.json(
      { success: false, error: 'INTELLIGENCE_DASHBOARD_TOKEN is not configured' },
      { status: 503 }
    )
  }
  const providedToken = getOpsTokenFromRequest(request)
  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

function getSupabaseClient() {
  const url = getSupabaseUrl()
  const anon = getSupabasePublicApiKey()
  if (!url || !anon) return null
  return createClient(url, anon)
}

function normalizeEntry(entry: DecisionLogEntry): DecisionLogEntry | null {
  if (!entry || !entry.at || !entry.region || !Array.isArray(entry.items)) return null
  return {
    at: new Date(entry.at).toISOString(),
    region: String(entry.region).toUpperCase(),
    viralityScore: typeof entry.viralityScore === 'number' ? entry.viralityScore : null,
    confidence: typeof entry.confidence === 'number' ? entry.confidence : null,
    mode: entry.mode || undefined,
    source: entry.source || undefined,
    feedback: entry.feedback || null,
    executedAt: entry.executedAt || null,
    items: entry.items
      .filter((item) => item?.id && item?.title && item?.reason && item?.level)
      .slice(0, 12)
      .map((item) => ({
        id: item.id,
        level: item.level,
        title: item.title,
        reason: item.reason,
        riskLevel: item.riskLevel,
        requiresApproval: Boolean(item.requiresApproval),
        approvalStatus: item.approvalStatus || (item.requiresApproval ? 'pending' : 'not_required'),
        executionStatus: item.executionStatus || 'not_executed',
        policyReason: item.policyReason,
      })),
  }
}

function computeEntryHash(entry: DecisionLogEntry, prevHash: string): string {
  const raw = JSON.stringify({
    at: entry.at,
    region: entry.region,
    viralityScore: entry.viralityScore,
    confidence: entry.confidence,
    items: entry.items,
    prevHash,
  })
  return createHash('sha256').update(raw).digest('hex')
}

function sealEntries(entries: DecisionLogEntry[]): SealedDecisionLogEntry[] {
  const sealed: SealedDecisionLogEntry[] = []
  let prevHash = memoryStore[memoryStore.length - 1]?.entryHash || 'GENESIS'
  for (const entry of entries) {
    const entryHash = computeEntryHash(entry, prevHash)
    sealed.push({ ...entry, prevHash, entryHash })
    prevHash = entryHash
  }
  return sealed
}

function pruneMemoryStoreByTime(nowMs = Date.now()) {
  const cutoff = nowMs - RETENTION_WINDOW_MS
  const kept = memoryStore.filter((entry) => {
    const ts = new Date(entry.at).getTime()
    return Number.isFinite(ts) && ts >= cutoff
  })
  memoryStore.splice(0, memoryStore.length, ...kept)
  if (memoryStore.length > MAX_MEMORY_ENTRIES) {
    memoryStore.splice(0, memoryStore.length - MAX_MEMORY_ENTRIES)
  }
}

function computeIntegrityHash(entries: SealedDecisionLogEntry[]): string {
  const raw = JSON.stringify(entries)
  return createHash('sha256').update(raw).digest('hex')
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`intelligence-decision-log-post:${identifier}`, { limit: 25, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = (await request.json()) as DecisionLogPayload
    const entries = Array.isArray(body?.entries) ? body.entries.slice(0, MAX_BATCH_SIZE) : []
    const validEntries = entries.map(normalizeEntry).filter((entry): entry is DecisionLogEntry => Boolean(entry))

    if (validEntries.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid entries provided' }, { status: 400 })
    }

    const sealed = sealEntries(validEntries)
    memoryStore.push(...sealed)
    pruneMemoryStoreByTime()

    const supabase = getSupabaseClient()
    if (supabase) {
      const payload = sealed.map((entry) => ({
        event_type: 'decision_log',
        event_name: 'intelligence_decision_feed',
        session_id: null,
        page_path: '/intelligence',
        user_agent: request.headers.get('user-agent') || null,
        ip_hash: null,
        properties: {
          source: body?.source || 'intelligence-radar',
          region: entry.region,
          capturedAt: entry.at,
          viralityScore: entry.viralityScore,
          confidence: entry.confidence,
          items: entry.items,
          mode: entry.mode || null,
          feedback: entry.feedback || null,
          executedAt: entry.executedAt || null,
          prevHash: entry.prevHash,
          entryHash: entry.entryHash,
        },
      }))
      // Non-blocking persistence model: endpoint remains resilient even if storage fails.
      await supabase.from('analytics_events').insert(payload)
    }

    return NextResponse.json({ success: true, stored: sealed.length, capped: entries.length >= MAX_BATCH_SIZE })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to store decision log' },
      { status: 500 }
    )
  }
}

function toCsv(entries: SealedDecisionLogEntry[]): string {
  const header = 'at,region,viralityScore,confidence,level,title,reason,riskLevel,requiresApproval,approvalStatus,executionStatus,policyReason,prevHash,entryHash'
  const rows: string[] = []
  for (const entry of entries) {
    for (const item of entry.items) {
      const row = [
        entry.at,
        entry.region,
        entry.viralityScore ?? '',
        entry.confidence ?? '',
        item.level,
        item.title,
        item.reason,
        item.riskLevel || '',
        item.requiresApproval ? 'true' : 'false',
        item.approvalStatus || '',
        item.executionStatus || '',
        item.policyReason || '',
        entry.prevHash,
        entry.entryHash,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
      rows.push(row)
    }
  }
  return [header, ...rows].join('\n')
}

async function loadDurableEntries(limit: number): Promise<SealedDecisionLogEntry[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('analytics_events')
    .select('properties')
    .eq('event_type', 'decision_log')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (!Array.isArray(data)) return []
  const parsed = data
    .map((row) => (row as { properties?: unknown }).properties as DurableDecisionProperties | undefined)
    .filter(Boolean)
    .map((props) => ({
      at: String(props?.at || props?.capturedAt || ''),
      region: String(props?.region || ''),
      viralityScore: typeof props?.viralityScore === 'number' ? props.viralityScore : null,
      confidence: typeof props?.confidence === 'number' ? props.confidence : null,
      items: Array.isArray(props?.items) ? (props?.items as DecisionItem[]) : [],
      mode: typeof props?.mode === 'string' ? (props.mode as DecisionLogEntry['mode']) : undefined,
      source: typeof props?.source === 'string' ? props.source : undefined,
      feedback: (props?.feedback as DecisionLogEntry['feedback']) || null,
      executedAt: typeof props?.executedAt === 'string' ? props.executedAt : null,
      prevHash: String(props?.prevHash || 'GENESIS'),
      entryHash: String(props?.entryHash || ''),
    }))
    .filter((entry) => entry.at && entry.region && entry.entryHash)
  return parsed as SealedDecisionLogEntry[]
}

export async function GET(request: NextRequest) {
  const unauthorized = requireOpsToken(request)
  if (unauthorized) return unauthorized

  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`intelligence-decision-log-get:${identifier}`, { limit: 120, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  pruneMemoryStoreByTime()

  const { searchParams } = new URL(request.url)
  const limitRaw = Number(searchParams.get('limit') || '200')
  const limit = Number.isFinite(limitRaw) ? Math.min(500, Math.max(1, Math.floor(limitRaw))) : 200
  const region = (searchParams.get('region') || '').toUpperCase()
  const level = searchParams.get('level')
  const format = searchParams.get('format')

  const durableEntries = await loadDurableEntries(limit)
  const baseStore = memoryStore.length > 0 ? memoryStore : durableEntries.reverse()
  const latest = baseStore[baseStore.length - 1] ?? null
  const filtered = baseStore.filter((entry) => {
    if (region && entry.region !== region) return false
    if (level && level !== 'all') {
      return entry.items.some((item) => item.level === level)
    }
    return true
  })
  const entries = filtered.slice(-limit).reverse()
  const integrityHash = computeIntegrityHash(entries)
  const retentionHours = Math.floor(RETENTION_WINDOW_MS / (60 * 60 * 1000))

  if (format === 'csv') {
    return new NextResponse(toCsv(entries), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="intelligence-decision-log.csv"',
        'X-Intelligence-Integrity-Sha256': integrityHash,
        'X-Intelligence-Retention-Hours': String(retentionHours),
      },
    })
  }

  const response = NextResponse.json({
    success: true,
    count: baseStore.length,
    latest,
    entries,
    integrity: {
      algorithm: 'sha256',
      hash: integrityHash,
      chainHead: latest?.entryHash || null,
      genesis: memoryStore[0]?.prevHash || 'GENESIS',
    },
    retentionHours,
    updatedAt: new Date().toISOString(),
  })
  response.headers.set('X-Intelligence-Integrity-Sha256', integrityHash)
  response.headers.set('X-Intelligence-Retention-Hours', String(retentionHours))
  return response
}

export async function DELETE(request: NextRequest) {
  const unauthorized = requireOpsToken(request)
  if (unauthorized) return unauthorized

  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`intelligence-decision-log-delete:${identifier}`, { limit: 20, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  pruneMemoryStoreByTime()
  const before = memoryStore.length
  memoryStore.splice(0, memoryStore.length)
  return NextResponse.json({ success: true, cleared: before })
}

export async function PATCH(request: NextRequest) {
  const unauthorized = requireOpsToken(request)
  if (unauthorized) return unauthorized

  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`intelligence-decision-log-patch:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = (await request.json()) as {
      at: string
      itemId: string
      approvalStatus?: 'pending' | 'approved' | 'rejected' | 'not_required'
      executionStatus?: 'not_executed' | 'simulated' | 'executed' | 'blocked'
      feedback?: 'helpful' | 'wrong' | 'neutral' | null
    }
    if (!body?.at || !body?.itemId) {
      return NextResponse.json({ success: false, error: 'at and itemId are required' }, { status: 400 })
    }
    const target = memoryStore.find((entry) => entry.at === body.at)
    if (!target) {
      return NextResponse.json({ success: false, error: 'Entry not found in active memory window' }, { status: 404 })
    }
    const item = target.items.find((it) => it.id === body.itemId)
    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }
    if (body.approvalStatus) item.approvalStatus = body.approvalStatus
    if (body.executionStatus) item.executionStatus = body.executionStatus
    if (body.feedback !== undefined) target.feedback = body.feedback
    if (body.executionStatus === 'executed') target.executedAt = new Date().toISOString()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update decision log' },
      { status: 500 }
    )
  }
}
