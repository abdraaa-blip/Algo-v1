'use client'

import { useState, useRef, useCallback } from 'react'
import { Share2, Download, Copy, Check, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/useHaptic'

interface ShareableCardProps {
  type: 'score' | 'streak' | 'prediction' | 'challenge' | 'discovery'
  data: {
    title: string
    value: string | number
    subtitle?: string
    rank?: number
    totalUsers?: number
    icon?: string
  }
  className?: string
}

export function ShareableCard({ type, data, className }: ShareableCardProps) {
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { trigger } = useHaptic()

  const getGradient = () => {
    switch (type) {
      case 'score': return 'from-violet-600 via-purple-600 to-fuchsia-600'
      case 'streak': return 'from-orange-500 via-red-500 to-pink-500'
      case 'prediction': return 'from-cyan-500 via-blue-500 to-violet-500'
      case 'challenge': return 'from-emerald-500 via-teal-500 to-cyan-500'
      case 'discovery': return 'from-amber-500 via-orange-500 to-red-500'
      default: return 'from-violet-600 to-fuchsia-600'
    }
  }

  const getShareText = () => {
    const percentile = data.rank && data.totalUsers 
      ? Math.round((1 - data.rank / data.totalUsers) * 100)
      : null

    switch (type) {
      case 'score':
        return `My viral score on ALGO is ${data.value}! ${percentile ? `Top ${percentile}% globally.` : ''} Can you beat it?`
      case 'streak':
        return `${data.value} day streak on ALGO! I'm on fire. Join me and start yours.`
      case 'prediction':
        return `I predicted "${data.title}" would go viral on ALGO and I was right! Try to beat my prediction skills.`
      case 'challenge':
        return `Just completed "${data.title}" challenge on ALGO! ${data.icon || ''} ${data.subtitle || ''}`
      case 'discovery':
        return `I discovered "${data.title}" on ALGO before it went viral! Join me to find the next big thing.`
      default:
        return `Check out my stats on ALGO!`
    }
  }

  const handleShare = async () => {
    trigger('medium')
    
    const shareData = {
      title: 'ALGO - Viral Trends',
      text: getShareText(),
      url: `https://algo.app/share?ref=${encodeURIComponent(data.title)}`
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // Cancelled
      }
    } else {
      handleCopy()
    }
  }

  const handleXShare = () => {
    trigger('light')
    const text = encodeURIComponent(getShareText())
    const url = encodeURIComponent('https://algo.app')
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420')
  }

  const handleCopy = async () => {
    trigger('light')
    try {
      await navigator.clipboard.writeText(`${getShareText()} https://algo.app`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Failed
    }
  }

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    trigger('medium')
    setIsGenerating(true)

    try {
      // Dynamic import for html2canvas
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0f',
        scale: 2,
      })
      
      const link = document.createElement('a')
      link.download = `algo-${type}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Failed to generate image:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [type, trigger])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Shareable Card Preview */}
      <div
        ref={cardRef}
        className={cn(
          'relative overflow-hidden rounded-2xl p-6',
          'bg-gradient-to-br',
          getGradient()
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* ALGO branding */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <Sparkles className="size-4 text-white/80" />
          <span className="text-sm font-bold text-white/90 tracking-wide">ALGO</span>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Icon & Title */}
          <div className="flex items-center gap-3">
            {data.icon && (
              <span className="text-4xl">{data.icon}</span>
            )}
            <div>
              <p className="text-white/70 text-sm font-medium">{data.title}</p>
              <p className="text-white text-3xl font-bold">{data.value}</p>
            </div>
          </div>

          {/* Subtitle / Stats */}
          {data.subtitle && (
            <p className="text-white/80 text-sm">{data.subtitle}</p>
          )}

          {/* Rank badge */}
          {data.rank && data.totalUsers && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-white/90 text-sm font-medium">
                Top {Math.round((1 - data.rank / data.totalUsers) * 100)}%
              </span>
              <span className="text-white/60 text-xs">
                of {data.totalUsers.toLocaleString()} users
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/20">
          <p className="text-white/60 text-xs">algo.app - Discover what&apos;s trending</p>
        </div>
      </div>

      {/* Share Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-white/10 hover:bg-white/15 text-white font-medium',
            'transition-colors duration-200'
          )}
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>

        <button
          onClick={handleXShare}
          className={cn(
            'size-10 flex items-center justify-center rounded-xl',
            'bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2]',
            'transition-colors duration-200'
          )}
          aria-label="Partager sur X"
        >
          <X size={18} />
        </button>

        <button
          onClick={handleCopy}
          className={cn(
            'size-10 flex items-center justify-center rounded-xl',
            'bg-white/10 hover:bg-white/15 text-white',
            'transition-colors duration-200'
          )}
          aria-label="Copy link"
        >
          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
        </button>

        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className={cn(
            'size-10 flex items-center justify-center rounded-xl',
            'bg-white/10 hover:bg-white/15 text-white',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Download image"
        >
          <Download size={18} className={isGenerating ? 'animate-pulse' : ''} />
        </button>
      </div>
    </div>
  )
}
