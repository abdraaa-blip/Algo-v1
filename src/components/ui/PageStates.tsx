'use client'

import { AlertTriangle, RefreshCw, WifiOff, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ALGO_UI_EMPTY, ALGO_UI_ERROR, ALGO_UI_LOADING, ALGO_UI_OFFLINE } from '@/lib/copy/ui-strings'

interface LoadingStateProps {
  message?: string
  className?: string
}

/**
 * Consistent loading state for pages
 */
export function LoadingState({ message = ALGO_UI_LOADING.root, className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500/20" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-sm text-white/50">{message}</p>
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

/**
 * Consistent error state for pages
 */
export function ErrorState({ 
  title = ALGO_UI_ERROR.title,
  message = ALGO_UI_ERROR.message,
  onRetry,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reessayer
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  title?: string
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/**
 * Consistent empty state for pages
 */
export function EmptyState({
  title = ALGO_UI_EMPTY.title,
  message = ALGO_UI_EMPTY.message,
  icon,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-8 h-8 text-white/30" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 max-w-md mb-6">{message}</p>
      {action}
    </div>
  )
}

interface OfflineStateProps {
  onRetry?: () => void
  className?: string
}

/**
 * Offline state indicator
 */
export function OfflineState({ onRetry, className = '' }: OfflineStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-orange-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{ALGO_UI_OFFLINE.title}</h3>
      <p className="text-sm text-white/50 max-w-md mb-6">{ALGO_UI_OFFLINE.message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reessayer
        </Button>
      )}
    </div>
  )
}

/**
 * Offline banner (non-blocking)
 */
export function OfflineBanner({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500/90 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span>{ALGO_UI_OFFLINE.banner}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 px-2 py-0.5 bg-white/20 rounded text-xs hover:bg-white/30"
        >
          Fermer
        </button>
      )}
    </div>
  )
}
