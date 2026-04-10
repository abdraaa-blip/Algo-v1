'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Trophy, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/useHaptic'

interface PredictionItem {
  id: string
  title: string
  thumbnail?: string
  currentScore: number
  category: string
}

interface Prediction {
  itemId: string
  prediction: 'viral' | 'flop'
  timestamp: Date
  resolved?: boolean
  correct?: boolean
}

interface ViralPredictionGameProps {
  items: PredictionItem[]
  className?: string
}

export function ViralPredictionGame({ items, className }: ViralPredictionGameProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [currentItem, setCurrentItem] = useState<PredictionItem | null>(null)
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 })
  const [showResult, setShowResult] = useState<{ correct: boolean; xp: number } | null>(null)
  const { trigger } = useHaptic()

  // Pick a random unpredicted item
  useEffect(() => {
    const predictedIds = new Set(predictions.map(p => p.itemId))
    const available = items.filter(item => !predictedIds.has(item.id))
    
    if (available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length)
      setCurrentItem(available[randomIndex] || null)
    } else {
      setCurrentItem(null)
    }
  }, [items, predictions])

  const handlePrediction = (prediction: 'viral' | 'flop') => {
    if (!currentItem) return
    trigger('medium')

    // Simulate result (in production, this would be resolved later)
    const isCorrect = Math.random() > 0.4 // 60% success rate for engagement
    const xpEarned = isCorrect ? (prediction === 'viral' ? 50 : 75) : 0

    setPredictions(prev => [...prev, {
      itemId: currentItem.id,
      prediction,
      timestamp: new Date(),
      resolved: true,
      correct: isCorrect
    }])

    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: isCorrect ? prev.streak + 1 : 0
    }))

    setShowResult({ correct: isCorrect, xp: xpEarned })
    setTimeout(() => setShowResult(null), 2000)
  }

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0

  return (
    <div className={cn(
      'rounded-2xl overflow-hidden',
      'bg-gradient-to-br from-[#1a1a1f] to-[#0f0f12]',
      'border border-[var(--color-border)]',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <TrendingUp className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Viral or Flop?</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Predict what will trend</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3">
            {stats.streak >= 3 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">
                <Sparkles className="size-3" />
                <span className="text-xs font-medium">{stats.streak} streak</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{accuracy}%</p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Card */}
      <div className="p-4">
        {currentItem ? (
          <div className="relative">
            {/* Result overlay */}
            {showResult && (
              <div className={cn(
                'absolute inset-0 z-10 flex items-center justify-center rounded-xl',
                'backdrop-blur-sm',
                showResult.correct ? 'bg-emerald-500/20' : 'bg-red-500/20'
              )}>
                <div className="text-center">
                  {showResult.correct ? (
                    <>
                      <CheckCircle2 className="size-12 text-emerald-400 mx-auto mb-2" />
                      <p className="text-lg font-bold text-emerald-400">Correct!</p>
                      <p className="text-sm text-emerald-300">+{showResult.xp} XP</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-12 text-red-400 mx-auto mb-2" />
                      <p className="text-lg font-bold text-red-400">Wrong!</p>
                      <p className="text-sm text-red-300">Try again</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Content preview */}
            <div className="p-4 rounded-xl bg-[var(--color-card)] mb-4">
              <div className="flex items-start gap-4">
                {currentItem.thumbnail && (
                  <div className="size-16 rounded-lg bg-[var(--color-card-hover)] overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element -- URL dynamiques externes, pas de domaine fixe */}
                    <img
                      src={currentItem.thumbnail}
                      alt={`Preview for ${currentItem.title}`}
                      className="size-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-violet-400 bg-violet-500/20 rounded mb-1.5">
                    {currentItem.category}
                  </span>
                  <h4 className="text-sm font-medium text-white line-clamp-2">
                    {currentItem.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                      <TrendingUp className="size-3" />
                      <span>Score: {currentItem.currentScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePrediction('viral')}
                disabled={!!showResult}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl',
                  'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10',
                  'border border-emerald-500/30',
                  'hover:from-emerald-500/30 hover:to-emerald-600/20',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <TrendingUp className="size-8 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Viral</span>
                <span className="text-[10px] text-emerald-400/60">+50 XP</span>
              </button>

              <button
                onClick={() => handlePrediction('flop')}
                disabled={!!showResult}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl',
                  'bg-gradient-to-br from-red-500/20 to-red-600/10',
                  'border border-red-500/30',
                  'hover:from-red-500/30 hover:to-red-600/20',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <TrendingDown className="size-8 text-red-400" />
                <span className="text-sm font-semibold text-red-400">Flop</span>
                <span className="text-[10px] text-red-400/60">+75 XP</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Trophy className="size-12 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-white">All caught up!</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Check back later for more predictions</p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)]">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{stats.correct}</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{stats.total}</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-400">{stats.streak}</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">Streak</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-violet-400">{stats.correct * 50}</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">XP Earned</p>
          </div>
        </div>
      </div>
    </div>
  )
}
