import { NextRequest, NextResponse } from 'next/server'
import { getAutonomyPolicy, updateAutonomyPolicy } from '@/lib/autonomy/policy'
import { getAutonomyCounters } from '@/lib/autonomy/telemetry'

export const dynamic = 'force-dynamic'

function requireOpsToken(request: NextRequest): NextResponse | null {
  const expectedToken = process.env.INTELLIGENCE_DASHBOARD_TOKEN
  if (!expectedToken) {
    return NextResponse.json(
      { success: false, error: 'INTELLIGENCE_DASHBOARD_TOKEN is not configured' },
      { status: 503 }
    )
  }
  const provided =
    request.headers.get('x-intelligence-ops-token') ||
    request.cookies.get('intelligence_ops_token')?.value ||
    null
  if (!provided || provided !== expectedToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET() {
  return NextResponse.json({
    success: true,
    policy: getAutonomyPolicy(),
    counters: getAutonomyCounters(),
    updatedAt: new Date().toISOString(),
  })
}

export async function PATCH(request: NextRequest) {
  const unauthorized = requireOpsToken(request)
  if (unauthorized) return unauthorized
  try {
    const body = (await request.json()) as {
      mode?: 'advisory' | 'guarded_auto' | 'manual_only'
      killSwitch?: boolean
      minConfidenceForAuto?: number
    }
    const policy = updateAutonomyPolicy({
      ...(body.mode ? { mode: body.mode } : {}),
      ...(typeof body.killSwitch === 'boolean' ? { killSwitch: body.killSwitch } : {}),
      ...(typeof body.minConfidenceForAuto === 'number' ? { minConfidenceForAuto: body.minConfidenceForAuto } : {}),
    })
    return NextResponse.json({ success: true, policy })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Invalid payload' },
      { status: 400 }
    )
  }
}
