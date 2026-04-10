'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * Loading Progress Bar - Shows at the top of the page during navigation
 * Inspired by YouTube, Linear, and Vercel dashboards
 */
export function LoadingProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Reset on route change
    setIsLoading(true)
    setProgress(0)

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(30), 100)
    const timer2 = setTimeout(() => setProgress(60), 300)
    const timer3 = setTimeout(() => setProgress(80), 600)
    const timer4 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
      }, 200)
    }, 800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [pathname, searchParams])

  if (!isLoading && progress === 0) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[200] h-0.5 bg-transparent"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full bg-gradient-to-r from-violet-500 via-violet-400 to-cyan-400',
          'transition-all duration-300 ease-out',
          'shadow-[0_0_10px_rgba(123,97,255,0.5)]',
        )}
        style={{ width: `${progress}%` }}
      />
      {/* Glow effect at the end */}
      <div
        className={cn(
          'absolute top-0 right-0 h-full w-24',
          'bg-gradient-to-r from-transparent to-white/30',
          'transition-all duration-300',
        )}
        style={{ 
          transform: `translateX(${progress < 100 ? '0' : '100'}%)`,
          opacity: progress > 0 && progress < 100 ? 1 : 0,
        }}
      />
    </div>
  )
}

/**
 * Global loading overlay for heavy operations
 */
export function LoadingOverlay({ 
  isLoading, 
  message 
}: { 
  isLoading: boolean
  message?: string 
}) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
        </div>
        {message && (
          <p className="text-sm text-white/60 font-medium">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Skeleton pulse animation for content loading
 */
export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        'animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5',
        'bg-[length:200%_100%]',
        'rounded-lg',
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}
