import { NextRequest, NextResponse } from 'next/server'
import { getAutonomyCounters } from '@/lib/autonomy/telemetry'
import { getAutonomyPolicy, updateAutonomyPolicy } from '@/lib/autonomy/policy'
import {
  addLearningHistoryEntry,
  getLearningHistory,
  persistLearningHistoryEntry,
} from '@/lib/autonomy/learning-history'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  void _request
  const counters = getAutonomyCounters()
  const policy = getAutonomyPolicy()
  const totalFeedback = counters.feedbackHelpful + counters.feedbackWrong + counters.feedbackNeutral

  if (totalFeedback < 5) {
    const entry = addLearningHistoryEntry({
      applied: false,
      previousMinConfidence: policy.minConfidenceForAuto,
      nextMinConfidence: policy.minConfidenceForAuto,
      helpfulRatio: counters.feedbackHelpful / Math.max(1, totalFeedback),
      wrongRatio: counters.feedbackWrong / Math.max(1, totalFeedback),
      totalFeedback,
      note: 'Not enough feedback for stable online adjustment',
    })
    void persistLearningHistoryEntry(entry)
    return NextResponse.json({
      success: true,
      learningApplied: false,
      reason: 'Not enough feedback for stable online adjustment',
      policy,
      counters,
      history: getLearningHistory(1),
    })
  }

  const helpfulRatio = counters.feedbackHelpful / Math.max(1, totalFeedback)
  const wrongRatio = counters.feedbackWrong / Math.max(1, totalFeedback)
  let target = policy.minConfidenceForAuto

  if (helpfulRatio >= 0.65 && wrongRatio <= 0.2) {
    target = Math.max(0.55, policy.minConfidenceForAuto - 0.02)
  } else if (wrongRatio >= 0.35) {
    target = Math.min(0.9, policy.minConfidenceForAuto + 0.03)
  }

  const autoGuardEnabled = process.env.ALGO_AUTONOMY_AUTO_GUARD !== '0'
  let safetyAction: 'none' | 'advisory_lock' | 'hard_kill' = 'none'
  const patch: {
    minConfidenceForAuto: number
    mode?: 'advisory' | 'guarded_auto' | 'manual_only'
    killSwitch?: boolean
  } = { minConfidenceForAuto: target }

  // Drift guardrail: partial lock first, full stop only on critical sustained wrong feedback.
  if (autoGuardEnabled && totalFeedback >= 10 && wrongRatio >= 0.45) {
    patch.mode = 'advisory'
    patch.minConfidenceForAuto = Math.max(0.85, patch.minConfidenceForAuto)
    safetyAction = 'advisory_lock'
  }
  if (autoGuardEnabled && totalFeedback >= 15 && wrongRatio >= 0.55) {
    patch.killSwitch = true
    safetyAction = 'hard_kill'
  }

  const next = updateAutonomyPolicy(patch)
  const entry = addLearningHistoryEntry({
    applied: target !== policy.minConfidenceForAuto,
    previousMinConfidence: policy.minConfidenceForAuto,
    nextMinConfidence: next.minConfidenceForAuto,
    helpfulRatio,
    wrongRatio,
    totalFeedback,
    note:
      target !== policy.minConfidenceForAuto
        ? 'Policy threshold recalibrated from feedback loop'
        : 'No policy change after recalibration',
  })
  void persistLearningHistoryEntry(entry)
  return NextResponse.json({
    success: true,
    learningApplied: target !== policy.minConfidenceForAuto,
    policy: next,
    counters,
    diagnostics: {
      helpfulRatio,
      wrongRatio,
      totalFeedback,
      safetyAction,
      autoGuardEnabled,
    },
    history: getLearningHistory(20),
  })
}
