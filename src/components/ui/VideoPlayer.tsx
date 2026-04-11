'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  platform?: 'youtube' | 'reddit' | 'tiktok' | 'vimeo' | 'native'
  autoPlay?: boolean
  onClose?: () => void
  className?: string
}

export function VideoPlayer({
  src,
  poster,
  title,
  platform = 'native',
  autoPlay = false,
  onClose,
  className,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  // Handle YouTube embed
  if (platform === 'youtube') {
    const videoId = extractYouTubeId(src)
    return (
      <div className={cn('relative aspect-video bg-black rounded-xl overflow-hidden', className)}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 end-3 z-20 p-2 bg-black/60 rounded-full text-white/80 hover:text-white hover:bg-black/80 transition-all"
            aria-label="Fermer la video"
          >
            <X size={20} />
          </button>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&mute=1&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'Video'}
        />
      </div>
    )
  }

  // Handle Reddit video
  if (platform === 'reddit') {
    return (
      <div className={cn('relative aspect-video bg-black rounded-xl overflow-hidden', className)}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 end-3 z-20 p-2 bg-black/60 rounded-full text-white/80 hover:text-white hover:bg-black/80 transition-all"
            aria-label="Fermer la video"
          >
            <X size={20} />
          </button>
        )}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain"
          autoPlay={autoPlay}
          muted={isMuted}
          loop
          playsInline
          controls
        />
      </div>
    )
  }

  // Native video player
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(progress || 0)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = percent * videoRef.current.duration
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-video bg-black rounded-xl overflow-hidden group',
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 end-3 z-20 p-2 bg-black/60 rounded-full text-white/80 hover:text-white hover:bg-black/80 transition-all"
          aria-label="Fermer la video"
        >
          <X size={20} />
        </button>
      )}

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Play button overlay */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
        >
          <div className="size-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <Play size={32} className="text-white ms-1" fill="white" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0',
        )}
      >
        {/* Progress bar */}
        <div
          className="h-1 bg-white/20 rounded-full cursor-pointer mb-3"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {title && (
              <span className="text-white/70 text-sm truncate max-w-[200px]">{title}</span>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize size={20} className="text-white" /> : <Maximize size={20} className="text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Utility to extract YouTube video ID
function extractYouTubeId(url: string): string {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7]?.length === 11) ? match[7] : url
}

// Video thumbnail with play button overlay
interface VideoThumbnailProps {
  src: string
  thumbnail: string | null
  title?: string
  duration?: string
  platform?: 'youtube' | 'reddit' | 'tiktok' | 'native'
  onClick?: () => void
  className?: string
}

export function VideoThumbnail({
  src,
  thumbnail,
  title,
  duration,
  platform = 'native',
  onClick,
  className,
}: VideoThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  
  // Generate fallback thumbnail for YouTube
  const fallbackThumbnail = platform === 'youtube' 
    ? `https://i.ytimg.com/vi/${extractYouTubeId(src)}/hqdefault.jpg`
    : '/images/video-placeholder.jpg'

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-video bg-white/5 rounded-xl overflow-hidden group',
        'hover:ring-2 hover:ring-violet-500/50 transition-all',
        className,
      )}
    >
      <ImageWithFallback
        src={imageError ? null : (thumbnail || fallbackThumbnail)}
        alt={title || 'Video thumbnail'}
        fill
        fallbackType="platform"
        platform={platform}
        className="object-cover transition-transform group-hover:scale-105"
        containerClassName="w-full h-full"
        onError={() => setImageError(true)}
      />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors z-10">
        <div className="size-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-violet-500/80 transition-colors">
          <Play size={24} className="text-white ms-0.5" fill="white" />
        </div>
      </div>

      {/* Duration badge */}
      {duration && (
        <span className="absolute bottom-2 end-2 px-1.5 py-0.5 bg-black/80 rounded text-white text-[10px] font-medium">
          {duration}
        </span>
      )}

      {/* Platform badge */}
      {platform && platform !== 'native' && (
        <span className={cn(
          'absolute top-2 start-2 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase',
          platform === 'youtube' && 'bg-red-500 text-white',
          platform === 'reddit' && 'bg-orange-500 text-white',
          platform === 'tiktok' && 'bg-black text-white',
        )}>
          {platform}
        </span>
      )}
    </button>
  )
}

// Video modal for fullscreen playback
interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  title?: string
  platform?: 'youtube' | 'reddit' | 'tiktok' | 'native'
  poster?: string
}

export function VideoModal({ isOpen, onClose, src, title, platform, poster }: VideoModalProps) {
  useBodyScrollLock(isOpen)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Lecture video: ${title}` : 'Lecture video'}
    >
      <div
        className="w-full max-w-5xl"
        onClick={e => e.stopPropagation()}
      >
        <VideoPlayer
          src={src}
          title={title}
          platform={platform}
          poster={poster}
          autoPlay
          onClose={onClose}
        />
        {title && (
          <h3 className="text-white font-semibold mt-4 text-lg">{title}</h3>
        )}
      </div>
    </div>
  )
}

export default VideoPlayer
