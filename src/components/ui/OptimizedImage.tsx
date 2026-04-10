'use client'

import { useState, useEffect, useRef } from 'react'
import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: string
  lowQualitySrc?: string
  aspectRatio?: string
  showSkeleton?: boolean
}

/**
 * Optimized Image Component
 * - Lazy loading with intersection observer
 * - Low quality placeholder (LQIP) support
 * - Graceful fallback on error
 * - Skeleton loading state
 */
export function OptimizedImage({
  src,
  alt,
  fallback = '/images/placeholder.jpg',
  lowQualitySrc,
  aspectRatio,
  showSkeleton = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // Load images 200px before they enter viewport
    )

    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  const imageSrc = hasError ? fallback : src

  return (
    <div 
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton loader */}
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}

      {/* Low quality placeholder */}
      {lowQualitySrc && !isLoaded && isInView && (
        <Image
          src={lowQualitySrc}
          alt=""
          fill
          className="object-cover blur-lg scale-110"
          aria-hidden
        />
      )}

      {/* Main image */}
      {isInView && (
        <Image
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
    </div>
  )
}

/**
 * Background image with lazy loading
 */
export function LazyBackgroundImage({
  src,
  className,
  children,
}: {
  src: string
  className?: string
  children?: React.ReactNode
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return

    const img = new window.Image()
    img.src = src
    img.onload = () => setIsLoaded(true)
  }, [isInView, src])

  return (
    <div
      ref={ref}
      className={cn(
        'bg-cover bg-center transition-opacity duration-500',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={isLoaded ? { backgroundImage: `url(${src})` } : undefined}
    >
      {children}
    </div>
  )
}
