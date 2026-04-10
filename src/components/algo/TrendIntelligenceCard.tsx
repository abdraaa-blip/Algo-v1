'use client'

import { useState } from 'react'
import { 
  Brain, Users, BarChart3, Video,
  Sparkles, Zap, Eye, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrendIntelligence {
  id: string
  name: string
  score: number
  
  // 1. Emotion Indicator
  emotion: {
    primary: EmotionType
    score: number // 0-100
    secondary?: EmotionType
  }
  
  // 2. Saturation Score
  saturation: SaturationLevel
  saturationScore: number // 0-100
  
  // 3. Badges
  badges: TrendBadge[]
  
  // 4. Multi-expert Analysis
  analysis: {
    psycho: PsychoAnalysis
    socio: SocioAnalysis
    algorithm: AlgorithmAnalysis
    content: ContentAnalysis
  }
  
  // 5. Action Suggestions
  actions: ActionSuggestion[]
  
  // 6. Semantic Analysis
  semantics: SemanticAnalysis
  
  // 7. Engagement Heatmap
  heatmap: EngagementHeatmap
  
  // Basic info
  platform: string
  category: string
  growthRate: number
  views?: number
  timeWindow: string
}

export type EmotionType = 
  | 'curiosity' | 'anger' | 'inspiration' | 'fear' 
  | 'humor' | 'controversy' | 'belonging' | 'status'

export type SaturationLevel = 'early' | 'rising' | 'peak' | 'saturated' | 'declining'

export type TrendBadge = 
  | 'high_controversy' | 'viral_format' | 'niche_growing' 
  | 'evergreen' | 'early_signal' | 'saturated' 
  | 'brand_opportunity' | 'storytelling'

interface PsychoAnalysis {
  emotionalDrivers: string[]
  psychologicalBias: string
  emotionalHook: string
}

interface SocioAnalysis {
  communities: string[]
  demographicFit: string
  socialDynamics: string
}

interface AlgorithmAnalysis {
  growthSpeed: 'explosive' | 'fast' | 'moderate' | 'slow'
  engagementPotential: number // 0-100
  viralProbability: number // 0-100
  peakPrediction: string
}

interface ContentAnalysis {
  bestFormats: string[]
  recommendedLength: string
  keyElements: string[]
  avoidList: string[]
}

interface ActionSuggestion {
  type: 'video' | 'thread' | 'reaction' | 'analysis' | 'meme' | 'sound'
  action: string
  urgency: 'immediate' | 'soon' | 'flexible'
  angle: string
}

interface SemanticAnalysis {
  whyItWorks: string
  psychologicalBias: string
  storytellingStructure: string
  emotionalHook: string
  conflictElement: string
  noveltyFactor: string
  relatability: string
  statusSignaling: string
}

interface EngagementHeatmap {
  platforms: { name: string; percentage: number; trend: 'up' | 'stable' | 'down' }[]
  audiences: { name: string; percentage: number }[]
  formats: { name: string; percentage: number }[]
  peakHours: string[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const emotionConfig: Record<EmotionType, { label: string; icon: string; color: string }> = {
  curiosity: { label: 'Curiosite', icon: '🤔', color: '#00D1FF' },
  anger: { label: 'Colere', icon: '😠', color: '#FF4D6D' },
  inspiration: { label: 'Inspiration', icon: '✨', color: '#FFD700' },
  fear: { label: 'Peur', icon: '😨', color: '#9B59B6' },
  humor: { label: 'Humour', icon: '😄', color: '#00FFB2' },
  controversy: { label: 'Controverse', icon: '🔥', color: '#FF6B35' },
  belonging: { label: 'Appartenance', icon: '🤝', color: '#4ECDC4' },
  status: { label: 'Statut', icon: '👑', color: '#F39C12' },
}

const saturationConfig: Record<SaturationLevel, { label: string; color: string; width: string }> = {
  early: { label: 'Early', color: '#00D1FF', width: '20%' },
  rising: { label: 'Rising', color: '#00FFB2', width: '40%' },
  peak: { label: 'Peak', color: '#FFD700', width: '70%' },
  saturated: { label: 'Sature', color: '#FF6B35', width: '90%' },
  declining: { label: 'Declin', color: '#FF4D6D', width: '100%' },
}

const badgeConfig: Record<TrendBadge, { label: string; icon: string; color: string }> = {
  high_controversy: { label: 'Controverse', icon: '⚡', color: '#FF4D6D' },
  viral_format: { label: 'Format Viral', icon: '🚀', color: '#00FFB2' },
  niche_growing: { label: 'Niche', icon: '📈', color: '#00D1FF' },
  evergreen: { label: 'Evergreen', icon: '🌿', color: '#4ECDC4' },
  early_signal: { label: 'Signal', icon: '🔔', color: '#FFD700' },
  saturated: { label: 'Sature', icon: '⚠️', color: '#FF6B35' },
  brand_opportunity: { label: 'Marque', icon: '💼', color: '#9B59B6' },
  storytelling: { label: 'Story', icon: '📖', color: '#F39C12' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

type ViewType = 'overview' | 'psycho' | 'socio' | 'algorithm' | 'content'

const viewTabs: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Vue globale', icon: <Eye size={14} /> },
  { id: 'psycho', label: 'Psycho', icon: <Brain size={14} /> },
  { id: 'socio', label: 'Socio', icon: <Users size={14} /> },
  { id: 'algorithm', label: 'Algo', icon: <BarChart3 size={14} /> },
  { id: 'content', label: 'Contenu', icon: <Video size={14} /> },
]

interface TrendIntelligenceCardProps {
  trend: TrendIntelligence
  onActionClick?: (action: ActionSuggestion) => void
}

export function TrendIntelligenceCard({ trend, onActionClick }: TrendIntelligenceCardProps) {
  const [activeView, setActiveView] = useState<ViewType>('overview')
  
  const emotion = emotionConfig[trend.emotion.primary]
  const saturation = saturationConfig[trend.saturation]
  
  return (
    <article 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(20,20,30,0.98), rgba(10,10,15,0.99))',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER - Nom + Score + Emotion
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 mb-1">
              {trend.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span>{trend.platform}</span>
              <span>•</span>
              <span>{trend.category}</span>
              <span>•</span>
              <span className={trend.growthRate > 0 ? 'text-emerald-400' : 'text-red-400'}>
                {trend.growthRate > 0 ? '+' : ''}{trend.growthRate}%
              </span>
            </div>
          </div>
          
          {/* Score circulaire */}
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0"
            style={{ 
              background: `conic-gradient(${emotion.color} ${trend.score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
            }}
          >
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(10,10,15,0.95)' }}
            >
              <span style={{ color: emotion.color }}>{trend.score}</span>
            </div>
          </div>
        </div>
        
        {/* Emotion + Saturation Row */}
        <div className="flex items-center gap-3">
          {/* Emotion Indicator */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: `${emotion.color}15`, border: `1px solid ${emotion.color}30` }}
          >
            <span className="text-base">{emotion.icon}</span>
            <span className="text-xs font-medium" style={{ color: emotion.color }}>
              {emotion.label}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-white/60">
              {trend.emotion.score}%
            </span>
          </div>
          
          {/* Saturation Mini */}
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: saturation.width, background: saturation.color }}
              />
            </div>
            <span className="text-[10px] font-bold" style={{ color: saturation.color }}>
              {saturation.label}
            </span>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          BADGES
      ═══════════════════════════════════════════════════════════════════ */}
      {trend.badges.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {trend.badges.map(badge => {
              const config = badgeConfig[badge]
              return (
                <span 
                  key={badge}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: `${config.color}15`, color: config.color }}
                >
                  {config.icon} {config.label}
                </span>
              )
            })}
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════
          VIEW TABS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 pb-2">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          {viewTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[10px] font-medium transition-all',
                activeView === tab.id 
                  ? 'bg-violet-500/20 text-violet-300' 
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          VIEW CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 pb-4">
        {activeView === 'overview' && (
          <OverviewView trend={trend} onActionClick={onActionClick} />
        )}
        {activeView === 'psycho' && (
          <PsychoView analysis={trend.analysis.psycho} semantics={trend.semantics} />
        )}
        {activeView === 'socio' && (
          <SocioView analysis={trend.analysis.socio} heatmap={trend.heatmap} />
        )}
        {activeView === 'algorithm' && (
          <AlgorithmView analysis={trend.analysis.algorithm} heatmap={trend.heatmap} saturation={trend.saturation} />
        )}
        {activeView === 'content' && (
          <ContentView analysis={trend.analysis.content} actions={trend.actions} onActionClick={onActionClick} />
        )}
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewView({ trend, onActionClick }: { trend: TrendIntelligence; onActionClick?: (action: ActionSuggestion) => void }) {
  const topAction = trend.actions[0]
  
  return (
    <div className="space-y-3">
      {/* Semantic Summary */}
      <div 
        className="p-3 rounded-xl"
        style={{ background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.1)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300 uppercase">Pourquoi ca marche</span>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">{trend.semantics.whyItWorks}</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <div className="text-lg font-bold text-violet-400">{trend.analysis.algorithm.engagementPotential}%</div>
          <div className="text-[9px] text-white/40 uppercase">Engagement</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <div className="text-lg font-bold text-cyan-400">{trend.analysis.algorithm.viralProbability}%</div>
          <div className="text-[9px] text-white/40 uppercase">Viralite</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <div className="text-lg font-bold text-yellow-400">{trend.timeWindow}</div>
          <div className="text-[9px] text-white/40 uppercase">Fenetre</div>
        </div>
      </div>
      
      {/* Top Action */}
      {topAction && (
        <button
          onClick={() => onActionClick?.(topAction)}
          className="w-full p-3 rounded-xl flex items-center gap-3 transition-all hover:scale-[1.01]"
          style={{ 
            background: 'linear-gradient(135deg, rgba(123,97,255,0.15), rgba(0,209,255,0.1))',
            border: '1px solid rgba(123,97,255,0.3)'
          }}
        >
          <Zap size={18} className="text-violet-400 flex-shrink-0" />
          <div className="flex-1 text-left">
            <div className="text-sm font-bold text-white">{topAction.action}</div>
            <div className="text-xs text-white/50">{topAction.angle}</div>
          </div>
          <ChevronRight size={16} className="text-white/30" />
        </button>
      )}
      
      {/* Heatmap Mini */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-white/5">
          <div className="text-[9px] text-white/40 uppercase mb-1">Top plateforme</div>
          <div className="text-xs text-white/80">{trend.heatmap.platforms[0]?.name || 'N/A'}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <div className="text-[9px] text-white/40 uppercase mb-1">Top audience</div>
          <div className="text-xs text-white/80">{trend.heatmap.audiences[0]?.name || 'N/A'}</div>
        </div>
      </div>
    </div>
  )
}

function PsychoView({ analysis, semantics }: { analysis: PsychoAnalysis; semantics: SemanticAnalysis }) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={14} className="text-purple-400" />
          <span className="text-xs font-bold text-purple-300 uppercase">Moteurs emotionnels</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {analysis.emotionalDrivers.map((driver, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-white/70">
              {driver}
            </span>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-white/5">
          <div className="text-[9px] text-white/40 uppercase mb-1">Biais psychologique</div>
          <div className="text-xs text-white/80">{semantics.psychologicalBias}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <div className="text-[9px] text-white/40 uppercase mb-1">Hook emotionnel</div>
          <div className="text-xs text-white/80">{semantics.emotionalHook}</div>
        </div>
      </div>
      
      <div className="p-3 rounded-xl bg-white/5">
        <div className="text-[9px] text-white/40 uppercase mb-1">Structure narrative</div>
        <div className="text-xs text-white/80">{semantics.storytellingStructure}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-white/5">
          <div className="text-[9px] text-white/40 uppercase mb-1">Element de conflit</div>
          <div className="text-xs text-white/80">{semantics.conflictElement}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <div className="text-[9px] text-white/40 uppercase mb-1">Facteur nouveaute</div>
          <div className="text-xs text-white/80">{semantics.noveltyFactor}</div>
        </div>
      </div>
    </div>
  )
}

function SocioView({ analysis, heatmap }: { analysis: SocioAnalysis; heatmap: EngagementHeatmap }) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Users size={14} className="text-teal-400" />
          <span className="text-xs font-bold text-teal-300 uppercase">Communautes impliquees</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {analysis.communities.map((community, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-white/70">
              {community}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-3 rounded-xl bg-white/5">
        <div className="text-[9px] text-white/40 uppercase mb-2">Distribution des audiences</div>
        <div className="space-y-2">
          {heatmap.audiences.map((audience, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-white/60 w-24 truncate">{audience.name}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-teal-400"
                  style={{ width: `${audience.percentage}%` }}
                />
              </div>
              <span className="text-xs text-white/40 w-8">{audience.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-3 rounded-xl bg-white/5">
        <div className="text-[9px] text-white/40 uppercase mb-1">Dynamique sociale</div>
        <div className="text-xs text-white/80">{analysis.socialDynamics}</div>
      </div>
    </div>
  )
}

function AlgorithmView({ analysis, heatmap, saturation }: { analysis: AlgorithmAnalysis; heatmap: EngagementHeatmap; saturation: SaturationLevel }) {
  const satConfig = saturationConfig[saturation]
  
  return (
    <div className="space-y-3">
      {/* Saturation Bar */}
      <div className="p-3 rounded-xl bg-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-white/40 uppercase">Niveau de saturation</span>
          <span className="text-xs font-bold" style={{ color: satConfig.color }}>{satConfig.label}</span>
        </div>
        <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
          <div className="absolute inset-0 flex">
            {Object.entries(saturationConfig).map(([key, config]) => (
              <div 
                key={key}
                className="flex-1 border-r border-black/20 last:border-0"
                style={{ background: key === saturation ? config.color : 'transparent' }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-white/30">
          <span>Early</span>
          <span>Rising</span>
          <span>Peak</span>
          <span>Sature</span>
          <span>Declin</span>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-white/5 text-center">
          <div className="text-2xl font-black text-violet-400">{analysis.engagementPotential}%</div>
          <div className="text-[9px] text-white/40 uppercase">Potentiel engagement</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 text-center">
          <div className="text-2xl font-black text-cyan-400">{analysis.viralProbability}%</div>
          <div className="text-[9px] text-white/40 uppercase">Probabilite virale</div>
        </div>
      </div>
      
      {/* Platform Heatmap */}
      <div className="p-3 rounded-xl bg-white/5">
        <div className="text-[9px] text-white/40 uppercase mb-2">Repartition par plateforme</div>
        <div className="space-y-2">
          {heatmap.platforms.map((platform, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-white/60 w-20">{platform.name}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${platform.percentage}%`,
                    background: platform.trend === 'up' ? '#00FFB2' : platform.trend === 'down' ? '#FF4D6D' : '#FFC107'
                  }}
                />
              </div>
              <span className="text-xs text-white/40 w-8">{platform.percentage}%</span>
              <span className="text-xs">
                {platform.trend === 'up' ? '↑' : platform.trend === 'down' ? '↓' : '→'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-3 rounded-xl bg-white/5">
        <div className="text-[9px] text-white/40 uppercase mb-1">Prediction du pic</div>
        <div className="text-xs text-white/80">{analysis.peakPrediction}</div>
      </div>
    </div>
  )
}

function ContentView({ analysis, actions, onActionClick }: { analysis: ContentAnalysis; actions: ActionSuggestion[]; onActionClick?: (action: ActionSuggestion) => void }) {
  return (
    <div className="space-y-3">
      {/* Best Formats */}
      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Video size={14} className="text-orange-400" />
          <span className="text-xs font-bold text-orange-300 uppercase">Formats recommandes</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {analysis.bestFormats.map((format, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-white/10 text-xs text-white/80 font-medium">
              {format}
            </span>
          ))}
        </div>
        <div className="mt-2 text-xs text-white/50">
          Duree ideale: <span className="text-white/80">{analysis.recommendedLength}</span>
        </div>
      </div>
      
      {/* Key Elements */}
      <div className="p-3 rounded-xl bg-white/5">
        <div className="text-[9px] text-white/40 uppercase mb-2">Elements cles a inclure</div>
        <div className="flex flex-wrap gap-1.5">
          {analysis.keyElements.map((element, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-xs text-emerald-400">
              ✓ {element}
            </span>
          ))}
        </div>
      </div>
      
      {/* Avoid List */}
      <div className="p-3 rounded-xl bg-white/5">
        <div className="text-[9px] text-white/40 uppercase mb-2">A eviter</div>
        <div className="flex flex-wrap gap-1.5">
          {analysis.avoidList.map((item, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-red-500/10 text-xs text-red-400">
              ✗ {item}
            </span>
          ))}
        </div>
      </div>
      
      {/* Action Suggestions */}
      <div className="space-y-2">
        <div className="text-[9px] text-white/40 uppercase">Actions suggerees</div>
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => onActionClick?.(action)}
            className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.01] flex items-center gap-3"
            style={{ 
              background: action.urgency === 'immediate' ? 'rgba(255,77,109,0.1)' : 'rgba(255,255,255,0.05)',
              border: action.urgency === 'immediate' ? '1px solid rgba(255,77,109,0.3)' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(123,97,255,0.2)' }}
            >
              <Zap size={14} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{action.action}</div>
              <div className="text-xs text-white/50 truncate">{action.angle}</div>
            </div>
            {action.urgency === 'immediate' && (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400">
                URGENT
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: Generate Intelligence from basic trend data
// ═══════════════════════════════════════════════════════════════════════════════

export function generateTrendIntelligence(basicTrend: {
  id: string
  name: string
  platform: string
  category: string
  score: number
  growthRate: number
  views?: number
  emotion?: string
  explanation?: string
  contentIdeas?: string[]
  timeWindow?: string
}): TrendIntelligence {
  const score = basicTrend.score
  const growthRate = basicTrend.growthRate
  
  // Determine emotion
  const emotionMap: Record<string, EmotionType> = {
    'surprise': 'curiosity',
    'curiosite': 'curiosity',
    'curiosity': 'curiosity',
    'colere': 'anger',
    'indignation': 'anger',
    'anger': 'anger',
    'joie': 'humor',
    'humor': 'humor',
    'peur': 'fear',
    'fear': 'fear',
    'inspiration': 'inspiration',
  }
  const primaryEmotion = emotionMap[basicTrend.emotion || 'curiosity'] || 'curiosity'
  
  // Determine saturation
  let saturation: SaturationLevel = 'early'
  if (score >= 95 && growthRate < 50) saturation = 'declining'
  else if (score >= 90 && growthRate < 100) saturation = 'saturated'
  else if (score >= 85) saturation = 'peak'
  else if (score >= 70 && growthRate > 100) saturation = 'rising'
  else saturation = 'early'
  
  // Generate badges
  const badges: TrendBadge[] = []
  if (growthRate > 200) badges.push('viral_format')
  if (score < 70 && growthRate > 150) badges.push('early_signal')
  if (primaryEmotion === 'anger') badges.push('high_controversy')
  if (saturation === 'saturated' || saturation === 'declining') badges.push('saturated')
  if (basicTrend.category === 'Tech' || basicTrend.category === 'Finance') badges.push('niche_growing')
  if (badges.length === 0) badges.push('storytelling')
  
  return {
    id: basicTrend.id,
    name: basicTrend.name,
    score: basicTrend.score,
    platform: basicTrend.platform,
    category: basicTrend.category,
    growthRate: basicTrend.growthRate,
    views: basicTrend.views,
    timeWindow: basicTrend.timeWindow || '6h',
    
    emotion: {
      primary: primaryEmotion,
      score: Math.min(100, Math.floor(score * 0.9 + Math.random() * 10)),
    },
    
    saturation,
    saturationScore: saturation === 'early' ? 20 : saturation === 'rising' ? 45 : saturation === 'peak' ? 75 : saturation === 'saturated' ? 90 : 95,
    
    badges,
    
    analysis: {
      psycho: {
        emotionalDrivers: ['FOMO', 'Curiosite', 'Validation sociale', 'Nouveaute'],
        psychologicalBias: 'Biais de confirmation et effet de groupe',
        emotionalHook: basicTrend.explanation || 'Tendance qui capte l\'attention',
      },
      socio: {
        communities: ['Gen Z', 'Createurs de contenu', 'Early adopters'],
        demographicFit: '18-35 ans, urbain, connecte',
        socialDynamics: 'Propagation par imitation et partage viral',
      },
      algorithm: {
        growthSpeed: growthRate > 200 ? 'explosive' : growthRate > 100 ? 'fast' : growthRate > 50 ? 'moderate' : 'slow',
        engagementPotential: Math.min(100, Math.floor(score * 0.8 + growthRate * 0.1)),
        viralProbability: Math.min(100, Math.floor(growthRate * 0.4 + score * 0.3)),
        peakPrediction: saturation === 'early' ? 'Dans 2-4 jours' : saturation === 'rising' ? 'Dans 12-24h' : 'Atteint ou depasse',
      },
      content: {
        bestFormats: ['Video courte', 'Reaction', 'Thread explicatif'],
        recommendedLength: basicTrend.platform === 'TikTok' ? '15-30 secondes' : '30-60 secondes',
        keyElements: ['Hook fort', 'Visuel impactant', 'Call-to-action'],
        avoidList: ['Contenu trop long', 'Manque de contexte', 'Clickbait excessif'],
      },
    },
    
    actions: [
      {
        type: 'video',
        action: `Cree une video ${basicTrend.platform === 'TikTok' ? '15-30s' : '30-60s'}`,
        urgency: saturation === 'peak' ? 'immediate' : saturation === 'rising' ? 'soon' : 'flexible',
        angle: basicTrend.contentIdeas?.[0] || `Mon analyse de "${basicTrend.name}"`,
      },
      {
        type: 'reaction',
        action: 'Fais une video reaction',
        urgency: 'soon',
        angle: `Ce que je pense de "${basicTrend.name}"`,
      },
      {
        type: 'analysis',
        action: 'Positionne-toi en expert',
        urgency: 'flexible',
        angle: `Explication complete de "${basicTrend.name}"`,
      },
    ],
    
    semantics: {
      whyItWorks: basicTrend.explanation || 'Cette tendance capte l\'attention par son actualite et son potentiel de partage.',
      psychologicalBias: 'Biais de confirmation + effet de nouveaute',
      storytellingStructure: 'Conflit → Resolution → Transformation',
      emotionalHook: 'Sentiment d\'urgence et de decouverte',
      conflictElement: 'Opposition entre ancienne et nouvelle vision',
      noveltyFactor: 'Angle inedit sur un sujet connu',
      relatability: 'Experience partagee par la majorite',
      statusSignaling: 'Etre a jour, informé, dans la tendance',
    },
    
    heatmap: {
      platforms: [
        { name: basicTrend.platform, percentage: 45, trend: 'up' },
        { name: 'Twitter', percentage: 25, trend: 'stable' },
        { name: 'Instagram', percentage: 20, trend: 'up' },
        { name: 'YouTube', percentage: 10, trend: 'stable' },
      ],
      audiences: [
        { name: '18-24 ans', percentage: 40 },
        { name: '25-34 ans', percentage: 35 },
        { name: '35-44 ans', percentage: 15 },
        { name: '45+ ans', percentage: 10 },
      ],
      formats: [
        { name: 'Video courte', percentage: 50 },
        { name: 'Image/Meme', percentage: 25 },
        { name: 'Thread/Texte', percentage: 15 },
        { name: 'Audio', percentage: 10 },
      ],
      peakHours: ['18h-20h', '12h-14h', '21h-23h'],
    },
  }
}
