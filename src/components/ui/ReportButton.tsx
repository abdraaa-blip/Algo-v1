'use client'

import { useState } from 'react'
import { Flag, X, Loader2, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/useHaptic'
import { useAuth } from '@/hooks/useAuth'

interface ReportButtonProps {
  contentId: string
  contentType: 'trend' | 'video' | 'news' | 'star' | 'comment'
  className?: string
}

const REPORT_REASONS = [
  { id: 'broken', label: 'Broken link or content', icon: AlertTriangle },
  { id: 'inappropriate', label: 'Inappropriate content', icon: Flag },
  { id: 'spam', label: 'Spam or misleading', icon: Flag },
  { id: 'outdated', label: 'Outdated information', icon: AlertTriangle },
  { id: 'other', label: 'Other issue', icon: Flag },
] as const

export function ReportButton({ contentId, contentType, className }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { trigger } = useHaptic()
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!selectedReason) return
    
    trigger('medium')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          reason: selectedReason,
          additionalInfo,
          userId: user?.id,
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setTimeout(() => {
          setIsOpen(false)
          setIsSubmitted(false)
          setSelectedReason(null)
          setAdditionalInfo('')
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to submit report:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          trigger('light')
          setIsOpen(true)
        }}
        aria-label="Report content"
        className={cn(
          'size-8 rounded-lg flex items-center justify-center',
          'text-white/30 hover:text-white/60 hover:bg-white/5',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60',
          className
        )}
      >
        <Flag size={14} strokeWidth={2} aria-hidden />
      </button>

      {/* Report Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={cn(
              'w-full max-w-md p-6 rounded-2xl',
              'bg-[#1a1a1f] border border-white/10',
              'shadow-2xl animate-in zoom-in-95 duration-200'
            )}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-labelledby="report-title"
          >
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="size-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Report Submitted</h3>
                <p className="text-white/50 text-sm">Thank you for helping improve ALGO.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 id="report-title" className="text-lg font-semibold text-white">
                    Report Content
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="size-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {REPORT_REASONS.map(reason => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                        selectedReason === reason.id
                          ? 'bg-violet-500/15 border border-violet-500/30 text-white'
                          : 'bg-white/3 border border-white/5 text-white/70 hover:bg-white/5 hover:border-white/10'
                      )}
                    >
                      <reason.icon size={16} className={selectedReason === reason.id ? 'text-violet-400' : ''} />
                      <span className="text-sm">{reason.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                  placeholder="Additional details (optional)"
                  className={cn(
                    'w-full h-20 px-4 py-3 rounded-xl resize-none',
                    'bg-white/3 border border-white/5 text-white placeholder:text-white/30',
                    'focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20',
                    'text-sm'
                  )}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || isSubmitting}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all',
                      'flex items-center justify-center gap-2',
                      selectedReason
                        ? 'bg-red-500/80 hover:bg-red-500 text-white'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
