'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Link2, MessageCircle, Check, X, AtSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/useHaptic'

interface ShareButtonProps {
  title: string
  text?: string
  url?: string
  className?: string
  variant?: 'icon' | 'button'
}

export function ShareButton({ 
  title, 
  text, 
  url, 
  className,
  variant = 'icon'
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { trigger } = useHaptic()

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareText = text || title

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleNativeShare = async () => {
    trigger('medium')
    
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl })
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          setIsOpen(true)
        }
      }
    } else {
      setIsOpen(true)
    }
  }

  const handleCopyLink = async () => {
    trigger('light')
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareToTwitter = () => {
    trigger('light')
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
    setIsOpen(false)
  }

  const shareToWhatsApp = () => {
    trigger('light')
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
    window.open(whatsappUrl, '_blank')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleNativeShare}
        aria-label="Share"
        aria-expanded={isOpen}
        className={cn(
          variant === 'icon' 
            ? 'size-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5'
            : 'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60',
          className
        )}
      >
        <Share2 size={variant === 'icon' ? 16 : 14} strokeWidth={2} aria-hidden />
        {variant === 'button' && <span className="text-sm font-medium">Share</span>}
      </button>

      {/* Share menu dropdown */}
      {isOpen && (
        <div 
          className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'w-56 p-2 rounded-xl',
            'bg-[#1a1a1f] border border-white/10',
            'shadow-2xl shadow-black/50',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
          role="menu"
        >
          <button
            onClick={shareToTwitter}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            role="menuitem"
          >
            <AtSign size={16} aria-hidden />
            <span className="text-sm">Share on X</span>
          </button>
          
          <button
            onClick={shareToWhatsApp}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            role="menuitem"
          >
            <MessageCircle size={16} aria-hidden />
            <span className="text-sm">Share on WhatsApp</span>
          </button>
          
          <hr className="my-1 border-white/5" />
          
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            role="menuitem"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-400" aria-hidden />
                <span className="text-sm text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Link2 size={16} aria-hidden />
                <span className="text-sm">Copy link</span>
              </>
            )}
          </button>
          
          <hr className="my-1 border-white/5" />
          
          <button
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            role="menuitem"
          >
            <X size={16} aria-hidden />
            <span className="text-sm">Cancel</span>
          </button>
        </div>
      )}
    </div>
  )
}
