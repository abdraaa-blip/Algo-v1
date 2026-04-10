import { NextRequest, NextResponse } from 'next/server'
import type { ActionProposal } from '@/lib/autonomy/types'
import { executeAutonomyProposal } from '@/lib/autonomy/executor'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { proposal?: ActionProposal }
    if (!body?.proposal) {
      return NextResponse.json({ success: false, error: 'proposal is required' }, { status: 400 })
    }
    const result = executeAutonomyProposal(body.proposal)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Execution failed' },
      { status: 500 }
    )
  }
}
