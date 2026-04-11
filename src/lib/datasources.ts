/**
 * ALGO Data Sources - External API Connectors
 */

export interface SourceStatus {
  name: string
  status: 'live' | 'cached' | 'error' | 'offline'
  lastUpdate: number
  count: number
}

const statuses = new Map<string, SourceStatus>()

export function getSourceStatuses(): SourceStatus[] {
  return Array.from(statuses.values())
}

function setStatus(id: string, s: Partial<SourceStatus>) {
  const current = statuses.get(id) || { name: id, status: 'offline' as const, lastUpdate: 0, count: 0 }
  statuses.set(id, { ...current, ...s, lastUpdate: Date.now() })
}

export async function fetchYouTubeTrending(country = 'US') {
  // Use YouTube Data API directly (faster and more reliable than Invidious)
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) {
    setStatus('youtube', { name: 'YouTube', status: 'offline', count: 0 })
    return []
  }
  
  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${country}&maxResults=10&key=${apiKey}`,
      { signal: AbortSignal.timeout(3000) }
    )
    
    if (!r.ok) throw new Error('YouTube API error')
    
    const data = await r.json()
    setStatus('youtube', { name: 'YouTube', status: 'live', count: data.items?.length || 0 })
    
    return (data.items || []).map((v: { id: string; snippet: { title: string; thumbnails: { high?: { url: string } }; channelTitle: string; publishedAt: string }; statistics: { viewCount?: string } }) => ({
      id: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails.high?.url || '',
      channel: v.snippet.channelTitle,
      views: parseInt(v.statistics.viewCount || '0', 10),
      published: new Date(v.snippet.publishedAt).getTime() / 1000
    }))
  } catch {
    setStatus('youtube', { name: 'YouTube', status: 'error', count: 0 })
    return []
  }
}

export async function fetchRedditHot() {
  // Reddit blocks server-side requests with 403
  // Return empty and mark as offline to avoid slow timeouts
  setStatus('reddit', { name: 'Reddit', status: 'offline', count: 0 })
  return []
}

export async function fetchHackerNews() {
  try {
    const r = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: AbortSignal.timeout(5000) })
    if (!r.ok) throw new Error('HN error')
    
    const ids = await r.json()
    
    // Fetch items in PARALLEL (not sequential) - much faster!
    const itemPromises = ids.slice(0, 10).map(async (id: number) => {
      try {
        const sr = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(3000) })
        if (sr.ok) {
          const s = await sr.json()
          return { id: s.id, title: s.title, url: s.url || `https://news.ycombinator.com/item?id=${s.id}`, score: s.score, by: s.by }
        }
        return null
      } catch { return null }
    })
    
    const results = await Promise.all(itemPromises)
    const items = results.filter((item): item is { id: number; title: string; url: string; score: number; by: string } => item !== null)
    
    setStatus('hackernews', { name: 'Hacker News', status: 'live', count: items.length })
    return items
  } catch {
    setStatus('hackernews', { name: 'Hacker News', status: 'error', count: 0 })
    return []
  }
}

export async function fetchGitHubTrending() {
  try {
    const r = await fetch('https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc&per_page=15', {
      signal: AbortSignal.timeout(5000),
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
    if (!r.ok) throw new Error('GH error')
    
    const j = await r.json()
    const items = j.items.map((x: { id: number; full_name: string; description: string; html_url: string; stargazers_count: number; language: string }) => ({
      id: x.id, name: x.full_name, description: x.description || '', url: x.html_url, stars: x.stargazers_count, language: x.language || 'Unknown'
    }))
    
    setStatus('github', { name: 'GitHub', status: 'live', count: items.length })
    return items
  } catch {
    setStatus('github', { name: 'GitHub', status: 'error', count: 0 })
    return []
  }
}

export async function fetchAllSources() {
  const [yt, rd, hn, gh] = await Promise.allSettled([fetchYouTubeTrending(), fetchRedditHot(), fetchHackerNews(), fetchGitHubTrending()])
  return {
    youtube: yt.status === 'fulfilled' ? yt.value : [],
    reddit: rd.status === 'fulfilled' ? rd.value : [],
    hackernews: hn.status === 'fulfilled' ? hn.value : [],
    github: gh.status === 'fulfilled' ? gh.value : [],
    statuses: getSourceStatuses()
  }
}
