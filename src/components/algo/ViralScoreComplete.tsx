'use client'

import { Clock, Shield } from 'lucide-react'

interface ViralScoreCompleteProps {
  score: number
  confidence?: 'haute' | 'moyenne' | 'faible'
  window?: string // e.g., "6h", "12h", "24h"
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

export function ViralScoreComplete({ 
  score, 
  confidence = 'moyenne',
  window = '12h',
  size = 'md',
  showDetails = true
}: ViralScoreCompleteProps) {
  const col = score >= 85 ? '#7B61FF' : score >= 65 ? '#00FFB2' : score >= 45 ? '#00D1FF' : 'rgba(240,240,248,0.3)'
  
  const confidenceConfig = {
    haute: { color: '#00FFB2', label: 'Haute confiance', bg: 'rgba(0,255,178,0.1)' },
    moyenne: { color: '#FFD166', label: 'Confiance moyenne', bg: 'rgba(255,209,102,0.1)' },
    faible: { color: '#FF4D6D', label: 'Confiance faible', bg: 'rgba(255,77,109,0.1)' },
  }
  
  const conf = confidenceConfig[confidence]
  
  const sizeConfig = {
    sm: { ring: 36, fontSize: 10, gap: 1.5 },
    md: { ring: 48, fontSize: 13, gap: 2 },
    lg: { ring: 64, fontSize: 18, gap: 3 },
  }
  
  const s = sizeConfig[size]
  const r = (s.ring - 5) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(score, 100) / 100) * circ
  
  // Parse window to determine urgency
  const windowHours = parseInt(window.replace('h', '')) || 12
  const isUrgent = windowHours <= 6
  const isModerate = windowHours <= 12
  
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Score Ring */}
      <div className="relative flex-shrink-0" style={{ width: s.ring, height: s.ring }}>
        <svg width={s.ring} height={s.ring} className="absolute inset-0">
          <circle 
            cx={s.ring / 2} 
            cy={s.ring / 2} 
            r={r} 
            fill="none" 
            stroke="rgba(255,255,255,0.07)" 
            strokeWidth={3.5}
          />
          <circle 
            cx={s.ring / 2} 
            cy={s.ring / 2} 
            r={r} 
            fill="none" 
            stroke={col} 
            strokeWidth={3.5}
            strokeLinecap="round" 
            strokeDasharray={circ} 
            strokeDashoffset={offset}
            transform={`rotate(-90 ${s.ring / 2} ${s.ring / 2})`}
            style={{ 
              filter: `drop-shadow(0 0 6px ${col}80)`,
              transition: 'stroke-dashoffset 0.6s'
            }}
          />
          {/* Animated outer ring for high scores */}
          {score >= 80 && (
            <circle 
              cx={s.ring / 2} 
              cy={s.ring / 2} 
              r={r + 4} 
              fill="none" 
              stroke={col} 
              strokeWidth={0.8}
              strokeDasharray={`${circ * 0.1} ${circ * 0.9}`} 
              opacity={0.5}
              className="animate-[algo-spin_6s_linear_infinite]"
              transform={`rotate(-90 ${s.ring / 2} ${s.ring / 2})`}
            />
          )}
        </svg>
        <span 
          className="absolute inset-0 flex items-center justify-center font-black"
          style={{ fontSize: s.fontSize, color: col }}
        >
          {score}
        </span>
      </div>
      
      {/* Details: Confidence + Window */}
      {showDetails && (
        <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
          {/* Confidence */}
          <div 
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-medium w-fit"
            style={{ background: conf.bg, color: conf.color }}
          >
            <Shield size={8} className="flex-shrink-0" />
            <span className="truncate">{conf.label}</span>
          </div>
          
          {/* Window */}
          <div 
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold w-fit ${isUrgent ? 'animate-pulse' : ''}`}
            style={{ 
              background: isUrgent ? 'rgba(255,77,109,0.15)' : isModerate ? 'rgba(255,209,102,0.1)' : 'rgba(255,255,255,0.05)',
              color: isUrgent ? '#FF4D6D' : isModerate ? '#FFD166' : 'rgba(255,255,255,0.5)'
            }}
          >
            <Clock size={8} className="flex-shrink-0" />
            <span>Fenetre: {window}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper to calculate confidence from various signals
export function calculateConfidence(signals: {
  trendStrength?: number
  sourceCount?: number
  consistency?: number
}): 'haute' | 'moyenne' | 'faible' {
  const { trendStrength = 50, sourceCount = 1, consistency = 50 } = signals
  const avgScore = (trendStrength + Math.min(sourceCount * 20, 100) + consistency) / 3
  
  if (avgScore >= 70) return 'haute'
  if (avgScore >= 40) return 'moyenne'
  return 'faible'
}

// Helper to estimate window from momentum
export function estimateWindow(momentum: 'exploding' | 'rising' | 'peaked' | 'cooling' | 'steady' | 'fading'): string {
  switch (momentum) {
    case 'exploding': return '3h'
    case 'rising': return '6h'
    case 'peaked': return '12h'
    case 'steady': return '24h'
    case 'cooling': return '48h'
    case 'fading': return '72h'
    default: return '24h'
  }
}
