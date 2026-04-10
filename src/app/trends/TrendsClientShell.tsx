'use client'
// REBUILD_REQUIRED: 2026-04-05T06:25 - This file does NOT use getTrends
// All trends come from useRealTimeTrends hook, displayTrends variable
import { useState, useMemo } from 'react'
import { TrendingUp, Users, Activity, Zap, Timer } from 'lucide-react'
import { BackButton }       from '@/components/ui/BackButton'
import { FilterBar }        from '@/components/ui/FilterBar'
import { SectionHeader }    from '@/components/ui/SectionHeader'
import { WatchlistToggle }  from '@/components/ui/WatchlistToggle'
import { MomentumPill }     from '@/components/ui/MomentumPill'
import { Badge }            from '@/components/ui/Badge'
import { EmptyState }       from '@/components/ui/EmptyState'
import { SkeletonLoader }   from '@/components/ui/SkeletonLoader'
import { LiveIndicator, DataFlowVisualizer } from '@/components/ui/LivingPulse'
import { RealTimeTrendCard } from '@/components/ui/RealTimeTrendCard'
import { TrendDetailModal } from '@/components/ui/TrendDetailModal'
import { ViralScoreRing } from '@/components/ui/ViralScoreRing'
import { DataQualityChip } from '@/components/ui/DataQualityChip'
import type { RealTimeTrend } from '@/hooks/useRealTimeTrends'
import { useScope }         from '@/hooks/useScope'
import { useWatchlist }     from '@/hooks/useWatchlist'
import { useRealTimeTrends } from '@/hooks/useRealTimeTrends'
import { formatCount }      from '@/i18n/utils'
import { track }            from '@/services/analyticsService'
import { cn }               from '@/lib/utils'
import type { Trend, TrendTab, FilterOption } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendsLabels {
  title:     string
  subtitle:  string
  follow:    string
  unfollow:  string
  exploding: string
  loading:   string
  emptyTitle:string
  emptySub:  string
  whyWorks:  string
  tabLabels: Record<TrendTab, string>
}

interface TrendsClientShellProps {
  initialTrends: Trend[]
  locale:        string
  labels:        TrendsLabels
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function TrendsClientShell({ initialTrends, locale, labels }: TrendsClientShellProps) {
  const [activeTab, setActiveTab] = useState<TrendTab>('today')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [selectedTrend, setSelectedTrend] = useState<RealTimeTrend | null>(null)
  const { scope, isLoaded }       = useScope()
  const { toggle, isFollowing }   = useWatchlist()
  
  // Determine country code based on scope type
  const getCountryFromScope = () => {
    if (scope.type === 'country') return scope.code || 'US'
    if (scope.type === 'region') {
      // For regions, use the first country as representative or 'US' for global-like behavior
      return scope.code === 'EUROPE' ? 'FR' : 
             scope.code === 'AFRICA' ? 'NG' :
             scope.code === 'AMERICAS' ? 'US' :
             scope.code === 'ASIA' ? 'JP' : 'US'
    }
    return 'US' // Global default
  }

  // Real-time trends from the algorithm
  const { 
    trends,
    meta, 
    loading: trendsLoading,
    timeSinceUpdate,
    isStale,
    refresh
  } = useRealTimeTrends({
    country: getCountryFromScope(),
    limit: 30,
    refreshInterval: 30000,
    enabled: isLoaded
  })

  // Use real-time trends data (no more legacy mock data)
  const displayTrends = trends.length > 0 ? trends : initialTrends

  const scopeLabel = scope.type === 'global' ? '' : ` — ${scope.name || ''}`

  const filterOptions: FilterOption[] = (
    ['today','week','month','mostViewed','mostPlayed','mostCopied','emerging'] as TrendTab[]
  ).map((tab) => ({ id: tab, label: labels.tabLabels[tab], value: tab }))

  function handleFollow(trendId: string) {
    toggle(trendId)
    track(isFollowing(trendId) ? 'trend_unfollowed' : 'trend_followed', { trendId, tab: activeTab })
  }

  const STAGGER = ['algo-s1','algo-s2','algo-s3','algo-s4','algo-s5','algo-s6'] as const
  
  // Stats dérivées
  const stats = useMemo(() => {
    if (!meta) return null
    const tierS = trends.filter(t => t.score.tier === 'S').length
    const tierA = trends.filter(t => t.score.tier === 'A').length
    const postNow = trends.filter(t => t.prediction.recommendedAction === 'post_now').length
    return { tierS, tierA, postNow, total: trends.length }
  }, [trends, meta])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Back Button */}
      <BackButton fallbackHref="/" />

      {/* ═══════════════════════════════════════════════════════════════════
          LIVE ALGORITHM HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] border border-[var(--color-border)] p-5">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00D1FF]/5 rounded-full blur-[60px]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Activity className="text-violet-400" size={20} />
                <h1 className="text-xl font-black text-[var(--color-text-primary)] tracking-tight">
                  {labels.title}{scopeLabel}
                </h1>
                <LiveIndicator />
              </div>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {meta 
                  ? `${meta.totalSignals} signaux analysés en temps réel`
                  : labels.subtitle
                }
              </p>
            </div>
            
            {/* Quick Stats */}
            {stats && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-xs text-yellow-400 font-bold">{stats.tierS}</span>
                  <span className="text-[10px] text-yellow-400/60">TIER S</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <span className="text-xs text-violet-400 font-bold">{stats.tierA}</span>
                  <span className="text-[10px] text-violet-400/60">TIER A</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Zap size={12} className="text-orange-400" />
                  <span className="text-xs text-orange-400 font-bold">{stats.postNow}</span>
                  <span className="text-[10px] text-orange-400/60">POST NOW</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Data Flow */}
          <DataFlowVisualizer particleCount={25} className="mb-4" />
          <div className="mb-3">
            <DataQualityChip
              source={(meta as { source?: string } | null)?.source || `realtime:${getCountryFromScope()}`}
              freshness={isStale ? 'stale' : `${timeSinceUpdate}s`}
              confidence={trends.length >= 20 ? 'high' : trends.length >= 8 ? 'medium' : 'low'}
            />
          </div>
          
          {/* View toggle & Refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  viewMode === 'cards' 
                    ? 'bg-[var(--color-card-hover)] text-[var(--color-text-primary)]' 
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                Cartes
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  viewMode === 'list' 
                    ? 'bg-[var(--color-card-hover)] text-[var(--color-text-primary)]' 
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                Liste
              </button>
            </div>
            
            <button
              onClick={refresh}
              disabled={trendsLoading}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs',
                'bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                'transition-all disabled:opacity-50'
              )}
            >
              <Timer size={12} className={trendsLoading ? 'animate-spin' : ''} />
              <span>{isStale ? 'Actualiser' : `${timeSinceUpdate}s`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FilterBar sticky */}
      <div
        className="sticky top-14 z-[100] -mx-4 px-4 py-2 border-b border-[var(--color-border)] algo-sticky-subnav"
      >
        <FilterBar
          filters={filterOptions}
          active={activeTab}
          onChange={(v) => setActiveTab(v as TrendTab)}
          ariaLabel={labels.title}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          REAL-TIME TRENDS GRID
      ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Loading */}
      {trendsLoading && trends.length === 0 && (
        <div className={viewMode === 'cards' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
        }>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLoader key={i} shape={viewMode === 'cards' ? 'card' : 'row'} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!trendsLoading && trends.length === 0 && (
        <EmptyState
          icon={TrendingUp}
          title={labels.emptyTitle}
          subtitle={labels.emptySub}
        />
      )}

      {/* Cards View */}
      {trends.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trends.map((trend, i) => (
            <RealTimeTrendCard
              key={trend.keyword || `trend-${i}`}
              trend={trend}
              rank={i + 1}
              showPrediction={true}
              onClick={setSelectedTrend}
              className={STAGGER[i % 6]}
            />
          ))}
        </div>
      )}
      
      {/* List View */}
      {trends.length > 0 && viewMode === 'list' && (
        <div className="space-y-2" role="list" aria-label={`Trends — ${labels.tabLabels[activeTab]}`}>
          {trends.map((trend, i) => (
            <RealTimeTrendCard
              key={trend.keyword || `trend-${i}`}
              trend={trend}
              rank={i + 1}
              compact={true}
              onClick={setSelectedTrend}
              className={STAGGER[i % 6]}
            />
          ))}
        </div>
      )}
      
      {/* Trend Detail Modal */}
      {selectedTrend && (
        <TrendDetailModal
          trend={selectedTrend}
          onClose={() => setSelectedTrend(null)}
          onCopyHook={(hook) => track('hook_copied', { trend: selectedTrend.keyword, hook })}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          LEGACY TRENDS (for comparison/fallback)
      ═══════════════════════════════════════════════════════════════════ */}
      {displayTrends.length > 0 && (
        <div className="pt-8 border-t border-[var(--color-border)]">
          <SectionHeader
            title="Trends classiques"
            subtitle="Basé sur les données historiques"
            className="mb-4"
          />
          
          <div className="space-y-3" role="list">
            {displayTrends.slice(0, 5).map((trend, i) => (
              <TrendRow
                key={trend.id || `legacy-trend-${i}`}
                trend={trend}
                rank={i + 1}
                locale={locale}
                isFollowing={isFollowing(trend.id || `legacy-${i}`)}
                onToggle={handleFollow}
                followLabel={labels.follow}
                unfollowLabel={labels.unfollow}
                explodingLabel={labels.exploding}
                animClass={STAGGER[i % 6]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// ─── TrendRow ─────────────────────────────────────────────────────────────────

interface TrendRowProps {
  trend:          Trend
  rank:           number
  locale:         string
  isFollowing:    boolean
  onToggle:       (id: string) => void
  followLabel:    string
  unfollowLabel:  string
  explodingLabel: string
  animClass:      string
}

function TrendRow({
  trend, rank, locale, isFollowing, onToggle,
  followLabel, unfollowLabel, explodingLabel, animClass,
}: TrendRowProps) {
  const isCooling = trend.growthTrend === 'down'

  return (
    <article
      role="listitem"
      className={cn(
        'flex items-start gap-4 p-4 rounded-2xl border',
        'transition-all duration-[250ms]',
        'hover:border-[var(--color-border-strong)] hover:bg-[var(--color-card-hover)]',
        'focus-within:ring-2 focus-within:ring-violet-400/40',
        trend.isExploding
          ? 'border-[rgba(123,97,255,0.22)] bg-[rgba(123,97,255,0.04)] algo-exploding'
          : 'border-[var(--color-border)] bg-[var(--color-card)]',
        isCooling && 'opacity-60',
        animClass,
      )}
    >
      {/* Rang */}
      <span
        className="text-xl font-black leading-none shrink-0 mt-0.5 tabular-nums"
        style={{ color: rank <= 3 ? 'var(--color-violet)' : 'rgba(240,240,248,0.18)' }}
        aria-label={`Rang ${rank}`}
      >
        {rank}
      </span>

      {/* Infos */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">{trend.name}</span>
          {trend.isExploding && (
            <Badge type="exploding" label={explodingLabel} />
          )}
          {isCooling && (
            <Badge type="coolOff" label="En déclin" animated={false} />
          )}
        </div>

        <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed line-clamp-2">
          {trend.explanation}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <MomentumPill value={trend.growthRate} trend={trend.growthTrend} />
          <span
            className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1"
            aria-label={`${(trend.watchersCount || 0).toLocaleString(locale)} observateurs`}
          >
            <Users size={9} strokeWidth={2} aria-hidden />
            {formatCount(trend.watchersCount || 0, locale)}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)] opacity-90">
            {trend.platform} · {trend.category}
          </span>
        </div>

        {trend.associatedSound && (
          <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
            <span aria-hidden>🎵</span>
            {trend.associatedSound}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex flex-col items-end gap-2.5">
        <ViralScoreRing value={trend.score} size="md" />
        <WatchlistToggle
          trendId={trend.id}
          isFollowing={isFollowing}
          onToggle={onToggle}
          followLabel={followLabel}
          unfollowLabel={unfollowLabel}
          size="sm"
        />
      </div>
    </article>
  )
}
