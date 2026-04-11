'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BrainCircuit, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface MemoryItem {
  id: string
  createdAt: string
  region: string
  domain: 'viral' | 'behavior' | 'product' | 'economic' | 'science' | 'ux'
  summary: string
  confidence: number
}

interface LearningAlert {
  type: 'drift' | 'feedback' | 'stability'
  severity: 'low' | 'medium' | 'high'
  message: string
}

export default function IntelligenceLearningPage() {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<LearningHistoryItem[]>([])
  const [memory, setMemory] = useState<MemoryItem[]>([])
  const [alerts, setAlerts] = useState<LearningAlert[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [hRes, mRes] = await Promise.all([
          fetch('/api/intelligence/learning-history?limit=120', { cache: 'no-store' }),
          fetch('/api/intelligence/memory?limit=60', { cache: 'no-store' }),
        ])
        const hJson = (await hRes.json()) as { success: boolean; data?: LearningHistoryItem[]; alerts?: LearningAlert[] }
        const mJson = (await mRes.json()) as { success: boolean; data?: MemoryItem[] }
        if (hJson.success && Array.isArray(hJson.data)) setHistory(hJson.data)
        if (hJson.success && Array.isArray(hJson.alerts)) setAlerts(hJson.alerts)
        if (mJson.success && Array.isArray(mJson.data)) setMemory(mJson.data)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const stats = useMemo(() => {
    const applied = history.filter((h) => h.applied).length
    const noChange = history.length - applied
    const avgThreshold =
      history.length > 0
        ? history.reduce((acc, h) => acc + h.nextMinConfidence, 0) / history.length
        : null
    const avgHelpful =
      history.length > 0
        ? history.reduce((acc, h) => acc + h.helpfulRatio, 0) / history.length
        : null
    return { applied, noChange, avgThreshold, avgHelpful }
  }, [history])

  return (
    <div className="min-h-screen text-[var(--color-text-primary)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Learning Loop</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">Calibration history, feedback quality, and memory stream</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/intelligence"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Retour au radar
            </Link>
            <Link
              href="/intelligence/ops"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Ops
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <StatCard title="applied calibrations" value={stats.applied} />
          <StatCard title="no-change runs" value={stats.noChange} />
          <StatCard title="avg threshold" value={stats.avgThreshold === null ? '--' : stats.avgThreshold.toFixed(2)} />
          <StatCard title="avg helpful ratio" value={stats.avgHelpful === null ? '--' : `${Math.round(stats.avgHelpful * 100)}%`} />
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit size={14} className="text-violet-300" />
            <p className="text-sm font-semibold">Calibration timeline</p>
          </div>
          <div className="h-24 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-2 flex items-end gap-1">
            {history.slice(0, 70).reverse().map((item) => {
              const value = Math.round(item.nextMinConfidence * 100)
              const height = Math.max(8, value * 0.7)
              return (
                <div
                  key={item.id}
                  className={cn('w-2 rounded-sm', item.applied ? 'bg-violet-300/80' : 'bg-[var(--color-text-muted)]')}
                  style={{ height: `${height}px` }}
                  title={`${new Date(item.at).toLocaleString()} · ${item.previousMinConfidence.toFixed(2)} -> ${item.nextMinConfidence.toFixed(2)}`}
                />
              )
            })}
            {history.length === 0 && !loading && <p className="text-xs text-[var(--color-text-tertiary)]">No calibration history yet.</p>}
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
            <h2 className="text-sm font-semibold mb-2">Drift Alerts</h2>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div key={`${alert.type}-${idx}`} className="text-xs border border-[var(--color-border)] rounded-lg p-2 bg-[var(--color-bg-elevated)]">
                  <p className={cn(
                    'font-semibold',
                    alert.severity === 'high' && 'text-rose-300',
                    alert.severity === 'medium' && 'text-amber-300',
                    alert.severity === 'low' && 'text-emerald-300'
                  )}>
                    {alert.type} · {alert.severity}
                  </p>
                  <p className="text-[var(--color-text-secondary)] mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
            <h2 className="text-sm font-semibold mb-2">Recent learning runs</h2>
            <div className="space-y-2">
              {history.slice(0, 20).map((item) => (
                <div key={item.id} className="text-xs border border-[var(--color-border)] rounded-lg p-2 bg-[var(--color-bg-elevated)]">
                  <p>
                    {new Date(item.at).toLocaleString()} · {item.applied ? 'applied' : 'no-change'}
                  </p>
                  <p className="text-[var(--color-text-secondary)] mt-1">
                    threshold {item.previousMinConfidence.toFixed(2)} {'->'} {item.nextMinConfidence.toFixed(2)} · helpful {(item.helpfulRatio * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
              {history.length === 0 && !loading && <p className="text-xs text-[var(--color-text-secondary)]">No entries yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
            <h2 className="text-sm font-semibold mb-2">Knowledge memory stream</h2>
            <div className="space-y-2">
              {memory.slice(0, 20).map((item) => (
                <div key={item.id} className="text-xs border border-[var(--color-border)] rounded-lg p-2 bg-[var(--color-bg-elevated)]">
                  <p className="text-[var(--color-text-primary)]">
                    [{item.region}] {item.domain} · conf {(item.confidence * 100).toFixed(0)}%
                  </p>
                  <p className="text-[var(--color-text-secondary)] mt-1">{item.summary}</p>
                </div>
              ))}
              {memory.length === 0 && !loading && <p className="text-xs text-[var(--color-text-secondary)]">No memory entries yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)]">{title}</p>
      <p className="text-xl font-black mt-1">{value}</p>
    </div>
  )
}
