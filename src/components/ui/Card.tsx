import { Eye, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from './Badge'
import { ViralScoreRing } from './ViralScoreRing'
import { MomentumPill } from './MomentumPill'
import { InsightPanel } from './InsightPanel'
import { ImageWithFallback } from './ImageWithFallback'
import type { Content, BadgeType } from '@/types'
import { formatViews, formatRelativeTime } from '@/i18n/utils'

// ─── Labels passés par le parent — zéro texte hardcodé ───────────────────────

interface CardLabels {
  badge: Record<BadgeType | 'coolOff' | 'exploding', string>
  viralScoreAriaLabel: string  // ex: "Viral Score : {value}"
  insight: Parameters<typeof InsightPanel>[0]['labels']
}

interface CardProps {
  content:      Content
  labels:       CardLabels
  locale?:      string
  showInsight?: boolean
  animClass?:   string   // ex: 'algo-s1'
  className?:   string
}

const platformCls: Record<string, string> = {
  TikTok:    'text-pink-400',
  Instagram: 'text-purple-400',
  YouTube:   'text-red-400',
  Twitter:   'text-sky-400',
  Snapchat:  'text-yellow-400',
  Reddit:    'text-orange-400',
  Other:     'text-white/35',
}

export function Card({
  content,
  labels,
  locale    = 'fr',
  showInsight = false,
  animClass,
  className,
}: CardProps) {
  const isCooling  = content.growthTrend === 'down'
  const badgeType: BadgeType | 'coolOff' | 'exploding' =
    content.isExploding ? 'exploding'
    : isCooling          ? 'coolOff'
    : content.badge

  const badgeLabel = labels.badge[badgeType]

  // Use sourceUrl for live API content (yt_*, etc.), fall back to internal route for mock data
  const href = content.sourceUrl || `/content/${content.id}`
  const isExternal = content.sourceUrl?.startsWith('http')

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={cn(
        // Layout - Fixed height and card-stable to prevent CLS
        'group block rounded-[16px] border overflow-hidden h-[220px] card-stable',
        // Glassmorphism
        'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
        // Backdrop
        'backdrop-blur-[12px]',
        // Transitions
        'transition-[transform,border-color,box-shadow] duration-[250ms] ease-out',
        // Hover
        'hover:scale-[1.012] hover:border-[rgba(123,97,255,0.22)] hover:bg-[rgba(255,255,255,0.07)]',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60',
        // Animations conditionnelles
        content.isExploding && 'algo-exploding',
        content.badge === 'Early' && !content.isExploding && 'algo-early-card',
        isCooling && 'opacity-65',
        // Stagger
        animClass,
        className,
      )}
      aria-label={content.title}
    >
      {/* ── Thumbnail - Fixed dimensions to prevent CLS ── */}
      <div className="relative w-full h-[120px] bg-white/5 overflow-hidden">
        <ImageWithFallback
          src={content.thumbnail}
          alt={content.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[350ms] group-hover:scale-[1.03]"
          containerClassName="absolute inset-0"
          fallbackType="platform"
          platform={content.platform?.toLowerCase() || 'default'}
        />

        {/* Badge — position start pour RTL */}
        <div className="absolute top-2 start-2">
          <Badge type={badgeType} label={badgeLabel} />
        </div>

        {/* Platform — position end pour RTL */}
        <div className="absolute top-2 end-2">
          <span
            className={cn(
              'text-[9px] font-bold uppercase tracking-widest',
              'px-2 py-0.5 rounded-full',
              'bg-black/45 backdrop-blur-sm',
              platformCls[content.platform] ?? 'text-white/40',
            )}
          >
            {content.platform}
          </span>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="p-3 space-y-2.5">

        {/* Titre */}
        <p className="text-white/85 text-sm font-semibold leading-snug line-clamp-2 transition-colors duration-150 group-hover:text-white">
          {content.title}
        </p>

        {/* Score + Momentum */}
        <div className="flex items-center justify-between">
          <ViralScoreRing
            value={content.viralScore}
            trend={content.growthTrend}
            size="sm"
            aria-label={`${labels.viralScoreAriaLabel} : ${content.viralScore}`}
          />
          <MomentumPill value={content.growthRate} trend={content.growthTrend} />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-white/28">
          {content.views != null && (
            <span className="flex items-center gap-1">
              <Eye size={9} strokeWidth={2} aria-hidden />
              {formatViews(content.views, locale)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={9} strokeWidth={2} aria-hidden />
            {formatRelativeTime(content.detectedAt, locale)}
          </span>
          <span className="ms-auto text-white/18">{content.category}</span>
        </div>

        {/* InsightPanel condensé — visible au hover desktop uniquement */}
        {showInsight && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-[200ms] pt-0.5">
            <InsightPanel
              insight={content.insight}
              labels={labels.insight}
              condensed
            />
          </div>
        )}
      </div>
    </a>
  )
}
