import { canonicalYoutubeWatchUrl, parseYoutubeVideoIdFromUrl } from '@/lib/social/youtube-video-id'
import {
  fetchYoutubePublicMetrics,
  isYoutubeDataApiConfigured,
} from '@/lib/social/youtube-public-metrics'
import { getYoutubeObservationSeries } from '@/lib/social/youtube-observation-series'

export type ViralControlYoutubeBlock = {
  configured: boolean
  videoId: string
  videoUrl: string
  title: string | null
  publishedAt: string | null
  fetchedAt: string | null
  views: number
  likes: number
  comments: number
  observationSeries: Array<{ at: string; views: number; likes: number; comments: number }>
  noteFr: string
}

/**
 * Optionnel : enrichit le cockpit avec des métriques publiques YouTube + série d’observations serveur.
 */
export async function resolveYoutubeForViralControl(
  rawUrl: string | null | undefined
): Promise<ViralControlYoutubeBlock | null> {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return null

  const videoId = parseYoutubeVideoIdFromUrl(trimmed)
  if (!videoId) return null

  const videoUrl = canonicalYoutubeWatchUrl(videoId)

  if (!isYoutubeDataApiConfigured()) {
    return {
      configured: false,
      videoId,
      videoUrl,
      title: null,
      publishedAt: null,
      fetchedAt: null,
      views: 0,
      likes: 0,
      comments: 0,
      observationSeries: [],
      noteFr:
        'Ajoute YOUTUBE_API_KEY côté serveur pour afficher vues, likes et commentaires publics (Data API v3).',
    }
  }

  const m = await fetchYoutubePublicMetrics(videoId)
  if (!m) {
    return {
      configured: true,
      videoId,
      videoUrl,
      title: null,
      publishedAt: null,
      fetchedAt: null,
      views: 0,
      likes: 0,
      comments: 0,
      observationSeries: getYoutubeObservationSeries(videoId),
      noteFr:
        'Lecture API YouTube indisponible pour cette vidéo (introuvable, quota ou erreur réseau). Réessaie plus tard.',
    }
  }

  return {
    configured: true,
    videoId,
    videoUrl,
    title: m.title,
    publishedAt: m.publishedAt,
    fetchedAt: m.fetchedAt,
    views: m.views,
    likes: m.likes,
    comments: m.comments,
    observationSeries: m.observationSeries,
    noteFr:
      'Métriques publiques YouTube (instantané). La courbe = relevés à chaque fetch serveur, pas l’historique officiel de la plateforme.',
  }
}
