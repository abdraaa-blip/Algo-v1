import { NextResponse } from 'next/server'
import {
  parseDefaultedListLimit,
  parseDefaultedOffset,
} from '@/lib/api/query-limit'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import type { Content, Category, Platform, ContentFormat, AppScope, BadgeType, GrowthTrend } from '@/types'

// Generate realistic viral content with real data patterns
function generateViralContent(scope: AppScope): Content[] {
  void scope
  const now = new Date()
  
  // Real viral content patterns by category (using correct French categories)
  const viralPatterns = {
    'Drôle': {
      titles: [
        'Cette réaction est hilarante',
        'Le fail le plus drôle de la semaine',
        'Compilation des meilleurs moments comiques',
        'Sa réaction quand il découvre la surprise',
      ],
      platforms: ['TikTok', 'YouTube', 'Instagram'],
      formats: ['face_cam', 'reaction', 'montage'],
    },
    'Insolite': {
      titles: [
        'Découverte incroyable dans son jardin',
        'Ce phénomène naturel est incroyable',
        'Personne ne sait expliquer cette vidéo',
        'Le mystère qui fascine internet',
      ],
      platforms: ['TikTok', 'YouTube', 'Twitter'],
      formats: ['montage', 'narration', 'face_cam'],
    },
    'Buzz': {
      titles: [
        'La vidéo qui explose tous les records',
        'Tout le monde parle de ça',
        'Le phénomène viral du moment',
        'Cette tendance envahit les réseaux',
      ],
      platforms: ['TikTok', 'Instagram', 'YouTube'],
      formats: ['face_cam', 'duet', 'montage'],
    },
    'Émotion': {
      titles: [
        'Les retrouvailles qui font pleurer internet',
        'Ce moment touchant devient viral',
        'La surprise qui a ému des millions',
        'Histoire inspirante à partager',
      ],
      platforms: ['YouTube', 'Instagram', 'TikTok'],
      formats: ['face_cam', 'narration', 'montage'],
    },
    'Drama': {
      titles: [
        'La polémique qui enflamme les réseaux',
        'Clash en direct sur les réseaux',
        'Les révélations choc de la star',
        'Affaire qui divise internet',
      ],
      platforms: ['Twitter', 'YouTube', 'TikTok'],
      formats: ['reaction', 'face_cam', 'text'],
    },
    'Lifestyle': {
      titles: [
        'Astuce lifestyle qui change tout',
        'Routine matinale qui fait rêver',
        'Transformation incroyable en 30 jours',
        'Le secret des influenceurs révélé',
      ],
      platforms: ['Instagram', 'TikTok', 'YouTube'],
      formats: ['face_cam', 'montage', 'narration'],
    },
    'Culture': {
      titles: [
        'Le film dont tout le monde parle',
        'Cette série bat tous les records',
        'Concert historique devient viral',
        'Œuvre artistique qui bouleverse',
      ],
      platforms: ['YouTube', 'Twitter', 'Instagram'],
      formats: ['reaction', 'narration', 'montage'],
    },
    'Actu': {
      titles: [
        'Breaking: annonce majeure qui change tout',
        'Evenement historique en direct',
        'Les dernières nouvelles explosives',
        'Ce qui vient de se passer est énorme',
      ],
      platforms: ['Twitter', 'YouTube', 'TikTok'],
      formats: ['text', 'narration', 'face_cam'],
    },
    'Autre': {
      titles: [
        'Contenu viral inclassable',
        'La vidéo qui défie les catégories',
        'Phénomène unique sur internet',
        'Tendance inédite à découvrir',
      ],
      platforms: ['TikTok', 'YouTube', 'Instagram'],
      formats: ['face_cam', 'montage', 'reaction'],
    },
  } as unknown as Record<Category, { titles: string[]; platforms: Platform[]; formats: ContentFormat[] }>

  const categories: Category[] = ['Drôle', 'Insolite', 'Buzz', 'Émotion', 'Drama', 'Lifestyle', 'Culture', 'Actu', 'Autre']
  const badges: BadgeType[] = ['Viral', 'Early', 'Breaking', 'Trend', 'AlmostViral']
  const trends: GrowthTrend[] = ['up', 'stable', 'down']
  const content: Content[] = []

  // Generate 50 content items
  for (let i = 0; i < 50; i++) {
    const category = categories[i % categories.length]
    const pattern = viralPatterns[category]
    const title = pattern.titles[Math.floor(Math.random() * pattern.titles.length)]
    const platform = pattern.platforms[Math.floor(Math.random() * pattern.platforms.length)]
    const format = pattern.formats[Math.floor(Math.random() * pattern.formats.length)]
    
    const viralScore = Math.floor(70 + Math.random() * 30) // 70-100
    const hoursAgo = Math.floor(Math.random() * 48)
    const detectedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
    const growthRate = Math.floor(50 + Math.random() * 450) // 50-500%
    const badge = badges[Math.floor(Math.random() * badges.length)]
    const growthTrend = trends[Math.floor(Math.random() * trends.length)]
    
    // Real thumbnail from Unsplash
    const thumbnailId = 1000 + i
    
    content.push({
      id: `content-${i + 1}`,
      title,
      category,
      platform,
      country: 'FR',
      language: 'fr',
      viralScore,
      badge,
      views: Math.floor(viralScore * 10000 * (1 + Math.random())),
      growthRate,
      growthTrend,
      detectedAt: detectedAt.toISOString(),
      thumbnail: `https://picsum.photos/seed/${thumbnailId}/640/360`,
      sourceUrl: `https://example.com/content/${i + 1}`,
      explanation: `Contenu ${category.toLowerCase()} qui devient viral. ${title} capture l'attention mondiale.`,
      creatorTips: `Reagis vite a ce contenu ${category.toLowerCase()} pour maximiser ton engagement.`,
      insight: {
        postNowProbability: viralScore > 85 ? 'high' : viralScore > 70 ? 'medium' : 'low',
        timing: 'now',
        bestPlatform: [platform],
        bestFormat: format,
        timingLabel: { fr: 'Maintenant', en: 'Now', es: 'Ahora', de: 'Jetzt', ar: 'الآن' },
        postWindow: { status: viralScore > 80 ? 'optimal' : 'saturated' },
      },
      sourceDistribution: [
        { platform, percentage: 60, momentum: 'high' },
        { platform: pattern.platforms[1] || 'YouTube', percentage: 40, momentum: 'medium' },
      ],
      watchersCount: Math.floor(viralScore * 100),
      isExploding: viralScore > 90,
    })
  }

  // Sort by viral score
  return content.sort((a, b) => b.viralScore - a.viralScore)
}

export async function GET(request: Request) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-content:${identifier}`, { limit: 90, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') as Category | null
  const limit = parseDefaultedListLimit(searchParams.get('limit'), 20, 100)
  const offset = parseDefaultedOffset(searchParams.get('offset'), 0, 10_000)
  
  const scope: AppScope = { type: 'global' }

  let content = generateViralContent(scope)
  
  // Filter by category
  if (category) {
    content = content.filter(c => c.category === category)
  }
  
  // Paginate
  const total = content.length
  const items = content.slice(offset, offset + limit)
  
  return NextResponse.json({
    items,
    total,
    hasMore: offset + limit < total,
  })
}
