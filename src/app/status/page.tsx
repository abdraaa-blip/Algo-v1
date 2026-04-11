'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2, RefreshCw, Wifi, Video, Newspaper, BrainCircuit, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiStatus {
  timestamp: string
  apis: {
    newsapi: {
      configured: boolean
      test: { success: boolean; count: number; source: 'live' | 'error' | 'unconfigured'; error?: string } | null
    }
    youtube: {
      configured: boolean
      test: { success: boolean; count: number; source: 'live' | 'error' | 'unconfigured'; error?: string } | null
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
      setError(err instanceof Error ? err.message : 'Impossible de charger le statut')
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
            <h1 className="text-3xl font-black tracking-tight">Statut ALGO</h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">Connexions API live (NewsAPI, YouTube)</p>
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
              Dernière vérif : {new Date(status.timestamp).toLocaleString()}
            </div>

            {/* NewsAPI Status */}
            <StatusCard
              title="NewsAPI"
              icon={Newspaper}
              configured={status.apis.newsapi.configured}
              test={status.apis.newsapi.test}
              envHint="NEWSAPI_KEY ou NEWS_API_KEY"
              description="Titres d’actualité (FR, US, UK, Nigeria) via NewsAPI"
            />

            {/* YouTube API Status */}
            <StatusCard
              title="YouTube Data API v3"
              icon={Video}
              configured={status.apis.youtube.configured}
              test={status.apis.youtube.test}
              envHint="YOUTUBE_API_KEY"
              description="Tendances YouTube par pays (Data API v3)"
            />

            {/* Synthèse */}
            {(() => {
              const newsLive = Boolean(status.apis.newsapi.test?.success && status.apis.newsapi.test?.source === 'live')
              const ytLive = Boolean(status.apis.youtube.test?.success && status.apis.youtube.test?.source === 'live')
              const newsUn = status.apis.newsapi.test?.source === 'unconfigured'
              const ytUn = status.apis.youtube.test?.source === 'unconfigured'
              const newsFault = Boolean(
                status.apis.newsapi.configured &&
                  status.apis.newsapi.test &&
                  !newsLive &&
                  status.apis.newsapi.test.source === 'error'
              )
              const ytFault = Boolean(
                status.apis.youtube.configured &&
                  status.apis.youtube.test &&
                  !ytLive &&
                  status.apis.youtube.test.source === 'error'
              )
              const allLive = newsLive && ytLive
              const allUnconfigured = newsUn && ytUn
              const anyFault = newsFault || ytFault
              const anyLive = newsLive || ytLive

              const tone =
                allLive ? 'ok' :
                allUnconfigured && !anyFault ? 'neutral' :
                anyFault && !anyLive ? 'fault' :
                'partial'
              return (
            <div className={cn(
              'p-6 rounded-2xl border text-center',
              tone === 'ok' && 'bg-green-500/10 border-green-500/20',
              tone === 'neutral' && 'bg-slate-500/10 border-slate-500/25',
              tone === 'partial' && 'bg-amber-500/10 border-amber-500/25',
              tone === 'fault' && 'bg-orange-500/10 border-orange-500/25'
            )}>
              <Wifi size={32} className={cn(
                'mx-auto mb-3',
                tone === 'ok' && 'text-green-400',
                tone === 'neutral' && 'text-slate-400',
                tone === 'partial' && 'text-amber-400',
                tone === 'fault' && 'text-orange-400'
              )} />
              <h3 className="text-lg font-bold">
                {tone === 'ok' && 'Tout est opérationnel'}
                {tone === 'neutral' && 'Mode sans clés live'}
                {tone === 'partial' && 'Connexion partielle'}
                {tone === 'fault' && 'Live à vérifier'}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {tone === 'ok' && 'Les deux flux répondent correctement.'}
                {tone === 'neutral' &&
                  'Normal en local : ajoute NEWSAPI_KEY et YOUTUBE_API_KEY dans .env.local (voir .env.example). Le reste de l’app peut tourner en démo / fallbacks.'}
                {tone === 'partial' && 'Au moins une source répond ; l’autre est absente ou en pause.'}
                {tone === 'fault' && 'Les clés sont présentes mais un appel a échoué : regarde le détail sous chaque carte.'}
              </p>
            </div>
              )
            })()}

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
                  <h3 className="font-bold text-lg">Poids du modèle (adaptatif)</h3>
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
                      {modelWeights.rollbackApplied ? 'Actif' : 'Inactif'}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">Historique</p>
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
  description,
  envHint,
}: {
  title: string
  icon: React.ElementType
  configured: boolean
  test: { success: boolean; count: number; source: 'live' | 'error' | 'unconfigured'; error?: string } | null
  description: string
  envHint: string
}) {
  const isLive = Boolean(test?.success && test?.source === 'live')
  const isUnconfigured = test?.source === 'unconfigured'
  const isFault = Boolean(test && !isLive && test.source === 'error')

  return (
    <div className={cn(
      'p-5 rounded-2xl border transition-all',
      isLive ? 'bg-green-500/5 border-green-500/20' :
      isUnconfigured ? 'bg-amber-500/5 border-amber-500/20' :
      isFault ? 'bg-red-500/5 border-red-500/20' :
      'bg-[var(--color-card)] border-[var(--color-border)]'
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          'p-3 rounded-xl',
          isLive ? 'bg-green-500/20' :
          isUnconfigured ? 'bg-amber-500/15' :
          isFault ? 'bg-red-500/20' :
          'bg-[var(--color-card)]'
        )}>
          <Icon size={24} className={cn(
            isLive ? 'text-green-400' :
            isUnconfigured ? 'text-amber-400' :
            isFault ? 'text-red-400' :
            'text-[var(--color-text-secondary)]'
          )} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{title}</h3>
            {isLive && <CheckCircle size={18} className="text-green-400" aria-hidden />}
            {isUnconfigured && <AlertCircle size={18} className="text-amber-400" aria-hidden />}
            {isFault && <XCircle size={18} className="text-red-400" aria-hidden />}
          </div>
          
          <p className="text-sm text-[var(--color-text-tertiary)] mb-3">{description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">Clé API</p>
              <p className={cn(
                'font-mono text-xs',
                configured ? 'text-green-400' : 'text-amber-400'
              )}>
                {configured ? 'Présente (masquée)' : 'Absente du .env'}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">Statut</p>
              <p className={cn(
                'font-bold',
                isLive ? 'text-green-400' : isUnconfigured ? 'text-amber-400' : isFault ? 'text-red-400' : 'text-[var(--color-text-secondary)]'
              )}>
                {isLive ? `${test!.count} éléments` : isUnconfigured ? 'À configurer' : isFault ? 'Échec live' : '—'}
              </p>
            </div>
          </div>

          {isUnconfigured && (
            <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
              Variable attendue : <span className="font-mono text-[var(--color-text-primary)]">{envHint}</span> · voir <span className="font-mono">.env.example</span>
            </p>
          )}

          {isFault && test?.error && (
            <div className="mt-3 p-2 rounded-lg bg-red-500/10 text-red-300 text-xs">
              {test.error}
            </div>
          )}

          {isLive && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>En direct · source : {test!.source}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
