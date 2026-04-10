'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface MissedTrendsAlertProps {
  className?: string
}

/**
 * MissedTrendsAlert - Creates urgency by showing missed opportunities
 * "Tu as rate 3 tendances hier. Ne rate pas celle-ci."
 */
export function MissedTrendsAlert({ className }: MissedTrendsAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [missedCount, setMissedCount] = useState(0)
  const [currentTrend, setCurrentTrend] = useState('')
  
  useEffect(() => {
    // Simulate missed trends based on time of day
    const hour = new Date().getHours()
    const baseMissed = hour < 12 ? 2 : hour < 18 ? 4 : 3
    const randomMissed = baseMissed + Math.floor(Math.random() * 3)
    
    setMissedCount(randomMissed)
    setCurrentTrend(['IA generative', 'Nouveau meme viral', 'Drama Twitter', 'Challenge TikTok'][Math.floor(Math.random() * 4)])
    
    // Show after a short delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])
  
  if (!isVisible) return null
  
  return (
    <div 
      className={`relative overflow-hidden rounded-xl border animate-in slide-in-from-top-2 duration-500 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,77,109,0.12) 0%, rgba(255,77,109,0.05) 100%)',
        borderColor: 'rgba(255,77,109,0.2)'
      }}
    >
      {/* Dismiss button */}
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Fermer"
      >
        <X size={14} className="text-white/40" />
      </button>
      
      <div className="p-3 sm:p-4 flex items-start gap-3">
        <div 
          className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,77,109,0.2)' }}
        >
          <AlertTriangle size={16} className="text-[#FF4D6D]" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-white/90 mb-1">
            Tu as rate <span className="text-[#FF4D6D]">{missedCount} tendances</span> hier
          </p>
          <p className="text-[11px] sm:text-xs text-white/50 mb-2">
            Ne rate pas <span className="text-emerald-400 font-medium">&quot;{currentTrend}&quot;</span> - ca explose maintenant
          </p>
          
          <Link
            href="/trends"
            className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255,77,109,0.2)',
              color: '#FF4D6D'
            }}
          >
            <TrendingUp size={12} />
            Voir cette tendance
          </Link>
        </div>
      </div>
      
      {/* Urgency indicator */}
      <div 
        className="h-1 w-full"
        style={{
          background: 'linear-gradient(90deg, #FF4D6D 0%, rgba(255,77,109,0.3) 100%)'
        }}
      />
    </div>
  )
}
