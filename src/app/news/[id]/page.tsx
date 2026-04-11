import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Script from 'next/script'
import { ArrowLeft, ExternalLink, Clock, Zap, TrendingUp, Globe } from 'lucide-react'
import { ShareStrip } from '@/components/growth/ShareStrip'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { extractTitleKeywords } from '@/lib/seo/keywords-from-title'
import { newsArticleJsonLd } from '@/lib/seo/json-ld'
import { absoluteUrl } from '@/lib/seo/site'
import { Badge } from '@/components/ui/Badge'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { InsightPanel } from '@/components/ui/InsightPanel'
import type { ContentFormat, Insight, PostWindowStatus, TimingStatus } from '@/types'
import { fillLocaleStrings } from '@/types'

// =============================================================================
// ALGO V1 · News Detail Page
// Fetches real news from Google News RSS and displays with ALGO insights
// =============================================================================

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  urlToImage: string | null
  publishedAt: string
  source: string
  author: string | null
  country: string
}

// Fetch news from our live-news API and find the article by ID
async function fetchNewsById(newsId: string): Promise<NewsArticle | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  try {
    // Fetch news for France (default) and other countries
    const countries = ['fr', 'us']
    
    for (const country of countries) {
      const res = await fetch(`${baseUrl}/api/live-news?country=${country}`, {
        next: { revalidate: 300 },
        headers: { 'User-Agent': 'ALGO-Internal/1.0' }
      })
      
      if (!res.ok) continue
      
      const data = await res.json()
      if (!data.success || !data.data) continue
      
      const found = data.data.find((article: NewsArticle) => article.id === newsId)
      if (found) return found
    }
    
    return null
  } catch (error) {
    console.error('[ALGO] Failed to fetch news:', error)
    return null
  }
}

// Generate importance score based on article characteristics
function calculateImportanceScore(article: NewsArticle): number {
  let score = 70 // Base score
  
  // Recent articles score higher
  const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000
  if (hoursAgo < 1) score += 20
  else if (hoursAgo < 3) score += 15
  else if (hoursAgo < 6) score += 10
  else if (hoursAgo < 12) score += 5
  
  // Longer titles often indicate more detail
  if (article.title.length > 80) score += 5
  
  // Has description
  if (article.description && article.description.length > 100) score += 5
  
  // Has image
  if (article.urlToImage) score += 3
  
  return Math.min(99, score)
}

// Calculate speed/freshness score
function calculateSpeedScore(article: NewsArticle): number {
  const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000
  
  if (hoursAgo < 0.5) return 98
  if (hoursAgo < 1) return 92
  if (hoursAgo < 2) return 85
  if (hoursAgo < 4) return 75
  if (hoursAgo < 8) return 65
  if (hoursAgo < 12) return 55
  if (hoursAgo < 24) return 45
  return 30
}

// Guess category from title keywords
function guessCategory(title: string): string {
  const titleLower = title.toLowerCase()
  
  if (/tech|ia|ai|digital|startup|innovation|robot|cyber/.test(titleLower)) return 'Tech'
  if (/sport|football|match|ligue|nba|tennis|rugby/.test(titleLower)) return 'Sport'
  if (/film|cinema|serie|netflix|disney|marvel/.test(titleLower)) return 'Entertainment'
  if (/politique|president|gouvernement|election|ministre/.test(titleLower)) return 'Politique'
  if (/economie|bourse|marche|entreprise|finance/.test(titleLower)) return 'Economie'
  if (/musique|concert|artiste|album|spotify/.test(titleLower)) return 'Musique'
  if (/science|recherche|decouverte|etude/.test(titleLower)) return 'Science'
  
  return 'Actualite'
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const news = await fetchNewsById(id)

  if (!news) {
    return buildPageMetadata({
      title: 'Actualité introuvable',
      description: 'Cette actualité n’est plus disponible sur ALGO.',
      path: `/news/${id}`,
      noindex: true,
    })
  }

  const kw = extractTitleKeywords(news.title, 8)
  return buildPageMetadata({
    title: news.title,
    description: news.description || news.title,
    path: `/news/${id}`,
    keywords: [...kw, news.country, news.source].filter(Boolean),
    ogType: 'article',
    ogImage: news.urlToImage,
    locale: 'fr_FR',
    alternateLocales: ['en_US'],
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 60) return `il y a ${diffMins} min`
  if (diffHours < 24) return `il y a ${diffHours}h`
  return `il y a ${diffDays}j`
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function NewsPage({ params }: Props) {
  const { id } = await params
  const news = await fetchNewsById(id)

  if (!news) notFound()

  // Calculate dynamic scores
  const importanceScore = calculateImportanceScore(news)
  const speedScore = calculateSpeedScore(news)
  const tags = extractTitleKeywords(news.title, 5)
  const category = guessCategory(news.title)

  const timing: TimingStatus =
    speedScore > 80 ? 'now' : speedScore > 50 ? 'now' : 'too_late'
  const postWindowStatus: PostWindowStatus =
    speedScore > 80 ? 'optimal' : speedScore > 50 ? 'fading' : 'saturated'
  const insight: Insight = {
    postNowProbability: importanceScore > 85 ? 'high' : importanceScore > 70 ? 'medium' : 'low',
    timing,
    bestPlatform: ['YouTube', 'TikTok', 'Twitter'],
    bestFormat: 'news' as ContentFormat,
    timingLabel: fillLocaleStrings({
      fr: speedScore > 85 ? 'Breaking news' : 'Actualité chaude',
      en: 'Breaking news',
    }),
    postWindow: { status: postWindowStatus },
  }

  const shareUrl = absoluteUrl(`/news/${id}`)
  const shareSnippet = `Ce qui compte maintenant : ${news.title.slice(0, 110)}${news.title.length > 110 ? '…' : ''}`

  return (
    <>
      <Script
        id={`news-article-ld-${news.id}`}
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(
          newsArticleJsonLd({
            headline: news.title,
            description: news.description || news.title,
            urlPath: `/news/${id}`,
            datePublished: news.publishedAt,
            image: news.urlToImage,
            authorName: news.author || undefined,
          })
        )}
      </Script>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Back button */}
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] text-sm font-semibold hover:text-[var(--color-text-primary)] transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Retour aux actualités
      </Link>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
          Actualite en direct
        </span>
      </div>

      {/* Hero image */}
      {news.urlToImage && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6">
          <ImageWithFallback
            src={news.urlToImage}
            alt={news.title}
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute top-3 left-3">
            <Badge 
              type={speedScore > 85 ? 'Breaking' : speedScore > 70 ? 'Early' : 'Trend'} 
              label={speedScore > 85 ? 'Breaking' : speedScore > 70 ? 'Fresh' : 'Tendance'} 
              size="md" 
            />
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-tertiary)] font-semibold mb-3">
        <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
          <Globe size={10} />
          {news.source}
        </span>
        <span className="text-[var(--color-text-muted)]">·</span>
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {formatRelativeTime(news.publishedAt)}
        </span>
        <span className="text-[var(--color-text-muted)]">·</span>
        <span>{category}</span>
        <span className="text-[var(--color-text-muted)]">·</span>
        <span className="text-emerald-400/70">{news.country}</span>
      </div>

      {/* Title */}
      <h1 className="text-xl md:text-2xl font-black text-[var(--color-text-primary)] tracking-tight leading-tight mb-4 text-balance">
        {news.title}
      </h1>

      <ShareStrip className="mb-6" url={shareUrl} title={news.title} snippet={shareSnippet} />

      {/* Scores */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <Zap size={14} className="text-rose-400" />
          <div>
            <p className="text-[10px] text-rose-400/70 font-semibold">Importance</p>
            <p className="text-lg font-black text-rose-400">{importanceScore}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <TrendingUp size={14} className="text-amber-400" />
          <div>
            <p className="text-[10px] text-amber-400/70 font-semibold">Fraicheur</p>
            <p className="text-lg font-black text-amber-400">{speedScore}</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-[var(--color-card)] text-[10px] text-[var(--color-text-secondary)] font-semibold"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {news.description && (
        <section className="mb-6">
          <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed font-medium">
            {news.description}
          </p>
        </section>
      )}

      {/* Insight Engine */}
      <InsightPanel
        insight={insight}
        watchersCount={Math.floor(importanceScore * 8)}
        labels={{
          title: 'Insight pour créateurs',
          postNow: { high: 'Réagis maintenant !', medium: 'Opportunité modérée', low: 'Signal faible' },
          timing: { now: 'Breaking — agis vite', too_late: 'Sujet déjà traité', too_early: 'Trop tôt' },
          bestPlatform: 'Plateformes idéales',
          bestFormat: 'Format recommandé',
          watchers: '{count} créateurs surveillent cette actu',
          postWindow: { optimal: 'Fenêtre optimale', saturated: 'Sujet saturé', fading: 'Intérêt en baisse' },
        }}
      />

      {/* Creator tips */}
      <section className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
        <h2 className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span>🎯</span>
          Conseils pour createurs
        </h2>
        <ul className="space-y-2 text-[13px] text-[var(--color-text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span>
              {speedScore > 80 
                ? 'Cette actu est fraîche — crée une réaction ou une analyse dans les 2 prochaines heures'
                : 'Trouve un angle original pour te démarquer sur ce sujet'
              }
            </span>
          </li>
          {tags.length > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>Utilise les hashtags: #{tags.slice(0, 3).join(' #')}</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span>Poste d&apos;abord sur {insight.bestPlatform.slice(0, 2).join(' et ')}</span>
          </li>
        </ul>
      </section>

      {/* Source link */}
      <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-semibold hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ExternalLink size={14} />
          Lire l&apos;article complet sur {news.source}
        </a>
      </div>

      {/* Disclaimer */}
      <p className="mt-4 text-[10px] text-[var(--color-text-muted)] text-center">
        Source : {news.source} via Google News · Analyse ALGO en temps réel
      </p>
    </div>
    </>
  )
}
