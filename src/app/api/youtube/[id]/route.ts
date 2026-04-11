import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

// =============================================================================
// ALGO V1 · YouTube Video Detail API
// Fetches full video details including stats, description, and related videos
// =============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`api-youtube-id:${identifier}`, { limit: 90, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { id } = await params
  const videoId = id.replace('youtube-', '').replace('yt-', '')
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
  }
  
  try {
    // Fetch video details and related videos in parallel
    const [videoRes, relatedRes] = await Promise.all([
      fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`),
      fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=6&key=${apiKey}`),
    ])
    
    const videoData = await videoRes.json()
    const relatedData = await relatedRes.json()
    const item = videoData.items?.[0]
    
    if (!item) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }
    
    const views = parseInt(item.statistics?.viewCount || '0')
    const likes = parseInt(item.statistics?.likeCount || '0')
    const comments = parseInt(item.statistics?.commentCount || '0')
    
    // Parse duration from ISO 8601 format (PT1H2M30S)
    const duration = item.contentDetails?.duration
    let durationMinutes = 0
    if (duration) {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (match) {
        const hours = parseInt(match[1] || '0')
        const mins = parseInt(match[2] || '0')
        const secs = parseInt(match[3] || '0')
        durationMinutes = hours * 60 + mins + Math.ceil(secs / 60)
      }
    }
    
    return NextResponse.json({
      id: videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      thumbnail: 
        item.snippet.thumbnails?.maxres?.url || 
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url,
      views,
      likes,
      comments,
      duration: durationMinutes,
      durationRaw: duration,
      tags: item.snippet.tags?.slice(0, 10) || [],
      categoryId: item.snippet.categoryId,
      related: (relatedData.items || []).slice(0, 6).map((r: { id: { videoId: string }; snippet: { title: string; thumbnails?: { medium?: { url: string } }; channelTitle: string } }) => ({
        id: `youtube-${r.id.videoId}`,
        title: r.snippet.title,
        thumbnail: r.snippet.thumbnails?.medium?.url,
        channelName: r.snippet.channelTitle,
      })),
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    })
  } catch (e) {
    console.error('YouTube fetch error:', e)
    return NextResponse.json({ error: 'YouTube fetch failed' }, { status: 500 })
  }
}
