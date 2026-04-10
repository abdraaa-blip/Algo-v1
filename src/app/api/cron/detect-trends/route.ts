import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { clusterTrends } from '@/lib/ai/algo-brain'
import { getSupabaseSecretApiKey, getSupabaseUrl } from '@/lib/supabase/env-keys'

/**
 * Automated Trend Detection
 * Runs every 30 minutes via Vercel Cron
 * 
 * Pipeline steps:
 * 1. Analyze database for emerging clusters
 * 2. Create or update trend entities
 * 3. Retire trends when content pool stops growing
 */

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = getSupabaseSecretApiKey()
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL et clé secrète (SERVICE_ROLE ou SUPABASE_SECRET_KEY) requis')
  }
  return createClient(supabaseUrl, supabaseKey)
}

interface TrendEntity {
  id: string
  name: string
  description: string
  status: 'emerging' | 'growing' | 'mainstream' | 'declining' | 'retired'
  contentCount: number
  avgViralScore: number
  firstDetected: string
  lastUpdated: string
  relatedKeywords: string[]
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  console.log('[ALGO Cron] Starting trend detection...')

  try {
    // Fetch recent trending content from various sources
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'

    const [trendsRes, newsRes, videosRes] = await Promise.all([
      fetch(`${baseUrl}/api/live-trends?limit=50`, { next: { revalidate: 0 } }),
      fetch(`${baseUrl}/api/live-news?limit=50`, { next: { revalidate: 0 } }),
      fetch(`${baseUrl}/api/live-videos?limit=50`, { next: { revalidate: 0 } }),
    ])

    const [trendsData, newsData, videosData] = await Promise.all([
      trendsRes.json(),
      newsRes.json(),
      videosRes.json(),
    ])

    // Combine all content for clustering
    const allContent = [
      ...(trendsData.data || []).map((t: { title: string; viralScore?: number }) => ({
        title: t.title,
        category: 'trends',
        viralScore: t.viralScore || 70,
      })),
      ...(newsData.data || []).map((n: { title: string; viralScore?: number }) => ({
        title: n.title,
        category: 'news',
        viralScore: n.viralScore || 60,
      })),
      ...(videosData.data || []).map((v: { title: string; viralScore?: number }) => ({
        title: v.title,
        category: 'videos',
        viralScore: v.viralScore || 65,
      })),
    ]

    // Cluster trends using AI
    const clusters = await clusterTrends(allContent)
    
    console.log(`[ALGO Cron] Detected ${clusters.length} trend clusters`)

    // Store detected trends
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    const detectedTrends: TrendEntity[] = clusters.map((cluster, i) => ({
      id: cluster.id || `trend_${Date.now()}_${i}`,
      name: cluster.name,
      description: cluster.description,
      status: cluster.evolutionStage === 'emerging' ? 'emerging' :
              cluster.evolutionStage === 'growing' ? 'growing' :
              cluster.evolutionStage === 'mainstream' ? 'mainstream' :
              'declining',
      contentCount: allContent.filter(c => 
        c.title.toLowerCase().includes(cluster.name.toLowerCase().split(' ')[0])
      ).length,
      avgViralScore: Math.round(
        allContent
          .filter(c => c.title.toLowerCase().includes(cluster.name.toLowerCase().split(' ')[0]))
          .reduce((acc, c) => acc + c.viralScore, 0) / 
        Math.max(1, allContent.filter(c => c.title.toLowerCase().includes(cluster.name.toLowerCase().split(' ')[0])).length)
      ),
      firstDetected: now,
      lastUpdated: now,
      relatedKeywords: cluster.name.toLowerCase().split(' ').filter(w => w.length > 3),
    }))

    // Upsert trends to database
    const { error: upsertError } = await supabase
      .from('detected_trends')
      .upsert(
        detectedTrends.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          status: t.status,
          content_count: t.contentCount,
          avg_viral_score: t.avgViralScore,
          first_detected: t.firstDetected,
          last_updated: t.lastUpdated,
          related_keywords: t.relatedKeywords,
        })),
        { onConflict: 'id' }
      )

    if (upsertError) {
      console.warn('[ALGO Cron] Failed to store trends:', upsertError.message)
    }

    const executionTime = Date.now() - startTime
    console.log(`[ALGO Cron] Trend detection completed in ${executionTime}ms`)

    return NextResponse.json({
      success: true,
      trendsDetected: detectedTrends.length,
      trends: detectedTrends.slice(0, 10), // Return top 10
      executionTimeMs: executionTime,
    })
  } catch (error) {
    console.error('[ALGO Cron] Trend detection failed:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
