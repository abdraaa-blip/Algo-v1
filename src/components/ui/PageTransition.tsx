'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * Page Transition Wrapper - Smooth animations between routes
 * Inspired by Linear and Vercel dashboard transitions
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    setIsTransitioning(true)
    
    // Small delay for exit animation
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsTransitioning(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div
      className={cn(
        'transition-[opacity,transform] ease-out',
        isTransitioning && 'opacity-0 translate-y-1.5',
        !isTransitioning && 'opacity-100 translate-y-0',
        className
      )}
      style={{
        transitionDuration: 'var(--algo-duration-route, 280ms)',
        transitionTimingFunction: 'var(--ease-out-soft, cubic-bezier(0.16, 1, 0.3, 1))',
      }}
    >
      {displayChildren}
    </div>
  )
}

/**
 * Fade transition for modals and overlays
 */
export function FadeTransition({ 
  show, 
  children,
  duration = 200,
  className 
}: { 
  show: boolean
  children: ReactNode
  duration?: number
  className?: string 
}) {
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      return undefined
    }
    const timer = setTimeout(() => setShouldRender(false), duration)
    return () => clearTimeout(timer)
  }, [show, duration])

  if (!shouldRender) return null

  return (
    <div
      className={cn(
        'transition-opacity',
        show ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * Slide transition for drawers and sidebars
 */
export function SlideTransition({ 
  show, 
  children,
  direction = 'right',
  className 
}: { 
  show: boolean
  children: ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  className?: string 
}) {
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      return undefined
    }
    const timer = setTimeout(() => setShouldRender(false), 300)
    return () => clearTimeout(timer)
  }, [show])

  if (!shouldRender) return null

  const transforms = {
    left: show ? 'translate-x-0' : '-translate-x-full',
    right: show ? 'translate-x-0' : 'translate-x-full',
    up: show ? 'translate-y-0' : '-translate-y-full',
    down: show ? 'translate-y-0' : 'translate-y-full',
  }

  return (
    <div
      className={cn(
        'transition-transform duration-300 ease-out',
        transforms[direction],
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Scale transition for cards and modals
 */
export function ScaleTransition({ 
  show, 
  children,
  className 
}: { 
  show: boolean
  children: ReactNode
  className?: string 
}) {
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      return undefined
    }
    const timer = setTimeout(() => setShouldRender(false), 200)
    return () => clearTimeout(timer)
  }, [show])

  if (!shouldRender) return null

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-out',
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Stagger children animation
 */
export function StaggerChildren({ 
  children, 
  delay = 50,
  className 
}: { 
  children: ReactNode[]
  delay?: number
  className?: string 
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * delay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
