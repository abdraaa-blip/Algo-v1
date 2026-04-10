'use client'

import { useState, useEffect, memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  Zap, 
  Clock, 
  Globe2, 
  ChevronRight,
  Flame,
  Target,
  AlertTriangle,
  HelpCircle,
  Laugh,
  Lightbulb,
  Heart
} from 'lucide-react'
import { ViralScoreRing } from './ViralScoreRing'
import { MomentumPill } from './MomentumPill'
import { analyzeEmotion, type EmotionType } from '@/lib/algo-engine'
import type { RealTimeTrend } from '@/hooks/useRealTimeTrends'

interface RealTimeTrendCardProps {
  trend: RealTimeTrend
  rank?: number
  showPrediction?: boolean
  compact?: boolean
  onClick?: (trend: RealTimeTrend) => void
  className?: string
}

// Platform icons/colors
const PLATFORM_CONFIG: Record<string, { color: string; label: string }> = {
  tiktok: { color: '#00f2ea', label: 'TikTok' },
  x: { color: '#ffffff', label: 'X' },
  instagram: { color: '#E4405F', label: 'Instagram' },
  youtube: { color: '#FF0000', label: 'YouTube' },
  reddit: { color: '#FF5700', label: 'Reddit' },
  google: { color: '#4285F4', label: 'Google' },
  news: { color: '#10B981', label: 'News' },
}

// Tier colors
const TIER_CONFIG: Record<string, { bg: string; text: string; glow: string }> = {
  S: { bg: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
  A: { bg: 'bg-violet-500/15', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
  B: { bg: 'bg-[#00D1FF]/10', text: 'text-[#00D1FF]', glow: 'shadow-[#00D1FF]/20' },
  C: { bg: 'bg-white/5', text: 'text-white/60', glow: '' },
  D: { bg: 'bg-white/3', text: 'text-white/40', glow: '' },
}

// Emotion detection config
const EMOTION_CONFIG: Record<EmotionType, { icon: typeof Heart; color: string; label: string }> = {
  curiosity: { icon: HelpCircle, color: 'text-cyan-400', label: 'Curiosite' },
  anger: { icon: Flame, color: 'text-red-400', label: 'Colere' },
  humor: { icon: Laugh, color: 'text-yellow-400', label: 'Humour' },
  inspiration: { icon: Lightbulb, color: 'text-violet-400', label: 'Inspiration' },
  fear: { icon: AlertTriangle, color: 'text-orange-400', label: 'Peur' },
  neutral: { icon: Target, color: 'text-zinc-400', label: 'Neutre' },
}

function RealTimeTrendCardComponent({
  trend,
  rank,
  showPrediction = true,
  compact = false,
  onClick,
  className
}: RealTimeTrendCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [velocityDelta, setVelocityDelta] = useState(0)
  
  // Simuler des updates de vélocité en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setVelocityDelta(Math.floor(Math.random() * 200) - 50) // -50 à +150
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  
  // Analyze emotion from keyword
  const emotion = useMemo(() => analyzeEmotion(trend.keyword), [trend.keyword])
  const emotionConfig = EMOTION_CONFIG[emotion.primary]
  const EmotionIcon = emotionConfig.icon
  
  const tierConfig = TIER_CONFIG[trend.score.tier] || TIER_CONFIG.D
  const scoreVelocity = trend.score.breakdown?.velocity ?? trend.avgVelocity
  const momentum = scoreVelocity > 70 ? 'rising' : scoreVelocity > 40 ? 'steady' : 'fading'
  
  // Format large numbers
  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }
  
  // Action indicator
  const getActionIndicator = () => {
    const recommendedAction = trend.prediction?.recommendedAction
    switch (recommendedAction) {
      case 'post_now':
        return { icon: Flame, text: 'POST NOW', color: 'text-orange-400 bg-orange-500/20' }
      case 'prepare':
        return { icon: Target, text: 'PREPARE', color: 'text-violet-400 bg-violet-500/20' }
      case 'wait':
        return { icon: Clock, text: 'WAIT', color: 'text-[#00D1FF] bg-[#00D1FF]/20' }
      case 'too_late':
        return { icon: AlertTriangle, text: 'LATE', color: 'text-red-400 bg-red-500/20' }
      default:
        return { icon: Target, text: 'ANALYZE', color: 'text-white/60 bg-white/10' }
    }
  }
  
  const action = getActionIndicator()
  
  if (compact) {
    return (
      <div 
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl',
          'bg-white/[0.02] hover:bg-white/[0.05]',
          'border border-white/5 hover:border-white/10',
          'transition-all duration-200 cursor-pointer',
          className
        )}
        onClick={() => onClick?.(trend)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.(trend)
          }
        }}
      >
        {rank && (
          <span className={cn(
            'text-sm font-bold tabular-nums w-6 text-center',
            rank <= 3 ? 'text-yellow-400' : 'text-white/30'
          )}>
            {rank}
          </span>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{trend.keyword}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {trend.platforms.slice(0, 3).map(p => (
              <div 
                key={p}
                className="size-1.5 rounded-full"
                style={{ backgroundColor: PLATFORM_CONFIG[p]?.color || '#666' }}
              />
            ))}
            <span className="text-[10px] text-white/40">
              {formatNumber(trend.totalVolume)} mentions
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-md',
            tierConfig.bg, tierConfig.text
          )}>
            {trend.score.tier}
          </span>
          <ChevronRight size={14} className="text-white/20" />
        </div>
      </div>
    )
  }
  
  return (
    <div 
      className={cn(
        'relative group p-4 rounded-2xl cursor-pointer',
        'bg-gradient-to-br from-white/[0.03] to-transparent',
        'border border-white/5 hover:border-white/12',
        'transition-all duration-300',
        isHovered && 'shadow-xl',
        tierConfig.glow && isHovered && `shadow-lg ${tierConfig.glow}`,
        className
      )}
      onClick={() => onClick?.(trend)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(trend)
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {/* Rank + Title */}
          <div className="flex items-center gap-2 mb-1">
            {rank && (
              <span className={cn(
                'text-lg font-black tabular-nums',
                rank <= 3 ? 'text-yellow-400' : 'text-white/20'
              )}>
                #{rank}
              </span>
            )}
            <h3 className="text-base font-bold text-white truncate">{trend.keyword}</h3>
          </div>
          
          {/* Platforms + Emotion */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {trend.platforms.slice(0, 2).map(platform => (
              <span
                key={platform}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider"
                style={{ 
                  backgroundColor: `${PLATFORM_CONFIG[platform]?.color}15`,
                  color: PLATFORM_CONFIG[platform]?.color 
                }}
              >
                {PLATFORM_CONFIG[platform]?.label || platform}
              </span>
            ))}
            {/* Emotion Tag from ALGO Engine */}
            {emotion.primary !== 'neutral' && (
              <span className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/5',
                emotionConfig.color
              )}>
                <EmotionIcon size={9} />
                {emotionConfig.label}
              </span>
            )}
          </div>
        </div>
        
        {/* Score Ring */}
        <div className="flex flex-col items-center gap-1">
          <ViralScoreRing value={trend.score.overall} size="md" />
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-lg',
            tierConfig.bg, tierConfig.text
          )}>
            TIER {trend.score.tier}
          </span>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/[0.02] rounded-xl p-2">
          <div className="flex items-center gap-1 text-[10px] text-white/40 mb-0.5">
            <TrendingUp size={10} />
            <span>Velocity</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-white">{formatNumber(Math.round(trend.avgVelocity))}</span>
            {velocityDelta !== 0 && (
              <span className={cn(
                'text-[10px] font-medium',
                velocityDelta > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {velocityDelta > 0 ? '+' : ''}{velocityDelta}
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-white/[0.02] rounded-xl p-2">
          <div className="flex items-center gap-1 text-[10px] text-white/40 mb-0.5">
            <Zap size={10} />
            <span>Volume</span>
          </div>
          <span className="text-sm font-bold text-white">{formatNumber(trend.totalVolume)}</span>
        </div>
        
        <div className="bg-white/[0.02] rounded-xl p-2">
          <div className="flex items-center gap-1 text-[10px] text-white/40 mb-0.5">
            <Globe2 size={10} />
            <span>Spread</span>
          </div>
          <span className="text-sm font-bold text-white">
            {trend.signals[0]?.geographicSpread?.length || 1} pays
          </span>
        </div>
      </div>
      
      {/* Prediction Section */}
      {showPrediction && (
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <MomentumPill level={momentum} />
            <span className="text-[10px] text-white/40">
              Confiance: {Math.round(trend.score.confidence * 100)}%
            </span>
          </div>
          
          {action && (
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
              action.color
            )}>
              <action.icon size={12} />
              <span>{action.text}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Hover Effect */}
      <div 
        className={cn(
          'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
          'bg-gradient-to-t from-violet-500/5 to-transparent'
        )}
      />
    </div>
  )
}

export const RealTimeTrendCard = memo(RealTimeTrendCardComponent)
