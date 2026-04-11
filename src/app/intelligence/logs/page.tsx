'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Download, Filter, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  prevHash?: string
  entryHash?: string
  mode?: 'advisory' | 'guarded_auto' | 'manual_only'
  source?: string
  feedback?: 'helpful' | 'wrong' | 'neutral' | null
  executedAt?: string | null
}

interface DecisionLogApiResponse {
  success: boolean
  entries?: DecisionLogEntry[]
  latest?: DecisionLogEntry | null
  count?: number
  integrity?: { algorithm: string; hash: string; chainHead?: string | null; genesis?: string }
  retentionHours?: number
}

interface LearningHistoryItem {
  id: string
  at: string
  applied: boolean
  previousMinConfidence: number
  nextMinConfidence: number
  helpfulRatio: number
  wrongRatio: number
  totalFeedback: number
  note: string
}

export default function IntelligenceLogsPage() {
  const [requiresToken, setRequiresToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<DecisionLogEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [region, setRegion] = useState('all')
  const [level, setLevel] = useState<'all' | 'action_now' | 'watch' | 'ignore'>('all')
  const [query, setQuery] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [opsToken, setOpsToken] = useState('')
  const [integrityHash, setIntegrityHash] = useState<string | null>(null)
  const [chainHead, setChainHead] = useState<string | null>(null)
  const [retentionHours, setRetentionHours] = useState<number | null>(null)
  const [updatingItem, setUpdatingItem] = useState<string | null>(null)
  const [learningHistory, setLearningHistory] = useState<LearningHistoryItem[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.sessionStorage.getItem('intelligence-ops-token')
    if (stored) setOpsToken(stored)
  }, [])

  const fetchLogs = useCallback(async () => {
    if (!opsToken) {
      setLoading(false)
      setEntries([])
      setError('Operator token required to access logs.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/intelligence/decision-log', {
        cache: 'no-store',
        headers: opsToken ? { 'x-intelligence-ops-token': opsToken } : undefined,
      })
      if (res.status === 401) {
        setRequiresToken(true)
        throw new Error('Unauthorized: provide valid operator token.')
      }
      setRequiresToken(false)
      const json = (await res.json()) as DecisionLogApiResponse
      if (!json.success) throw new Error('Failed to fetch decision logs')
      const availableEntries = Array.isArray(json.entries) ? json.entries : json.latest ? [json.latest] : []
      setEntries(availableEntries)
      setTotalCount(json.count || 0)
      setIntegrityHash(json.integrity?.hash || res.headers.get('x-intelligence-integrity-sha256'))
      setChainHead(json.integrity?.chainHead || null)
      setRetentionHours(
        typeof json.retentionHours === 'number'
          ? json.retentionHours
          : Number(res.headers.get('x-intelligence-retention-hours') || 0) || null
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to fetch logs')
    } finally {
      setLoading(false)
    }
  }, [opsToken])

  const fetchLearningHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/intelligence/learning-history?limit=20', { cache: 'no-store' })
      const json = (await res.json()) as { success: boolean; data?: LearningHistoryItem[] }
      if (json.success && Array.isArray(json.data)) {
        setLearningHistory(json.data)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    void fetchLearningHistory()
  }, [fetchLearningHistory])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      void fetchLogs()
      void fetchLearningHistory()
    }, 30_000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLearningHistory, fetchLogs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((entry) => {
      if (region !== 'all' && entry.region !== region) return false
      const matchingItems = entry.items.filter((item) => (level === 'all' ? true : item.level === level))
      if (matchingItems.length === 0) return false
      if (!q) return true
      return matchingItems.some(
        (item) => item.title.toLowerCase().includes(q) || item.reason.toLowerCase().includes(q)
      )
    })
  }, [entries, level, query, region])

  const flattenedRows = useMemo(
    () =>
      filtered.flatMap((entry) =>
        entry.items
          .filter((item) => (level === 'all' ? true : item.level === level))
          .map((item) => ({
            at: entry.at,
            region: entry.region,
            viralityScore: entry.viralityScore,
            confidence: entry.confidence,
            level: item.level,
            title: item.title,
            reason: item.reason,
          }))
      ),
    [filtered, level]
  )

  const levelCounts = useMemo(() => {
    const counts = { action_now: 0, watch: 0, ignore: 0 }
    for (const row of flattenedRows) {
      counts[row.level] += 1
    }
    return counts
  }, [flattenedRows])

  const exportCsv = () => {
    if (flattenedRows.length === 0) return
    const header = 'at,region,viralityScore,confidence,level,title,reason'
    const rows = flattenedRows.map((row) =>
      [row.at, row.region, row.viralityScore ?? '', row.confidence ?? '', row.level, row.title, row.reason]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `intelligence-logs-filtered-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const exportServerSignedCsv = async () => {
    if (!opsToken) {
      setError('Operator token required for server export.')
      return
    }
    setError(null)
    try {
      const res = await fetch('/api/intelligence/decision-log?format=csv', {
        headers: { 'x-intelligence-ops-token': opsToken },
      })
      if (!res.ok) throw new Error('Failed to export signed CSV')
      const csvHash = res.headers.get('x-intelligence-integrity-sha256')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const hashSuffix = csvHash ? csvHash.slice(0, 10) : 'nohash'
      link.href = url
      link.download = `intelligence-logs-signed-${hashSuffix}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      if (csvHash) setIntegrityHash(csvHash)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to export signed CSV')
    }
  }

  const clearServerLog = async () => {
    if (!opsToken) {
      setError('Operator token required to clear logs.')
      return
    }
    setClearing(true)
    setError(null)
    try {
      const res = await fetch('/api/intelligence/decision-log', {
        method: 'DELETE',
        headers: { 'x-intelligence-ops-token': opsToken },
      })
      const json = (await res.json()) as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error || 'Failed to clear logs')
      await fetchLogs()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to clear server log')
    } finally {
      setClearing(false)
    }
  }

  const updateItemStatus = async (entryAt: string, itemId: string, approvalStatus: 'approved' | 'rejected') => {
    if (!opsToken) return
    setUpdatingItem(`${entryAt}:${itemId}`)
    try {
      const res = await fetch('/api/intelligence/decision-log', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-intelligence-ops-token': opsToken,
        },
        body: JSON.stringify({ at: entryAt, itemId, approvalStatus }),
      })
      if (res.ok) await fetchLogs()
    } finally {
      setUpdatingItem(null)
    }
  }

  const sendFeedback = async (entry: DecisionLogEntry, item: DecisionItem, feedback: 'helpful' | 'wrong' | 'neutral') => {
    try {
      await fetch('/api/intelligence/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId: item.id,
          feedback,
          region: entry.region,
          note: item.title,
        }),
      })
      await fetch('/api/intelligence/decision-log', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-intelligence-ops-token': opsToken,
        },
        body: JSON.stringify({ at: entry.at, itemId: item.id, feedback }),
      })
      await fetchLogs()
    } catch {
      // silent
    }
  }

  return (
    <div className="min-h-screen text-[var(--color-text-primary)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Intelligence Decision Logs</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">Operational view of decision feed history</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/intelligence"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Retour au radar
            </Link>
            <Link
              href="/intelligence/learning"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Learning
            </Link>
            <Link
              href="/intelligence/ops"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Ops
            </Link>
            <button
              type="button"
              onClick={exportCsv}
              disabled={flattenedRows.length === 0}
              className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] disabled:opacity-50 transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => void exportServerSignedCsv()}
              disabled={!opsToken}
              className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <Download size={14} />
              Export Signed CSV
            </button>
            <button
              type="button"
              onClick={() => void clearServerLog()}
              disabled={clearing}
              className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {clearing ? 'Clearing...' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={() => void fetchLogs()}
              disabled={loading}
              className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={opsToken}
            onChange={(e) => setOpsToken(e.target.value)}
            placeholder="Operator token"
            type="password"
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md px-2 py-1.5 text-xs flex-1 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <button
            type="button"
            onClick={() => {
              if (typeof window === 'undefined') return
              if (opsToken) {
                window.sessionStorage.setItem('intelligence-ops-token', opsToken)
              } else {
                window.sessionStorage.removeItem('intelligence-ops-token')
              }
            }}
            className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
          >
            Save session token
          </button>
          {requiresToken && (
            <span className="text-[11px] text-amber-300">
              Tip: first access can be done with `?opsToken=...` to set secured cookie.
            </span>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-xs">
            <Filter size={14} />
            Filters
          </div>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
          >
            <option value="all">All regions</option>
            {Array.from(new Set(entries.map((e) => e.region))).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as 'all' | 'action_now' | 'watch' | 'ignore')}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
          >
            <option value="all">All levels</option>
            <option value="action_now">Action now</option>
            <option value="watch">Watch</option>
            <option value="ignore">Ignore</option>
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title/reason..."
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md px-2 py-1.5 text-xs flex-1 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            auto-refresh 30s
          </label>
        </div>

        {error && <div className="text-sm text-red-300 rounded-lg border border-red-500/20 bg-red-500/10 p-3">{error}</div>}

        <div className="text-xs text-[var(--color-text-secondary)] flex flex-wrap items-center gap-2">
          <span>Showing {filtered.length} entries / {entries.length} loaded / {totalCount} total</span>
          <span>· action now: {levelCounts.action_now}</span>
          <span>· watch: {levelCounts.watch}</span>
          <span>· ignore: {levelCounts.ignore}</span>
          {retentionHours !== null && <span>· retention: {retentionHours}h</span>}
          {integrityHash && <span>· integrity: {integrityHash.slice(0, 12)}...</span>}
          {chainHead && <span>· chain head: {chainHead.slice(0, 12)}...</span>}
        </div>

        <div className="space-y-3">
          {learningHistory.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
              <h2 className="text-sm font-semibold mb-2">Learning Calibration History</h2>
              <div className="space-y-2">
                {learningHistory.slice(0, 6).map((item) => (
                  <div key={item.id} className="text-xs text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg p-2 bg-[var(--color-bg-elevated)]">
                    <p>
                      {new Date(item.at).toLocaleString()} · {item.applied ? 'applied' : 'no-change'} · threshold{' '}
                      {item.previousMinConfidence.toFixed(2)} → {item.nextMinConfidence.toFixed(2)}
                    </p>
                    <p className="text-[var(--color-text-tertiary)] mt-1">
                      helpful {(item.helpfulRatio * 100).toFixed(0)}% · wrong {(item.wrongRatio * 100).toFixed(0)}% · feedback {item.totalFeedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {filtered.map((entry) => (
            <div key={entry.at} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-2">
                <span>{new Date(entry.at).toLocaleString()}</span>
                <span>·</span>
                <span>{entry.region}</span>
                <span>·</span>
                <span>virality: {entry.viralityScore ?? '--'}</span>
                <span>·</span>
                <span>confidence: {entry.confidence === null ? '--' : `${Math.round(entry.confidence * 100)}%`}</span>
                {entry.entryHash && (
                  <>
                    <span>·</span>
                    <span>hash: {entry.entryHash.slice(0, 10)}...</span>
                  </>
                )}
              </div>
              <div className="space-y-2">
                {entry.items
                  .filter((item) => (level === 'all' ? true : item.level === level))
                  .map((item) => (
                    <div key={item.id} className="p-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span
                          className={cn(
                            'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold',
                            item.level === 'action_now' && 'bg-rose-500/20 text-rose-300',
                            item.level === 'watch' && 'bg-amber-500/20 text-amber-300',
                            item.level === 'ignore' && 'bg-[var(--color-card-hover)] text-[var(--color-text-secondary)]'
                          )}
                        >
                          {item.level === 'action_now' ? 'Action now' : item.level === 'watch' ? 'Watch' : 'Ignore'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">{item.reason}</p>
                      {(item.riskLevel || item.policyReason) && (
                        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
                          risk: {item.riskLevel || 'n/a'} · policy: {item.policyReason || 'n/a'}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {item.approvalStatus === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => void updateItemStatus(entry.at, item.id, 'approved')}
                              disabled={updatingItem === `${entry.at}:${item.id}`}
                              className="text-[11px] px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => void updateItemStatus(entry.at, item.id, 'rejected')}
                              disabled={updatingItem === `${entry.at}:${item.id}`}
                              className="text-[11px] px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => void sendFeedback(entry, item, 'helpful')}
                          className="text-[11px] px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30"
                        >
                          Helpful
                        </button>
                        <button
                          type="button"
                          onClick={() => void sendFeedback(entry, item, 'wrong')}
                          className="text-[11px] px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30"
                        >
                          Wrong
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-text-secondary)]">
              No log entries match your filters yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
