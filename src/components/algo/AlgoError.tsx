'use client'

import { ALGO_UI_ERROR } from '@/lib/copy/ui-strings'

interface AlgoErrorProps {
  onRetry?: () => void
}

export function AlgoError({ onRetry }: AlgoErrorProps) {
  return (
    <div 
      className="text-center py-10"
      style={{ color: 'rgba(240,240,248,0.38)' }}
    >
      <p className="space-y-1">
        <span className="block font-semibold text-[rgba(240,240,248,0.52)]">{ALGO_UI_ERROR.title}</span>
        <span className="block">{ALGO_UI_ERROR.message}</span>
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-3 px-4 py-2 rounded-[10px] text-xs font-bold cursor-pointer transition-colors hover:bg-[rgba(123,97,255,0.25)]"
          style={{
            background: 'rgba(123,97,255,0.15)',
            border: '1px solid rgba(123,97,255,0.25)',
            color: '#a78bfa'
          }}
        >
          Réessayer
        </button>
      )}
    </div>
  )
}
