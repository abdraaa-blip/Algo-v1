import { NextRequest, NextResponse } from 'next/server'
import { parseDefaultedListLimit } from '@/lib/api/query-limit'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'

/**
 * GitHub Trending API - Fetches trending repositories
 * Scrapes GitHub trending page (no official API for trending)
 */

interface TrendingRepo {
  id: string
  name: string
  fullName: string
  description: string
  language: string
  stars: number
  starsToday: number
  forks: number
  url: string
  owner: {
    name: string
    avatar: string
  }
}

// Language colors for display
const LANGUAGE_COLORS: Record<string, string> = {
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Python': '#3572A5',
  'Java': '#b07219',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'C++': '#f34b7d',
  'C': '#555555',
  'Ruby': '#701516',
  'PHP': '#4F5D95',
  'Swift': '#F05138',
  'Kotlin': '#A97BFF',
  'Dart': '#00B4AB',
  'C#': '#178600',
  'Shell': '#89e051',
}

async function fetchTrendingRepos(language?: string, since: string = 'daily'): Promise<TrendingRepo[]> {
  try {
    // Use GitHub's unofficial trending API endpoint
    const langParam = language ? `&language=${encodeURIComponent(language)}` : ''
    const url = `https://api.gitterapp.com/repositories?since=${since}${langParam}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 } // 30 min cache
    })

    if (!response.ok) {
      // Fallback to scraping if gitterapp is down
      return await scrapeTrending(language, since)
    }

    const repos = await response.json()
    return repos.map((repo: {
      author: string
      name: string
      description: string
      language: string
      stars: number
      currentPeriodStars: number
      forks: number
      url: string
      avatar: string
    }) => ({
      id: `${repo.author}/${repo.name}`,
      name: repo.name,
      fullName: `${repo.author}/${repo.name}`,
      description: repo.description || '',
      language: repo.language || 'Unknown',
      stars: repo.stars,
      starsToday: repo.currentPeriodStars || 0,
      forks: repo.forks,
      url: repo.url,
      owner: {
        name: repo.author,
        avatar: repo.avatar
      }
    }))
  } catch (error) {
    console.error('[ALGO GitHub] Failed to fetch trending:', error)
    return await scrapeTrending(language, since)
  }
}

async function scrapeTrending(language?: string, since: string = 'daily'): Promise<TrendingRepo[]> {
  try {
    const langPath = language ? `/${encodeURIComponent(language)}` : ''
    const url = `https://github.com/trending${langPath}?since=${since}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 ALGO Bot'
      },
      next: { revalidate: 1800 }
    })

    if (!response.ok) {
      throw new Error(`GitHub scrape failed: ${response.status}`)
    }

    const html = await response.text()
    
    // Simple regex parsing for repo data
    const repos: TrendingRepo[] = []
    const repoPattern = /href="\/([^/]+\/[^"]+)"[^>]*>[\s\S]*?<p class="[^"]*">([\s\S]*?)<\/p>/g
    let match

    while ((match = repoPattern.exec(html)) !== null && repos.length < 25) {
      const [, fullName, description] = match
      if (fullName && !fullName.includes('/trending')) {
        const [owner, name] = fullName.split('/')
        repos.push({
          id: fullName,
          name,
          fullName,
          description: description?.trim() || '',
          language: 'Unknown',
          stars: 0,
          starsToday: 0,
          forks: 0,
          url: `https://github.com/${fullName}`,
          owner: {
            name: owner,
            avatar: `https://github.com/${owner}.png`
          }
        })
      }
    }

    return repos
  } catch (error) {
    console.error('[ALGO GitHub] Scraping failed:', error)
    return FALLBACK_REPOS
  }
}

// Fallback trending repos
const FALLBACK_REPOS: TrendingRepo[] = [
  { id: 'openai/openai-cookbook', name: 'openai-cookbook', fullName: 'openai/openai-cookbook', description: 'Examples and guides for using the OpenAI API', language: 'Python', stars: 58000, starsToday: 245, forks: 9200, url: 'https://github.com/openai/openai-cookbook', owner: { name: 'openai', avatar: 'https://github.com/openai.png' } },
  { id: 'vercel/ai', name: 'ai', fullName: 'vercel/ai', description: 'Build AI-powered applications with React, Svelte, Vue, and Solid', language: 'TypeScript', stars: 42000, starsToday: 180, forks: 5800, url: 'https://github.com/vercel/ai', owner: { name: 'vercel', avatar: 'https://github.com/vercel.png' } },
  { id: 'anthropics/anthropic-cookbook', name: 'anthropic-cookbook', fullName: 'anthropics/anthropic-cookbook', description: 'A collection of notebooks/recipes showcasing some fun and effective ways of using Claude', language: 'Jupyter Notebook', stars: 12000, starsToday: 156, forks: 1200, url: 'https://github.com/anthropics/anthropic-cookbook', owner: { name: 'anthropics', avatar: 'https://github.com/anthropics.png' } },
  { id: 'langchain-ai/langchain', name: 'langchain', fullName: 'langchain-ai/langchain', description: 'Building applications with LLMs through composability', language: 'Python', stars: 92000, starsToday: 134, forks: 14500, url: 'https://github.com/langchain-ai/langchain', owner: { name: 'langchain-ai', avatar: 'https://github.com/langchain-ai.png' } },
  { id: 'microsoft/generative-ai-for-beginners', name: 'generative-ai-for-beginners', fullName: 'microsoft/generative-ai-for-beginners', description: '21 Lessons, Get Started Building with Generative AI', language: 'Jupyter Notebook', stars: 65000, starsToday: 120, forks: 33000, url: 'https://github.com/microsoft/generative-ai-for-beginners', owner: { name: 'microsoft', avatar: 'https://github.com/microsoft.png' } },
]

function calculateViralScore(repo: TrendingRepo): number {
  // Viral score based on stars today and total stars ratio
  const velocityScore = Math.min(50, repo.starsToday / 5) // Max 50 from velocity
  const popularityScore = Math.min(30, Math.log10(repo.stars + 1) * 5) // Max 30 from popularity
  const momentumScore = Math.min(20, (repo.starsToday / Math.max(repo.stars, 1)) * 1000) // Max 20 from momentum
  
  return Math.round(velocityScore + popularityScore + momentumScore)
}

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(identifier, { limit: 30, windowMs: 60000 })
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(req.url)
  const language = searchParams.get('language') || undefined
  const since = searchParams.get('since') || 'daily' // daily, weekly, monthly
  const limit = parseDefaultedListLimit(searchParams.get('limit'), 20, 50)

  try {
    const repos = await fetchTrendingRepos(language, since)
    
    const data = repos.slice(0, limit).map((repo, i) => ({
      id: `github_${repo.id.replace('/', '_')}`,
      rank: i + 1,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      language: repo.language,
      languageColor: LANGUAGE_COLORS[repo.language] || '#858585',
      stars: repo.stars,
      starsToday: repo.starsToday,
      forks: repo.forks,
      url: repo.url,
      owner: repo.owner,
      viralScore: calculateViralScore(repo),
      platform: 'github',
      type: 'repository'
    }))

    return NextResponse.json({
      success: true,
      data,
      fetchedAt: new Date().toISOString(),
      source: repos === FALLBACK_REPOS ? 'fallback' : 'live',
      count: data.length,
      language: language || 'all',
      period: since
    }, { headers: createRateLimitHeaders(rateLimit) })
  } catch (error) {
    console.error('[ALGO GitHub] API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch GitHub data',
      data: FALLBACK_REPOS.slice(0, limit).map((r, i) => ({
        ...r,
        id: `github_${r.id.replace('/', '_')}`,
        rank: i + 1,
        viralScore: calculateViralScore(r),
        platform: 'github'
      })),
      source: 'fallback'
    }, { status: 500 })
  }
}
