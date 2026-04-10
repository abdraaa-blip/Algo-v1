'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { ALGO_UI_ERROR } from '@/lib/copy/ui-strings'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Global Error Boundary - Catches any unhandled errors in child components
 * Prevents the entire app from crashing due to a single component error
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('[ALGO ErrorBoundary] Caught error:', error)
    console.error('[ALGO ErrorBoundary] Component stack:', errorInfo.componentStack)
    
    this.setState({ errorInfo })
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // Log to analytics/monitoring (in production)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      try {
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {}) // Silent fail
      } catch {
        // Ignore logging errors
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-400" />
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">{ALGO_UI_ERROR.title}</h2>
              <p className="text-white/50 text-sm">{ALGO_UI_ERROR.message}</p>
            </div>

            {/* Error Details (dev only) */}
            {this.props.showDetails && this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-left">
                <p className="text-xs font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-400 text-sm font-semibold hover:bg-violet-500/25 transition-colors"
              >
                <RefreshCw size={14} />
                Reessayer
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                <Home size={14} />
                Accueil
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Lightweight error boundary for smaller components
 */
export class ComponentErrorBoundary extends Component<
  { children: ReactNode; name?: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; name?: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error(`[ALGO] Error in ${this.props.name || 'component'}:`, error.message)
  }

  render() {
    if (this.state.hasError) {
      // Render nothing or a minimal placeholder
      return null
    }
    return this.props.children
  }
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { fallback?: ReactNode; name?: string }
) {
  const displayName = options?.name || WrappedComponent.displayName || WrappedComponent.name || 'Component'
  
  const ComponentWithErrorBoundary = (props: P) => (
    <ComponentErrorBoundary name={displayName}>
      <WrappedComponent {...props} />
    </ComponentErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`
  return ComponentWithErrorBoundary
}
