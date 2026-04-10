import { NextRequest, NextResponse } from 'next/server'

interface ReportBody {
  contentId: string
  contentType: 'trend' | 'video' | 'news' | 'star' | 'comment'
  reason: string
  additionalInfo?: string
  userId?: string
}

// Store reports (in production, use database)
const reports: Array<ReportBody & { id: string; createdAt: string; status: 'pending' | 'reviewed' | 'resolved' }> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReportBody

    // Validate required fields
    if (!body.contentId || !body.contentType || !body.reason) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, contentType, reason' },
        { status: 400 }
      )
    }

    // Validate content type
    const validTypes = ['trend', 'video', 'news', 'star', 'comment']
    if (!validTypes.includes(body.contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Validate reason
    const validReasons = ['broken', 'inappropriate', 'spam', 'outdated', 'other']
    if (!validReasons.includes(body.reason)) {
      return NextResponse.json(
        { error: 'Invalid reason' },
        { status: 400 }
      )
    }

    // Create report
    const report = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
    }

    reports.push(report)

    // In production: 
    // - Save to database
    // - Send notification to moderation team
    // - Log for analytics
    if (process.env.NODE_ENV === 'development') {
      console.log('[ALGO Report]', {
        id: report.id,
        contentId: report.contentId,
        contentType: report.contentType,
        reason: report.reason,
      })
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully',
    })
  } catch (error) {
    console.error('[ALGO Report Error]', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')

  let filteredReports = [...reports]

  if (status) {
    filteredReports = filteredReports.filter(r => r.status === status)
  }

  return NextResponse.json({
    reports: filteredReports.slice(0, limit),
    total: filteredReports.length,
  })
}
