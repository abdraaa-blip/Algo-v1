import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getBaseUrl() {
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ success: false, error: 'CRON_SECRET is not configured' }, { status: 503 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(`${getBaseUrl()}/api/intelligence/ops-runbook`, {
      method: 'POST',
      headers: { authorization: `Bearer ${cronSecret}` },
      cache: 'no-store',
    })
    const json = await res.json()
    return NextResponse.json({
      success: true,
      runbook: json,
      triggeredAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to execute ops runbook' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
