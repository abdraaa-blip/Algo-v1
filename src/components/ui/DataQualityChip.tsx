'use client'

import { cn } from '@/lib/utils'

interface DataQualityChipProps {
  source: string
  freshness: string
  confidence: 'high' | 'medium' | 'low'
  className?: string
}

export function DataQualityChip({ source, freshness, confidence, className }: DataQualityChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/70',
        className
      )}
    >
      <span>source: {source}</span>
      <span className="text-white/30">|</span>
      <span>freshness: {freshness}</span>
      <span className="text-white/30">|</span>
      <span
        className={cn(
          confidence === 'high' && 'text-emerald-300',
          confidence === 'medium' && 'text-amber-300',
          confidence === 'low' && 'text-rose-300'
        )}
      >
        confidence: {confidence}
      </span>
    </div>
  )
}
