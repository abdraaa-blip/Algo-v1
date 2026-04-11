'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Sparkles, Zap, TrendingUp, Eye, ChevronRight } from 'lucide-react'

// Types
interface TrendData {
  id: string
  name: string
  score: number
  confidence: 'haute' | 'moyenne' | 'faible'
  timeWindow: string // "8h", "3h", "24h"
  status: 'hot' | 'rising' | 'early'
  emotion: string // "surprise", "colere", "joie", etc.
  platform: string // "TikTok", "YouTube", "Instagram"
  format: string // "face cam", "montage", "voice over"
  whyItWorks: string // 1 phrase max
  action: {
    task: string // "Fais une video 15-30s"
    hook: string // "Personne ne vous dit ca sur..."
    deadline: string // "Poste avant 18h"
  }
  examples: string[] // ["Pourquoi personne ne parle de ca?", "Ce que j'ai decouvert sur..."]
  origin?: string // "Reddit"
  arrivesOn?: string // "TikTok dans 3h"
  category?: string
  // Extended data for detail view
  views?: number
  watchers?: number
  growthRate?: number
  bestTimeToPost?: string
  targetAudience?: string
  estimatedReach?: string
}

interface TrendActionCardProps {
  trend: TrendData
  onCreateClick?: () => void
  onDetailsClick?: () => void
}

// Status badge colors
const statusConfig = {
  hot: { label: 'HOT', bg: 'rgba(255,77,109,0.15)', border: 'rgba(255,77,109,0.4)', color: '#FF4D6D', pulse: true },
  rising: { label: 'RISING', bg: 'rgba(255,193,7,0.15)', border: 'rgba(255,193,7,0.4)', color: '#FFC107', pulse: false },
  early: { label: 'EARLY', bg: 'rgba(0,209,255,0.15)', border: 'rgba(0,209,255,0.4)', color: '#00D1FF', pulse: false },
}

// Confidence indicator
const confidenceConfig = {
  haute: { label: 'Elevee', color: '#00FFB2', bars: 3 },
  moyenne: { label: 'Moyenne', color: '#FFC107', bars: 2 },
  faible: { label: 'Faible', color: '#FF4D6D', bars: 1 },
}

// Platform icons (emoji fallback)
const platformIcons: Record<string, string> = {
  'TikTok': '📱',
  'YouTube': '▶️',
  'Instagram': '📷',
  'Twitter': '🐦',
  'Reddit': '🔴',
  'LinkedIn': '💼',
}

// Emotion icons
const emotionIcons: Record<string, string> = {
  'surprise': '😲',
  'colere': '😠',
  'joie': '😄',
  'curiosite': '🤔',
  'peur': '😨',
  'nostalgie': '🥹',
  'indignation': '😤',
}

// Format icons
const formatIcons: Record<string, string> = {
  'face cam': '🎬',
  'montage': '🎞️',
  'voice over': '🎙️',
  'screen record': '🖥️',
  'photo': '📸',
  'carousel': '🎠',
  'story': '📖',
}

export function TrendActionCard({ trend, onCreateClick, onDetailsClick }: TrendActionCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  
  const status = statusConfig[trend.status]
  const confidence = confidenceConfig[trend.confidence]
  
  const handleCreate = () => {
    if (onCreateClick) {
      onCreateClick()
    } else {
      router.push(`/creator-mode?trend=${encodeURIComponent(trend.name)}&platform=${encodeURIComponent(trend.platform)}&format=${encodeURIComponent(trend.format)}`)
    }
  }
  
  const handleDetails = () => {
    if (onDetailsClick) {
      onDetailsClick()
    }
  }

  return (
    <article 
      className="relative overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        background: 'linear-gradient(145deg, rgba(20,20,30,0.95), rgba(10,10,15,0.98))',
        border: isHovered ? `1px solid ${status.color}50` : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isHovered ? `0 8px 32px ${status.color}20` : '0 4px 16px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER - Nom + Badge Status
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-base sm:text-lg font-bold text-white leading-tight pr-2 line-clamp-2">
          {trend.name}
        </h3>
        <span 
          className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${status.pulse ? 'animate-pulse' : ''}`}
          style={{ 
            background: status.bg, 
            border: `1px solid ${status.border}`,
            color: status.color 
          }}
        >
          {status.label}
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. SCORE + URGENCE - Zone la plus importante
      ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="mx-4 p-3 rounded-xl flex items-center justify-between"
        style={{ 
          background: 'linear-gradient(135deg, rgba(123,97,255,0.1), rgba(0,255,178,0.05))',
          border: '1px solid rgba(123,97,255,0.2)'
        }}
      >
        {/* Score */}
        <div className="flex items-center gap-3">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black"
            style={{ 
              background: `conic-gradient(${status.color} ${trend.score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
              boxShadow: `0 0 20px ${status.color}40`
            }}
          >
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(10,10,15,0.95)' }}
            >
              <span style={{ color: status.color }}>{trend.score}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Score ALGO</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/60">Confiance:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i}
                    className="w-1.5 h-3 rounded-sm"
                    style={{ 
                      background: i <= confidence.bars ? confidence.color : 'rgba(255,255,255,0.1)'
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: confidence.color }}>
                {confidence.label}
              </span>
            </div>
          </div>
        </div>
        
        {/* Urgence */}
        <div 
          className="flex flex-col items-center px-3 py-2 rounded-lg"
          style={{ 
            background: trend.status === 'hot' ? 'rgba(255,77,109,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${trend.status === 'hot' ? 'rgba(255,77,109,0.3)' : 'rgba(255,255,255,0.1)'}`
          }}
        >
          <Clock size={14} className={trend.status === 'hot' ? 'text-red-400 animate-pulse' : 'text-white/40'} />
          <span 
            className="text-lg font-black"
            style={{ color: trend.status === 'hot' ? '#FF4D6D' : '#FFC107' }}
          >
            {trend.timeWindow}
          </span>
          <span className="text-[9px] text-white/40 uppercase">restantes</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. LECTURE EXPRESS - Comprendre en 2 secondes
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-4 px-4 py-3">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
          <span className="text-sm">{emotionIcons[trend.emotion] || '🎭'}</span>
          <span className="text-[11px] text-white/60 capitalize">{trend.emotion}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
          <span className="text-sm">{platformIcons[trend.platform] || '📱'}</span>
          <span className="text-[11px] text-white/60">{trend.platform}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
          <span className="text-sm">{formatIcons[trend.format] || '🎬'}</span>
          <span className="text-[11px] text-white/60 capitalize">{trend.format}</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. POURQUOI CA MARCHE - 1 phrase max
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 pb-2">
        <p 
          className="text-xs text-center italic leading-relaxed px-2 py-2 rounded-lg"
          style={{ 
            background: 'rgba(0,255,178,0.05)',
            border: '1px solid rgba(0,255,178,0.1)',
            color: 'rgba(0,255,178,0.8)'
          }}
        >
          &quot;{trend.whyItWorks}&quot;
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. ACTION DIRECTE - Coeur de la carte
      ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="mx-4 p-3 rounded-xl"
        style={{ 
          background: 'linear-gradient(135deg, rgba(123,97,255,0.15), rgba(123,97,255,0.05))',
          border: '1px solid rgba(123,97,255,0.3)'
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-violet-400" />
          <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">A faire maintenant</span>
        </div>
        
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span className="text-white/90">{trend.action.task}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span className="text-white/90">
              Hook: <span className="text-violet-300 font-medium">&quot;{trend.action.hook}&quot;</span>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400 mt-0.5">⏰</span>
            <span className="text-yellow-300 font-medium">{trend.action.deadline}</span>
          </li>
        </ul>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          6. EXEMPLES CONCRETS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={12} className="text-cyan-400" />
          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Exemples de hooks</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {trend.examples.slice(0, 2).map((example, i) => (
            <span 
              key={i}
              className="text-[11px] px-2 py-1 rounded-lg bg-white/5 text-white/70 border border-white/10"
            >
              &quot;{example}&quot;
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BONUS: Stats et Contexte (si disponible)
      ═══════════════════════════════════════════════════════════════════ */}
      {(trend.views || trend.targetAudience || trend.estimatedReach || trend.bestTimeToPost) && (
        <div className="px-4 pb-2">
          <div 
            className="grid grid-cols-2 gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {trend.views && trend.views > 0 && (
              <div className="flex flex-col">
                <span className="text-[9px] text-white/40 uppercase">Volume</span>
                <span className="text-xs text-white/80 font-medium">
                  {trend.views >= 1000000 ? `${(trend.views / 1000000).toFixed(1)}M` : 
                   trend.views >= 1000 ? `${(trend.views / 1000).toFixed(0)}K` : trend.views} vues
                </span>
              </div>
            )}
            {trend.growthRate && (
              <div className="flex flex-col">
                <span className="text-[9px] text-white/40 uppercase">Croissance</span>
                <span className="text-xs font-medium" style={{ color: trend.growthRate > 100 ? '#00FFB2' : '#FFC107' }}>
                  +{trend.growthRate}%
                </span>
              </div>
            )}
            {trend.targetAudience && (
              <div className="flex flex-col">
                <span className="text-[9px] text-white/40 uppercase">Audience</span>
                <span className="text-xs text-white/80">{trend.targetAudience}</span>
              </div>
            )}
            {trend.estimatedReach && (
              <div className="flex flex-col">
                <span className="text-[9px] text-white/40 uppercase">Portee estimee</span>
                <span className="text-xs text-emerald-400 font-medium">{trend.estimatedReach}</span>
              </div>
            )}
            {trend.bestTimeToPost && (
              <div className="flex flex-col col-span-2">
                <span className="text-[9px] text-white/40 uppercase">Meilleur moment</span>
                <span className="text-xs text-yellow-400 font-medium">{trend.bestTimeToPost}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════
          BONUS: Projection (si disponible)
      ═══════════════════════════════════════════════════════════════════ */}
      {trend.origin && trend.arrivesOn && (
        <div className="px-4 pb-2">
          <div 
            className="flex items-center justify-center gap-3 text-[10px] px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <span className="text-white/40">Origine: <span className="text-white/60">{trend.origin}</span></span>
            <TrendingUp size={10} className="text-emerald-400" />
            <span className="text-emerald-400">Arrive sur {trend.arrivesOn}</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          7. BOUTONS - Actions principales
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 pt-2 flex gap-2">
        {/* Bouton principal */}
        <button
          onClick={handleCreate}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #7B61FF, #00D1FF)',
            boxShadow: '0 4px 20px rgba(123,97,255,0.4)',
            color: 'white'
          }}
        >
          <Zap size={16} />
          Créer avec cette tendance
        </button>
        
        {/* Bouton secondaire */}
        {onDetailsClick && (
          <button
            onClick={handleDetails}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)'
            }}
          >
            <Eye size={16} />
          </button>
        )}
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Version compacte pour les listes
// ═══════════════════════════════════════════════════════════════════════════════

export function TrendActionCardCompact({ trend, onClick }: { trend: TrendData; onClick?: () => void }) {
  const status = statusConfig[trend.status]
  
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: 'rgba(20,20,30,0.8)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Score compact */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ 
            background: `conic-gradient(${status.color} ${trend.score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
          }}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(10,10,15,0.95)' }}
          >
            <span style={{ color: status.color }}>{trend.score}</span>
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-white truncate">{trend.name}</span>
            <span 
              className={`px-1.5 py-0.5 rounded text-[8px] font-black ${status.pulse ? 'animate-pulse' : ''}`}
              style={{ background: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <span>{emotionIcons[trend.emotion] || '🎭'} {trend.emotion}</span>
            <span>•</span>
            <span>{platformIcons[trend.platform] || '📱'} {trend.platform}</span>
            <span>•</span>
            <span className={trend.status === 'hot' ? 'text-red-400 font-bold' : ''}>
              <Clock size={10} className="inline mr-0.5" />
              {trend.timeWindow}
            </span>
          </div>
        </div>
        
        <ChevronRight size={16} className="text-white/20 flex-shrink-0" />
      </div>
    </button>
  )
}
