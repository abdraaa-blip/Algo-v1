import { NextRequest, NextResponse } from 'next/server'
import { parseDefaultedListLimit } from '@/lib/api/query-limit'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'

/**
 * Reddit API - Fetches trending posts from top subreddits
 * Uses Reddit's public JSON API (no auth required for read-only)
 */

interface RedditPost {
  id: string
  title: string
  subreddit: string
  author: string
  score: number
  upvote_ratio: number
  num_comments: number
  created_utc: number
  url: string
  permalink: string
  thumbnail: string
  selftext: string
  is_video: boolean
  over_18: boolean
}

interface RedditApiResponse {
  data: {
    children: Array<{
      data: RedditPost
    }>
  }
}

// Top subreddits for trending content by category
const TRENDING_SUBREDDITS = {
  tech: ['technology', 'programming', 'webdev', 'artificial', 'MachineLearning'],
  entertainment: ['movies', 'television', 'Music', 'gaming', 'anime'],
  news: ['worldnews', 'news', 'politics', 'science', 'space'],
  culture: ['memes', 'dankmemes', 'funny', 'interestingasfuck', 'todayilearned'],
  viral: ['all', 'popular', 'videos', 'pics', 'gifs']
}

async function fetchSubreddit(subreddit: string, sort: 'hot' | 'rising' | 'top' = 'hot'): Promise<RedditPost[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=10&raw_json=1`,
      {
        headers: {
          'User-Agent': 'ALGO:v1.0.0 (by /u/algo_trends)',
        },
        next: { revalidate: 300 } // 5 min cache
      }
    )

    if (!response.ok) {
      console.error(`[ALGO Reddit] Failed to fetch r/${subreddit}: ${response.status}`)
      return []
    }

    const data: RedditApiResponse = await response.json()
    return data.data.children
      .map(child => child.data)
      .filter(post => !post.over_18) // Filter NSFW
  } catch (error) {
    console.error(`[ALGO Reddit] Error fetching r/${subreddit}:`, error)
    return []
  }
}

function calculateViralScore(post: RedditPost): number {
  const ageHours = (Date.now() / 1000 - post.created_utc) / 3600
  const scoreVelocity = post.score / Math.max(ageHours, 0.1)
  const engagementRate = post.num_comments / Math.max(post.score, 1)
  const upvoteBonus = post.upvote_ratio > 0.9 ? 1.2 : post.upvote_ratio > 0.8 ? 1.1 : 1.0
  
  // Normalize to 0-100 scale
  const rawScore = (scoreVelocity * 0.4 + engagementRate * 100 * 0.3 + post.score / 1000 * 0.3) * upvoteBonus
  return Math.min(100, Math.round(rawScore))
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
  const category = (searchParams.get('category') || 'viral') as keyof typeof TRENDING_SUBREDDITS
  const sort = (searchParams.get('sort') || 'hot') as 'hot' | 'rising' | 'top'
  const limit = parseDefaultedListLimit(searchParams.get('limit'), 20, 50)

  const subreddits = TRENDING_SUBREDDITS[category] || TRENDING_SUBREDDITS.viral

  try {
    // Fetch from multiple subreddits in parallel
    const results = await Promise.all(
      subreddits.map(sub => fetchSubreddit(sub, sort))
    )

    // Flatten, dedupe by ID, sort by viral score
    const allPosts = results.flat()
    const uniquePosts = Array.from(
      new Map(allPosts.map(p => [p.id, p])).values()
    )

    const scoredPosts = uniquePosts
      .map(post => ({
        id: `reddit_${post.id}`,
        title: post.title,
        description: post.selftext?.slice(0, 200) || '',
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        upvoteRatio: post.upvote_ratio,
        comments: post.num_comments,
        createdAt: new Date(post.created_utc * 1000).toISOString(),
        url: `https://reddit.com${post.permalink}`,
        thumbnail: post.thumbnail?.startsWith('http') ? post.thumbnail : null,
        isVideo: post.is_video,
        viralScore: calculateViralScore(post),
        platform: 'reddit' as const,
        category
      }))
      .sort((a, b) => b.viralScore - a.viralScore)
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: scoredPosts,
      fetchedAt: new Date().toISOString(),
      source: 'live',
      count: scoredPosts.length
    }, { headers: createRateLimitHeaders(rateLimit) })
  } catch (error) {
    console.error('[ALGO Reddit] API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Reddit data',
      data: [],
      source: 'error'
    }, { status: 500 })
  }
}
