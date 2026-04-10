'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LiveCurve } from '@/components/algo/LiveCurve'
import { Badge } from '@/components/algo/Badge'
import { ViralScoreRing } from '@/components/algo/ViralScoreRing'
import { AlgoLoader } from '@/components/algo/AlgoLoader'
import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'
import { AlgoEmpty } from '@/components/algo/AlgoEmpty'

interface FailedContent {
  id: string
  title: string
  platform: string
  category: string
  score: number
  views: number
  whyFailed: string
  lesson: string
}

const FAILED_CONTENT: FailedContent[] = [
  {
    id: '1',
    title: 'Tentative de challenge viral qui a fait un flop',
    platform: 'TikTok',
    category: 'Challenge',
    score: 42,
    views: 1200,
    whyFailed: 'Le challenge etait trop complique a reproduire. Les gens n\'ont pas compris les regles en 15 secondes.',
    lesson: 'Un challenge viral doit etre simple, reproductible instantanement, et montrer clairement ce qu\'il faut faire.'
  },
  {
    id: '2',
    title: 'Video reaction publiee 48h trop tard',
    platform: 'YouTube',
    category: 'Reaction',
    score: 38,
    views: 3400,
    whyFailed: 'Le trailer etait deja analyse par 50 autres createurs. L\'audience avait deja vu les memes theories partout.',
    lesson: 'Dans le format reaction, le timing est roi. Mieux vaut une video rapide et imparfaite qu\'une video parfaite en retard.'
  },
  {
    id: '3',
    title: 'Post sur un scandale deja refroidi',
    platform: 'Twitter',
    category: 'Actualite',
    score: 35,
    views: 890,
    whyFailed: 'Le scandale etait deja dans la phase "conclusions" quand le post est sorti. Plus personne n\'etait interesse.',
    lesson: 'Les scandales ont une fenetre de 24-48h maximum. Apres, il faut soit une nouvelle info exclusive, soit passer a autre chose.'
  },
  {
    id: '4',
    title: 'Meme qui ciblait le mauvais public',
    platform: 'Instagram',
    category: 'Humour',
    score: 29,
    views: 450,
    whyFailed: 'L\'humour etait trop niche et referencait des elements que l\'audience de la page ne connaissait pas.',
    lesson: 'Connais ton audience. Un meme drole pour toi peut etre incomprehensible pour tes followers.'
  },
  {
    id: '5',
    title: 'Tutorial trop long sans structure',
    platform: 'YouTube',
    category: 'Education',
    score: 44,
    views: 2100,
    whyFailed: 'Pas de chapitres, pas de resume au debut, 20 minutes pour expliquer ce qui aurait pu tenir en 5.',
    lesson: 'Structure ton contenu. Dis ce que tu vas montrer, montre-le, resume ce que tu as montre. Respecte le temps de l\'audience.'
  },
]

export default function FailLabPage() {
  const [content] = useState<FailedContent[]>(FAILED_CONTENT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen pb-20 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <LiveCurve rate={30} color="blue" opacity={0.06} />
        <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs mb-4 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
          <h1 className="text-2xl md:text-3xl font-black mb-2 text-[var(--color-text-primary)]">
            Fail Lab
          </h1>
          <p className="text-sm max-w-lg text-[var(--color-text-secondary)]">
            Ces contenus avaient tout pour reussir, mais quelque chose a mal tourne. Apprends de leurs erreurs.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <AlgoLoader message={ALGO_UI_LOADING.failLabPage} />
        ) : content.length === 0 ? (
          <AlgoEmpty 
            icon={'\u{1F4A1}'} 
            title="Pas d'echecs a analyser pour le moment"
          />
        ) : (
          <div className="grid gap-4">
            {content.map((item, i) => (
              <article
                key={item.id}
                className={`rounded-xl p-5 transition-all algo-s${Math.min(i + 1, 6)}`}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <ViralScoreRing score={item.score} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: 'rgba(240,240,248,0.85)' }}>
                        {item.title}
                      </p>
                      <Badge type="AlmostViral" label="Presque viral" />
                    </div>
                    <div className="flex items-center gap-3 text-[10px]" style={{ color: 'rgba(240,240,248,0.4)' }}>
                      <span>{item.platform}</span>
                      <span style={{ color: 'rgba(240,240,248,0.2)' }}>|</span>
                      <span>{item.category}</span>
                      <span style={{ color: 'rgba(240,240,248,0.2)' }}>|</span>
                      <span>{item.views.toLocaleString('fr-FR')} vues</span>
                    </div>
                  </div>
                </div>
                
                {/* Why it failed */}
                <div 
                  className="rounded-xl p-4 mb-3"
                  style={{ 
                    background: 'rgba(255,77,109,0.08)',
                    border: '1px solid rgba(255,77,109,0.15)'
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#FF4D6D' }}>
                    Pourquoi ca a echoue
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,240,248,0.7)' }}>
                    {item.whyFailed}
                  </p>
                </div>
                
                {/* Lesson */}
                <div 
                  className="rounded-xl p-4"
                  style={{ 
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(240,240,248,0.5)' }}>
                    Lecon a retenir
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,240,248,0.6)' }}>
                    {item.lesson}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
