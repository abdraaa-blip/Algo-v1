/**
 * Contenu de démonstration lorsque les clés API (YouTube, TMDB, Last.fm) sont absentes
 * ou que les appels échouent, pour garder l’UI remplie et des miniatures valides.
 */
import type { RealArtist, RealTrack } from '@/lib/api/lastfm-service'

const DEMO_YT = [
  { id: 'dQw4w9WgXcQ', title: 'Exemple tendance (démo ALGO)', channel: 'YouTube' },
  { id: 'jNQXAC9IVRw', title: 'Format court viral (démo)', channel: 'YouTube' },
  { id: '9bZkp7q19f0', title: 'Clip en traction (démo)', channel: 'YouTube' },
  { id: 'kJQP7kiw5Fk', title: 'Hit international (démo)', channel: 'YouTube' },
  { id: 'L_jWHffIx5E', title: 'Performance live (démo)', channel: 'YouTube' },
  { id: 'y6120QOlsfU', title: 'Création / making-of (démo)', channel: 'YouTube' },
] as const

function ytThumb(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

/** Format attendu par `/api/live-videos` (VideosClientShell). */
export function buildDemoLiveVideos(country: string) {
  const c = country.toUpperCase()
  const now = Date.now()
  return DEMO_YT.map((item, index) => {
    const views = 2_400_000 - index * 180_000
    const publishedAt = new Date(now - (index + 1) * 3_600_000).toISOString()
    const viralScore = Math.max(72, 92 - index * 3)
    return {
      id: item.id,
      title: item.title,
      channel: item.channel,
      thumbnail: ytThumb(item.id),
      views,
      viewsFormatted: formatViewCount(views),
      publishedAt,
      publishedAtFormatted: `${index + 1}h`,
      duration: '4:12',
      viralScore,
      growthRate: 120 + index * 15,
      badge: (index < 2 ? 'Viral' : index < 4 ? 'Early' : 'Trend') as
        | 'Viral'
        | 'Early'
        | 'Breaking'
        | 'Trend',
      country: c,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      isExploding: index === 0,
    }
  })
}

/** Format attendu par `/api/youtube` (page d’accueil). */
export function buildDemoHomeYoutubeItems(regionCode: string) {
  return DEMO_YT.map((item, index) => {
    const views = 3_100_000 - index * 200_000
    const likes = Math.floor(views * 0.02)
    const growthRate = Math.min(Math.floor((likes / Math.max(views, 1)) * 1000), 500)
    return {
      id: item.id,
      title: item.title,
      category: 'Culture',
      platform: 'YouTube',
      country: regionCode,
      language: 'fr',
      viralScore: Math.min(Math.floor(growthRate / 5) + 60, 99),
      badge: growthRate > 200 ? 'Viral' : growthRate > 100 ? 'Early' : 'Trend',
      views,
      growthRate,
      growthTrend: 'up' as const,
      detectedAt: new Date(Date.now() - index * 7200000).toISOString(),
      thumbnail: ytThumb(item.id),
      sourceUrl: `https://www.youtube.com/watch?v=${item.id}`,
      explanation: `Vidéo d’exemple (sans clé YouTube). Région ${regionCode}.`,
      creatorTips: 'Configure YOUTUBE_API_KEY pour les vraies tendances.',
      insight: {
        postNowProbability: 'medium' as const,
        timing: 'now',
        bestPlatform: ['YouTube'],
        bestFormat: 'reaction',
        timingLabel: { fr: 'Démo', en: 'Demo' },
        postWindow: { status: 'optimal' as const },
      },
      sourceDistribution: [{ platform: 'YouTube', percentage: 100, momentum: 'medium' as const }],
      watchersCount: Math.floor(views / 1000),
      isExploding: index === 0,
    }
  })
}

export function getDemoLastFmTracks(): RealTrack[] {
  const now = new Date().toISOString()
  const rows: { name: string; artist: string }[] = [
    { name: 'Midnight Signal', artist: 'Nova Keys' },
    { name: 'City Pulse', artist: 'Echo Lane' },
    { name: 'Rise Up (demo)', artist: 'ALGO Radio' },
    { name: 'Neon Run', artist: 'Synth Park' },
    { name: 'Loop Theory', artist: 'Tape Dream' },
    { name: 'Golden Hour', artist: 'Sunset Crew' },
  ]
  return rows.map((row, i) => {
    const label = encodeURIComponent(`${row.artist} ${row.name}`)
    return {
      id: `demo-track-${i}`,
      name: row.name,
      artist: row.artist,
      artistUrl: 'https://www.last.fm/music',
      url: 'https://www.last.fm',
      imageUrl: `https://ui-avatars.com/api/?name=${label}&background=1db954&color=fff&size=300&bold=true`,
      listeners: 890_000 - i * 80_000,
      playcount: 4_200_000 - i * 300_000,
      rank: i + 1,
      fetchedAt: now,
    }
  })
}

export function getDemoLastFmArtists(): RealArtist[] {
  const now = new Date().toISOString()
  const names = ['Nova Keys', 'Echo Lane', 'Synth Park', 'Tape Dream', 'Sunset Crew', 'ALGO Radio']
  return names.map((name, i) => ({
    id: `demo-artist-${i}`,
    name,
    url: 'https://www.last.fm/music',
    imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=300&bold=true`,
    listeners: 1_200_000 - i * 90_000,
    playcount: 8_000_000 - i * 500_000,
    rank: i + 1,
    tags: ['demo', 'charts'],
    fetchedAt: now,
  }))
}
