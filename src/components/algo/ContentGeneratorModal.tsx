'use client'

import { useState } from 'react'
import { X, Sparkles, Copy, Check, RefreshCw, Lightbulb, MessageSquare, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface GeneratedContent {
  idea: string
  hook: string
  angle: string
  format: string
  exampleTitles: string[]
}

interface ContentGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  trendTitle: string
  category: string
  emotion?: string
  platform?: string
}

// Simulated AI generation (in production, this would call an API)
function generateContent(trend: string, category: string, emotion: string): GeneratedContent {
  const hooks = [
    `Personne ne te dit ça sur ${trend}…`,
    `J'ai découvert quelque chose de choquant sur ${trend}`,
    `Voici pourquoi tout le monde parle de ${trend}`,
    `La vérité sur ${trend} que les médias cachent`,
    `POV : tu découvres ${trend} pour la première fois`,
  ]
  
  const angles = [
    `Analyse critique avec ton point de vue personnel`,
    `Réaction authentique en temps réel`,
    `Explication simple pour les débutants`,
    `Comparaison avec des situations similaires`,
    `Story-time basé sur ton expérience`,
  ]
  
  const formats = ['Face cam reaction', 'Voice-over + montage', 'POV immersif', 'Duet/Stitch', 'Green screen']
  
  const ideas = [
    `Fais une réaction spontanée à ${trend} en montrant ton écran`,
    `Explique ${trend} comme si tu parlais à un ami qui ne connaît rien`,
    `Compare ${trend} avec ce qui s'est passé l'année dernière`,
    `Raconte une anecdote personnelle liée à ${trend}`,
    `Demonte les fake news autour de ${trend}`,
  ]
  
  return {
    idea: ideas[Math.floor(Math.random() * ideas.length)],
    hook: `${hooks[Math.floor(Math.random() * hooks.length)]} [${emotion}]`,
    angle: `${angles[Math.floor(Math.random() * angles.length)]} (${category})`,
    format: formats[Math.floor(Math.random() * formats.length)],
    exampleTitles: [
      `${trend} - Ma reaction honnete`,
      `J'ai teste ${trend} et voici ce qui s'est passe`,
      `La vérité sur ${trend} (personne n'en parle)`,
    ],
  }
}

export function ContentGeneratorModal({
  isOpen,
  onClose,
  trendTitle,
  category,
  emotion = 'surprise',
  platform = 'TikTok',
}: ContentGeneratorModalProps) {
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200))
    const generated = generateContent(trendTitle, category, emotion)
    setContent(generated)
    setIsGenerating(false)
  }
  
  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,20,30,0.98), rgba(15,15,25,0.98))',
          border: '1px solid rgba(123,97,255,0.3)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(123,97,255,0.3), rgba(0,209,255,0.2))' }}
            >
              <Sparkles size={20} className="text-violet-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white/90">Generateur de contenu</h2>
              <p className="text-[10px] text-white/40">Propulse par l&apos;IA ALGO</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={18} className="text-white/50" />
          </button>
        </div>
        
        {/* Trend context */}
        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Tendance selectionnee</p>
          <p className="text-sm font-semibold text-white/80 line-clamp-2">{trendTitle}</p>
          <div className="flex gap-2 mt-2">
            <span 
              className="px-2 py-0.5 rounded-full text-[9px] font-medium"
              style={{ background: 'rgba(123,97,255,0.15)', color: 'rgba(123,97,255,0.9)' }}
            >
              {category}
            </span>
            <span 
              className="px-2 py-0.5 rounded-full text-[9px] font-medium"
              style={{ background: 'rgba(0,209,255,0.12)', color: 'rgba(0,209,255,0.9)' }}
            >
              {platform}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {!content && !isGenerating && (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(123,97,255,0.1)' }}
              >
                <Lightbulb size={28} className="text-violet-400" />
              </div>
              <p className="text-sm text-white/60 mb-4">
                Clique pour générer une idée de contenu basée sur cette tendance
              </p>
              <Button
                variant="primary"
                size="lg"
                icon={Sparkles}
                onClick={handleGenerate}
              >
                Générer une idée
              </Button>
            </div>
          )}
          
          {isGenerating && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin mx-auto mb-4" />
              <p className="text-sm text-white/60">Analyse de la tendance...</p>
              <p className="text-[10px] text-white/30 mt-1">Génération de l&apos;idée optimale</p>
            </div>
          )}
          
          {content && !isGenerating && (
            <div className="space-y-4">
              {/* Idea */}
              <div 
                className="rounded-xl p-4"
                style={{ background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.15)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={14} className="text-violet-400" />
                    <span className="text-[10px] font-bold text-white/50 uppercase">Idee de contenu</span>
                  </div>
                  <button 
                    onClick={() => handleCopy(content.idea, 'idea')}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {copiedField === 'idea' ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} className="text-white/40" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{content.idea}</p>
              </div>
              
              {/* Hook */}
              <div 
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.15)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-amber-400" />
                    <span className="text-[10px] font-bold text-white/50 uppercase">Hook d&apos;accroche</span>
                  </div>
                  <button 
                    onClick={() => handleCopy(content.hook, 'hook')}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {copiedField === 'hook' ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} className="text-white/40" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-amber-300/90 font-medium italic">&quot;{content.hook}&quot;</p>
              </div>
              
              {/* Format + Angle */}
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.15)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Video size={12} className="text-cyan-400" />
                    <span className="text-[9px] font-bold text-white/40 uppercase">Format</span>
                  </div>
                  <p className="text-[11px] text-cyan-300/90 font-medium">{content.format}</p>
                </div>
                <div 
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(0,209,178,0.08)', border: '1px solid rgba(0,209,178,0.15)' }}
                >
                  <span className="text-[9px] font-bold text-white/40 uppercase">Angle narratif</span>
                  <p className="text-[11px] text-emerald-300/90 font-medium mt-1">{content.angle}</p>
                </div>
              </div>
              
              {/* Example titles */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Exemples de titres</p>
                <div className="space-y-1.5">
                  {content.exampleTitles.map((title, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <span className="text-[11px] text-white/60">{title}</span>
                      <button 
                        onClick={() => handleCopy(title, `title-${i}`)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                      >
                        {copiedField === `title-${i}` ? (
                          <Check size={12} className="text-green-400" />
                        ) : (
                          <Copy size={12} className="text-white/30" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Regenerate */}
              <Button
                variant="ghost"
                size="md"
                className="w-full"
                icon={RefreshCw}
                onClick={handleGenerate}
              >
                Régénérer une autre idée
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
