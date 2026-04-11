import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'
import { computeCanonicalViralScore } from '@/lib/ai/canonical-viral-score'
import { persistViralScoreSnapshot } from '@/lib/ecosystem/snapshot-store'
import { supabaseServiceRoleConfigured } from '@/lib/supabase/admin'
import { AlgoCache } from '@/services/AlgoCache'
import { AlgoEventBus } from '@/services/AlgoEventBus'

// Analysis types
interface AnalysisInput {
  mode: 'url' | 'upload' | 'description'
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'reddit'
  url?: string
  description?: string
  locale: string
}

interface AnalysisResult {
  overallScore: number
  hookScore: number
  trendScore: number
  formatScore: number
  emotionScore: number
  timingScore: number
  potential: 'high' | 'medium' | 'low' | 'too-late' | 'too-early'
  bestPlatform: string
  bestTimeToPost: string
  estimatedReach: { low: number; high: number }
  recommendations: {
    thumbnail: string
    hook: string
    audio: string
    hashtags: string[]
    format: string
    timing: string
    benchmark: string
  }
  trendingTopics: string[]
  competitorInsights: string[]
  modelTelemetry: {
    adaptiveSignals: {
      engagementRate: number
      frictionRate: number
    } | null
    weightsUsed: {
      hook: number
      trend: number
      format: number
      emotion: number
      timing: number
    }
    adaptiveNotes: string[]
    weightsVersion: string
    rollbackApplied: boolean
  }
}

// Platform optimal posting times (UTC)
const PLATFORM_PEAK_HOURS = {
  youtube: { start: 14, end: 20, label: '14h-20h' },
  tiktok: { start: 18, end: 22, label: '18h-22h' },
  instagram: { start: 11, end: 14, label: '11h-14h' },
  twitter: { start: 9, end: 12, label: '9h-12h' },
  reddit: { start: 6, end: 10, label: '6h-10h (US time)' },
}

// Format recommendations by platform
const PLATFORM_FORMATS = {
  youtube: ['Shorts (< 60s)', 'Long-form (8-15 min)', 'Tutorial', 'Reaction', 'Commentary'],
  tiktok: ['Trending sound', 'Duet', 'Stitch', 'POV', 'Storytime'],
  instagram: ['Reels', 'Carousel', 'Story series', 'Live'],
  twitter: ['Thread', 'Video clip (< 2:20)', 'Quote tweet trend'],
  reddit: ['Discussion post', 'Image/Video', 'AMA style'],
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-viral-analyzer:${identifier}`, { limit: 18, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const formData = await request.formData()
    
    const input: AnalysisInput = {
      mode: formData.get('mode') as AnalysisInput['mode'],
      platform: formData.get('platform') as AnalysisInput['platform'],
      url: formData.get('url') as string | undefined,
      description: formData.get('description') as string | undefined,
      locale: formData.get('locale') as string || 'fr',
    }

    // Get content to analyze
    const contentData = await extractContentData(input, formData)
    
    // Fetch trend data from cache (via orchestrator)
    const trendData = await getTrendData(input.locale)
    
    // Analyze and score
    const result = await analyzeContent(contentData, trendData, input)
    
    // Publish signal if high potential early trend detected
    if (result.potential === 'high' && result.timingScore >= 80) {
      AlgoEventBus.publish('signal:early', {
        item: { topic: contentData.topic, score: result.overallScore },
        detectedAt: new Date().toISOString(),
        source: 'viral-analyzer',
      })
    }

    AlgoEventBus.publish('score:weights', {
      topic: contentData.topic,
      overallScore: result.overallScore,
      modelTelemetry: result.modelTelemetry,
    })

    if (supabaseServiceRoleConfigured()) {
      const subjectKey = createHash('sha256')
        .update(`${input.platform}:${input.mode}:${input.url || ''}:${contentData.topic.slice(0, 240)}`)
        .digest('hex')
        .slice(0, 48)
      void persistViralScoreSnapshot({
        subjectType: 'viral_analyzer',
        subjectKey,
        score: result.overallScore,
        confidence: result.modelTelemetry?.adaptiveSignals != null ? 0.82 : 0.55,
        payload: {
          potential: result.potential,
          platform: input.platform,
          topic: contentData.topic.slice(0, 300),
          mode: input.mode,
          weightsVersion: result.modelTelemetry?.weightsVersion,
        },
      }).catch(() => {})
    }

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[ALGO Viral Analyzer] Error:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}

interface ContentData {
  topic: string
  keywords: string[]
  format: string
  hasVideo: boolean
  hasThumbnail: boolean
  thumbnailUrl?: string
  videoMetadata?: {
    title: string
    description: string
    tags: string[]
    viewCount?: number
    likeCount?: number
    commentCount?: number
    publishedAt?: string
  }
}

async function extractContentData(
  input: AnalysisInput, 
  formData: FormData
): Promise<ContentData> {
  if (input.mode === 'url' && input.url) {
    return await extractFromUrl(input.url)
  }
  
  if (input.mode === 'description' && input.description) {
    return extractFromDescription(input.description)
  }
  
  if (input.mode === 'upload') {
    const video = formData.get('video') as File | null
    const thumbnail = formData.get('thumbnail') as File | null
    return extractFromUpload(video, thumbnail)
  }
  
  throw new Error('Invalid input mode')
}

async function extractFromUrl(url: string): Promise<ContentData> {
  // Detect platform and extract content
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return await extractYouTubeData(url)
  }
  
  if (url.includes('reddit.com')) {
    return await extractRedditData(url)
  }
  
  // For other platforms, extract basic info
  return {
    topic: 'Content from URL',
    keywords: extractKeywordsFromUrl(url),
    format: 'video',
    hasVideo: true,
    hasThumbnail: false,
  }
}

async function extractYouTubeData(url: string): Promise<ContentData> {
  const videoId = extractYouTubeId(url)
  if (!videoId) {
    return {
      topic: 'YouTube Video',
      keywords: [],
      format: 'video',
      hasVideo: true,
      hasThumbnail: true,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    }
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return {
      topic: 'YouTube Video',
      keywords: [],
      format: 'video',
      hasVideo: true,
      hasThumbnail: true,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    }
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    )
    
    if (response.ok) {
      const data = await response.json()
      const video = data.items?.[0]
      
      if (video) {
        const snippet = video.snippet
        const stats = video.statistics
        
        return {
          topic: snippet.title,
          keywords: snippet.tags || extractKeywordsFromText(snippet.title + ' ' + snippet.description),
          format: detectYouTubeFormat(snippet),
          hasVideo: true,
          hasThumbnail: true,
          thumbnailUrl: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url,
          videoMetadata: {
            title: snippet.title,
            description: snippet.description,
            tags: snippet.tags || [],
            viewCount: parseInt(stats.viewCount || '0'),
            likeCount: parseInt(stats.likeCount || '0'),
            commentCount: parseInt(stats.commentCount || '0'),
            publishedAt: snippet.publishedAt,
          },
        }
      }
    }
  } catch (error) {
    console.warn('[ALGO] YouTube API error:', error)
  }

  return {
    topic: 'YouTube Video',
    keywords: [],
    format: 'video',
    hasVideo: true,
    hasThumbnail: true,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  }
}

async function extractRedditData(url: string): Promise<ContentData> {
  try {
    // Convert to JSON endpoint
    const jsonUrl = url.replace(/\/?$/, '.json')
    const response = await fetch(jsonUrl, {
      headers: { 'User-Agent': 'ALGO/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    
    if (response.ok) {
      const data = await response.json()
      const post = data[0]?.data?.children?.[0]?.data
      
      if (post) {
        return {
          topic: post.title,
          keywords: extractKeywordsFromText(post.title + ' ' + (post.selftext || '')),
          format: post.is_video ? 'video' : post.is_gallery ? 'gallery' : 'text',
          hasVideo: post.is_video,
          hasThumbnail: !!post.thumbnail && post.thumbnail !== 'self',
          thumbnailUrl: post.thumbnail !== 'self' ? post.thumbnail : undefined,
          videoMetadata: {
            title: post.title,
            description: post.selftext || '',
            tags: [],
            viewCount: post.ups,
            commentCount: post.num_comments,
          },
        }
      }
    }
  } catch (error) {
    console.warn('[ALGO] Reddit API error:', error)
  }

  return {
    topic: 'Reddit Post',
    keywords: extractKeywordsFromUrl(url),
    format: 'post',
    hasVideo: false,
    hasThumbnail: false,
  }
}

function extractFromDescription(description: string): ContentData {
  const keywords = extractKeywordsFromText(description)
  const format = detectFormatFromText(description)
  
  return {
    topic: description.slice(0, 100),
    keywords,
    format,
    hasVideo: false,
    hasThumbnail: false,
  }
}

function extractFromUpload(
  video: File | null, 
  thumbnail: File | null
): ContentData {
  return {
    topic: video?.name.replace(/\.[^/.]+$/, '') || 'Uploaded content',
    keywords: [],
    format: 'video',
    hasVideo: !!video,
    hasThumbnail: !!thumbnail,
  }
}

// Trend data fetching
interface TrendData {
  googleTrends: string[]
  youtubeSearches: string[]
  newsKeywords: string[]
  redditTopics: string[]
}

async function getTrendData(locale: string): Promise<TrendData> {
  const country = locale === 'fr' ? 'FR' : 'US'

  const [cachedTrends, cachedNews] = await Promise.all([
    AlgoCache.get<{ keywords: string[] }>('trends', country),
    AlgoCache.get<{ keywords: string[] }>('news', `keywords_${country}`),
  ])

  const googleTrends = cachedTrends.data?.keywords ?? []
  const newsKeywords = cachedNews.data?.keywords ?? []
  
  // Fetch fresh YouTube searches
  let youtubeSearches: string[] = []
  try {
    const ytResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || ''}/api/live-videos?country=${country}`)
    if (ytResponse.ok) {
      const ytData = await ytResponse.json()
      youtubeSearches = ytData.data?.slice(0, 10).map((v: { title: string }) => v.title) || []
    }
  } catch {
    // Use cache fallback
  }

  return {
    googleTrends,
    youtubeSearches,
    newsKeywords,
    redditTopics: [],
  }
}

// Main analysis function
async function analyzeContent(
  content: ContentData,
  trends: TrendData,
  input: AnalysisInput
): Promise<AnalysisResult> {
  const adaptiveSignals = await getAdaptiveSignals()
  const trendSignals = [...trends.googleTrends, ...trends.youtubeSearches, ...trends.newsKeywords]
  const canonical = computeCanonicalViralScore({
    topic: content.topic,
    keywords: content.keywords,
    hasVideo: content.hasVideo,
    hasThumbnail: content.hasThumbnail,
    platform: input.platform,
    trendSignals,
    adaptiveSignals: adaptiveSignals || undefined,
  })

  const hookScore = canonical.hook
  const trendScore = canonical.trend
  const formatScore = canonical.format
  const emotionScore = canonical.emotion
  const timingScore = canonical.timing
  const overallScore = canonical.overall
  
  // Determine potential
  const potential = determinePotential(overallScore, timingScore)
  
  // Find best platform
  const bestPlatform = recommendBestPlatform(content, input.platform)
  
  // Generate recommendations
  const recommendations = generateRecommendations(content, trends, input.platform)
  
  // Estimate reach
  const estimatedReach = estimateReach(overallScore, input.platform)
  
  return {
    overallScore,
    hookScore,
    trendScore,
    formatScore,
    emotionScore,
    timingScore,
    potential,
    bestPlatform,
    bestTimeToPost: PLATFORM_PEAK_HOURS[input.platform].label,
    estimatedReach,
    recommendations,
    trendingTopics: [...trends.googleTrends.slice(0, 5), ...trends.youtubeSearches.slice(0, 5)],
    competitorInsights: generateCompetitorInsights(content, trends),
    modelTelemetry: {
      adaptiveSignals,
      weightsUsed: canonical.weightsUsed,
      adaptiveNotes: canonical.adaptiveNotes,
      weightsVersion: canonical.weightsVersion,
      rollbackApplied: canonical.rollbackApplied,
    },
  }
}

async function getAdaptiveSignals(): Promise<{ engagementRate: number; frictionRate: number } | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  if (!baseUrl) return null
  try {
    const res = await fetch(`${baseUrl}/api/analytics/events?hours=24`, {
      headers: { 'User-Agent': 'ALGO-Internal/1.0' },
      signal: AbortSignal.timeout(2500),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = await res.json()
    const engagementRate = Number(json?.adaptiveSignals?.engagementRate)
    const frictionRate = Number(json?.adaptiveSignals?.frictionRate)
    if (Number.isNaN(engagementRate) || Number.isNaN(frictionRate)) return null
    return { engagementRate, frictionRate }
  } catch {
    return null
  }
}

function determinePotential(
  overallScore: number, 
  timingScore: number
): AnalysisResult['potential'] {
  if (overallScore >= 75) return 'high'
  if (overallScore >= 50) return 'medium'
  if (timingScore < 30) return 'too-late'
  if (timingScore > 90 && overallScore < 50) return 'too-early'
  return 'low'
}

function recommendBestPlatform(content: ContentData, currentPlatform: string): string {
  // If video content, YouTube or TikTok are usually best
  if (content.hasVideo) {
    if (content.format.includes('short')) return 'tiktok'
    return 'youtube'
  }
  
  // If image-based, Instagram is good
  if (content.hasThumbnail && !content.hasVideo) return 'instagram'
  
  // Default to user's selected platform
  return currentPlatform
}

function generateRecommendations(
  content: ContentData,
  trends: TrendData,
  platform: string
): AnalysisResult['recommendations'] {
  const topTrends = trends.googleTrends.slice(0, 3)
  const topYT = trends.youtubeSearches.slice(0, 3)
  
  return {
    thumbnail: content.hasThumbnail 
      ? 'Ta miniature est presente. Assure-toi qu\'elle a un contraste eleve, un visage expressif et du texte lisible.'
      : 'Ajoute une miniature avec un visage expressif, des couleurs vives et du texte accrocheur (3-5 mots max).',
    hook: `Commence par une question choc ou une affirmation surprenante. Les 3 premieres secondes doivent creer de la curiosite. Mentionne "${topTrends[0] || content.keywords[0] || 'le sujet'}" des le debut.`,
    audio: platform === 'tiktok' 
      ? 'Utilise un son trending du moment. Verifie la bibliotheque TikTok pour les sons viraux cette semaine.'
      : 'Ajoute une musique de fond energique mais pas trop forte. La voix doit rester claire.',
    hashtags: generateHashtags(content, trends),
    format: `Pour ${platform}, privilegie le format ${PLATFORM_FORMATS[platform as keyof typeof PLATFORM_FORMATS]?.[0] || 'video'}. ${platform === 'youtube' ? 'Vise 8-12 minutes pour un meilleur algorithme.' : 'Garde ca court et percutant.'}`,
    timing: `Poste ${PLATFORM_PEAK_HOURS[platform as keyof typeof PLATFORM_PEAK_HOURS]?.label || 'aux heures de pointe'} pour maximiser la portee initiale.`,
    benchmark: topYT.length > 0 
      ? `Inspire-toi des videos trending: "${topYT[0]}". Analyse ce qui fonctionne et adapte a ton style.`
      : 'Regarde les top videos de ta niche cette semaine et identifie les patterns communs.',
  }
}

function generateHashtags(content: ContentData, trends: TrendData): string[] {
  const hashtags: string[] = []
  
  // Add content keywords
  hashtags.push(...content.keywords.slice(0, 3).map(k => k.replace(/\s+/g, '')))
  
  // Add trending topics
  hashtags.push(...trends.googleTrends.slice(0, 2).map(t => t.replace(/\s+/g, '')))
  
  // Add generic viral hashtags
  hashtags.push('fyp', 'viral', 'trending')
  
  return [...new Set(hashtags)].slice(0, 10)
}

function estimateReach(score: number, platform: string): { low: number; high: number } {
  const baseReach = {
    youtube: { low: 1000, high: 50000 },
    tiktok: { low: 5000, high: 500000 },
    instagram: { low: 500, high: 20000 },
    twitter: { low: 200, high: 10000 },
    reddit: { low: 100, high: 5000 },
  }
  
  const base = baseReach[platform as keyof typeof baseReach] || baseReach.youtube
  const multiplier = score / 50 // Score of 50 = 1x, 100 = 2x
  
  return {
    low: Math.round(base.low * multiplier),
    high: Math.round(base.high * multiplier),
  }
}

function generateCompetitorInsights(content: ContentData, trends: TrendData): string[] {
  const insights: string[] = []
  
  if (trends.youtubeSearches.length > 0) {
    insights.push(`Les videos "${trends.youtubeSearches[0]}" performent bien en ce moment`)
  }
  
  if (trends.googleTrends.length > 0) {
    insights.push(`Le sujet "${trends.googleTrends[0]}" est en tendance sur Google`)
  }
  
  insights.push('Les formats courts (< 60s) ont 2x plus de chances de devenir viraux')
  insights.push('Les videos avec sous-titres ont 40% plus d\'engagement')
  
  return insights
}

// Utility functions
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

function extractKeywordsFromUrl(url: string): string[] {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname
      .split('/')
      .filter(p => p.length > 2)
      .flatMap(p => p.split(/[-_]/))
      .filter(w => w.length > 2 && !/^\d+$/.test(w))
  } catch {
    return []
  }
}

function extractKeywordsFromText(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'dans', 'sur', 'pour', 'de',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'est', 'sont', 'etait', 'avoir', 'etre', 'fait', 'faire',
  ])
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 20)
}

function detectYouTubeFormat(snippet: { title?: string; description?: string }): string {
  const text = ((snippet.title || '') + ' ' + (snippet.description || '')).toLowerCase()
  
  if (text.includes('short') || text.includes('#shorts')) return 'short'
  if (text.includes('tutorial') || text.includes('how to') || text.includes('tuto')) return 'tutorial'
  if (text.includes('reaction') || text.includes('reacting')) return 'reaction'
  if (text.includes('vlog')) return 'vlog'
  if (text.includes('review')) return 'review'
  
  return 'video'
}

function detectFormatFromText(text: string): string {
  const lower = text.toLowerCase()
  
  if (lower.includes('short') || lower.includes('tiktok') || lower.includes('reel')) return 'short'
  if (lower.includes('tutorial') || lower.includes('tuto') || lower.includes('how to')) return 'tutorial'
  if (lower.includes('vlog')) return 'vlog'
  if (lower.includes('podcast') || lower.includes('interview')) return 'podcast'
  
  return 'video'
}
