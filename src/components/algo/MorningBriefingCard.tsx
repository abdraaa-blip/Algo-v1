'use client'

import Link from 'next/link'
import { Clapperboard, Newspaper, Radar, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BriefingSignalIcon = 'radar' | 'news' | 'video'

export type BriefingSignal = {
  label: string
  title: string
  href: string
  meta?: string
  icon: BriefingSignalIcon
}

const icons = {
  radar: Radar,
  news: Newspaper,
  video: Clapperboard,
} as const

/**
 * Briefing « 3 signaux + 1 action » — boucle valeur rapide sans refetch.
 */
export function MorningBriefingCard({
  signals,
  action,
  className,
}: {
  signals: BriefingSignal[]
  action: { label: string; href: string }
  className?: string
}) {
  if (signals.length === 0) return null

  return (
    <div
      className={cn(
        'rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-cyan-950/35 via-[var(--color-bg-secondary)] to-violet-950/20 p-3 sm:p-4 mb-6 sm:mb-8 shadow-[var(--shadow-algo-sm)]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/90">
            Briefing signal
          </p>
          <p className="text-xs sm:text-sm font-semibold text-white/85 mt-0.5">
            3 lectures — avant que le feed ne décide pour toi
          </p>
        </div>
        <Link
          href="/intelligence"
          className="text-[10px] sm:text-xs font-semibold text-white/45 hover:text-cyan-300/90 shrink-0 transition-colors"
        >
          Radar →
        </Link>
      </div>

      <ul className="space-y-2 sm:space-y-2.5 mb-4">
        {signals.map((s, i) => {
          const Icon = icons[s.icon]
          const external = s.href.startsWith('http')
          const inner = (
            <>
                <span className="mt-0.5 rounded-md bg-cyan-500/15 p-1.5 text-cyan-300">
                  <Icon size={14} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">{s.label}</span>
                    {s.meta ? (
                      <span className="text-[9px] text-cyan-400/70 font-mono tabular-nums">{s.meta}</span>
                    ) : null}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white/80 line-clamp-2 mt-0.5 group-hover:text-white transition-colors">
                    {s.title}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-white/20 group-hover:text-cyan-400/80 shrink-0 mt-1 transition-colors"
                  aria-hidden
                />
            </>
          )
          return (
            <li key={`${s.label}-${i}`}>
              {external ? (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 sm:p-3 hover:bg-[var(--color-card-hover)] hover:border-cyan-500/20 transition-colors group"
                >
                  {inner}
                </a>
              ) : (
                <Link
                  href={s.href}
                  className="flex items-start gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 sm:p-3 hover:bg-[var(--color-card-hover)] hover:border-cyan-500/20 transition-colors group"
                >
                  {inner}
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      <Link
        href={action.href}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500/20 border border-cyan-400/35 text-cyan-100 hover:bg-cyan-500/30 transition-colors"
      >
        {action.label}
        <ArrowRight size={16} strokeWidth={2.2} aria-hidden />
      </Link>
    </div>
  )
}
