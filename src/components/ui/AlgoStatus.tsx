'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Activity, 
  Wifi, 
  Globe2, 
  Zap, 
  TrendingUp, 
  Radio,
  Server,
  Cpu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRealTimeTrends } from '@/hooks/useRealTimeTrends'

interface AlgoStatusProps {
  className?: string
  compact?: boolean
}

/**
 * AlgoStatus · Affiche le statut global de l'algorithme ALGO
 * 
 * Montre:
 * - Statut de connexion en temps réel
 * - Nombre de signaux analysés
 * - Score moyen de viralité
 * - Temps depuis la dernière mise à jour
 */
export function AlgoStatus({ className, compact = false }: AlgoStatusProps) {
  const { meta, trends, loading, timeSinceUpdate, isStale } = useRealTimeTrends({
    limit: 20,
    refreshInterval: 30000
  })
  
  const [pulseActive, setPulseActive] = useState(false)
  
  // Pulse effect on data update
  useEffect(() => {
    if (!loading && meta) {
      setPulseActive(true)
      const timer = setTimeout(() => setPulseActive(false), 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [meta, loading])
  
  // Derived stats
  const stats = useMemo(() => {
    if (!meta || !trends.length) return null
    
    const tierS = trends.filter(t => t.score.tier === 'S').length
    const tierA = trends.filter(t => t.score.tier === 'A').length
    const postNow = trends.filter(t => t.prediction.recommendedAction === 'post_now').length
    const avgScore = Math.round(meta.avgViralScore)
    
    return { tierS, tierA, postNow, avgScore, total: trends.length }
  }, [trends, meta])
  
  const connectionStatus = loading ? 'connecting' : isStale ? 'stale' : 'live'
  
  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-black/40 border border-white/5',
        'backdrop-blur-sm',
        className
      )}>
        <div className={cn(
          'relative size-2 rounded-full',
          connectionStatus === 'live' ? 'bg-green-400' :
          connectionStatus === 'stale' ? 'bg-yellow-400' :
          'bg-white/30 animate-pulse'
        )}>
          {connectionStatus === 'live' && (
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-50" />
          )}
        </div>
        <span className="text-[10px] font-mono text-white/50">
          {loading ? 'SYNC...' : `${meta?.totalSignals || 0} signals`}
        </span>
      </div>
    )
  }
  
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-[#0a0a12]/90 to-[#07070f]/90',
      'border border-white/5',
      'backdrop-blur-xl',
      pulseActive && 'ring-1 ring-green-500/30',
      className
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              connectionStatus === 'live' ? 'bg-green-500/10' :
              connectionStatus === 'stale' ? 'bg-yellow-500/10' :
              'bg-white/5'
            )}>
              <Activity 
                size={14} 
                className={cn(
                  connectionStatus === 'live' ? 'text-green-400' :
                  connectionStatus === 'stale' ? 'text-yellow-400' :
                  'text-white/30'
                )} 
              />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">ALGO Engine</h3>
              <p className="text-[9px] text-white/30">Viral Detection System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono',
              connectionStatus === 'live' ? 'bg-green-500/10 text-green-400' :
              connectionStatus === 'stale' ? 'bg-yellow-500/10 text-yellow-400' :
              'bg-white/5 text-white/40'
            )}>
              <Radio size={8} />
              <span>{connectionStatus === 'live' ? 'ACTIF' : connectionStatus === 'stale' ? 'PAUSE' : 'SYNC'}</span>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            <StatCell 
              icon={Server} 
              label="Signaux" 
              value={meta?.totalSignals || 0} 
              color="violet"
            />
            <StatCell 
              icon={Zap} 
              label="Tier S" 
              value={stats.tierS} 
              color="yellow"
            />
            <StatCell 
              icon={TrendingUp} 
              label="Tier A" 
              value={stats.tierA} 
              color="emerald"
            />
            <StatCell 
              icon={Cpu} 
              label="Score Moy" 
              value={stats.avgScore} 
              color="cyan"
            />
          </div>
        )}
        
        {/* Connection info */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-[9px] text-white/30">
            <Wifi size={10} />
            <span>Dernière sync: {timeSinceUpdate}s</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-white/30">
            <Globe2 size={10} />
            <span>{stats?.total || 0} topics actifs</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCell({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: typeof Activity
  label: string
  value: number
  color: 'violet' | 'yellow' | 'emerald' | 'cyan'
}) {
  const colorClasses = {
    violet: 'text-violet-400 bg-violet-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    cyan: 'text-[#00D1FF] bg-[#00D1FF]/10',
  }
  
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.02]">
      <div className={cn('p-1 rounded-md', colorClasses[color])}>
        <Icon size={10} />
      </div>
      <span className="text-sm font-bold text-white tabular-nums">{value}</span>
      <span className="text-[8px] text-white/30 uppercase tracking-wider">{label}</span>
    </div>
  )
}

/**
 * MiniAlgoStatus · Version minimale pour la navbar
 */
export function MiniAlgoStatus({ className }: { className?: string }) {
  const { meta, loading, isStale } = useRealTimeTrends({
    limit: 5,
    refreshInterval: 60000
  })
  
  return (
    <div className={cn(
      'flex items-center gap-1.5',
      className
    )}>
      <div className={cn(
        'size-1.5 rounded-full',
        loading ? 'bg-white/30 animate-pulse' :
        isStale ? 'bg-yellow-400' :
        'bg-green-400 algo-live-pulse'
      )} />
      <span className="text-[9px] font-mono text-white/40">
        {loading ? '...' : `${meta?.totalSignals || 0}`}
      </span>
    </div>
  )
}
