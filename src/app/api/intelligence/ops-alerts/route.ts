import { NextResponse } from 'next/server'
import { collectOpsStatus } from '@/lib/intelligence/ops-alerts'

export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = collectOpsStatus()

  return NextResponse.json({
    success: true,
    ...snapshot,
  })
}
