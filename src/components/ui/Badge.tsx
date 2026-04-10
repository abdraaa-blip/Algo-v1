import { cn } from '@/lib/utils'
import type { BadgeType } from '@/types'

// Mapping vers les classes Tailwind — couleurs issues des tokens via @theme
const cfg: Record<BadgeType | 'coolOff' | 'exploding', {
  base:  string
  dot?:  string
  anim?: string
}> = {
  Viral:       { base: 'bg-[rgba(123,97,255,0.20)] text-violet-300  border-[rgba(123,97,255,0.25)]',  dot: 'bg-violet-400',  anim: 'algo-dot-blink' },
  Early:       { base: 'bg-[rgba(0,255,178,0.15)]  text-emerald-300 border-[rgba(0,255,178,0.20)]',   dot: 'bg-emerald-400', anim: 'algo-early-glow' },
  Breaking:    { base: 'bg-[rgba(255,77,109,0.20)] text-rose-300    border-[rgba(255,77,109,0.25)]',  dot: 'bg-rose-400',    anim: 'algo-dot-blink' },
  Trend:       { base: 'bg-[rgba(0,209,255,0.15)]  text-sky-300     border-[rgba(0,209,255,0.20)]',   dot: 'bg-sky-400' },
  AlmostViral: { base: 'bg-white/8                 text-white/45    border-white/10' },
  coolOff:     { base: 'bg-white/4                 text-white/25    border-white/6' },
  exploding:   { base: 'bg-[rgba(255,77,109,0.25)] text-rose-200    border-[rgba(255,77,109,0.35)]',  dot: 'bg-rose-300',    anim: 'algo-dot-blink' },
}

interface BadgeProps {
  type:      BadgeType | 'coolOff' | 'exploding'
  label:     string
  animated?: boolean
  size?:     'sm' | 'md'
  className?: string
}

export function Badge({ type, label, animated = true, size = 'sm', className }: BadgeProps) {
  const c = cfg[type] ?? cfg.AlmostViral

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-[0.07em]',
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
        c.base,
        className,
      )}
    >
      {c.dot && (
        <span
          aria-hidden
          className={cn(
            'rounded-full flex-shrink-0',
            size === 'sm' ? 'size-1.5' : 'size-2',
            c.dot,
            animated && c.anim,
          )}
        />
      )}
      {label}
    </span>
  )
}
