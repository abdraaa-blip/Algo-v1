import { TrendingUp, TrendingDown, Minus, Zap, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GrowthTrend, MomentumLevel } from '@/types'

const cfg: Record<GrowthTrend, { icon: typeof TrendingUp; cls: string }> = {
  up:     { icon: TrendingUp,   cls: 'bg-[rgba(0,255,178,0.12)]  border-[rgba(0,255,178,0.22)]  text-emerald-400' },
  stable: { icon: Minus,        cls: 'bg-[rgba(0,209,255,0.12)]  border-[rgba(0,209,255,0.22)]  text-sky-400'     },
  down:   { icon: TrendingDown, cls: 'bg-white/5                  border-white/10                 text-white/35'    },
}

const levelCfg: Record<MomentumLevel | 'rising' | 'steady' | 'fading', { icon: typeof TrendingUp; cls: string; label: string }> = {
  high:      { icon: Flame,       cls: 'bg-orange-500/15 border-orange-500/25 text-orange-400', label: 'Fort' },
  medium:    { icon: Zap,         cls: 'bg-violet-500/12 border-violet-500/22 text-violet-400', label: 'Moyen' },
  low:       { icon: Minus,       cls: 'bg-white/5 border-white/10 text-white/35', label: 'Faible' },
  exploding: { icon: Flame,       cls: 'bg-orange-500/15 border-orange-500/25 text-orange-400', label: 'Explose' },
  rising:    { icon: TrendingUp,  cls: 'bg-emerald-500/12 border-emerald-500/22 text-emerald-400', label: 'Monte' },
  peaked:    { icon: Zap,         cls: 'bg-violet-500/12 border-violet-500/22 text-violet-400', label: 'Pic atteint' },
  steady:    { icon: Minus,       cls: 'bg-[#00D1FF]/10 border-[#00D1FF]/20 text-[#00D1FF]', label: 'Stable' },
  cooling:   { icon: TrendingDown,cls: 'bg-white/5 border-white/10 text-white/40', label: 'Refroidit' },
  fading:    { icon: TrendingDown,cls: 'bg-white/3 border-white/8 text-white/30', label: 'Declin' },
}

interface MomentumPillProps {
  value?:   number | string
  trend?:   GrowthTrend
  level?:   MomentumLevel | 'rising' | 'steady' | 'fading'
  unit?:    string
  className?: string
}

export function MomentumPill({ value, trend, level, unit, className }: MomentumPillProps) {
  // If level is provided, use the level-based config
  if (level) {
    const config = levelCfg[level] || levelCfg.steady
    const Icon = config.icon
    
    return (
      <span
        aria-label={config.label}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5',
          'rounded-full border text-[10px] font-semibold',
          config.cls,
          className,
        )}
      >
        <Icon size={10} strokeWidth={2.5} aria-hidden className="shrink-0" />
        <span>{config.label}</span>
      </span>
    )
  }
  
  // Original behavior with value and trend
  if (trend === undefined || value === undefined) {
    return null
  }
  const { icon: Icon, cls } = cfg[trend]
  
  // Handle both string and number values
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  const isPositive = numValue > 0
  const prefix = typeof value === 'string' 
    ? (value.startsWith('+') || value.startsWith('-') ? '' : (isPositive ? '+' : ''))
    : (trend === 'up' ? '+' : '')
  const display = typeof value === 'string' 
    ? (value.includes('%') ? value : `${prefix}${value}%`)
    : `${prefix}${value}%`

  return (
    <span
      aria-label={`${display}${unit ? ` ${unit}` : ''}`}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5',
        'rounded-full border text-[10px] font-semibold',
        cls,
        className,
      )}
    >
      <Icon size={10} strokeWidth={2.5} aria-hidden className="shrink-0" />
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {display}
        {unit && <span className="opacity-55 ms-0.5">{unit}</span>}
      </span>
    </span>
  )
}
