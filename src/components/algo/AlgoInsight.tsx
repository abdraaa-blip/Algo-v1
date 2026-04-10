'use client'

import { useState, useEffect } from 'react'
import { Brain, Sparkles, TrendingUp, Target, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlgoInsightProps {
  title: string
  category?: string
  score?: number
  compact?: boolean
  className?: string
}

// ALGO's signature phrases and personality
const ALGO_PHRASES = {
  intro: [
    "ALGO detecte un signal fort.",
    "Mon analyse indique une opportunite.",
    "Les donnees convergent vers un pattern interessant.",
    "Signal viral capte.",
    "Pattern detecte dans les donnees.",
  ],
  urgency: {
    critical: [
      "Fenetre critique. Action immediate requise.",
      "Le pic approche. C'est maintenant ou jamais.",
      "Saturation dans moins de 6h. Agis maintenant.",
    ],
    high: [
      "Timing optimal dans les prochaines heures.",
      "La vague monte. Position-toi avant les autres.",
      "Momentum ideal pour te demarquer.",
    ],
    medium: [
      "Bonne fenetre d'opportunite.",
      "Le sujet gagne en traction. Prepare ton contenu.",
      "Signal stable. Tu as le temps de bien faire.",
    ],
    low: [
      "Tendance emergente a surveiller.",
      "Signal precoce detecte. Avantage first-mover possible.",
      "A monitorer pour les prochaines heures.",
    ]
  },
  why: [
    "Voici pourquoi ca fonctionne:",
    "L'analyse revele:",
    "Les patterns montrent:",
    "Ce qui fait la difference:",
  ],
  action: [
    "Ce que tu dois faire maintenant:",
    "Action recommandee:",
    "Pour maximiser ton impact:",
    "Ma recommandation:",
  ],
  confidence: {
    high: "Confiance elevee sur cette prediction.",
    medium: "Niveau de confiance moyen - plusieurs scenarios possibles.",
    low: "Signal faible - a confirmer avec d'autres indicateurs.",
  }
}

// Get random phrase from array
function getPhrase(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)]
}

// Determine urgency level from score
function getUrgencyLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 90) return 'critical'
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

// Generate AI insight based on category and score
function generateInsight(title: string, category?: string, score?: number): {
  intro: string
  why: string
  action: string
  urgency: string
  confidence: string
  tips: string[]
} {
  const urgencyLevel = getUrgencyLevel(score || 50)
  
  const categoryInsights: Record<string, { why: string; action: string; tips: string[] }> = {
    Tech: {
      why: "Les sujets tech generent de l'engagement car ils impactent directement la vie quotidienne. Les gens cherchent a comprendre et anticiper.",
      action: "Fais une reaction rapide ou un tutoriel. Le format 'Ce que ca change pour toi' fonctionne tres bien.",
      tips: ["Simplifie le jargon technique", "Montre l'impact concret", "Donne ton avis personnel"]
    },
    Sport: {
      why: "Le sport cree des emotions fortes et une communaute engagee. Les gens veulent partager leurs reactions.",
      action: "Reagis a chaud pendant ou juste apres l'evenement. L'authenticite prime sur la qualite.",
      tips: ["Poste pendant le match", "Montre ta vraie reaction", "Interagis avec les commentaires"]
    },
    Cinema: {
      why: "Les fans de cinema sont passionnes et adorent les theories et analyses. Le contenu a une duree de vie plus longue.",
      action: "Analyse, theories, ou reactions au trailer. Le format 'X choses que tu as rate' marche bien.",
      tips: ["Evite les spoilers majeurs", "Fais des predictions audacieuses", "Compare avec d'autres oeuvres"]
    },
    Politique: {
      why: "Les sujets politiques generent des debats passionnes. L'engagement est eleve mais le ton compte.",
      action: "Resume factuel ou analyse des consequences. Reste informatif plutot qu'opinione.",
      tips: ["Reste factuel", "Evite la polemique gratuite", "Apporte de la valeur ajoutee"]
    },
    Divertissement: {
      why: "Le divertissement est viral par nature. Les gens veulent participer et se sentir dans le coup.",
      action: "Participe au trend avec ta touche personnelle. La creativite et l'humour priment.",
      tips: ["Ajoute ta personnalite", "Fais-le rapidement", "N'aie pas peur d'etre creatif"]
    },
    Finance: {
      why: "Les sujets financiers touchent directement le portefeuille des gens. Ils cherchent des conseils et de la reassurance.",
      action: "Explique ce qui se passe et ce que ca signifie. Evite les conseils d'investissement directs.",
      tips: ["Simplifie les concepts", "Donne du contexte historique", "Reste prudent sur les predictions"]
    },
    default: {
      why: "Ce sujet genere de l'interet car il touche a des preoccupations actuelles de l'audience.",
      action: "Cree du contenu qui apporte de la valeur - information, divertissement, ou inspiration.",
      tips: ["Connais ton audience", "Apporte ta perspective unique", "Sois authentique"]
    }
  }
  
  const insight = categoryInsights[category || 'default'] || categoryInsights.default
  
  return {
    intro: getPhrase(ALGO_PHRASES.intro),
    why: insight.why,
    action: insight.action,
    urgency: getPhrase(ALGO_PHRASES.urgency[urgencyLevel]),
    confidence: score && score >= 80 ? ALGO_PHRASES.confidence.high : 
                score && score >= 60 ? ALGO_PHRASES.confidence.medium : 
                ALGO_PHRASES.confidence.low,
    tips: insight.tips
  }
}

export function AlgoInsight({ title, category, score = 70, compact = false, className }: AlgoInsightProps) {
  const [insight, setInsight] = useState<ReturnType<typeof generateInsight> | null>(null)
  const [isTyping, setIsTyping] = useState(true)
  
  useEffect(() => {
    // Simulate AI "thinking" effect
    setIsTyping(true)
    const timer = setTimeout(() => {
      setInsight(generateInsight(title, category, score))
      setIsTyping(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [title, category, score])
  
  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "bg-gradient-to-r from-violet-500/10 to-cyan-500/5",
          "border border-violet-500/20",
          className
        )}
      >
        <Brain size={14} className="text-violet-400 shrink-0" />
        <p className="text-[11px] text-white/70 line-clamp-1">
          {isTyping ? "ALGO analyse..." : insight?.urgency}
        </p>
      </div>
    )
  }
  
  return (
    <div 
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-[#0d0d1a] via-[#0a0a12] to-[#080810]",
        "border border-violet-500/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(123,97,255,0.2), rgba(0,209,255,0.1))' }}
        >
          <Brain size={20} className="text-violet-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Analyse ALGO</h3>
            <Sparkles size={12} className="text-violet-400" />
          </div>
          <p className="text-[10px] text-white/40">Intelligence artificielle</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {isTyping ? (
          <div className="flex items-center gap-2 text-white/50">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">ALGO analyse les signaux...</span>
          </div>
        ) : insight && (
          <>
            {/* Intro */}
            <p className="text-xs text-violet-300 font-medium">{insight.intro}</p>
            
            {/* Urgency Alert */}
            <div 
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{ 
                background: score >= 80 ? 'rgba(255,77,109,0.1)' : score >= 60 ? 'rgba(255,193,7,0.1)' : 'rgba(0,209,255,0.1)',
                border: `1px solid ${score >= 80 ? 'rgba(255,77,109,0.3)' : score >= 60 ? 'rgba(255,193,7,0.3)' : 'rgba(0,209,255,0.3)'}`
              }}
            >
              <Zap size={16} className={score >= 80 ? 'text-red-400' : score >= 60 ? 'text-yellow-400' : 'text-cyan-400'} />
              <p className="text-xs text-white/80">{insight.urgency}</p>
            </div>
            
            {/* Why it works */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">Pourquoi ca marche</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{insight.why}</p>
            </div>
            
            {/* What to do */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-violet-400" />
                <span className="text-xs font-bold text-violet-300">Ce que tu dois faire</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{insight.action}</p>
            </div>
            
            {/* Tips */}
            <div className="space-y-1.5">
              {insight.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-white/30 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-white/50">{tip}</span>
                </div>
              ))}
            </div>
            
            {/* Confidence */}
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-white/30 italic">{insight.confidence}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
