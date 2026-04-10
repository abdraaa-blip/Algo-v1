'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlanetTotemControls } from '@/components/intelligence/PlanetTotemControls'

interface OpsAlert {
  id: string
  domain: 'autonomy' | 'learning' | 'resilience'
  severity: 'low' | 'medium' | 'high'
  message: string
}

interface OpsIncident {
  id: string
  at: string
  severity: 'low' | 'medium' | 'high'
  title: string
  details: string
  actions: string[]
}

export default function IntelligenceOpsPage() {
  const [opsToken, setOpsToken] = useState('')
  const [alerts, setAlerts] = useState<OpsAlert[]>([])
  const [incidents, setIncidents] = useState<OpsIncident[]>([])
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.sessionStorage.getItem('intelligence-ops-token')
    if (stored) setOpsToken(stored)
  }, [])

  const load = useCallback(async () => {
    const aRes = await fetch('/api/intelligence/ops-alerts', { cache: 'no-store' })
    const aJson = (await aRes.json()) as { success: boolean; alerts?: OpsAlert[] }
    if (aJson.success && Array.isArray(aJson.alerts)) setAlerts(aJson.alerts)
    if (!opsToken) return
    const iRes = await fetch('/api/intelligence/ops-incidents?limit=40', {
      cache: 'no-store',
      headers: { 'x-intelligence-ops-token': opsToken },
    })
    const iJson = (await iRes.json()) as { success: boolean; data?: OpsIncident[] }
    if (iJson.success && Array.isArray(iJson.data)) setIncidents(iJson.data)
  }, [opsToken])

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), 15000)
    return () => clearInterval(interval)
  }, [load])

  const runbook = async () => {
    if (!opsToken) return
    setRunning(true)
    try {
      const res = await fetch('/api/intelligence/ops-runbook', {
        method: 'POST',
        headers: { 'x-intelligence-ops-token': opsToken },
      })
      const json = await res.json() as { success: boolean; applied?: boolean }
      if (json.success) {
        setLastRun(json.applied ? 'Applied' : 'No action')
        await load()
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Ops Center</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">Unified alerts, runbook execution, and incident log</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/intelligence"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Back to Radar
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 flex items-center gap-2">
          <input
            type="password"
            value={opsToken}
            onChange={(e) => {
              setOpsToken(e.target.value)
              if (typeof window !== 'undefined') {
                if (e.target.value) window.sessionStorage.setItem('intelligence-ops-token', e.target.value)
                else window.sessionStorage.removeItem('intelligence-ops-token')
              }
            }}
            placeholder="Operator token"
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md px-2 py-1.5 text-xs flex-1 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <button
            type="button"
            onClick={() => void runbook()}
            disabled={!opsToken || running}
            className="text-xs px-3 py-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {running ? 'Running...' : 'Run Runbook'}
          </button>
          {lastRun && <span className="text-xs text-[var(--color-text-secondary)]">{lastRun}</span>}
        </div>

        <PlanetTotemControls />

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <h2 className="text-sm font-semibold mb-2">Active Alerts</h2>
          <div className="space-y-2">
            {alerts.length === 0 && <p className="text-xs text-emerald-300">No active alert.</p>}
            {alerts.map((alert) => (
              <div key={alert.id} className="text-xs rounded-lg border border-[var(--color-border)] p-2 bg-[var(--color-bg-elevated)]">
                <p className={cn(
                  'font-semibold',
                  alert.severity === 'high' && 'text-rose-300',
                  alert.severity === 'medium' && 'text-amber-300',
                  alert.severity === 'low' && 'text-emerald-300'
                )}>
                  [{alert.domain}] {alert.severity}
                </p>
                <p className="text-[var(--color-text-secondary)] mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <h2 className="text-sm font-semibold mb-2">Incident History</h2>
          <div className="space-y-2">
            {incidents.length === 0 ? (
              <p className="text-xs text-[var(--color-text-secondary)]">No incident yet (or token missing).</p>
            ) : (
              incidents.map((incident) => (
                <div key={incident.id} className="text-xs rounded-lg border border-[var(--color-border)] p-2 bg-[var(--color-bg-elevated)]">
                  <p className="text-[var(--color-text-primary)]">
                    {new Date(incident.at).toLocaleString()} · {incident.title}
                  </p>
                  <p className="text-[var(--color-text-secondary)] mt-1">{incident.details}</p>
                  {incident.actions.length > 0 && (
                    <p className="text-[var(--color-text-tertiary)] mt-1">actions: {incident.actions.join(', ')}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
