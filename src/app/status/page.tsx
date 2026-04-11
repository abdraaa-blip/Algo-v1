'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2, RefreshCw, Wifi, Video, Newspaper, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiStatus {
  timestamp: string
  apis: {
    newsapi: {
      configured: boolean
      test: { success: boolean; count: number; source: string; error?: string } | null
    }
    youtube: {
      configured: boolean
      test: { success: boolean; count: number; source: string; error?: string } | null
    }
  }
}

interface ModelWeightsStatus {
  generatedAt: string
  baseline: {
    hook: number
    trend: number
    format: number
    emotion: number
    timing: number
  }
  active: {
    hook: number
    trend: number
    format: number
    emotion: number
    timing: number
  }
  version: string
  rollbackApplied: boolean
  notes: string[]
  mode: 'adaptive' | 'baseline'
  runtimeSignals: { engagementRate: number; frictionRate: number } | null
  rollbackRule: string
  history: {
    count: number
    latest: { generatedAt: string; baselineVersion: string } | null
  }
}

export default function StatusPage() {
  const [status, setStatus] = useState<ApiStatus | null>(null)
  const [modelWeights, setModelWeights] = useState<ModelWeightsStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statusRes, modelRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/model/weights'),
      ])
      const statusData = await statusRes.json()
      const modelData = await modelRes.json()
      setStatus(statusData)
      setModelWeights(modelData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return (
    <div className="min-h-screen text-[var(--color-text-primary)] p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">ALGO Status</h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">Live API Connection Status</p>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={cn('text-[var(--color-text-secondary)]', loading && 'animate-spin')} />
          </button>
        </div>

        {loading && !status && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-violet-400" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {status && (
          <div className="space-y-6">
            {/* Timestamp */}
            <div className="text-xs text-[var(--color-text-muted)] text-center">
              Last checked: {new Date(status.timestamp).toLocaleString()}
            </div>

            {/* NewsAPI Status */}
            <StatusCard
              title="NewsAPI"
              icon={Newspaper}
              configured={status.apis.newsapi.configured}
              test={status.apis.newsapi.test}
              description="Real-time news headlines from France, US, UK, Nigeria"
            />

            {/* YouTube API Status */}
            <StatusCard
              title="YouTube Data API v3"
              icon={Video}
              configured={status.apis.youtube.configured}
              test={status.apis.youtube.test}
              description="Trending videos from YouTube by country"
            />

            {/* Overall Status */}
            <div className={cn(
              'p-6 rounded-2xl border text-center',
              status.apis.newsapi.test?.success && status.apis.youtube.test?.success
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-yellow-500/10 border-yellow-500/20'
            )}>
              <Wifi size={32} className={cn(
                'mx-auto mb-3',
                status.apis.newsapi.test?.success && status.apis.youtube.test?.success
                  ? 'text-green-400'
                  : 'text-yellow-400'
              )} />
              <h3 className="text-lg font-bold">
                {status.apis.newsapi.test?.success && status.apis.youtube.test?.success
                  ? 'All Systems Operational'
                  : 'Partial Connection'}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {status.apis.newsapi.test?.success && status.apis.youtube.test?.success
                  ? 'Real-time data is flowing'
                  : 'Some APIs may not be fully connected'}
              </p>
            </div>

            {/* Model Weights Status */}
            {modelWeights && (
              <div className={cn(
                'p-5 rounded-2xl border',
                modelWeights.rollbackApplied
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-cyan-500/10 border-cyan-500/20'
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <BrainCircuit size={18} className={modelWeights.rollbackApplied ? 'text-yellow-400' : 'text-cyan-400'} />
                  <h3 className="font-bold text-lg">Adaptive Model Weights</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">Version</p>
                    <p className="font-mono text-xs text-[var(--color-text-primary)]">{modelWeights.version}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">Mode</p>
                    <p className={cn('font-bold', modelWeights.mode === 'adaptive' ? 'text-cyan-400' : 'text-[var(--color-text-secondary)]')}>
                      {modelWeights.mode.toUpperCase()}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">Rollback</p>
                    <p className={cn('font-bold', modelWeights.rollbackApplied ? 'text-yellow-400' : 'text-green-400')}>
                      {modelWeights.rollbackApplied ? 'Applied' : 'Not applied'}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">History snapshots</p>
                    <p className="font-bold text-[var(--color-text-primary)]">{modelWeights.history.count}</p>
                  </div>
                </div>
                {modelWeights.runtimeSignals && (
                  <div className="mt-3 text-xs text-[var(--color-text-secondary)]">
                    Signals · engagement: {(modelWeights.runtimeSignals.engagementRate * 100).toFixed(2)}% · friction: {(modelWeights.runtimeSignals.frictionRate * 100).toFixed(2)}%
                  </div>
                )}
                {modelWeights.notes?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-[var(--color-text-secondary)]">
                    {modelWeights.notes.slice(0, 3).map((note) => (
                      <li key={note}>- {note}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusCard({
  title,
  icon: Icon,
  configured,
  test,
  description
}: {
  title: string
  icon: React.ElementType
  configured: boolean
  test: { success: boolean; count: number; source: string; error?: string } | null
  description: string
}) {
  const isSuccess = test?.success
  const isError = test && !test.success

  return (
    <div className={cn(
      'p-5 rounded-2xl border transition-all',
      isSuccess ? 'bg-green-500/5 border-green-500/20' :
      isError ? 'bg-red-500/5 border-red-500/20' :
      'bg-[var(--color-card)] border-[var(--color-border)]'
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          'p-3 rounded-xl',
          isSuccess ? 'bg-green-500/20' :
          isError ? 'bg-red-500/20' :
          'bg-[var(--color-card)]'
        )}>
          <Icon size={24} className={cn(
            isSuccess ? 'text-green-400' :
            isError ? 'text-red-400' :
            'text-[var(--color-text-secondary)]'
          )} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{title}</h3>
            {isSuccess && <CheckCircle size={18} className="text-green-400" />}
            {isError && <XCircle size={18} className="text-red-400" />}
          </div>
          
          <p className="text-sm text-[var(--color-text-tertiary)] mb-3">{description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">API Key</p>
              <p className={cn(
                'font-mono text-xs',
                configured ? 'text-green-400' : 'text-red-400'
              )}>
                {configured ? 'Présente (non affichée)' : 'Non configurée'}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">Status</p>
              <p className={cn(
                'font-bold',
                isSuccess ? 'text-green-400' : isError ? 'text-red-400' : 'text-[var(--color-text-secondary)]'
              )}>
                {isSuccess ? `${test.count} items` : isError ? 'Error' : 'Unknown'}
              </p>
            </div>
          </div>

          {test?.error && (
            <div className="mt-3 p-2 rounded-lg bg-red-500/10 text-red-300 text-xs">
              {test.error}
            </div>
          )}

          {isSuccess && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>LIVE - Data source: {test.source}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
