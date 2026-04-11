'use server'

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

// Types
interface Comment {
  id: string
  content_id: string
  user_id: string
  user_name: string
  user_avatar: string
  user_verified: boolean
  body: string
  created_at: string
  updated_at: string
  likes_count: number
  replies_count: number
  is_liked: boolean
  is_pinned: boolean
  sentiment: 'positive' | 'neutral' | 'negative'
  parent_id: string | null
  replies?: Comment[]
}

// Mock comments data
const MOCK_COMMENTS: Record<string, Comment[]> = {
  'content-1': [
    {
      id: 'comment-1',
      content_id: 'content-1',
      user_id: 'user-1',
      user_name: 'AlgoMaster',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoMaster',
      user_verified: true,
      body: 'Cette tendance va exploser dans les prochaines 24h, je le sens ! Les signaux sont tous au vert.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      likes_count: 234,
      replies_count: 12,
      is_liked: false,
      is_pinned: true,
      sentiment: 'positive',
      parent_id: null,
      replies: [
        {
          id: 'comment-1-1',
          content_id: 'content-1',
          user_id: 'user-2',
          user_name: 'TrendWatcher',
          user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TrendWatcher',
          user_verified: false,
          body: 'Totalement d\'accord ! J\'ai vu la meme chose sur TikTok ce matin.',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
          likes_count: 45,
          replies_count: 0,
          is_liked: true,
          is_pinned: false,
          sentiment: 'positive',
          parent_id: 'comment-1',
        },
      ],
    },
    {
      id: 'comment-2',
      content_id: 'content-1',
      user_id: 'user-3',
      user_name: 'ViralHunter',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ViralHunter',
      user_verified: false,
      body: 'Le timing est parfait pour poster maintenant. L\'algo de TikTok va pousser ce type de contenu toute la semaine.',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
      likes_count: 89,
      replies_count: 3,
      is_liked: false,
      is_pinned: false,
      sentiment: 'positive',
      parent_id: null,
    },
    {
      id: 'comment-3',
      content_id: 'content-1',
      user_id: 'user-4',
      user_name: 'Skeptic99',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Skeptic99',
      user_verified: false,
      body: 'Je suis pas convaincu... On a deja vu ce pattern la semaine derniere et ca n\'a pas pris.',
      created_at: new Date(Date.now() - 10800000).toISOString(),
      updated_at: new Date(Date.now() - 10800000).toISOString(),
      likes_count: 23,
      replies_count: 8,
      is_liked: false,
      is_pinned: false,
      sentiment: 'negative',
      parent_id: null,
    },
  ],
}

// Spam detection patterns
const SPAM_PATTERNS = [
  /buy now/i,
  /click here/i,
  /free money/i,
  /subscribe to my/i,
  /follow me at/i,
  /check out my/i,
  /\b(http|https):\/\/[^\s]+/g, // URLs
  /(.)\1{5,}/, // Repeated characters
]

function isSpam(text: string): boolean {
  return SPAM_PATTERNS.some(pattern => pattern.test(text))
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['super', 'genial', 'incroyable', 'top', 'parfait', 'excellent', 'bravo', 'love', 'amazing', 'great', 'awesome']
  const negativeWords = ['nul', 'mauvais', 'horrible', 'terrible', 'faux', 'fake', 'spam', 'arnaque', 'bad', 'worst', 'hate']
  
  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-comments-get:${identifier}`, { limit: 90, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const contentId = searchParams.get('content_id')
  const sortBy = searchParams.get('sort') || 'newest'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!contentId) {
    return NextResponse.json({ error: 'content_id is required' }, { status: 400 })
  }

  let comments = MOCK_COMMENTS[contentId] || []

  // Sort comments
  switch (sortBy) {
    case 'newest':
      comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
    case 'oldest':
      comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      break
    case 'top':
      comments.sort((a, b) => b.likes_count - a.likes_count)
      break
    case 'controversial':
      comments.sort((a, b) => b.replies_count - a.replies_count)
      break
  }

  // Pinned comments always first
  const pinned = comments.filter(c => c.is_pinned)
  const unpinned = comments.filter(c => !c.is_pinned)
  comments = [...pinned, ...unpinned]

  // Pagination
  const start = (page - 1) * limit
  const paginatedComments = comments.slice(start, start + limit)

  return NextResponse.json({
    comments: paginatedComments,
    meta: {
      total: comments.length,
      page,
      limit,
      hasMore: start + limit < comments.length,
    },
  })
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-comments-post:${identifier}`, { limit: 24, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = await request.json()
    const { content_id, body: commentBody, parent_id } = body

    // Validation
    if (!content_id || !commentBody) {
      return NextResponse.json({ error: 'content_id and body are required' }, { status: 400 })
    }

    if (commentBody.length < 2) {
      return NextResponse.json({ error: 'Comment too short' }, { status: 400 })
    }

    if (commentBody.length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 characters)' }, { status: 400 })
    }

    // Spam check
    if (isSpam(commentBody)) {
      return NextResponse.json({ error: 'Comment detected as spam' }, { status: 400 })
    }

    // Create new comment
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      content_id,
      user_id: 'current-user',
      user_name: 'You',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      user_verified: false,
      body: commentBody,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      replies_count: 0,
      is_liked: false,
      is_pinned: false,
      sentiment: analyzeSentiment(commentBody),
      parent_id: parent_id || null,
    }

    return NextResponse.json({
      comment: newComment,
      message: 'Comment posted successfully',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
}
