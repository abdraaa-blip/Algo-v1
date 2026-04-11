import { fetchGoogleTrends, type RealTrend } from '@/lib/api/real-data-service'
import { computeCanonicalViralScore } from '@/lib/ai/canonical-viral-score'
import { isYoutubeDataApiConfigured } from '@/lib/social/youtube-public-metrics'

export type ViralFusionTrendsMeta = {
  source: 'live' | 'cached' | 'fallback'
  fetchedAt?: string
}

export type ViralFusionTopTrend = {
  title: string
  trafficVolume: string
  country: string
  source: string
}

export type ViralFusionVideoRow = {
  videoId: string
  title: string
  views: number
  likes: number
  comments: number
  publishedAt: string | null
  watchUrl: string
  /** Score ALGO (modèle canonique multi-axes, pas seulement likes/vues). */
  fusionScore: number
}

export type ViralFusionPayload = {
  success: true
  kind: 'algo.viral_fusion'
  generatedAt: string
  region: string
  trendsMeta: ViralFusionTrendsMeta
  topTrend: ViralFusionTopTrend | null
  /** Titres injectés comme signaux tendance pour le score canonique. */
  trendSignals: string[]
  videos: ViralFusionVideoRow[]
  youtubeConfigured: boolean
  /** Présent si la recherche YouTube a été sautée (ex. gate Pro). */
  youtubeSearchSkipped?: 'require_pro'
  disclaimerFr: string
}

/** Exposé pour tests : score canonique à partir d’une vidéo + signaux radar texte. */
export function computeFusionCanonicalForVideo(input: {
  videoTitle: string
  trendSignals: string[]
}): ReturnType<typeof computeCanonicalViralScore> {
  const raw = input.videoTitle.trim()
  const keywords = raw
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 12)
  return computeCanonicalViralScore({
    topic: raw.slice(0, 140) || 'video',
    keywords: keywords.length ? keywords : ['contenu'],
    hasVideo: true,
    hasThumbnail: true,
    platform: 'youtube',
    trendSignals: input.trendSignals.filter((t) => t.trim().length > 1).slice(0, 12),
  })
}

function toTrendSignals(trends: RealTrend[], max = 10): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const t of trends) {
    const line = t.title?.trim()
    if (!line || seen.has(line.toLowerCase())) continue
    seen.add(line.toLowerCase())
    out.push(line)
    if (out.length >= max) break
  }
  return out
}

type SearchItem = { id?: { videoId?: string }; snippet?: { title?: string } }

async function youtubeSearchVideoIds(query: string, regionCode: string, maxResults: number): Promise<string[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim()
  if (!key) return []

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', String(Math.min(10, Math.max(1, maxResults))))
  url.searchParams.set('q', query.slice(0, 180))
  url.searchParams.set('regionCode', regionCode)
  url.searchParams.set('key', key)

  const res = await fetch(url.toString(), {
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return []

  const json = (await res.json()) as { items?: SearchItem[] }
  const ids: string[] = []
  for (const it of json.items ?? []) {
    const id = it.id?.videoId
    if (id && /^[\w-]{11}$/.test(id)) ids.push(id)
  }
  return [...new Set(ids)].slice(0, maxResults)
}

type VideoDetailItem = {
  id?: string
  snippet?: { title?: string; publishedAt?: string }
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string }
}

function toNum(s: string | undefined): number {
  if (s == null || s === '') return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

async function youtubeVideosDetails(videoIds: string[]): Promise<VideoDetailItem[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim()
  if (!key || videoIds.length === 0) return []

  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('part', 'snippet,statistics')
  url.searchParams.set('id', videoIds.join(','))
  url.searchParams.set('key', key)

  const res = await fetch(url.toString(), {
    cache: 'no-store',
    signal: AbortSignal.timeout(14_000),
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return []

  const json = (await res.json()) as { items?: VideoDetailItem[] }
  return json.items ?? []
}

/**
 * Agrège tendances (flux News RSS / cache existant) + recherche YouTube + score canonique ALGO.
 * Ne remplace pas le cockpit `/api/intelligence/viral-control` : lecture complémentaire pour le dashboard.
 */
export async function buildViralFusionPayload(
  region: string,
  opts?: { includeYouTube?: boolean }
): Promise<ViralFusionPayload> {
  const includeYouTube = opts?.includeYouTube !== false
  const regionUpper = region.toUpperCase()
  const pack = await fetchGoogleTrends(regionUpper)
  const trends = pack.data
  const trendSignals = toTrendSignals(trends)
  const top = trends[0]

  const topTrend: ViralFusionTopTrend | null = top
    ? {
        title: top.title,
        trafficVolume: top.trafficVolume,
        country: top.country,
        source: top.source,
      }
    : null

  const youtubeConfigured = isYoutubeDataApiConfigured()
  const videos: ViralFusionVideoRow[] = []
  let youtubeSearchSkipped: ViralFusionPayload['youtubeSearchSkipped']

  if (includeYouTube && youtubeConfigured && topTrend?.title) {
    const ids = await youtubeSearchVideoIds(topTrend.title, regionUpper, 5)
    const details = await youtubeVideosDetails(ids)

    for (const item of details) {
      const videoId = item.id
      if (!videoId) continue
      const title = item.snippet?.title?.trim() || 'Vidéo'
      const views = toNum(item.statistics?.viewCount)
      const likes = toNum(item.statistics?.likeCount)
      const comments = toNum(item.statistics?.commentCount)
      const publishedAt = item.snippet?.publishedAt ?? null

      const canon = computeFusionCanonicalForVideo({
        videoTitle: title,
        trendSignals,
      })

      videos.push({
        videoId,
        title,
        views,
        likes,
        comments,
        publishedAt,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        fusionScore: canon.overall,
      })
    }
  } else if (!includeYouTube && youtubeConfigured) {
    youtubeSearchSkipped = 'require_pro'
  }

  const baseDisclaimer =
    'Fusion indicative : tendances via agrégat News (pas l’API Google Trends officielle) ; vidéos via YouTube Data API si clé configurée ; score = modèle canonique ALGO (angles hook / tendance / format), pas une métrique plateforme brute.'
  const gateNote =
    youtubeSearchSkipped === 'require_pro'
      ? ' Recherche YouTube désactivée ici (plan gratuit ou gate `ALGO_FUSION_YOUTUBE_REQUIRE_PRO=1`).'
      : ''

  return {
    success: true,
    kind: 'algo.viral_fusion',
    generatedAt: new Date().toISOString(),
    region: regionUpper,
    trendsMeta: {
      source: pack.source,
      fetchedAt: pack.fetchedAt,
    },
    topTrend,
    trendSignals,
    videos,
    youtubeConfigured,
    ...(youtubeSearchSkipped ? { youtubeSearchSkipped } : {}),
    disclaimerFr: `${baseDisclaimer}${gateNote}`,
  }
}
