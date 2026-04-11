'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, ChevronRight, Clock, X } from 'lucide-react'
import { LiveCurve } from '@/components/algo/LiveCurve'
import { ViralScoreRing } from '@/components/algo/ViralScoreRing'
import { MomentumPill } from '@/components/algo/MomentumPill'
import { Badge } from '@/components/algo/Badge'
import { AlgoLoader } from '@/components/algo/AlgoLoader'
import { AlgoEmpty } from '@/components/algo/AlgoEmpty'
import { BackButton } from '@/components/ui/BackButton'
import { TrendActionCard } from '@/components/algo/TrendActionCard'
import { TrendIntelligenceCard, generateTrendIntelligence } from '@/components/algo/TrendIntelligenceCard'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { AlgoSignalShareCard } from '@/components/algo/AlgoSignalShareCard'
import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'

interface Trend {
  id: string
  name: string
  platform: string
  category: string
  score: number
  growthRate: number
  growthTrend: 'up' | 'down' | 'stable'
  views?: number
  watchers?: number
  explanation?: string
  whyItWorks?: string
  contentIdeas?: string[]
  bestTimeToPost?: string
  targetAudience?: string
  estimatedReach?: string
  // New actionable fields
  emotion?: string
  format?: string
  confidence?: 'haute' | 'moyenne' | 'faible'
  timeWindow?: string
  actionTask?: string
  actionHook?: string
  actionDeadline?: string
  hookExamples?: string[]
  origin?: string
  arrivesOn?: string
}

const TABS = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'emerging', label: 'Emergentes' },
  { id: 'mostViewed', label: 'Plus vues' },
  { id: 'mostWatched', label: 'Plus reprises' },
  { id: 'declining', label: 'En declin' },
] as const

const FALLBACK_TRENDS: Trend[] = [
  { 
    id: '1', 
    name: 'IA generative video', 
    platform: 'TikTok', 
    category: 'Tech', 
    score: 94, 
    growthRate: 256, 
    growthTrend: 'up', 
    views: 12500000, 
    watchers: 8420, 
    explanation: 'Sora et les nouveaux outils explosent',
    whyItWorks: 'Sujet nouveau + forte curiosité + impact direct sur les créateurs',
    contentIdeas: ['Reaction aux nouvelles annonces', 'Test des outils IA video', 'Avant/Apres avec IA'],
    bestTimeToPost: '18h-20h',
    targetAudience: 'Tech enthusiasts, 18-35 ans',
    estimatedReach: '500K-2M vues',
    // New actionable fields
    emotion: 'surprise',
    format: 'face cam',
    confidence: 'haute',
    timeWindow: '8h',
    actionTask: 'Fais une vidéo 15–30 s',
    actionHook: 'Tu n\'es pas prêt pour ça',
    actionDeadline: 'Poste avant 18h',
    hookExamples: ['Ce que l\'IA va changer dès demain', 'On ne te dit pas tout sur…', 'J\'ai testé et voilà ce qui se passe'],
    origin: 'Twitter',
    arrivesOn: 'TikTok dans 3h'
  },
  { 
    id: '2', 
    name: 'Coupe du Monde 2026', 
    platform: 'Instagram', 
    category: 'Sport', 
    score: 91, 
    growthRate: 89, 
    growthTrend: 'up', 
    views: 8900000, 
    watchers: 5230, 
    explanation: 'France vs Allemagne ce soir',
    whyItWorks: 'Match historique + rivalite + enjeu enorme',
    contentIdeas: ['Pronostics des matchs', 'Analyse tactique', 'Reactions aux resultats'],
    bestTimeToPost: 'Pendant et après le match',
    targetAudience: 'Fans de football, tous ages',
    estimatedReach: '200K-1M vues',
    emotion: 'joie',
    format: 'montage',
    confidence: 'haute',
    timeWindow: '6h',
    actionTask: 'Fais un pronostic vidéo 20 s',
    actionHook: 'Mon prono pour ce soir',
    actionDeadline: 'Poste 2h avant le match',
    hookExamples: ['Voila pourquoi la France va gagner', 'Ce joueur va tout changer', 'Personne ne s\'attend a ca']
  },
  { 
    id: '3', 
    name: 'Deadpool 4 Leak', 
    platform: 'YouTube', 
    category: 'Cinema', 
    score: 88, 
    growthRate: 234, 
    growthTrend: 'up', 
    views: 6700000, 
    watchers: 3100, 
    explanation: 'Leak du script + cameos confirmés',
    whyItWorks: 'Fanbase massive + surprise + theories',
    contentIdeas: ['Réaction au leak', 'Analyse des cameos', 'Théories sur la suite'],
    bestTimeToPost: 'Dans les 24h',
    targetAudience: 'Fans Marvel/DC, 15-35 ans',
    estimatedReach: '300K-1.5M vues',
    emotion: 'surprise',
    format: 'face cam',
    confidence: 'haute',
    timeWindow: '12h',
    actionTask: 'Vidéo réaction 30–60 s',
    actionHook: 'Ce qu\'on vient d\'apprendre sur Deadpool 4',
    actionDeadline: 'Poste dans les 6h',
    hookExamples: ['Marvel vient de confirmer...', 'Le cameo que personne n\'attendait', 'Ca change TOUT']
  },
  { 
    id: '4', 
    name: 'Drama influenceur', 
    platform: 'Twitter', 
    category: 'Drama', 
    score: 85, 
    growthRate: 167, 
    growthTrend: 'up', 
    views: 4500000, 
    watchers: 2800, 
    explanation: 'Clash entre 2 gros créateurs',
    whyItWorks: 'Conflit + émotions fortes + prise de position',
    contentIdeas: ['Resume neutre', 'Mon avis', 'Les preuves'],
    bestTimeToPost: 'Immédiat',
    targetAudience: 'Community YouTube/TikTok, 15-30 ans',
    estimatedReach: '100K-500K vues',
    emotion: 'indignation',
    format: 'voice over',
    confidence: 'moyenne',
    timeWindow: '4h',
    actionTask: 'Vidéo récap 45 s',
    actionHook: 'Voilà ce qui se passe vraiment',
    actionDeadline: 'Poste maintenant',
    hookExamples: ['J\'ai les preuves', 'Personne n\'en parle mais…', 'La vérité sur cette histoire']
  },
  { 
    id: '5', 
    name: 'Crypto Bitcoin ATH', 
    platform: 'Twitter', 
    category: 'Finance', 
    score: 82, 
    growthRate: 145, 
    growthTrend: 'up', 
    views: 3200000, 
    watchers: 1900, 
    explanation: 'Bitcoin proche du record historique',
    whyItWorks: 'FOMO + argent + émotions fortes',
    contentIdeas: ['Analyse technique', 'Faut-il acheter?', 'Mon portefeuille'],
    bestTimeToPost: 'Pendant la volatilite',
    targetAudience: 'Investisseurs, 20-45 ans',
    estimatedReach: '50K-200K vues',
    emotion: 'curiosite',
    format: 'screen record',
    confidence: 'moyenne',
    timeWindow: '12h',
    actionTask: 'Vidéo analyse 30 s',
    actionHook: 'Bitcoin va exploser ou crasher?',
    actionDeadline: 'Poste avant la cloture US',
    hookExamples: ['Ce signal ne trompe jamais', 'Voila ce que je fais', 'Ne fais pas cette erreur']
  },
  { 
    id: '6', 
    name: 'Challenge Silhouette 2.0', 
    platform: 'TikTok', 
    category: 'Divertissement', 
    score: 92, 
    growthRate: 312, 
    growthTrend: 'up', 
    views: 15000000, 
    watchers: 9800, 
    explanation: 'Nouveau filtre viral + son trending',
    whyItWorks: 'Simple + fun + participatif',
    contentIdeas: ['Ma version', 'Fail compilation', 'Tutorial'],
    bestTimeToPost: 'Maintenant',
    targetAudience: 'Gen Z, 13-25 ans',
    estimatedReach: '1M-10M vues',
    emotion: 'joie',
    format: 'face cam',
    confidence: 'haute',
    timeWindow: '3h',
    actionTask: 'Fais ta version du challenge',
    actionHook: 'J\'ai essaye le nouveau challenge',
    actionDeadline: 'Poste dans l\'heure',
    hookExamples: ['Regardez ce que ca donne', 'Je pensais pas que ca marcherait', 'Version ratee vs reussie'],
    origin: 'Instagram Reels',
    arrivesOn: 'YouTube Shorts dans 6h'
  },
]

// Hook for persisting followed trends
function useFollowedTrends() {
  const [following, setFollowing] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('algo_followed_trends')
    if (saved) {
      try {
        setFollowing(new Set(JSON.parse(saved)))
      } catch {
        // Invalid data
      }
    }
  }, [])
  
  const toggleFollow = useCallback((id: string) => {
    setFollowing(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      // Persist to localStorage
      localStorage.setItem('algo_followed_trends', JSON.stringify([...next]))
      return next
    })
  }, [])
  
  return { following, toggleFollow }
}

export default function TrendsPage() {
  const [activeTab, setActiveTab] = useState<string>('today')
  const [trends, setTrends] = useState<Trend[]>(FALLBACK_TRENDS)
  const [loading, setLoading] = useState(true)
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)
  const { following, toggleFollow } = useFollowedTrends()

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch('/api/live-trends')
        if (res.ok) {
          const data = await res.json()
          if (data.data?.length) {
            const mapped = data.data.map((t: Record<string, unknown>, i: number) => {
              const title = String(t.title || t.name || 'Sans titre')
              const description = String(t.description || t.trafficVolume || '')
              const country = String(t.country || 'FR')
              
              // Calculate dynamic score based on traffic
              const trafficStr = String(t.trafficVolume || '10K+')
              const trafficMatch = trafficStr.match(/(\d+)([KM])?/)
              let trafficNum = trafficMatch ? parseInt(trafficMatch[1]) : 10
              if (trafficMatch?.[2] === 'M') trafficNum *= 1000
              if (trafficMatch?.[2] === 'K') trafficNum *= 1
              const baseScore = Math.min(99, Math.max(50, 60 + Math.log10(trafficNum + 1) * 15))
              const score = Math.floor(baseScore + (Math.random() * 10 - 5))
              
              // Calculate growth rate (simulate based on position and score)
              const growthRate = Math.floor((100 - i * 8) + Math.random() * 80)
              const growthTrend = growthRate > 50 ? 'up' : growthRate > 0 ? 'stable' : 'down'
              
              // Guess category from title
              const titleLower = title.toLowerCase()
              const category = 
                /tech|ia|ai|digital|startup|robot|cyber/.test(titleLower) ? 'Tech' :
                /sport|football|match|ligue|nba|tennis|rugby|can|coupe/.test(titleLower) ? 'Sport' :
                /film|cinema|serie|netflix|disney|marvel|deadpool/.test(titleLower) ? 'Cinema' :
                /musique|concert|artiste|album|spotify|afrobeats/.test(titleLower) ? 'Musique' :
                /politique|president|gouvernement|election|ministre/.test(titleLower) ? 'Politique' :
                /economie|bourse|marche|entreprise|finance|crypto|bitcoin|naira/.test(titleLower) ? 'Finance' :
                /meteo|weather|storm/.test(titleLower) ? 'Meteo' :
                /royal|people|scandale|drama|influenceur/.test(titleLower) ? 'People' :
                'Actualite'
              
              // Guess platform from category
              const platform = 
                category === 'Sport' ? 'Twitter' :
                category === 'Cinema' ? 'YouTube' :
                category === 'Musique' ? 'TikTok' :
                category === 'Tech' ? 'Twitter' :
                category === 'People' ? 'Instagram' :
                ['TikTok', 'YouTube', 'Twitter', 'Instagram'][i % 4]
              
              // Generate contextual explanation
              const explanationTemplates = {
                Sport: [`Match important en cours`, `Resultats et reactions`, `Actualite sportive brulante`],
                Cinema: [`Nouvelle sortie ou annonce`, `Buzz sur les réseaux`, `Trailer ou leak viral`],
                Tech: [`Innovation qui fait parler`, `Annonce majeure du secteur`, `Sujet tech en explosion`],
                Musique: [`Nouveau titre viral`, `Artiste en tendance`, `Son qui cartonne`],
                Finance: [`Mouvement de marche`, `Actualite economique chaude`, `Signal financier fort`],
                People: [`Buzz ou scandale`, `Actualite people`, `Drama en cours`],
                Politique: [`Actualite politique majeure`, `Debat en cours`, `Annonce gouvernementale`],
                default: [`Sujet en forte croissance`, `Tendance détectée par ALGO`, `Signal viral émergent`]
              }
              const explanations = explanationTemplates[category as keyof typeof explanationTemplates] || explanationTemplates.default
              const explanation = description || explanations[i % explanations.length]
              
              // Generate why it works
              const whyTemplates = {
                Sport: `Les fans réagissent vite : l’engagement est souvent fort sur ces sujets (signaux agrégés, pas une garantie par publication).`,
                Cinema: `Les communautés de fans sont actives et partagent massivement.`,
                Tech: `Sujet d'actualite qui interesse un large public curieux.`,
                Musique: `Le contenu musical est hautement viral et facile a reproduire.`,
                Finance: `FOMO et émotions fortes autour de l’argent peuvent pousser l’engagement · reste un signal indicatif.`,
                People: `Les dramas generent des reactions fortes et du partage viral.`,
                Politique: `Sujet de debat qui pousse aux reactions et commentaires.`,
                default: `Tendance montante qui capte l'attention du public.`
              }
              const whyItWorks = whyTemplates[category as keyof typeof whyTemplates] || whyTemplates.default
              
              // Generate content ideas
              const ideasTemplates = {
                Sport: [`Pronostics`, `Reactions live`, `Analyse tactique`, `Resume du match`],
                Cinema: [`Réaction au trailer`, `Théories et analyses`, `Avant / après`, `Mon avis`],
                Tech: [`Explication simple`, `Test en direct`, `Ce que ca change`, `Mon avis tech`],
                Musique: [`Cover ou remix`, `Reaction a l'ecoute`, `Clip reaction`, `Ma version`],
                Finance: [`Analyse rapide`, `Faut-il investir?`, `Ce que je fais`, `Erreurs a eviter`],
                People: [`Resume de la situation`, `Mon avis`, `Les preuves`, `Ce qu'on ne dit pas`],
                default: [`Reaction`, `Mon avis`, `Explication`, `Ce que ca signifie`]
              }
              const contentIdeas = ideasTemplates[category as keyof typeof ideasTemplates] || ideasTemplates.default
              
              // Generate emotion
              const emotions = {
                Sport: 'joie',
                Cinema: 'surprise',
                Tech: 'curiosite',
                Musique: 'joie',
                Finance: 'curiosite',
                People: 'indignation',
                Politique: 'indignation',
                default: 'curiosite'
              }
              const emotion = emotions[category as keyof typeof emotions] || emotions.default
              
              // Generate format
              const formats = {
                Sport: 'face cam',
                Cinema: 'face cam',
                Tech: 'screen record',
                Musique: 'montage',
                Finance: 'screen record',
                People: 'voice over',
                default: 'face cam'
              }
              const format = formats[category as keyof typeof formats] || formats.default
              
              // Calculate time window based on score
              const timeWindow = score >= 90 ? '3h' : score >= 80 ? '6h' : score >= 70 ? '12h' : '24h'
              
              // Generate action
              const videoLength = platform === 'TikTok' ? '15-30s' : '30-60s'
              const actionTask = `Fais une vidéo ${videoLength} sur ${title}`
              const actionHook = `Ce que personne ne te dit sur ${title}`
              const now = new Date()
              const deadline = score >= 85 ? 'Poste dans les 2h' : score >= 75 ? 'Poste avant ' + (now.getHours() < 18 ? '18h' : '22h') : 'Poste dans les 24h'
              
              // Generate hook examples
              const hookExamples = [
                `Pourquoi tout le monde parle de ${title}`,
                `La vérité sur ${title}`,
                `${title} — ce que j'en pense`
              ]
              
              return {
                id: `trend_${country}_${i}_${Date.now()}`,
                name: title,
                platform,
                category,
                score,
                growthRate,
                growthTrend: growthTrend as 'up' | 'down' | 'stable',
                views: trafficNum * 1000,
                watchers: Math.floor(trafficNum * 0.1 + Math.random() * 1000),
                explanation,
                whyItWorks,
                contentIdeas,
                bestTimeToPost: score >= 85 ? 'Maintenant' : score >= 75 ? '18h-21h' : 'Flexible',
                targetAudience: `Fans de ${category}, ${country === 'FR' ? 'France' : country}`,
                estimatedReach: score >= 90 ? '100K-1M vues' : score >= 80 ? '50K-200K vues' : '10K-50K vues',
                // Actionable fields
                emotion,
                format,
                confidence: (score >= 85 ? 'haute' : score >= 70 ? 'moyenne' : 'faible') as 'haute' | 'moyenne' | 'faible',
                timeWindow,
                actionTask,
                actionHook,
                actionDeadline: deadline,
                hookExamples,
                origin: t.source ? String(t.source) : undefined,
                arrivesOn: platform !== 'TikTok' ? `TikTok dans ${Math.floor(Math.random() * 6 + 2)}h` : undefined
              }
            })
            setTrends(mapped)
          }
        }
      } catch (e) {
        console.warn('[ALGO] Failed to fetch trends:', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTrends()
    const interval = setInterval(fetchTrends, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getFilteredTrends = () => {
    let filtered = [...trends]
    
    switch (activeTab) {
      case 'emerging':
        filtered = filtered.filter(t => t.growthRate > 100).sort((a, b) => b.growthRate - a.growthRate)
        break
      case 'mostViewed':
        filtered = filtered.sort((a, b) => (b.views || 0) - (a.views || 0))
        break
      case 'mostWatched':
        filtered = filtered.sort((a, b) => (b.watchers || 0) - (a.watchers || 0))
        break
      case 'declining':
        filtered = filtered.filter(t => t.growthTrend === 'down')
        break
      default:
        filtered = filtered.sort((a, b) => b.score - a.score)
    }
    
    return filtered
  }

  const filteredTrends = getFilteredTrends()
  const followedTrends = trends.filter(t => following.has(t.id))

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <LiveCurve rate={60} color="violet" opacity={0.06} />
        <div className="relative max-w-7xl mx-auto px-4 pt-6 pb-6">
          <BackButton fallbackHref="/" label="Retour" />
          <h1 className="text-2xl md:text-3xl font-black mt-4 mb-2 text-[var(--color-text-primary)]">
            Tendances
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Ce que le monde regarde en ce moment
          </p>
        </div>
      </section>

      {/* Followed Trends Alert */}
      {followedTrends.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-4">
          <div className="rounded-xl p-4 bg-[var(--color-violet-muted)] border border-[color-mix(in_srgb,var(--color-violet)_28%,var(--color-border))]">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={16} className="text-violet-400" />
              <span className="text-sm font-bold text-violet-300">Tendances suivies ({followedTrends.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {followedTrends.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrend(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      <section className="sticky top-14 z-40 algo-sticky-subnav">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`algo-interactive px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-[color,background-color,transform] duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-violet)] text-white shadow-[0_0_20px_color-mix(in_srgb,var(--color-violet)_22%,transparent)]'
                    : 'bg-[var(--color-card)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <AlgoLoader message={ALGO_UI_LOADING.trendsPage} />
        ) : filteredTrends.length === 0 ? (
          <AlgoEmpty 
            icon="\u{1F4CA}" 
            title="Aucune tendance dans cette categorie pour le moment"
          />
        ) : (
          <div className="grid gap-3">
            {filteredTrends.map((trend, i) => (
              <button
                key={trend.id}
                onClick={() => setSelectedTrend(trend)}
                className={`group algo-interactive w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-[transform,border-color,background-color,box-shadow] duration-200 hover:scale-[1.003] algo-s${Math.min(i + 1, 6)} ${
                  trend.score >= 90
                    ? 'bg-[color-mix(in_srgb,var(--color-violet)_10%,var(--color-card))] border-[color-mix(in_srgb,var(--color-violet)_24%,var(--color-border))]'
                    : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-[color-mix(in_srgb,var(--color-violet)_18%,var(--color-border))]'
                }`}
              >
                {/* Rank */}
                <span
                  className={`text-2xl font-black w-8 text-center flex-shrink-0 ${i < 3 ? 'text-[var(--color-violet)]' : 'text-[var(--color-text-muted)]'}`}
                >
                  {i + 1}
                </span>
                
                {/* Score Ring */}
                <div className="flex-shrink-0">
                  <ViralScoreRing score={trend.score} size={48} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[color-mix(in_srgb,var(--color-violet)_85%,white)] transition-colors duration-200">
                      {trend.name}
                    </p>
                    <Badge 
                      type={trend.score >= 85 ? 'Viral' : trend.growthRate > 100 ? 'Early' : trend.growthTrend === 'down' ? 'AlmostViral' : 'Trend'} 
                      label={trend.growthTrend === 'down' ? 'En declin' : trend.score >= 85 ? 'Viral' : trend.growthRate > 100 ? 'Emergent' : 'Tendance'}
                    />
                    {following.has(trend.id) && (
                      <span className="px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-300 text-[10px] font-bold">
                        Suivi
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] flex-wrap text-[var(--color-text-tertiary)]">
                    <span>{trend.platform}</span>
                    <span style={{ color: 'rgba(240,240,248,0.2)' }}>|</span>
                    <span>{trend.category}</span>
                    {trend.explanation && (
                      <>
                        <span style={{ color: 'rgba(240,240,248,0.2)' }}>|</span>
                        <span className="truncate max-w-[200px] hidden sm:inline">{trend.explanation}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Urgency Indicator */}
                <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                  <MomentumPill value={Math.abs(trend.growthRate)} trend={trend.growthTrend} />
                  
                  {/* Time Window Badge */}
                  {(() => {
                    const window = trend.growthRate > 200 ? '3h' : trend.growthRate > 100 ? '6h' : trend.growthRate > 50 ? '12h' : '24h'
                    const isUrgent = trend.growthRate > 100
                    return (
                      <div 
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${isUrgent ? 'animate-pulse' : ''}`}
                        style={{
                          background: isUrgent
                            ? 'color-mix(in srgb, var(--color-red-alert) 16%, var(--color-card))'
                            : 'var(--color-card)',
                          color: isUrgent ? 'var(--color-red-alert)' : 'var(--color-text-muted)',
                        }}
                      >
                        <Clock size={9} />
                        <span>Fenetre: {window}</span>
                      </div>
                    )
                  })()}
                </div>
                
                {/* Arrow */}
                <ChevronRight size={20} className="text-white/20 group-hover:text-violet-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Trend Detail Modal - Uses TrendActionCard */}
      {selectedTrend && (
        <TrendDetailModalNew 
          trend={selectedTrend} 
          isFollowing={following.has(selectedTrend.id)}
          onToggleFollow={() => toggleFollow(selectedTrend.id)}
          onClose={() => setSelectedTrend(null)} 
        />
      )}
    </div>
  )
}

// Convert Trend to TrendActionCard format with full enrichment
function trendToActionData(trend: Trend) {
  // Determine status based on score and growth
  const status = trend.score >= 90 ? 'hot' as const : trend.growthRate > 100 ? 'rising' as const : 'early' as const
  
  // Calculate confidence based on multiple factors
  const confidenceScore = trend.confidence || (
    trend.score >= 85 && trend.growthRate > 80 ? 'haute' as const : 
    trend.score >= 70 || trend.growthRate > 50 ? 'moyenne' as const : 
    'faible' as const
  )
  
  // Calculate time window based on urgency
  const timeWindow = trend.timeWindow || (
    trend.growthRate > 200 ? '3h' : 
    trend.growthRate > 100 ? '6h' : 
    trend.growthRate > 50 ? '12h' : '24h'
  )
  
  // Build why it works with context
  const whyItWorks = trend.whyItWorks || trend.explanation || 
    `Cette tendance capte l'attention avec un score de ${trend.score} et une croissance de +${trend.growthRate} %. Idéal pour le format ${trend.format || 'vidéo'}.`
  
  // Build actionable hook
  const actionHook = trend.actionHook || 
    `${trend.name} — voici ce que tu dois savoir`
  
  // Build task based on platform
  const videoLength = trend.platform === 'TikTok' ? '15-30s' : 
                      trend.platform === 'YouTube' ? '60-90s' : '30-60s'
  const actionTask = trend.actionTask || 
    `Crée une vidéo ${videoLength} en format ${trend.format || 'face cam'}`
  
  // Build deadline based on urgency
  const now = new Date()
  const hour = now.getHours()
  const actionDeadline = trend.actionDeadline || (
    status === 'hot' ? 'Poste dans les 2h' :
    status === 'rising' ? `Poste avant ${hour < 18 ? '18h' : '22h'}` :
    'Poste dans les 24h'
  )
  
  // Build examples from contentIdeas or generate contextual ones
  const examples = trend.hookExamples?.length ? trend.hookExamples : 
    trend.contentIdeas?.slice(0, 3) || [
      `Pourquoi tout le monde parle de "${trend.name}"`,
      `${trend.name} : ce que les médias ne disent pas`,
      `Mon analyse de "${trend.name}"`
    ]
  
  return {
    id: trend.id,
    name: trend.name,
    score: trend.score,
    confidence: confidenceScore,
    timeWindow,
    status,
    emotion: trend.emotion || 'curiosite',
    platform: trend.platform,
    format: trend.format || 'face cam',
    whyItWorks,
    action: {
      task: actionTask,
      hook: actionHook,
      deadline: actionDeadline
    },
    examples,
    origin: trend.origin,
    arrivesOn: trend.arrivesOn,
    category: trend.category,
    // Additional context for the detail view
    views: trend.views,
    watchers: trend.watchers,
    growthRate: trend.growthRate,
    bestTimeToPost: trend.bestTimeToPost,
    targetAudience: trend.targetAudience,
    estimatedReach: trend.estimatedReach
  }
}

import { Brain, Zap } from 'lucide-react'

function TrendDetailModalNew({ 
  trend, 
  isFollowing, 
  onToggleFollow, 
  onClose 
}: { 
  trend: Trend
  isFollowing: boolean
  onToggleFollow: () => void
  onClose: () => void 
}) {
  const [viewMode, setViewMode] = useState<'action' | 'intelligence'>('action')
  
  useBodyScrollLock(true)
  
  const trendData = trendToActionData(trend)
  const intelligenceData = generateTrendIntelligence({
    id: trend.id,
    name: trend.name,
    platform: trend.platform,
    category: trend.category,
    score: trend.score,
    growthRate: trend.growthRate,
    views: trend.views,
    emotion: trend.emotion,
    explanation: trend.explanation,
    contentIdeas: trend.contentIdeas,
    timeWindow: trend.timeWindow,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      
      <div
        className="relative w-full sm:max-w-xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl algo-sheet-surface border border-[var(--color-border)] sm:shadow-[var(--shadow-algo-md)]"
        role="dialog"
        aria-modal="true"
        aria-label={`Details de tendance: ${trend.name}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden sticky top-0 z-20 flex justify-center py-2 algo-sheet-surface rounded-t-2xl">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        
        {/* Close button overlay */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/60 hover:text-white transition-colors"
          aria-label="Fermer la fenetre"
        >
          <X size={18} />
        </button>
        
        {/* View Mode Toggle */}
        <div className="algo-sheet-surface px-4 pt-4 pb-2">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setViewMode('action')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'action'
                  ? 'bg-[var(--color-violet-muted)] text-[var(--color-text-primary)] border border-[color-mix(in_srgb,var(--color-violet)_35%,var(--color-border))]'
                  : 'bg-[var(--color-card)] text-[var(--color-text-tertiary)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
              }`}
            >
              <Zap size={14} />
              Action Rapide
            </button>
            <button
              onClick={() => setViewMode('intelligence')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'intelligence'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                  : 'bg-[var(--color-card)] text-[var(--color-text-tertiary)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
              }`}
            >
              <Brain size={14} />
              Intelligence
            </button>
          </div>
          
          {/* Context Header - Shows key info about the trend */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">
              {trend.category}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
              {trend.platform}
            </span>
            {trend.growthRate > 100 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium animate-pulse">
                +{trend.growthRate}% croissance
              </span>
            )}
          </div>
          {trend.explanation && viewMode === 'action' && (
            <p className="text-xs text-white/50 leading-relaxed mb-2">
              {trend.explanation}
            </p>
          )}
        </div>
        
        {/* Action View */}
        {viewMode === 'action' && (
          <>
            <TrendActionCard 
              trend={trendData}
              onDetailsClick={() => setViewMode('intelligence')}
            />
            
            {/* Content Ideas Section */}
            {trend.contentIdeas && trend.contentIdeas.length > 0 && (
              <div className="algo-sheet-surface px-4 py-3">
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                  Idees de contenu
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {trend.contentIdeas.map((idea, i) => (
                    <span 
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                    >
                      {idea}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="algo-sheet-surface px-4 py-3 border-t border-[var(--color-border)]">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                Exporter ce signal
              </p>
              <AlgoSignalShareCard
                cardWidth={360}
                headline={trend.name}
                score={trend.score}
                badgeLabel={`${trend.platform} · ${trend.category}`}
                subtitle={trend.explanation?.slice(0, 100) || 'Tendance radar ALGO · avant saturation du feed.'}
              />
            </div>
          </>
        )}
        
        {/* Intelligence View */}
        {viewMode === 'intelligence' && (
          <div className="px-2 pb-2 space-y-3">
            <TrendIntelligenceCard 
              trend={intelligenceData}
              onActionClick={(action) => {
                console.log('Action clicked:', action)
              }}
            />
            <div className="algo-sheet-surface px-3 py-3 rounded-xl border border-[var(--color-border)]">
              <p className="text-[10px] font-bold text-cyan-400/70 uppercase tracking-wider mb-2">
                Partager l’intelligence
              </p>
              <AlgoSignalShareCard
                cardWidth={360}
                headline={trend.name}
                score={trend.score}
                badgeLabel="Vue intelligence"
                subtitle={
                  intelligenceData.analysis.psycho.emotionalHook.slice(0, 120) ||
                  trend.explanation?.slice(0, 100) ||
                  'Intelligence tendance ALGO.'
                }
              />
            </div>
          </div>
        )}
        
        {/* Follow Button */}
        <div className="p-4 pt-2 algo-sheet-surface">
          <button
            onClick={onToggleFollow}
            className={`algo-interactive w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-[background-color,color,border-color] duration-200 ${
              isFollowing
                ? 'bg-[var(--color-violet-muted)] text-[var(--color-text-primary)] border border-[color-mix(in_srgb,var(--color-violet)_35%,var(--color-border))]'
                : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
            }`}
          >
            {isFollowing ? <BellOff size={16} /> : <Bell size={16} />}
            {isFollowing ? 'Ne plus suivre' : 'Suivre cette tendance'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Old TrendDetailModal removed - now using TrendDetailModalNew with TrendActionCard
