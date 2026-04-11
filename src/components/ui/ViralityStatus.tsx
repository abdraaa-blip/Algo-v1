'use client'

import { cn } from '@/lib/utils'
import { Flame, TrendingUp, Zap, Clock, AlertTriangle, Sparkles } from 'lucide-react'

// =============================================================================
// ALGO V1 · Virality Status Component
// Shows the viral status of content with visual indicators
// =============================================================================

export type ViralityLevel = 
  | 'exploding'    // 90+ score, massive growth
  | 'viral'        // 80-89 score, strong momentum
  | 'rising'       // 70-79 score, growing fast
  | 'emerging'     // 60-69 score, early signal
  | 'stable'       // 50-59 score, steady
  | 'fading'       // Below 50, declining

export interface ViralityStatusProps {
  score: number
  momentum?: 'exploding' | 'rising' | 'stable' | 'fading'
  freshness?: 'fresh' | 'recent' | 'aging' | 'stale'
  saturation?: 'low' | 'medium' | 'high'
  variant?: 'badge' | 'pill' | 'card' | 'minimal'
  showLabel?: boolean
  showDetails?: boolean
  className?: string
}

// Calculate virality level from score
function getViralityLevel(score: number): ViralityLevel {
  if (score >= 90) return 'exploding'
  if (score >= 80) return 'viral'
  if (score >= 70) return 'rising'
  if (score >= 60) return 'emerging'
  if (score >= 50) return 'stable'
  return 'fading'
}

// Get display config for each level
const VIRALITY_CONFIG: Record<ViralityLevel, {
  label: string
  labelFr: string
  icon: typeof Flame
  color: string
  bgColor: string
  borderColor: string
  description: string
}> = {
  exploding: {
    label: 'Exploding',
    labelFr: 'Explosion',
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40',
    description: 'Ce contenu explose en ce moment'
  },
  viral: {
    label: 'Viral',
    labelFr: 'Viral',
    icon: Zap,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/40',
    description: 'Forte viralite en cours'
  },
  rising: {
    label: 'Rising',
    labelFr: 'Montant',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    description: 'Signal en forte croissance'
  },
  emerging: {
    label: 'Emerging',
    labelFr: 'Emergent',
    icon: Sparkles,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    description: 'Signal precoce detecte'
  },
  stable: {
    label: 'Stable',
    labelFr: 'Stable',
    icon: Clock,
    color: 'text-white/50',
    bgColor: 'bg-white/10',
    borderColor: 'border-white/20',
    description: 'Interet stable'
  },
  fading: {
    label: 'Fading',
    labelFr: 'Declin',
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    description: 'Interet en baisse'
  }
}

export function ViralityStatus({
  score,
  momentum,
  freshness,
  saturation,
  variant = 'badge',
  showLabel = true,
  showDetails = false,
  className
}: ViralityStatusProps) {
  const level = getViralityLevel(score)
  const config = VIRALITY_CONFIG[level]
  const Icon = config.icon

  // Badge variant - compact inline display
  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
          config.bgColor,
          config.color,
          className
        )}
      >
        <Icon size={10} />
        {showLabel && config.labelFr}
      </span>
    )
  }

  // Pill variant - slightly larger with border
  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
          config.bgColor,
          config.borderColor,
          config.color,
          className
        )}
      >
        <Icon size={12} className={level === 'exploding' ? 'animate-pulse' : ''} />
        {showLabel && config.labelFr}
        <span className="font-black">{score}</span>
      </span>
    )
  }

  // Card variant - full info display
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex flex-col gap-2 p-3 rounded-xl border',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={16} className={cn(config.color, level === 'exploding' && 'animate-pulse')} />
            <span className={cn('text-sm font-bold', config.color)}>
              {config.labelFr}
            </span>
          </div>
          <span className={cn('text-xl font-black', config.color)}>
            {score}
          </span>
        </div>

        {showDetails && (
          <>
            <p className="text-xs text-white/50">{config.description}</p>
            
            <div className="flex flex-wrap gap-2 text-[10px]">
              {momentum && (
                <span className={cn(
                  'px-2 py-0.5 rounded-full',
                  momentum === 'exploding' ? 'bg-orange-500/20 text-orange-300' :
                  momentum === 'rising' ? 'bg-emerald-500/20 text-emerald-300' :
                  momentum === 'stable' ? 'bg-white/10 text-white/50' :
                  'bg-red-500/10 text-red-300'
                )}>
                  {momentum === 'exploding' ? 'Momentum explosif' :
                   momentum === 'rising' ? 'Croissance forte' :
                   momentum === 'stable' ? 'Stable' :
                   'En baisse'}
                </span>
              )}
              
              {freshness && (
                <span className={cn(
                  'px-2 py-0.5 rounded-full',
                  freshness === 'fresh' ? 'bg-emerald-500/20 text-emerald-300' :
                  freshness === 'recent' ? 'bg-cyan-500/20 text-cyan-300' :
                  freshness === 'aging' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-red-500/10 text-red-300'
                )}>
                  {freshness === 'fresh' ? 'Tres frais' :
                   freshness === 'recent' ? 'Recent' :
                   freshness === 'aging' ? 'Vieillissant' :
                   'Ancien'}
                </span>
              )}
              
              {saturation && (
                <span className={cn(
                  'px-2 py-0.5 rounded-full',
                  saturation === 'low' ? 'bg-emerald-500/20 text-emerald-300' :
                  saturation === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-red-500/10 text-red-300'
                )}>
                  {saturation === 'low' ? 'Peu sature' :
                   saturation === 'medium' ? 'Saturation moyenne' :
                   'Tres sature'}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // Minimal variant - just icon and score
  return (
    <span className={cn('inline-flex items-center gap-1', config.color, className)}>
      <Icon size={12} />
      <span className="text-xs font-bold">{score}</span>
    </span>
  )
}

// Compact viral indicator for lists
export function ViralIndicator({ score, className }: { score: number; className?: string }) {
  const level = getViralityLevel(score)
  const config = VIRALITY_CONFIG[level]
  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Icon size={12} className={cn(config.color, level === 'exploding' && 'animate-pulse')} />
      <span className={cn('text-xs font-bold', config.color)}>{score}</span>
    </div>
  )
}

// Live pulse animation for exploding content
export function LivePulse({ active = true, className }: { active?: boolean; className?: string }) {
  if (!active) return null
  
  return (
    <span className={cn('relative flex size-2', className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full size-2 bg-red-500" />
    </span>
  )
}

export default ViralityStatus
