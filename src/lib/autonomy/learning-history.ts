import { createClient } from '@supabase/supabase-js'
import { getSupabaseSecretApiKey, getSupabaseUrl } from '@/lib/supabase/env-keys'

export interface LearningHistoryEntry {
  id: string
  at: string
  applied: boolean
  previousMinConfidence: number
  nextMinConfidence: number
  helpfulRatio: number
  wrongRatio: number
  totalFeedback: number
  note: string
}

const learningHistory: LearningHistoryEntry[] = []
const HISTORY_LIMIT = 1000

function getSupabaseClient() {
  const url = getSupabaseUrl()
  const serviceRole = getSupabaseSecretApiKey()
  if (!url || !serviceRole) return null
  return createClient(url, serviceRole)
}

export function addLearningHistoryEntry(
  entry: Omit<LearningHistoryEntry, 'id' | 'at'>
): LearningHistoryEntry {
  const full: LearningHistoryEntry = {
    id: `learn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...entry,
  }
  learningHistory.push(full)
  if (learningHistory.length > HISTORY_LIMIT) {
    learningHistory.splice(0, learningHistory.length - HISTORY_LIMIT)
  }
  return full
}

export function getLearningHistory(limit = 100): LearningHistoryEntry[] {
  const size = Math.max(1, Math.min(500, limit))
  return learningHistory.slice(-size).reverse()
}

export async function persistLearningHistoryEntry(entry: LearningHistoryEntry): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  // Try dedicated table first. If not available, degrade gracefully to analytics events.
  const { error } = await supabase.from('autonomy_learning_logs').insert({
    id: entry.id,
    at: entry.at,
    applied: entry.applied,
    previous_min_confidence: entry.previousMinConfidence,
    next_min_confidence: entry.nextMinConfidence,
    helpful_ratio: entry.helpfulRatio,
    wrong_ratio: entry.wrongRatio,
    total_feedback: entry.totalFeedback,
    note: entry.note,
  })

  if (!error) return

  await supabase.from('analytics_events').insert({
    event_type: 'autonomy_learning',
    event_name: 'policy_recalibration',
    page_path: '/intelligence',
    properties: entry,
  })
}
