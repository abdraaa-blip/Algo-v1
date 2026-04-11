'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { LiveCurve } from '@/components/algo/LiveCurve'
import { ContentCard } from '@/components/algo/ContentCard'
import { InsightPanel } from '@/components/ui/InsightPanel'
import {
  CREATOR_MODE_INSIGHT_LABELS,
  adaptCreatorPageInsightToFull,
} from '@/lib/creator-mode/creator-insight-panel'
import { ViralScoreRing } from '@/components/algo/ViralScoreRing'
import { Badge } from '@/components/algo/Badge'
import { AlgoLoader } from '@/components/algo/AlgoLoader'
import { RefreshCw, AlertCircle, Wifi, WifiOff, ExternalLink, Eye } from 'lucide-react'
import { AlgoSignalShareCard } from '@/components/algo/AlgoSignalShareCard'
import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'

interface Content {
  id: string
  title: string
  thumbnail?: string
  platform?: string
  category?: string
  viralScore?: number
  score?: number
  growthRate?: number
  growthTrend?: 'up' | 'down' | 'stable'
  views?: number
  badge?: 'Viral' | 'Early' | 'Breaking' | 'Trend' | 'AlmostViral'
  url?: string
  insight?: {
    postNowProbability: 'high' | 'medium' | 'low'
    timing: 'now' | 'too_late' | 'too_early'
    postWindow?: { status: 'optimal' | 'saturated' | 'fading' }
    bestPlatform?: string[]
    bestFormat?: string
    whyItWorks?: string
    reproductionIdea?: string
    tips?: string[]
  }
}

function getContentId(item: Record<string, unknown>, source: string, index: number, sourceUrl: string): string {
  if (source === 'youtube') {
    const videoId = item.videoId || item.id
    if (videoId) return `youtube-${videoId}`
    const ytMatch = sourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `youtube-${ytMatch[1]}`
  }
  if (source === 'reddit') {
    const redditId = item.id || item.name
    if (redditId) return `reddit_${redditId}`
  }
  if (source === 'github') {
    const repoName = item.name || item.full_name
    if (repoName) return `gh_${String(repoName).replace('/', '_')}`
  }
  if (source === 'hackernews') {
    const hnId = item.id || item.objectID
    if (hnId) return `hn_${hnId}`
  }
  return `${source}_${index}`
}

function transformToContent(item: Record<string, unknown>, source: string, index: number): Content {
  const title = String(item.title || item.name || 'Contenu sans titre')
  const views = Number(item.viewCount || item.views || item.score || item.stars || 0)
  const sourceUrl = String(item.url || item.link || '#')
  const contentId = getContentId(item, source, index, sourceUrl)
  
  const viralScore = Math.min(
    99,
    Math.max(
      50,
      views > 1_000_000
        ? 95
        : views > 500_000
          ? 90
          : views > 100_000
            ? 85
            : views > 50_000
              ? 80
              : views > 10_000
                ? 75
                : 70
    )
  )
  
  const badge: Content['badge'] = 
    viralScore >= 90 ? 'Viral' :
    viralScore >= 85 ? 'Breaking' :
    viralScore >= 80 ? 'Early' :
    'Trend'
  
  const platformMap: Record<string, string> = {
    youtube: 'YouTube',
    reddit: 'Reddit',
    hackernews: 'HackerNews',
    github: 'GitHub',
    tiktok: 'TikTok',
    twitter: 'Twitter'
  }
  
  const categoryGuess = 
    source === 'github' ? 'Tech' :
    source === 'hackernews' ? 'Tech' :
    source === 'reddit' ? 'Discussion' :
    title.toLowerCase().includes('ia') || title.toLowerCase().includes('ai') ? 'Tech' :
    title.toLowerCase().includes('film') || title.toLowerCase().includes('movie') ? 'Cinema' :
    title.toLowerCase().includes('music') || title.toLowerCase().includes('song') ? 'Musique' :
    'Actualite'
  
  const timing: 'now' | 'too_late' | 'too_early' = 
    viralScore >= 85 ? 'now' : viralScore >= 75 ? 'too_early' : 'too_late'
  
  const windowStatus: 'optimal' | 'saturated' | 'fading' = 
    timing === 'now' ? 'optimal' : timing === 'too_early' ? 'optimal' : 'fading'
  
  const whyItWorksTemplates = [
    `Ce contenu ${categoryGuess === 'Tech' ? 'tech' : 'sur ' + categoryGuess} capte l'attention car il répond à une tendance forte du moment.`,
    `Le titre accrocheur et le sujet ${categoryGuess.toLowerCase()} sont actuellement très recherchés.`,
    `L'engagement élevé (${views > 1000 ? (views / 1000).toFixed(0) + 'K' : views} vues) prouve l'intérêt du public.`,
    `Ce type de contenu performe bien car il combine actualité et valeur ajoutée.`
  ]
  
  const reproductionTemplates = [
    `Crée ta propre version en ajoutant ton angle unique sur ${categoryGuess.toLowerCase()}.`,
    `Réagis à ce contenu et ajoute ton analyse personnelle.`,
    `Utilise ce sujet comme base et adapte-le à ton audience.`,
    `Crée une série de contenus sur ce thème pour capitaliser sur la tendance.`
  ]
  
  const tipsPerCategory: Record<string, string[]> = {
    Tech: ['Explique les concepts simplement', 'Montre des démos visuelles', 'Compare avec les alternatives'],
    Cinema: ['Réagis authentiquement', 'Ajoute des théories', 'Évite les spoilers majeurs'],
    Musique: ['Utilise des extraits audio', 'Partage ton ressenti', 'Lie à l\'actualité de l\'artiste'],
    Discussion: ['Donne ton opinion tranchée', 'Invite au débat', 'Reste respectueux'],
    Actualite: ['Sois factuel', 'Ajoute du contexte', 'Cite tes sources']
  }
  
  return {
    id: contentId,
    title,
    thumbnail: String(item.thumbnail || item.thumbnailUrl || ''),
    platform: platformMap[source] || source,
    category: categoryGuess,
    viralScore,
    growthRate: Math.floor(Math.random() * 100) + 50,
    growthTrend: viralScore >= 80 ? 'up' : viralScore >= 70 ? 'stable' : 'down',
    views,
    badge,
    url: sourceUrl,
    insight: {
      postNowProbability: viralScore >= 85 ? 'high' : viralScore >= 75 ? 'medium' : 'low',
      timing,
      postWindow: { status: windowStatus },
      bestPlatform: source === 'youtube' ? ['TikTok', 'YouTube Shorts'] : 
                    source === 'reddit' ? ['Twitter', 'TikTok'] :
                    ['TikTok', 'Instagram Reels'],
      bestFormat: viralScore >= 85 ? 'reaction' : 'face_cam',
      whyItWorks: whyItWorksTemplates[index % whyItWorksTemplates.length],
      reproductionIdea: reproductionTemplates[index % reproductionTemplates.length],
      tips: tipsPerCategory[categoryGuess] || tipsPerCategory.Actualite
    }
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CreatorModePage() {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [showReproduction, setShowReproduction] = useState(false)
  
  const { data: liveData, error: liveError, isLoading, mutate } = useSWR(
    '/api/live?limit=20',
    fetcher,
    { 
      revalidateOnFocus: false,
      refreshInterval: 5 * 60 * 1000,
      dedupingInterval: 60 * 1000
    }
  )
  
  const content: Content[] = (() => {
    if (!liveData?.success || !liveData?.data) return []
    
    const allItems: Content[] = []
    const sources = Object.keys(liveData.data)
    
    for (const source of sources) {
      const sourceData = liveData.data[source]
      if (Array.isArray(sourceData)) {
        sourceData.slice(0, 5).forEach((item, index) => {
          allItems.push(transformToContent(item, source, index))
        })
      }
    }
    
    return allItems
      .sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0))
      .slice(0, 12)
  })()
  
  useEffect(() => {
    if (content.length > 0 && !selectedContent) {
      setSelectedContent(content[0])
    }
  }, [content, selectedContent])
  
  const handleRefresh = useCallback(() => {
    mutate()
  }, [mutate])

  return (
    <main className="min-h-screen pb-20">
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <LiveCurve rate={80} color="green" opacity={0.08} />
        <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs mb-4 text-[var(--color-text-muted)] transition-colors duration-200 hover:text-[var(--color-text-primary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
          <h1 className="text-2xl md:text-3xl font-black mb-2 text-[var(--color-text-primary)]">
            Mode Createur
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Signaux agrégés depuis plusieurs flux : les scores sont des <strong className="font-semibold text-white/70">indicateurs</strong> pour
            prioriser et tester · pas une garantie d’audience. Export et partage pour documenter ta veille.
          </p>
          <p className="text-xs mt-2 text-[var(--color-text-tertiary)]">
            <Link href="/intelligence#algo-core" className="text-[var(--color-violet)] hover:underline">
              Core Intelligence
            </Link>{' '}
            · analyse multi-facteurs, simulations et priorités sur les flux live (radar).
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {liveData?.success ? (
              <>
                <Wifi size={14} className="text-amber-400" />
                <span className="text-xs text-amber-400">Sources actives</span>
                <span className="text-[10px] text-white/30">
                  {liveData?.sources ? `${Object.keys(liveData.sources).filter(k => liveData.sources[k]?.status === 'success').length} sources (MAJ 5 min)` : ''}
                </span>
              </>
            ) : liveError ? (
              <>
                <WifiOff size={14} className="text-red-400" />
                <span className="text-xs text-red-400">Connexion interrompue</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs text-yellow-500">{ALGO_UI_LOADING.creatorTrending}</span>
              </>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="algo-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] transition-[background-color,color] duration-200 hover:bg-[var(--color-card)] disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
        
        {isLoading && content.length === 0 ? (
          <AlgoLoader message={ALGO_UI_LOADING.creatorTrending} />
        ) : liveError && content.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl algo-surface">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <p className="text-sm text-white/70 mb-2">Signal faible sur ce flux</p>
            <p className="text-xs text-white/40 mb-4">Vérifie ta connexion puis réessaie</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-all"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-bold mb-4 text-[var(--color-text-secondary)]">
                Contenus tendance ({content.length}) · MAJ toutes les 5 min
              </h2>
              <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2">
                {content.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedContent(item)
                      setShowReproduction(false)
                    }}
                    className={`algo-interactive w-full text-left p-4 rounded-xl border transition-[background-color,border-color,box-shadow] duration-200 ${
                      selectedContent?.id === item.id
                        ? 'ring-2 ring-[var(--color-violet)] bg-[var(--color-violet-muted)] border-[color-mix(in_srgb,var(--color-violet)_30%,var(--color-border))]'
                        : 'bg-[var(--color-card)] border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ViralScoreRing score={item.viralScore || item.score || 75} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-[var(--color-text-primary)]">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[var(--color-text-tertiary)]">{item.platform}</span>
                          <Badge type={item.badge || 'Trend'} label={item.badge || 'Trend'} />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <Link
                href="/viral-analyzer"
                className="algo-interactive block mt-4 p-4 rounded-xl text-center text-[var(--color-violet)] border border-[color-mix(in_srgb,var(--color-violet)_28%,var(--color-border))] bg-[var(--color-violet-muted)] transition-[background-color,transform] duration-200 hover:bg-[color-mix(in_srgb,var(--color-violet)_18%,var(--color-card))]"
              >
                <span className="text-sm font-bold">Analyse ton propre contenu</span>
                <span className="block text-xs mt-1 text-[var(--color-text-tertiary)]">Viral Analyzer</span>
              </Link>
            </div>

            <div>
              {selectedContent ? (
                <div className="space-y-4">
                  <ContentCard content={selectedContent} />
                  
                  <div className="flex gap-2">
                    {selectedContent.url && selectedContent.url !== '#' && (
                      <a
                        href={selectedContent.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="algo-interactive flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] border border-[var(--color-border)] bg-[var(--color-card)] transition-[background-color,transform] duration-200 hover:bg-[var(--color-card-hover)]"
                      >
                        <ExternalLink size={14} />
                        Voir la source
                      </a>
                    )}
                    <Link
                      href={`/content/${selectedContent.id}`}
                      className="algo-interactive flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--color-violet)] border border-[color-mix(in_srgb,var(--color-violet)_28%,var(--color-border))] bg-[var(--color-violet-muted)] transition-[background-color,transform] duration-200 hover:bg-[color-mix(in_srgb,var(--color-violet)_22%,var(--color-card))]"
                    >
                      <Eye size={14} />
                      Voir la fiche ALGO
                    </Link>
                  </div>
                  
                  <div className="rounded-xl p-3 bg-[var(--color-violet-muted)] border border-[color-mix(in_srgb,var(--color-violet)_28%,var(--color-border))]">
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-2 text-[var(--color-violet)]">
                      Carte signal exportable
                    </p>
                    <AlgoSignalShareCard
                      headline={selectedContent.title}
                      score={selectedContent.viralScore || selectedContent.score || 70}
                      badgeLabel={selectedContent.badge || selectedContent.platform || 'ALGO'}
                      subtitle="Mode créateur · score indicatif ALGO sur ce flux (voir transparence pour les autres écrans)."
                    />
                  </div>

                  {selectedContent.insight && (
                    <InsightPanel
                      insight={adaptCreatorPageInsightToFull(selectedContent.insight)}
                      watchersCount={Math.floor((selectedContent.views || 0) / 100)}
                      labels={CREATOR_MODE_INSIGHT_LABELS}
                    />
                  )}
                  
                  {selectedContent.insight?.whyItWorks && (
                    <div 
                      className="rounded-xl p-4"
                      style={{ 
                        background: 'rgba(0,255,178,0.05)',
                        border: '1px solid rgba(0,255,178,0.15)'
                      }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#00FFB2' }}>
                        Pourquoi ca marche
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,240,248,0.7)' }}>
                        {selectedContent.insight.whyItWorks}
                      </p>
                    </div>
                  )}
                  
                  {selectedContent.insight?.reproductionIdea && (
                    <div>
                      <button
                        onClick={() => setShowReproduction(!showReproduction)}
                        className="w-full px-4 py-3 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: 'rgba(123,97,255,0.15)',
                          border: '1px solid rgba(123,97,255,0.25)',
                          color: '#a78bfa'
                        }}
                      >
                        {showReproduction ? 'Masquer l\'idee' : 'Reproduire l\'idee'}
                      </button>
                      
                      {showReproduction && (
                        <div 
                          className="mt-3 rounded-xl p-4"
                          style={{ 
                            background: 'rgba(123,97,255,0.05)',
                            border: '1px solid rgba(123,97,255,0.15)'
                          }}
                        >
                          <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(240,240,248,0.7)' }}>
                            {selectedContent.insight.reproductionIdea}
                          </p>
                          
                          {selectedContent.insight.tips && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--color-violet)]">
                                Conseils
                              </p>
                              <ul className="space-y-1">
                                {selectedContent.insight.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(240,240,248,0.5)' }}>
                                    <span className="text-[var(--color-violet)]">•</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 rounded-xl algo-surface">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Selectionne un contenu pour voir son analyse
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
