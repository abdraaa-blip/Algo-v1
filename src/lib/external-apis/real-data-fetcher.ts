'use server'

/**
 * Real Data Fetcher - Fetches actual trending content from public APIs
 * Uses RSS feeds, public APIs, and scraping-safe endpoints
 */

// ==================== YOUTUBE TRENDING ====================
interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  channelName: string
  viewCount: number
  publishedAt: string
  duration: string
}

export async function fetchYouTubeTrending(country: string = 'US'): Promise<YouTubeVideo[]> {
  try {
    // Using Invidious API (open source YouTube frontend) - no API key needed
    const response = await fetch(
      `https://vid.puffyan.us/api/v1/trending?region=${country}&type=Default`,
      { next: { revalidate: 900 } } // Cache 15 minutes
    )
    
    if (!response.ok) {
      // Fallback to another instance
      const fallback = await fetch(
        `https://invidious.snopyta.org/api/v1/trending?region=${country}`,
        { next: { revalidate: 900 } }
      )
      if (!fallback.ok) throw new Error('YouTube API unavailable')
      const data = await fallback.json()
      return mapYouTubeData(data)
    }
    
    const data = await response.json()
    return mapYouTubeData(data)
  } catch (error) {
    console.error('[ALGO] YouTube fetch error:', error)
    return getFallbackYouTubeData()
  }
}

interface InvidiousVideo {
  videoId: string
  title: string
  videoThumbnails?: { url: string }[]
  author: string
  viewCount?: number
  published: number
  lengthSeconds?: number
}

function mapYouTubeData(data: InvidiousVideo[]): YouTubeVideo[] {
  return data.slice(0, 20).map((item) => ({
    id: item.videoId,
    title: item.title,
    thumbnail: item.videoThumbnails?.[4]?.url || item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
    channelName: item.author,
    viewCount: item.viewCount || 0,
    publishedAt: new Date(item.published * 1000).toISOString(),
    duration: formatDuration(item.lengthSeconds || 0),
  }))
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ==================== REDDIT HOT ====================
interface RedditPost {
  id: string
  title: string
  subreddit: string
  thumbnail: string | null
  url: string
  score: number
  numComments: number
  author: string
  createdAt: string
  isVideo: boolean
  videoUrl?: string
}

export async function fetchRedditHot(subreddit: string = 'all'): Promise<RedditPost[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
      { 
        next: { revalidate: 300 }, // Cache 5 minutes
        headers: { 'User-Agent': 'ALGO/1.0' }
      }
    )
    
    if (!response.ok) throw new Error('Reddit API unavailable')
    
    interface RedditApiResponse {
      data: {
        children: Array<{
          data: {
            id: string
            title: string
            subreddit: string
            thumbnail: string
            url: string
            score: number
            num_comments: number
            author: string
            created_utc: number
            is_video: boolean
            media?: { reddit_video?: { fallback_url?: string } }
          }
        }>
      }
    }
    const data: RedditApiResponse = await response.json()
    return data.data.children.map((item) => ({
      id: item.data.id,
      title: item.data.title,
      subreddit: item.data.subreddit,
      thumbnail: item.data.thumbnail?.startsWith('http') ? item.data.thumbnail : null,
      url: item.data.url,
      score: item.data.score,
      numComments: item.data.num_comments,
      author: item.data.author,
      createdAt: new Date(item.data.created_utc * 1000).toISOString(),
      isVideo: item.data.is_video,
      videoUrl: item.data.media?.reddit_video?.fallback_url,
    }))
  } catch (error) {
    console.error('[ALGO] Reddit fetch error:', error)
    return []
  }
}

// ==================== HACKER NEWS ====================
interface HNStory {
  id: number
  title: string
  url: string
  score: number
  by: string
  time: number
  descendants: number
}

export async function fetchHackerNewsTop(): Promise<HNStory[]> {
  try {
    const idsResponse = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { next: { revalidate: 600 } }
    )
    const ids = await idsResponse.json()
    
    const stories = await Promise.all(
      ids.slice(0, 15).map(async (id: number) => {
        const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        return res.json()
      })
    )
    
    return stories.filter(s => s && s.title)
  } catch (error) {
    console.error('[ALGO] HN fetch error:', error)
    return []
  }
}

// ==================== RSS FEEDS (NEWS) ====================
interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  thumbnail: string | null
}

export async function fetchNewsRSS(): Promise<NewsArticle[]> {
  try {
    // Using rss2json service for RSS parsing
    const feeds = [
      { url: 'https://www.reddit.com/r/worldnews/.rss', source: 'Reddit WorldNews' },
      { url: 'https://hnrss.org/frontpage', source: 'Hacker News' },
    ]
    
    const allArticles: NewsArticle[] = []
    
    for (const feed of feeds) {
      try {
        const response = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`,
          { next: { revalidate: 600 } }
        )
        const data = await response.json()
        
        interface RSSItem {
          guid?: string
          link: string
          title: string
          description?: string
          pubDate: string
          thumbnail?: string
          enclosure?: { link?: string }
        }
        if (data.items) {
          allArticles.push(...(data.items as RSSItem[]).slice(0, 10).map((item) => ({
            id: item.guid || item.link,
            title: item.title,
            description: item.description?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
            url: item.link,
            source: feed.source,
            publishedAt: item.pubDate,
            thumbnail: item.thumbnail || item.enclosure?.link || null,
          })))
        }
      } catch (e) {
        console.error(`[ALGO] RSS feed error for ${feed.source}:`, e)
      }
    }
    
    return allArticles
  } catch (error) {
    console.error('[ALGO] News fetch error:', error)
    return []
  }
}

// ==================== GOOGLE TRENDS (via proxy) ====================
interface GoogleTrend {
  keyword: string
  traffic: string
  relatedQueries: string[]
  articleUrls: string[]
}

export async function fetchGoogleTrends(country: string = 'US'): Promise<GoogleTrend[]> {
  try {
    // Using SerpAPI or similar if available, otherwise generate from keywords
    // For now, we aggregate trending topics from multiple sources
    const redditTrending = await fetchRedditHot('popular')
    const ytTrending = await fetchYouTubeTrending(country)
    
    // Extract keywords from titles
    const keywords = new Map<string, number>()
    
    redditTrending.forEach(post => {
      const words = post.title.toLowerCase().split(/\s+/).filter(w => w.length > 4)
      words.forEach(w => keywords.set(w, (keywords.get(w) || 0) + post.score / 1000))
    })
    
    ytTrending.forEach(video => {
      const words = video.title.toLowerCase().split(/\s+/).filter(w => w.length > 4)
      words.forEach(w => keywords.set(w, (keywords.get(w) || 0) + video.viewCount / 100000))
    })
    
    // Sort by score and return top 20
    return Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, score]) => ({
        keyword,
        traffic: formatTraffic(score),
        relatedQueries: [],
        articleUrls: [],
      }))
  } catch (error) {
    console.error('[ALGO] Trends fetch error:', error)
    return []
  }
}

function formatTraffic(score: number): string {
  if (score > 100) return '100K+'
  if (score > 50) return '50K+'
  if (score > 10) return '10K+'
  return '5K+'
}

// ==================== AGGREGATED VIRAL CONTENT ====================
export interface ViralContent {
  id: string
  type: 'video' | 'article' | 'post' | 'trend'
  title: string
  description?: string
  thumbnail: string | null
  source: string
  platform: 'youtube' | 'reddit' | 'twitter' | 'tiktok' | 'news'
  url: string
  metrics: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
  }
  publishedAt: string
  viralScore: number
  embedUrl?: string
}

export async function fetchAllViralContent(country: string = 'US'): Promise<ViralContent[]> {
  const [youtube, reddit, hn] = await Promise.all([
    fetchYouTubeTrending(country),
    fetchRedditHot('popular'),
    fetchHackerNewsTop(),
  ])
  
  const content: ViralContent[] = []
  
  // Map YouTube videos
  youtube.forEach((video, i) => {
    content.push({
      id: `yt-${video.id}`,
      type: 'video',
      title: video.title,
      thumbnail: video.thumbnail,
      source: video.channelName,
      platform: 'youtube',
      url: `https://youtube.com/watch?v=${video.id}`,
      embedUrl: `https://www.youtube.com/embed/${video.id}`,
      metrics: { views: video.viewCount },
      publishedAt: video.publishedAt,
      viralScore: Math.max(95 - i * 3, 40),
    })
  })
  
  // Map Reddit posts
  reddit.forEach((post, i) => {
    content.push({
      id: `reddit-${post.id}`,
      type: post.isVideo ? 'video' : 'post',
      title: post.title,
      thumbnail: post.thumbnail,
      source: `r/${post.subreddit}`,
      platform: 'reddit',
      url: `https://reddit.com${post.url}`,
      embedUrl: post.videoUrl,
      metrics: { likes: post.score, comments: post.numComments },
      publishedAt: post.createdAt,
      viralScore: Math.max(90 - i * 2, 35),
    })
  })
  
  // Map HN stories
  hn.forEach((story, i) => {
    content.push({
      id: `hn-${story.id}`,
      type: 'article',
      title: story.title,
      thumbnail: null,
      source: 'Hacker News',
      platform: 'news',
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      metrics: { likes: story.score, comments: story.descendants },
      publishedAt: new Date(story.time * 1000).toISOString(),
      viralScore: Math.max(85 - i * 3, 30),
    })
  })
  
  // Sort by viral score
  return content.sort((a, b) => b.viralScore - a.viralScore)
}

// ==================== FALLBACK DATA ====================
function getFallbackYouTubeData(): YouTubeVideo[] {
  return [
    {
      id: 'dQw4w9WgXcQ',
      title: 'Trending Video #1',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      channelName: 'Trending Channel',
      viewCount: 1000000,
      publishedAt: new Date().toISOString(),
      duration: '3:32',
    },
  ]
}
