'use client'

/**
 * Intelligence Badges · Visual indicators for ALGO Engine analysis
 * 
 * Displays: Viral Score, Emotion Tag, Freshness, Early Signal
 */

import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  Zap, 
  Clock, 
  Sparkles,
  Flame,
  AlertTriangle,
  Lightbulb,
  Heart,
  Laugh,
  HelpCircle
} from 'lucide-react'
import type { ViralScore, EmotionAnalysis, ViralPhase, EmotionType } from '@/lib/algo-engine'

// ═══════════════════════════════════════════════════════════════════════════
// VIRAL SCORE BADGE
// ═══════════════════════════════════════════════════════════════════════════

const PHASE_CONFIG: Record<ViralPhase, { color: string; bg: string; icon: typeof TrendingUp }> = {
  early: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: Sparkles },
  rising: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: TrendingUp },
  peak: { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Flame },
  saturated: { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle },
  declining: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', icon: Clock },
}

interface ViralScoreBadgeProps {
  score: ViralScore
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ViralScoreBadge({ score, size = 'md', showLabel = true, className }: ViralScoreBadgeProps) {
  const config = PHASE_CONFIG[score.phase]
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  }
  
  const iconSizes = { sm: 10, md: 12, lg: 14 }
  
  return (
    <div className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.bg,
      config.color,
      sizeClasses[size],
      className
    )}>
      <Icon size={iconSizes[size]} />
      <span className="font-bold">{score.score}</span>
      {showLabel && <span className="opacity-80">• {score.label}</span>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VIRAL SCORE RING (Circular visualization)
// ═══════════════════════════════════════════════════════════════════════════

interface ViralScoreRingProps {
  score: number
  phase: ViralPhase
  size?: number
  showPhase?: boolean
  className?: string
}

export function ViralScoreRingEnhanced({ score, phase, size = 48, showPhase = false, className }: ViralScoreRingProps) {
  const config = PHASE_CONFIG[phase]
  const strokeWidth = size / 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  
  // Color based on score
  const strokeColor = score >= 80 ? '#f59e0b' : score >= 60 ? '#22c55e' : score >= 40 ? '#06b6d4' : score >= 20 ? '#8b5cf6' : '#71717a'
  
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-bold" style={{ fontSize: size / 3 }}>{score}</span>
        {showPhase && (
          <span className={cn('text-[8px] uppercase tracking-wider', config.color)}>
            {phase}
          </span>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EMOTION TAG
// ═══════════════════════════════════════════════════════════════════════════

const EMOTION_CONFIG: Record<EmotionType, { color: string; bg: string; icon: typeof Heart; label: string }> = {
  curiosity: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: HelpCircle, label: 'Curiosite' },
  anger: { color: 'text-red-400', bg: 'bg-red-500/20', icon: Flame, label: 'Colere' },
  humor: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Laugh, label: 'Humour' },
  inspiration: { color: 'text-violet-400', bg: 'bg-violet-500/20', icon: Lightbulb, label: 'Inspiration' },
  fear: { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle, label: 'Peur' },
  neutral: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', icon: Clock, label: 'Neutre' },
}

interface EmotionTagProps {
  emotion: EmotionAnalysis
  size?: 'sm' | 'md'
  showIntensity?: boolean
  className?: string
}

export function EmotionTag({ emotion, size = 'md', showIntensity = false, className }: EmotionTagProps) {
  const config = EMOTION_CONFIG[emotion.primary]
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5'
  }
  
  return (
    <div className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.bg,
      config.color,
      sizeClasses[size],
      className
    )}>
      <Icon size={size === 'sm' ? 10 : 12} />
      <span>{config.label}</span>
      {showIntensity && emotion.intensity > 0.5 && (
        <span className="opacity-60">• {Math.round(emotion.intensity * 100)}%</span>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EARLY SIGNAL BADGE
// ═══════════════════════════════════════════════════════════════════════════

interface EarlySignalBadgeProps {
  className?: string
}

export function EarlySignalBadge({ className }: EarlySignalBadgeProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
      'bg-gradient-to-r from-violet-500/20 to-cyan-500/20',
      'border border-violet-500/30',
      'text-[10px] font-bold text-violet-300 uppercase tracking-wider',
      className
    )}>
      <Zap size={10} className="text-cyan-400" />
      Signal emergent
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FRESHNESS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

interface FreshnessIndicatorProps {
  status: 'live' | 'recent' | 'stale'
  timestamp?: string
  className?: string
}

export function FreshnessIndicator({ status, timestamp, className }: FreshnessIndicatorProps) {
  const config = {
    live: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Données récentes' },
    recent: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: 'Mis a jour' },
    stale: { color: 'text-zinc-500', bg: 'bg-zinc-600/20', label: 'Données anciennes' },
  }
  
  const current = config[status]
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 text-[10px]',
      current.color,
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', status === 'live' ? 'bg-amber-400' : status === 'recent' ? 'bg-zinc-400' : 'bg-zinc-500')} />
      <span>{current.label}</span>
      {timestamp && <span className="opacity-60">• {timestamp}</span>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED INTELLIGENCE STRIP
// ═══════════════════════════════════════════════════════════════════════════

interface IntelligenceStripProps {
  viralScore: ViralScore
  emotion: EmotionAnalysis
  isEarlySignal?: boolean
  freshness?: 'live' | 'recent' | 'stale'
  compact?: boolean
  className?: string
}

export function IntelligenceStrip({ 
  viralScore, 
  emotion, 
  isEarlySignal = false, 
  freshness,
  compact = false,
  className 
}: IntelligenceStripProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 flex-wrap',
      compact && 'gap-1.5',
      className
    )}>
      <ViralScoreBadge 
        score={viralScore} 
        size={compact ? 'sm' : 'md'} 
        showLabel={!compact}
      />
      <EmotionTag 
        emotion={emotion} 
        size={compact ? 'sm' : 'md'}
      />
      {isEarlySignal && <EarlySignalBadge />}
      {freshness && <FreshnessIndicator status={freshness} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION CARD
// ═══════════════════════════════════════════════════════════════════════════

import type { ActionSuggestion } from '@/lib/algo-engine'

interface ActionCardProps {
  action: ActionSuggestion
  onClick?: () => void
  className?: string
}

export function ActionCard({ action, onClick, className }: ActionCardProps) {
  const urgencyConfig = {
    immediate: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Maintenant' },
    soon: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Bientot' },
    flexible: { color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: 'Flexible' },
  }
  
  const difficultyConfig = {
    easy: { dots: 1, label: 'Facile' },
    medium: { dots: 2, label: 'Moyen' },
    hard: { dots: 3, label: 'Avance' },
  }
  
  const urgency = urgencyConfig[action.urgency]
  const difficulty = difficultyConfig[action.difficulty]
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-xl text-left transition-all',
        'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm text-white/90 font-medium leading-snug">
          {action.action}
        </p>
        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full shrink-0', urgency.bg, urgency.color)}>
          {urgency.label}
        </span>
      </div>
      
      <div className="flex items-center gap-3 text-[10px] text-white/40">
        <span className="px-1.5 py-0.5 rounded bg-white/10">{action.format}</span>
        <span className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <span 
              key={i} 
              className={cn(
                'w-1 h-1 rounded-full',
                i < difficulty.dots ? 'bg-white/60' : 'bg-white/20'
              )}
            />
          ))}
          <span className="ml-1">{difficulty.label}</span>
        </span>
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIONS PANEL
// ═══════════════════════════════════════════════════════════════════════════

interface ActionsPanelProps {
  actions: ActionSuggestion[]
  title?: string
  onActionClick?: (action: ActionSuggestion) => void
  className?: string
}

export function ActionsPanel({ actions, title = 'Actions suggerees', onActionClick, className }: ActionsPanelProps) {
  if (actions.length === 0) return null
  
  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
        {title}
      </h4>
      <div className="space-y-2">
        {actions.map((action) => (
          <ActionCard 
            key={action.id} 
            action={action}
            onClick={() => onActionClick?.(action)}
          />
        ))}
      </div>
    </div>
  )
}
