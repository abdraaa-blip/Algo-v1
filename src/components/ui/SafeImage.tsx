'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ImageOff } from 'lucide-react'

interface SafeImageProps {
  src: string | null | undefined
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  fallbackSrc?: string
  showFallbackIcon?: boolean
  priority?: boolean
  sizes?: string
}

const DEFAULT_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%231a1a2e" width="400" height="300"/%3E%3Ctext fill="%23ffffff20" font-family="system-ui" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage unavailable%3C/text%3E%3C/svg%3E'

export function SafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  fallbackSrc = DEFAULT_FALLBACK,
  showFallbackIcon = true,
  priority = false,
  sizes,
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const imageSrc = error || !src ? fallbackSrc : src

  if (fill) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {!loaded && !error && (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        )}
        
        {error && showFallbackIcon ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
            <ImageOff size={24} className="text-white/20" />
          </div>
        ) : (
          <Image
            src={imageSrc}
            alt={alt}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0',
            )}
            onError={() => setError(true)}
            onLoad={() => setLoaded(true)}
            priority={priority}
            sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
            unoptimized={imageSrc.startsWith('data:')}
          />
        )}
      </div>
    )
  }

  if (error && showFallbackIcon) {
    return (
      <div 
        className={cn('flex items-center justify-center bg-white/5', className)}
        style={{ width, height }}
      >
        <ImageOff size={24} className="text-white/20" />
      </div>
    )
  }

  return (
    <div className="relative">
      {!loaded && !error && (
        <div 
          className={cn('absolute inset-0 bg-white/5 animate-pulse rounded-inherit', className)}
          style={{ width, height }}
        />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={width || 400}
        height={height || 300}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        priority={priority}
        unoptimized={imageSrc.startsWith('data:') || imageSrc.startsWith('http')}
      />
    </div>
  )
}

// Avatar with fallback
interface SafeAvatarProps {
  src: string | null | undefined
  alt: string
  size?: number
  className?: string
}

export function SafeAvatar({ src, alt, size = 40, className }: SafeAvatarProps) {
  const [error, setError] = useState(false)

  const initials = alt
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (error || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-full',
          className,
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-white/60 font-semibold" style={{ fontSize: size * 0.35 }}>
          {initials || '?'}
        </span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover bg-white/5', className)}
      onError={() => setError(true)}
      unoptimized={src.startsWith('data:') || src.startsWith('http')}
    />
  )
}

// Thumbnail with lazy loading
interface ThumbnailProps {
  src: string | null | undefined
  alt: string
  aspectRatio?: 'video' | 'square' | 'portrait'
  className?: string
  onClick?: () => void
}

export function Thumbnail({ src, alt, aspectRatio = 'video', className, onClick }: ThumbnailProps) {
  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'relative overflow-hidden rounded-xl bg-white/5',
        aspectClasses[aspectRatio],
        onClick && 'cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all',
        className,
      )}
    >
      <SafeImage
        src={src}
        alt={alt}
        fill
        className="transition-transform duration-300 hover:scale-105"
      />
    </button>
  )
}

export default SafeImage
