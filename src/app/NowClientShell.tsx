'use client'

// CACHE_BUST_V6: 2026-04-05T06:10 - Imports DataFlowVisualizer from LivingPulse
// This file uses ONLY pure CSS backgrounds
// If you see AnimatedBackground errors, clear your browser cache

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ExternalLink, Zap, Activity, TrendingUp, Sparkles, Radio, Bell } from 'lucide-react'
import { useScope }        from '@/hooks/useScope'
import { getCountryCodeFromScope } from '@/data/countries'
import { useRealTimeTrends, type RealTimeTrend } from '@/hooks/useRealTimeTrends'
import { Card }            from '@/components/ui/Card'
import { SectionHeader }   from '@/components/ui/SectionHeader'
import { SkeletonLoader }  from '@/components/ui/SkeletonLoader'
import { EmptyState }      from '@/components/ui/EmptyState'
import { LivingPulse } from '@/components/ui/LivingPulse'
import { RealTimeTrendCard } from '@/components/ui/RealTimeTrendCard'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { BuzzAlert, useBuzzAlerts } from '@/components/ui/BuzzAlert'
import { DataPipelineStatus } from '@/components/data/DataPipelineStatus'
// REMOVED: import { getContentsByScope } from '@/services/contentService' - was using mock data!
import { formatRelativeTime } from '@/i18n/utils'
import { track } from '@/services/analyticsService'
import { trackInteraction } from '@/lib/algorithm/recommendation-engine'
import type { Content, NewsItem } from '@/types'
import { cn } from '@/lib/utils'
import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'

const STAGGER = ['algo-s1','algo-s2','algo-s3','algo-s4','algo-s5','algo-s6'] as const

const DataFlowVisualizer = dynamic(
  () => import('@/components/ui/LivingPulse').then((m) => m.DataFlowVisualizer),
  { ssr: false, loading: () => <div className="h-16 rounded-xl bg-white/5 mb-6" /> }
)
const TrendDetailModal = dynamic(
  () => import('@/components/ui/TrendDetailModal').then((m) => m.TrendDetailModal),
  { ssr: false }
)
const NotificationCenter = dynamic(
  () => import('@/components/ui/BuzzAlert').then((m) => m.NotificationCenter),
  { ssr: false }
)
const LiveVideosSection = dynamic(
  () => import('@/components/ui/LiveVideosSection').then((m) => m.LiveVideosSection),
  { loading: () => <div className="min-h-[280px] rounded-2xl bg-white/5" /> }
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardLabels {
  badge:               Record<string, string>
  viralScoreAriaLabel: string
  insight:             Parameters<typeof Card>[0]['labels']['insight']
}

interface ScopeLabels {
  global:    string
  search:    string
  suggested: string
  countries: string
  globalView:string
}

interface I18n {
  heroGlobal:   string
  heroCountry:  string
  seeAll:       string
  loading:      string
  emptyGeneric: string
  emptyHint:    string
  newsTitle:    string
  earlyTitle:   string
  earlySub:     string
  goingNow:     string
  watchSignals: string
}

interface NowClientShellProps {
  initialContent: Content[]
  exploding:      Content[]
  early:          Content[]
  breaking:       NewsItem[]
  locale:         string
  cardLabels:     CardLabels
  scopeLabels:    ScopeLabels
  i18n:           I18n
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function NowClientShell({
  initialContent,
  early,
  breaking,
  locale,
  cardLabels,
  i18n,
}: NowClientShellProps) {
  const { scope, isLoaded } = useScope()
  const [selectedTrend, setSelectedTrend] = useState<RealTimeTrend | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  
  // REAL-TIME TRENDS — L'algorithme vivant
  const { 
    trends, 
    meta, 
    topTrend, 
    postNowOpportunities,
    loading: trendsLoading, 
    timeSinceUpdate,
    isStale,
  } = useRealTimeTrends({
    country: getCountryCodeFromScope(scope),
    refreshInterval: 30000, // 30 secondes
    enabled: isLoaded
  })
  
  // Buzz Alerts
  const { currentAlert, dismissAlert } = useBuzzAlerts(trends, true)

  // USE REAL DATA - initialContent comes from live APIs (YouTube, NewsAPI)
  // NOT from mock data! The data is already fetched server-side in page.tsx
  const scopedContent = initialContent

  const heroLabel = scope.type === 'global'
    ? i18n.heroGlobal
    : i18n.heroCountry.replace('{country}', scope.name || '')

  // Analytics
  useEffect(() => {
    track('content_viewed', { page: 'now', scope: scope.type })
  }, [scope.type])
  
  // Handle trend click
  const handleTrendClick = useCallback((trend: RealTimeTrend) => {
    setSelectedTrend(trend)
    setIsModalOpen(true)
    
    // Track interaction for recommendations
    trackInteraction({
      type: 'click',
      trendKeyword: trend.keyword,
      platform: trend.platforms[0],
      contentType: 'trend',
      timestamp: Date.now()
    })
  }, [])
  
  // Calculer l'intensité globale basée sur les trends
  const globalIntensity = useMemo(() => {
    if (!meta) return 50
    return Math.min(100, meta.avgViralScore + (meta.topTier * 10))
  }, [meta])

  // CACHE_BUST_V6: 2026-04-05T04:55 - Pure CSS background only
  // DO NOT USE: AnimatedBackground, MinimalBackground, or any canvas-based component
  // This prevents hydration mismatches between server and client
  return (
    <>
      {/* Static CSS background - identical on server and client */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10"
        aria-hidden="true"
        data-testid="static-background"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#07070f] via-[#0a0a14] to-[#07070f]" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>
      
      {/* Buzz Alert */}
      {currentAlert && (
        <BuzzAlert 
          trend={currentAlert} 
          onDismiss={dismissAlert}
          onView={handleTrendClick}
        />
      )}
      
      {/* Trend Detail Modal */}
      {selectedTrend && isModalOpen && (
        <TrendDetailModal
          trend={selectedTrend}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedTrend(null)
          }}
        />
      )}
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-12 space-y-8">
        
        {/* ══════════════════════════════════════════════════════════════════
            ALGO HEADER — Le coeur battant de l'algorithme (MAJ periodiques)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c0c14]/90 via-[#0f0f1a]/90 to-[#0a0a12]/90 backdrop-blur-xl border border-white/5 p-6 md:p-8">
          {/* Static background - no animations to prevent CLS */}
          <div className="absolute inset-0 opacity-30 pointer-events-none z-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#00D1FF]/10 rounded-full blur-[80px]" />
          </div>
          
          {/* Content - z-index 10 to be above background */}
          <div className="relative z-10">
            {/* Header Row */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* LivingPulse - already has z-10 internally */}
                  <LivingPulse intensity={globalIntensity} showStats compact={false} />
                  
                  {/* Notification Bell - z-20 to ensure badge appears above LivingPulse (which is z-10) */}
                  <button
                    onClick={() => setIsNotificationCenterOpen(true)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors relative z-20"
                  >
                    <Bell size={18} />
                    {postNowOpportunities.length > 0 && (
                      <span className="absolute -top-1 -right-1 size-5 flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full z-30 shadow-lg shadow-orange-500/40 ring-2 ring-[#07070f]">
                        {postNowOpportunities.length}
                      </span>
                    )}
                  </button>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {heroLabel}
                </h1>
                <p className="text-xs md:text-sm text-violet-400/70 tracking-wide mt-0.5">
                  L&apos;algorithme des algorithmes
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-white/40 flex items-center gap-2">
                    <Radio size={12} className="text-amber-400" />
                    <span>
                      {meta ? `${meta.totalSignals} signaux` : ALGO_UI_LOADING.root} 
                      {' '}&bull;{' '}
                      {isStale ? 'Actualisation...' : `MAJ il y a ${timeSinceUpdate}s`}
                      {' '}&bull;{' '}
                      <span className="text-white/30">Refresh auto 30s</span>
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Top Trend Highlight - Clickable */}
              {topTrend && (
                <button
                  onClick={() => handleTrendClick(topTrend)}
                  className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4 min-w-[280px] text-left hover:border-yellow-500/40 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-[10px] text-yellow-400 uppercase tracking-widest mb-2">
                    <Sparkles size={12} />
                    <span>Signal #1 — Tier {topTrend.score.tier}</span>
                    <span className="ml-auto text-white/40 group-hover:text-white/60">Voir details →</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{topTrend.keyword}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={12} className="text-green-400" />
                      {Math.round(topTrend.avgVelocity).toLocaleString()}/h
                    </span>
                    <span>{topTrend.platforms.length} plateformes</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold',
                      topTrend.prediction.recommendedAction === 'post_now' 
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-violet-500/20 text-violet-400'
                    )}>
                      {topTrend.prediction.recommendedAction === 'post_now' ? 'POST NOW' : 'PREPARE'}
                    </span>
                  </div>
                </button>
              )}
            </div>
            
            {/* Data Flow Visualizer */}
            <DataFlowVisualizer className="mb-6" particleCount={30} />
            
            {/* Real-Time Trending Grid - Clickable - with contain for CLS prevention */}
            {trendsLoading && trends.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" style={{ contain: 'layout', minHeight: '400px' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonLoader key={i} shape="card" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" style={{ contain: 'layout', minHeight: '400px' }}>
                {trends.slice(0, 6).map((trend, i) => (
                  <RealTimeTrendCard 
                    key={trend.keyword || `trend-${i}`} 
                    trend={trend} 
                    rank={i + 1}
                    showPrediction={true}
                    onClick={handleTrendClick}
                  />
                ))}
              </div>
            )}
            
            {/* See All Trends CTA */}
            {trends.length > 6 && (
              <div className="flex justify-center mt-4">
                <Link 
                  href="/trends"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl',
                    'bg-white/5 hover:bg-white/10',
                    'border border-white/10 hover:border-white/20',
                    'text-sm text-white/70 hover:text-white',
                    'transition-all duration-200'
                  )}
                >
                  <Activity size={14} />
                  <span>Voir les {trends.length} signaux tendance</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Breaking News Section ──────────────────────────────────────── */}
        <section aria-label={i18n.newsTitle} className="min-h-[120px] cls-stable">
          {breaking.length > 0 ? (
            <>
              <SectionHeader 
                title={i18n.newsTitle} 
                className="mb-4"
                trailing={
                  <DataPipelineStatus
                    sourceId="news"
                    fetchedAt={new Date().toISOString()}
                    variant="minimal"
                    showTimestamp={false}
                  />
                }
              />
              <div className="space-y-2">
                {breaking.map((n) => (
                  <a
                  key={n.id}
                  href={n.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={n.title}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl',
                    'border border-white/5 bg-white/[0.025]',
                    'hover:bg-white/[0.045] hover:border-white/9',
                    'transition-all duration-150 group',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60',
                  )}
                >
                  {/* News thumbnail */}
                  {n.thumbnail && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      <ImageWithFallback 
                        src={n.thumbnail} 
                        alt={n.title || 'News thumbnail'} 
                        fill
                        className="object-cover"
                        platform="news"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span
                        className="text-[9px] font-bold text-rose-400 uppercase tracking-widest"
                        aria-label={`Score d'importance : ${n.importanceScore}`}
                      >
                        {n.importanceScore}
                      </span>
                      {n.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[9px] text-white/28 px-1.5 py-0.5 rounded-full bg-white/4 border border-white/6">
                          {tag}
                        </span>
                      ))}
                      <span className="text-[9px] text-white/20 ms-auto">
                        {formatRelativeTime(n.detectedAt, locale)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white/80 leading-snug group-hover:text-white transition-colors line-clamp-2">
                      {n.title}
                    </p>
                  </div>
                  <ExternalLink
                    size={12}
                    strokeWidth={1.8}
                    className="text-white/18 group-hover:text-white/45 shrink-0 mt-0.5"
                    aria-hidden
                  />
                </a>
              ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[100px] text-white/20 text-sm">
              {ALGO_UI_LOADING.nowNews}
            </div>
          )}
        </section>

        {/* ── Contenus Viraux ─────────────────────────────────────────────── */}
        <section aria-label="Signaux viraux" className="cls-stable">
          <SectionHeader
            title={i18n.goingNow || 'En ce moment'}
            action={scopedContent.length > 0
              ? { label: i18n.seeAll, onClick: () => {} }
              : undefined
            }
            className="mb-4"
          />

          {/* Content wrapper with exact min-height and contain to prevent CLS */}
          <div className="min-h-[236px] contain-layout">
            {!isLoaded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonLoader key={i} shape="card" />
                ))}
              </div>
            )}

            {isLoaded && scopedContent.length === 0 && (
              <EmptyState
                icon={Zap}
                title={i18n.emptyGeneric}
                subtitle={i18n.emptyHint}
                cta={{ label: 'Global', onClick: () => {} }}
              />
            )}

            {isLoaded && scopedContent.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scopedContent.map((content, i) => (
                  <Card
                    key={content.id}
                    content={content}
                    labels={cardLabels}
                    locale={locale}
                    showInsight
                    animClass={STAGGER[i % 6]}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Early Signals - Reserve exact space to prevent CLS ─────────── */}
        <section aria-label="Signaux precoces" className="min-h-[280px] cls-stable">
          {early.length > 1 ? (
            <>
              <SectionHeader
                title={i18n.earlyTitle}
                subtitle={i18n.earlySub}
                className="mb-4"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {early.slice(1).map((content, i) => (
                  <Card
                    key={content.id}
                    content={content}
                    labels={cardLabels}
                    locale={locale}
                    animClass={STAGGER[i % 6]}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
        
        {/* ── Trending Videos from YouTube API (MAJ toutes les 15 min) ─────── */}
        <LiveVideosSection 
          title="Videos Tendance"
          subtitle="Mises a jour toutes les 15 min via YouTube"
          limit={6}
          country={scope.type !== 'global' ? getCountryCodeFromScope(scope) : undefined}
        />

        {/* ── Post Now Opportunities - Reserve space to prevent CLS ─────── */}
        <section aria-label="Opportunites immediates" className="min-h-[150px] cls-stable">
          {postNowOpportunities.length > 0 ? (
            <>
              <SectionHeader
                title="Opportunites POST NOW"
                subtitle="Ces signaux explosent — agis maintenant"
                className="mb-4"
                trailing={
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full animate-pulse">
                    {postNowOpportunities.length} urgentes
                  </span>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {postNowOpportunities.slice(0, 4).map((trend, i) => (
                  <RealTimeTrendCard 
                    key={trend.keyword || `post-now-${i}`} 
                    trend={trend}
                    showPrediction={true}
                    compact
                    onClick={handleTrendClick}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
        
        {/* ══════════════════════════════════════════════════════════════════
            DATA TRANSPARENCY FOOTER — Honest about data sources
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mt-8 pt-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/30">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>
                Donnees mises a jour periodiquement via APIs externes
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="px-2 py-1 rounded bg-white/5">Google Trends: 15min</span>
              <span className="px-2 py-1 rounded bg-white/5">YouTube: 30min</span>
              <span className="px-2 py-1 rounded bg-white/5">News: 15min</span>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
