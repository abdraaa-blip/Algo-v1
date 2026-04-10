import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Script from 'next/script'
import { ExternalLink, Users, ArrowRight } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { extractTitleKeywords } from '@/lib/seo/keywords-from-title'
import { articleContentJsonLd } from '@/lib/seo/json-ld'

import { Badge } from '@/components/ui/Badge'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { ViralScoreRing } from '@/components/ui/ViralScoreRing'
import { MomentumPill } from '@/components/ui/MomentumPill'
import { InsightPanel } from '@/components/ui/InsightPanel'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CommentSection } from '@/components/ui/CommentSection'
import { VideoPlayer } from '@/components/ui/VideoPlayer'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ShareButton } from '@/components/ui/ShareButton'
import { ReportButton } from '@/components/ui/ReportButton'
import { ScoreHistoryChart } from '@/components/ui/ScoreHistoryChart'
import { RelatedContent } from '@/components/ui/RelatedContent'
import { TrailerModal } from '@/components/ui/TrailerModal'
import { CastSection } from '@/components/ui/CastSection'
import { SimilarContent } from '@/components/ui/SimilarContent'
import { AlgoSignalShareCard } from '@/components/algo/AlgoSignalShareCard'
import { ShareStrip } from '@/components/growth/ShareStrip'
import { absoluteUrl } from '@/lib/seo/site'

import { getContentById, getAllContentIds } from '@/services/contentService'
import { cn } from '@/lib/utils'
import type { BadgeType, Content } from '@/types'

// ─── Fetch Real API Content ───────────────────────────────────────────────────

async function fetchYouTubeContent(videoId: string): Promise<Content | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return null
    
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null

    const views = parseInt(item.statistics?.viewCount || '0')
    const likes = parseInt(item.statistics?.likeCount || '0')
    const growthRate = Math.min(Math.floor((likes / Math.max(views, 1)) * 1000), 500)

    return {
      id: `youtube-${videoId}`,
      title: item.snippet?.title || '',
      category: 'Culture',
      platform: 'YouTube',
      country: 'US',
      language: item.snippet?.defaultLanguage || 'fr',
      viralScore: Math.min(Math.floor(growthRate / 5) + 60, 99),
      badge: growthRate > 200 ? 'Viral' : growthRate > 100 ? 'Early' : 'Trend',
      views,
      growthRate,
      growthTrend: 'up',
      detectedAt: item.snippet?.publishedAt || new Date().toISOString(),
      thumbnail: item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || '',
      sourceUrl: `https://youtube.com/watch?v=${videoId}`,
      explanation: item.snippet?.description?.slice(0, 300) || `Video tendance sur YouTube avec ${views.toLocaleString('fr-FR')} vues.`,
      creatorTips: 'Analyse ce format et adapte-le a ton audience dans les 24h.',
      insight: {
        postNowProbability: growthRate > 200 ? 'high' : 'medium',
        timing: 'now',
        bestPlatform: ['YouTube', 'TikTok'],
        bestFormat: 'reaction',
        timingLabel: { fr: 'Fenetre active', en: 'Active window' },
        postWindow: { status: 'optimal' },
      },
      sourceDistribution: [
        { platform: 'YouTube', percentage: 70, momentum: 'high' },
        { platform: 'TikTok', percentage: 30, momentum: 'medium' },
      ],
      watchersCount: Math.floor(views / 1000),
      isExploding: growthRate > 300,
    }
  } catch {
    return null
  }
}

interface TMDBExtras {
  trailerKey?: string | null
  cast?: Array<{ id: number; name: string; character: string; photo: string | null }>
  similar?: Array<{ id: string; title: string; poster: string | null; score: number; badge: string; year?: string }>
  rating?: number
  voteCount?: number
  releaseDate?: string
  runtime?: number
  genres?: string[]
  backdrop?: string
}

async function fetchTMDBContent(tmdbId: string, type: 'movie' | 'tv' = 'movie'): Promise<(Content & TMDBExtras) | null> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return null

  try {
    // Fetch main details, videos, credits, and similar in parallel
    const [detailsRes, videosRes, creditsRes, similarRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${apiKey}&language=fr-FR`, { next: { revalidate: 21600 } }),
      fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/videos?api_key=${apiKey}&language=fr-FR`, { next: { revalidate: 21600 } }),
      fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/credits?api_key=${apiKey}&language=fr-FR`, { next: { revalidate: 21600 } }),
      fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/similar?api_key=${apiKey}&language=fr-FR&page=1`, { next: { revalidate: 21600 } }),
    ])
    
    if (!detailsRes.ok) return null
    
    const [item, videos, credits, similar] = await Promise.all([
      detailsRes.json(),
      videosRes.ok ? videosRes.json() : { results: [] },
      creditsRes.ok ? creditsRes.json() : { cast: [] },
      similarRes.ok ? similarRes.json() : { results: [] },
    ])
    
    if (!item.id) return null

    // Find best trailer
    const allVideos = videos.results || []
    const trailer = 
      allVideos.find((v: { type: string; site: string; iso_639_1: string }) => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'fr') ||
      allVideos.find((v: { type: string; site: string }) => v.type === 'Trailer' && v.site === 'YouTube') ||
      allVideos.find((v: { site: string }) => v.site === 'YouTube')

    return {
      id: `tmdb-${tmdbId}`,
      title: item.title || item.name || '',
      category: type === 'movie' ? 'Films' : 'Series',
      platform: 'TMDB',
      country: 'US',
      language: 'fr',
      viralScore: Math.min(Math.floor(item.popularity / 10), 99),
      badge: item.popularity > 500 ? 'Viral' : 'Trend',
      views: item.vote_count * 1000,
      growthRate: Math.min(Math.floor(item.popularity / 5), 400),
      growthTrend: 'up',
      detectedAt: new Date().toISOString(),
      thumbnail: item.backdrop_path 
        ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` 
        : item.poster_path 
        ? `https://image.tmdb.org/t/p/w780${item.poster_path}` 
        : '',
      backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : undefined,
      sourceUrl: `https://www.themoviedb.org/${type}/${tmdbId}`,
      explanation: item.overview || 'Contenu tendance cette semaine.',
      creatorTips: `Fais une reaction ou une analyse de "${item.title || item.name}" — ce contenu est dans toutes les conversations.`,
      insight: {
        postNowProbability: item.popularity > 200 ? 'high' : 'medium',
        timing: 'now',
        bestPlatform: ['YouTube', 'TikTok', 'Instagram'],
        bestFormat: 'reaction',
        timingLabel: { fr: 'Tendance cette semaine', en: 'Trending this week' },
        postWindow: { status: item.popularity > 500 ? 'saturated' : 'optimal' },
      },
      sourceDistribution: [
        { platform: 'YouTube', percentage: 50, momentum: 'high' },
        { platform: 'Instagram', percentage: 30, momentum: 'medium' },
        { platform: 'TikTok', percentage: 20, momentum: 'medium' },
      ],
      watchersCount: item.vote_count,
      isExploding: item.popularity > 500,
      // Extended TMDB data
      trailerKey: trailer?.key || null,
      cast: (credits.cast || []).slice(0, 8).map((a: { id: number; name: string; character: string; profile_path: string | null }) => ({
        id: a.id,
        name: a.name,
        character: a.character,
        photo: a.profile_path ? `https://image.tmdb.org/t/p/w185${a.profile_path}` : null,
      })),
      similar: (similar.results || []).slice(0, 6).map((m: { id: number; title?: string; name?: string; poster_path: string | null; popularity: number; release_date?: string; first_air_date?: string }) => ({
        id: `tmdb-${m.id}`,
        title: m.title || m.name || '',
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
        score: Math.min(Math.floor(m.popularity / 10), 99),
        badge: m.popularity > 200 ? 'Trend' : 'Early',
        year: (m.release_date || m.first_air_date)?.slice(0, 4),
      })),
      rating: item.vote_average,
      voteCount: item.vote_count,
      releaseDate: item.release_date || item.first_air_date,
      runtime: item.runtime || item.episode_run_time?.[0],
      genres: (item.genres || []).map((g: { name: string }) => g.name),
    }
  } catch {
    return null
  }
}

// Fetch content from Reddit API
async function fetchRedditContent(postId: string): Promise<Content | null> {
  try {
    const res = await fetch(
      `https://www.reddit.com/comments/${postId}.json`,
      { next: { revalidate: 1800 }, headers: { 'User-Agent': 'ALGO/1.0' } }
    )
    if (!res.ok) return null
    
    const data = await res.json()
    const post = data?.[0]?.data?.children?.[0]?.data
    if (!post) return null
    
    const score = post.score || 0
    const viralScore = Math.min(99, Math.max(50, 60 + Math.log10(score + 1) * 10))
    
    return {
      id: `reddit_${postId}`,
      title: post.title || '',
      category: 'Discussion',
      platform: 'Reddit',
      country: 'US',
      language: 'en',
      viralScore: Math.floor(viralScore),
      badge: score > 10000 ? 'Viral' : score > 1000 ? 'Early' : 'Trend',
      views: score * 10,
      growthRate: Math.min(score / 10, 300),
      growthTrend: 'up',
      detectedAt: new Date(post.created_utc * 1000).toISOString(),
      thumbnail: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : '',
      sourceUrl: `https://reddit.com${post.permalink}`,
      explanation: post.selftext?.slice(0, 300) || `Discussion Reddit avec ${score.toLocaleString('fr-FR')} upvotes.`,
      creatorTips: 'Partage ton opinion sur ce sujet Reddit et invite au debat.',
      insight: {
        postNowProbability: score > 5000 ? 'high' : 'medium',
        timing: 'now',
        bestPlatform: ['Twitter', 'TikTok'],
        bestFormat: 'text',
        timingLabel: { fr: 'Discussion active', en: 'Active discussion' },
        postWindow: { status: 'optimal' },
      },
      sourceDistribution: [
        { platform: 'Reddit', percentage: 80, momentum: 'high' },
        { platform: 'Twitter', percentage: 20, momentum: 'medium' },
      ],
      watchersCount: Math.floor(score / 100),
      isExploding: score > 20000,
    }
  } catch {
    return null
  }
}

// Fetch content from GitHub API
async function fetchGitHubContent(repoName: string): Promise<Content | null> {
  try {
    // Convert underscore back to slash for API call
    const fullName = repoName.replace('_', '/')
    const res = await fetch(
      `https://api.github.com/repos/${fullName}`,
      { next: { revalidate: 3600 }, headers: { 'Accept': 'application/vnd.github.v3+json' } }
    )
    if (!res.ok) return null
    
    const repo = await res.json()
    if (!repo.id) return null
    
    const stars = repo.stargazers_count || 0
    const viralScore = Math.min(99, Math.max(50, 60 + Math.log10(stars + 1) * 8))
    
    return {
      id: `gh_${repoName}`,
      title: repo.full_name || repo.name || '',
      category: 'Tech',
      platform: 'GitHub',
      country: 'US',
      language: repo.language || 'en',
      viralScore: Math.floor(viralScore),
      badge: stars > 10000 ? 'Viral' : stars > 1000 ? 'Early' : 'Trend',
      views: stars * 100,
      growthRate: Math.min(stars / 50, 300),
      growthTrend: 'up',
      detectedAt: repo.pushed_at || new Date().toISOString(),
      thumbnail: repo.owner?.avatar_url || '',
      sourceUrl: repo.html_url,
      explanation: repo.description || `Projet GitHub avec ${stars.toLocaleString('fr-FR')} etoiles.`,
      creatorTips: 'Fais un tutoriel ou une review de ce projet open source.',
      insight: {
        postNowProbability: stars > 5000 ? 'high' : 'medium',
        timing: 'now',
        bestPlatform: ['YouTube', 'Twitter'],
        bestFormat: 'screen record',
        timingLabel: { fr: 'Projet tendance', en: 'Trending project' },
        postWindow: { status: 'optimal' },
      },
      sourceDistribution: [
        { platform: 'GitHub', percentage: 70, momentum: 'high' },
        { platform: 'Twitter', percentage: 30, momentum: 'medium' },
      ],
      watchersCount: repo.watchers_count || Math.floor(stars / 10),
      isExploding: stars > 50000,
    }
  } catch {
    return null
  }
}

// Fetch content from HackerNews API
async function fetchHackerNewsContent(storyId: string): Promise<Content | null> {
  try {
    const res = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return null
    
    const story = await res.json()
    if (!story || story.type !== 'story') return null
    
    const score = story.score || 0
    const viralScore = Math.min(99, Math.max(50, 60 + Math.log10(score + 1) * 12))
    
    return {
      id: `hn_${storyId}`,
      title: story.title || '',
      category: 'Tech',
      platform: 'HackerNews',
      country: 'US',
      language: 'en',
      viralScore: Math.floor(viralScore),
      badge: score > 500 ? 'Viral' : score > 100 ? 'Early' : 'Trend',
      views: score * 50,
      growthRate: Math.min(score / 5, 300),
      growthTrend: 'up',
      detectedAt: new Date(story.time * 1000).toISOString(),
      thumbnail: '',
      sourceUrl: story.url || `https://news.ycombinator.com/item?id=${storyId}`,
      explanation: `Article HackerNews avec ${score} points et ${story.descendants || 0} commentaires.`,
      creatorTips: 'Analyse ce sujet tech et partage ton expertise.',
      insight: {
        postNowProbability: score > 300 ? 'high' : 'medium',
        timing: 'now',
        bestPlatform: ['Twitter', 'YouTube'],
        bestFormat: 'text',
        timingLabel: { fr: 'Discussion tech', en: 'Tech discussion' },
        postWindow: { status: 'optimal' },
      },
      sourceDistribution: [
        { platform: 'HackerNews', percentage: 60, momentum: 'high' },
        { platform: 'Twitter', percentage: 40, momentum: 'medium' },
      ],
      watchersCount: story.descendants || Math.floor(score / 5),
      isExploding: score > 1000,
    }
  } catch {
    return null
  }
}

// Generate a fallback content when API fails but we know the source
function generateFallbackContent(id: string): Content | null {
  const platformMap: Record<string, { platform: string; category: string; url: string }> = {
    'youtube': { platform: 'YouTube', category: 'Video', url: `https://youtube.com/watch?v=${id.replace('youtube-', '')}` },
    'hn': { platform: 'HackerNews', category: 'Tech', url: `https://news.ycombinator.com/item?id=${id.replace('hn_', '')}` },
    'gh': { platform: 'GitHub', category: 'Tech', url: `https://github.com/${id.replace('gh_', '').replace('_', '/')}` },
    'reddit': { platform: 'Reddit', category: 'Discussion', url: `https://reddit.com/comments/${id.replace('reddit_', '')}` },
  }
  
  const prefix = id.split(/[-_]/)[0]
  const config = platformMap[prefix]
  if (!config) return null
  
  return {
    id,
    title: `Contenu ${config.platform}`,
    category: config.category,
    platform: config.platform,
    country: 'US',
    language: 'en',
    viralScore: 70,
    badge: 'Trend',
    views: 0,
    growthRate: 50,
    growthTrend: 'stable',
    detectedAt: new Date().toISOString(),
    thumbnail: '',
    sourceUrl: config.url,
    explanation: `Ce contenu provient de ${config.platform}. Cliquez sur le lien source pour le consulter directement.`,
    creatorTips: `Visitez ${config.platform} pour voir le contenu original.`,
    insight: {
      postNowProbability: 'medium',
      timing: 'now',
      bestPlatform: [config.platform],
      bestFormat: 'reaction',
      timingLabel: { fr: 'Disponible', en: 'Available' },
      postWindow: { status: 'optimal' },
    },
    sourceDistribution: [
      { platform: config.platform, percentage: 100, momentum: 'medium' },
    ],
    watchersCount: 0,
    isExploding: false,
  }
}

async function getContentByIdAsync(id: string): Promise<Content | null> {
  // 1. Try mock data first
  const mock = getContentById(id)
  if (mock) return mock

  let result: Content | null = null

  // 2. YouTube content
  if (id.startsWith('youtube-')) {
    const videoId = id.replace('youtube-', '')
    result = await fetchYouTubeContent(videoId)
    if (result) return result
    // Fallback for YouTube - provide direct link
    return generateFallbackContent(id)
  }

  // 3. TMDB content
  if (id.startsWith('tmdb-')) {
    const tmdbId = id.replace('tmdb-', '')
    result = await fetchTMDBContent(tmdbId)
    if (result) return result
    // No fallback for TMDB - content doesn't exist
    return null
  }
  
  // 4. Reddit content
  if (id.startsWith('reddit_')) {
    const postId = id.replace('reddit_', '')
    result = await fetchRedditContent(postId)
    if (result) return result
    return generateFallbackContent(id)
  }
  
  // 5. GitHub content
  if (id.startsWith('gh_')) {
    const repoName = id.replace('gh_', '')
    result = await fetchGitHubContent(repoName)
    if (result) return result
    return generateFallbackContent(id)
  }
  
  // 6. HackerNews content
  if (id.startsWith('hn_')) {
    const storyId = id.replace('hn_', '')
    result = await fetchHackerNewsContent(storyId)
    if (result) return result
    return generateFallbackContent(id)
  }

  // 7. Try raw YouTube ID (legacy support)
  if (!id.startsWith('c') && id.length >= 8 && id.length <= 12) {
    const ytContent = await fetchYouTubeContent(id)
    if (ytContent) return ytContent
  }
  
  // 8. For unknown IDs that look like they have a source prefix, try to extract and fetch
  const prefixMatch = id.match(/^(\w+)_(\d+)$/)
  if (prefixMatch) {
    const [, source, numId] = prefixMatch
    if (source === 'hackernews' || source === 'hn') {
      result = await fetchHackerNewsContent(numId)
      if (result) return result
    }
  }

  return null
}

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getAllContentIds().map((id) => ({ id }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const content = await getContentByIdAsync(id)
  if (!content) {
    return buildPageMetadata({
      title: 'Contenu introuvable',
      description: 'Ce contenu n’est plus disponible sur ALGO.',
      path: `/content/${id}`,
      noindex: true,
    })
  }

  const kw = extractTitleKeywords(content.title, 8)
  const extra = [content.platform, content.category].filter(Boolean) as string[]

  return buildPageMetadata({
    title: content.title,
    description: content.explanation || content.title,
    path: `/content/${id}`,
    keywords: [...kw, ...extra],
    ogType: content.platform === 'YouTube' ? 'video.other' : 'article',
    ogImage: content.thumbnail || null,
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
  
  if (diffMins < 60) return `il y a ${diffMins}min`
  if (diffHours < 24) return `il y a ${diffHours}h`
  return `il y a ${diffDays}j`
}

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function ContentPage({ params }: Props) {
  const { id } = await params
  const content = await getContentByIdAsync(id)
  if (!content) notFound()

  const isCooling = content.growthTrend === 'down'

  const badgeType: BadgeType | 'coolOff' | 'exploding' =
    content.isExploding ? 'exploding'
    : isCooling ? 'coolOff'
    : content.badge

  const badgeLabels = {
    Viral: 'Viral',
    Early: 'Early',
    Breaking: 'Breaking',
    Trend: 'Trend',
    AlmostViral: 'Presque viral',
    coolOff: 'Refroidissement',
    exploding: 'En explosion',
  }

  const badgeLabel = badgeLabels[badgeType as keyof typeof badgeLabels] ?? content.badge

  const insightLabels = {
    title: 'Insights',
    postNow: { high: 'Forte chance', medium: 'Moyenne', low: 'Faible' },
    timing: { now: 'Maintenant', too_late: 'Trop tard', too_early: 'Trop tot' },
    bestPlatform: 'Meilleure plateforme',
    bestFormat: 'Meilleur format',
    watchers: '{count} personnes surveillent ce signal',
    postWindow: { optimal: 'Optimal', saturated: 'Sature', fading: 'En baisse' },
    formatLabels: { face_cam: 'Face cam', text: 'Texte', montage: 'Montage', narration: 'Narration', duet: 'Duo', reaction: 'Reaction' },
  }

  const isCrossPlat = content.sourceDistribution.length >= 2

  return (
    <>
      <Script
        id={`content-ld-${id}`}
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(
          articleContentJsonLd({
            headline: content.title,
            description: content.explanation || content.title,
            urlPath: `/content/${id}`,
            image: content.thumbnail || null,
            datePublished: content.detectedAt,
          })
        )}
      </Script>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumbs 
          items={[
            { label: 'Accueil', href: '/' },
            { label: content.category, href: `/?category=${content.category}` },
            { label: content.title },
          ]}
        />
        <div className="flex items-center gap-2">
          <ShareButton title={content.title} text={content.explanation} />
          <ReportButton contentId={id} contentType="content" />
        </div>
      </div>

<div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[var(--color-card)]">
  <ImageWithFallback
    src={content.thumbnail}
    alt={content.title}
    fill
    sizes="(max-width: 672px) 100vw, 672px"
    className="object-cover"
    containerClassName="w-full h-full"
    fallbackType="platform"
    platform={content.platform?.toLowerCase() || 'default'}
    priority
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
  <div className="absolute top-3 start-3">
    <Badge type={badgeType} label={badgeLabel} size="md" />
  </div>
  {/* Trailer button for TMDB content */}
  {'trailerKey' in content && content.trailerKey && (
    <TrailerModal trailerKey={content.trailerKey} title={content.title} />
  )}
</div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-white/30">
          <span className="font-semibold text-white/50">{content.platform}</span>
          <span>·</span>
          <span>{content.category}</span>
          <span>·</span>
          <time dateTime={content.detectedAt}>Detecte {formatRelativeTime(content.detectedAt)}</time>
        </div>

        <h1 className="text-white font-black text-xl leading-tight">{content.title}</h1>

        <div className="flex items-center gap-4 flex-wrap">
          <ViralScoreRing value={content.viralScore} trend={content.growthTrend} size="md" />
          <MomentumPill value={content.growthRate} trend={content.growthTrend} />
          {content.watchersCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-white/28">
              <Users size={11} strokeWidth={1.8} />
              {formatCount(content.watchersCount)}
            </span>
          )}
        </div>

        <ShareStrip
          className="mt-4"
          url={absoluteUrl(`/content/${id}`)}
          title={content.title}
          snippet={`Signal ALGO · score ${content.viralScore} — ${content.title.slice(0, 80)}${content.title.length > 80 ? '…' : ''}`}
        />

        <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-950/20 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-violet-400/80 mb-2">
            Carte exportable
          </p>
          <AlgoSignalShareCard
            headline={content.title}
            score={content.viralScore}
            badgeLabel={badgeLabel}
            subtitle={content.explanation?.slice(0, 120) || 'Meta-radar ALGO — partage ton avantage.'}
          />
        </div>
      </div>

      <hr className="border-[var(--color-border)]" />

      <InsightPanel insight={content.insight} watchersCount={content.watchersCount} labels={insightLabels} />

      {isCrossPlat && (
        <p className="text-[11px] text-sky-400/70 flex items-center gap-1.5">
          <span>🔗</span>
          Cross-plateforme detecte
        </p>
      )}

      <hr className="border-[var(--color-border)]" />

      <section>
        <h2 className="text-xs font-bold text-white/45 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span>🔍</span>
          Pourquoi ca buzz
        </h2>
        <p className="text-sm text-white/58 leading-relaxed">{content.explanation}</p>
      </section>

      <section className="rounded-2xl border border-[rgba(123,97,255,0.18)] bg-[rgba(123,97,255,0.05)] p-4">
        <h2 className="text-xs font-bold text-violet-400/80 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span>🎯</span>
          Conseils createur
        </h2>
        <p className="text-sm text-white/58 leading-relaxed">{content.creatorTips}</p>

        <Link
          href="/creator-mode"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-violet-400/80 hover:text-violet-300 transition-colors"
        >
          Mode Createur
          <ArrowRight size={11} strokeWidth={2} />
        </Link>
      </section>

{content.failReason && (
  <section className="rounded-2xl border border-[rgba(255,77,109,0.18)] bg-[rgba(255,77,109,0.05)] p-4">
    <h2 className="text-xs font-bold text-rose-400/80 uppercase tracking-widest mb-3">
      Pourquoi ca a echoue
    </h2>
    <p className="text-sm text-white/55 leading-relaxed">{content.failReason}</p>
  </section>
)}

{/* Cast section for TMDB content */}
{'cast' in content && content.cast && content.cast.length > 0 && (
  <CastSection cast={content.cast} />
)}

{/* Similar content for TMDB */}
{'similar' in content && content.similar && content.similar.length > 0 && (
  <SimilarContent 
    items={content.similar} 
    type="film"
    title="Contenus similaires en tendance"
  />
)}

{/* TMDB rating and details */}
{'rating' in content && content.rating && (
  <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
    <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
      <span>⭐</span>
      Informations
    </h3>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-white/35 text-xs">Note TMDB</p>
        <p className="text-amber-400 font-bold">{content.rating.toFixed(1)}/10</p>
      </div>
      {'voteCount' in content && content.voteCount && (
        <div>
          <p className="text-white/35 text-xs">Votes</p>
          <p className="text-white/70 font-semibold">{content.voteCount.toLocaleString('fr-FR')}</p>
        </div>
      )}
      {'releaseDate' in content && content.releaseDate && (
        <div>
          <p className="text-white/35 text-xs">Date de sortie</p>
          <p className="text-white/70 font-semibold">{new Date(content.releaseDate).toLocaleDateString('fr-FR')}</p>
        </div>
      )}
      {'runtime' in content && content.runtime && (
        <div>
          <p className="text-white/35 text-xs">Duree</p>
          <p className="text-white/70 font-semibold">{content.runtime} min</p>
        </div>
      )}
      {'genres' in content && content.genres && content.genres.length > 0 && (
        <div className="col-span-2">
          <p className="text-white/35 text-xs mb-1">Genres</p>
          <div className="flex flex-wrap gap-1.5">
            {content.genres.map((g: string) => (
              <span key={g} className="px-2 py-0.5 rounded-full bg-[var(--color-card-hover)] text-[10px] text-[var(--color-text-secondary)] font-medium border border-[var(--color-border)]">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>
)}

{content.sourceDistribution.length > 0 && (
        <section>
          <SectionHeader title="Source du signal" className="mb-4" />
          <div className="space-y-2.5">
            {content.sourceDistribution.map((s) => (
              <div key={s.platform} className="flex items-center gap-3">
                <span className="text-xs text-white/45 w-20 shrink-0">{s.platform}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/7 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.percentage}%`,
                      background: s.momentum === 'high' ? 'var(--color-violet)'
                        : s.momentum === 'medium' ? 'var(--color-blue-neon)'
                        : 'rgba(240,240,248,0.25)',
                    }}
                  />
                </div>
                <span className="text-xs text-white/30 w-8 text-end tabular-nums">{s.percentage}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.platform?.toLowerCase().includes('youtube') && content.sourceUrl && (
        <section>
          <VideoPlayer 
            src={content.sourceUrl}
            poster={content.thumbnail}
            title={content.title}
            platform="youtube"
          />
        </section>
      )}

      <section>
        <SectionHeader title="Evolution du score" className="mb-4" />
        <ScoreHistoryChart contentId={id} currentScore={content.viralScore} className="h-48" />
      </section>

      <a
        href={content.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
          'border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] text-sm font-semibold',
          'hover:bg-white/8 hover:text-white/82 transition-all',
        )}
      >
        <ExternalLink size={14} strokeWidth={1.8} />
        Voir la source originale
      </a>

      <hr className="border-[var(--color-border)]" />

      <RelatedContent currentContentId={id} category={content.category} platform={content.platform} />

      <hr className="border-[var(--color-border)]" />

      <CommentSection contentId={id} />
    </div>
    </>
  )
}
