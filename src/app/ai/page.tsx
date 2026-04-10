'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BrainCircuit, Compass, Lightbulb, Radar, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AlgoLoader } from '@/components/algo/AlgoLoader'
import type { AlgoExpertiseLevel } from '@/lib/ai/algo-persona'
import { SITE_TRANSPARENCY_AI_CALIBRATION_HREF } from '@/lib/seo/site'
import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'
import {
  AI_TRANSPARENCY_EXPLAIN_LOCAL_LINES_FR,
  AI_TRANSPARENCY_LIMITS_FR,
  expertiseTransparencyLineFr,
} from '@/lib/ai/ai-transparency'

type AiMode = 'assistant' | 'analysis' | 'ideas' | 'exploration' | 'explain'

type AlgoAskStructuredClient = {
  options?: Array<{ title: string; upside?: string; downside?: string }>
  recommendedChoice?: { title: string; criterion?: string }
  nextStep?: string
}

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  mode: AiMode
  text: string
  at: string
  sources?: string[]
  confidence?: 'high' | 'medium' | 'low'
  /** Provenance des entrées + piste de lecture (réponse assistant uniquement). */
  transparencyLines?: string[]
  /** Présent si le modèle a rempli le contrat structuré (mode guide /api/ai/ask). */
  structured?: AlgoAskStructuredClient
}

type TrendLite = { title: string; score: number; category: string }
type TopContentLite = { title: string; category: string; viralScore: number; platform: string }

const HISTORY_KEY = 'algo_ai_history_v1'
const EXPERTISE_KEY = 'algo_ai_expertise_v1'

const MODE_LABELS: Record<AiMode, string> = {
  assistant: 'Guide stratégique',
  analysis: 'Analyse signal',
  ideas: 'Idées & angles',
  exploration: 'Veille & radar',
  explain: 'Scores & lecture',
}

const DEFAULT_PROMPTS: Record<AiMode, string[]> = {
  assistant: [
    'Que dois-je regarder en priorité ce matin ?',
    'Guide-moi vers les pages utiles selon mon objectif.',
    'Donne-moi un plan rapide pour capter une tendance.',
  ],
  analysis: [
    'Analyse ce titre: "Nouveau format de vidéo IA".',
    'Pourquoi ce contenu peut-il devenir viral ?',
    "Quels risques de saturation vois-tu sur ce sujet ?",
  ],
  ideas: [
    'Trouve 3 idées vidéo basées sur les signaux actuels.',
    'Propose un angle business pour une niche montante.',
    'Donne un hook fort pour TikTok + YouTube Shorts.',
  ],
  exploration: [
    'Montre-moi ce qui émerge avant le buzz.',
    'Quelles tendances sont les plus solides aujourd’hui ?',
    'Quelles opportunités créateur vois-tu cette semaine ?',
  ],
  explain: [
    'Explique un score viral de 82 simplement.',
    'Quelle différence entre score, momentum et fenêtre ?',
    'Comment interpréter un score élevé mais confiance moyenne ?',
  ],
}

function nowIso() {
  return new Date().toISOString()
}

function fallbackAnswer(mode: AiMode, question: string, country: string | null, expertise: AlgoExpertiseLevel): UiMessage {
  const base =
    "Connexion partielle aux modules : je ne vais pas inventer des signaux. Voici ce qui reste solide sans le moteur complet."
  const countryInfo = country ? ` Contexte pays : ${country}.` : ''
  const guidance =
    mode === 'analysis'
      ? ' Vérifie hook, format et fenêtre de publication avant de décider — ce triplet bat la plupart des intuitions.'
      : mode === 'ideas'
        ? ' Trois angles sûrs : réaction courte, tuto ultra-ciblé, comparatif « avant / après ». Choisis-en un et teste un seul hook.'
        : mode === 'exploration'
          ? ' Ouvre /trends puis /intelligence : tu verras si le signal tient ou s’il est bruit.'
          : mode === 'explain'
            ? ' Un score = indicateur ALGO, pas une sentence : croise-le avec timing, saturation et qualité du hook.'
            : ' Reformule avec objectif + plateforme + contrainte temps : je pourrai trancher plus net à la prochaine tentative.'
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    mode,
    text: `${base}${countryInfo}\n\n${guidance}\n\nTa question : ${question}`,
    at: nowIso(),
    confidence: 'low',
    sources: ['repli local ALGO'],
    transparencyLines: [
      'Réponse de secours : le modèle ou le réseau n’a pas pu répondre normalement.',
      expertiseTransparencyLineFr(expertise),
    ],
  }
}

export default function AlgoAiPage() {
  const [mode, setMode] = useState<AiMode>('assistant')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [sending, setSending] = useState(false)
  const [country, setCountry] = useState<string | null>(null)
  const [trends, setTrends] = useState<TrendLite[]>([])
  const [topContent, setTopContent] = useState<TopContentLite[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'partial'>('loading')
  const [expertise, setExpertise] = useState<AlgoExpertiseLevel>('intermediate')

  useEffect(() => {
    try {
      const ex = window.localStorage.getItem(EXPERTISE_KEY) as AlgoExpertiseLevel | null
      if (ex === 'novice' || ex === 'intermediate' || ex === 'advanced') setExpertise(ex)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(EXPERTISE_KEY, expertise)
    } catch {
      // ignore
    }
  }, [expertise])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as UiMessage[]
      setMessages(Array.isArray(parsed) ? parsed.slice(-18) : [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-18)))
  }, [messages])

  useEffect(() => {
    let cancelled = false
    const loadContext = async () => {
      try {
        const [ctxRes, trendsRes, videosRes] = await Promise.all([
          fetch('/api/context', { cache: 'no-store' }),
          fetch('/api/live-trends?region=FR', { cache: 'no-store' }),
          fetch('/api/youtube?country=FR', { cache: 'no-store' }),
        ])

        const ctx = (await ctxRes.json()) as { country?: string | null }
        const t = (await trendsRes.json()) as { data?: Array<Record<string, unknown>> }
        const v = (await videosRes.json()) as Array<Record<string, unknown>>
        if (cancelled) return

        setCountry(ctx.country ?? null)
        const tMapped = Array.isArray(t.data)
          ? t.data.slice(0, 6).map((x) => ({
              title: String(x.title || x.name || 'Signal'),
              score: Number(x.score) || 60,
              category: String(x.category || 'General'),
            }))
          : []
        const vMapped = Array.isArray(v)
          ? v.slice(0, 8).map((x) => ({
              title: String(x.title || 'Contenu'),
              category: String(x.category || 'General'),
              viralScore: Number(x.viralScore) || 70,
              platform: 'YouTube',
            }))
          : []

        setTrends(tMapped)
        setTopContent(vMapped)
        setStatus(tMapped.length > 0 || vMapped.length > 0 ? 'ready' : 'partial')
      } catch {
        if (cancelled) return
        setStatus('partial')
      }
    }
    void loadContext()
    return () => {
      cancelled = true
    }
  }, [])

  const quickPrompts = useMemo(() => DEFAULT_PROMPTS[mode], [mode])

  const ask = async () => {
    const question = input.trim()
    if (!question || sending) return
    const userMessage: UiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      mode,
      text: question,
      at: nowIso(),
    }
    const conversationHistory = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.text,
    }))
    setMessages((m) => [...m, userMessage])
    setInput('')
    setSending(true)

    try {
      let assistant: UiMessage | null = null

      if (mode === 'assistant') {
        const res = await fetch('/api/ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            context: { currentTrends: trends.map((t) => t.title), userCountry: country || 'FR' },
            conversationHistory,
            expertiseLevel: expertise,
          }),
        })
        const json = (await res.json()) as {
          success?: boolean
          answer?: string
          structured?: AlgoAskStructuredClient
          transparencyLines?: string[]
        }
        const baseLines = Array.isArray(json.transparencyLines) ? json.transparencyLines : []
        assistant = {
          id: crypto.randomUUID(),
          role: 'assistant',
          mode,
          text: json.answer || "Je n'ai pas pu générer une réponse complète.",
          at: nowIso(),
          confidence: status === 'ready' ? 'high' : 'medium',
          sources: ['/api/ai/ask', '/api/live-trends', '/api/context'],
          transparencyLines: [...baseLines, expertiseTransparencyLineFr(expertise)],
          structured: json.structured,
        }
      } else if (mode === 'analysis') {
        const res = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: question,
            description: `Contexte utilisateur: ${country || 'global'}`,
            platform: 'multi',
            category: 'trend',
            metrics: {},
            expertiseLevel: expertise,
          }),
        })
        const json = (await res.json()) as { analysis?: Record<string, unknown>; transparencyLines?: string[] }
        const a = json.analysis || {}
        assistant = {
          id: crypto.randomUUID(),
          role: 'assistant',
          mode,
          at: nowIso(),
          confidence: 'medium',
          sources: ['/api/ai/analyze'],
          transparencyLines: [
            ...(Array.isArray(json.transparencyLines) ? json.transparencyLines : []),
            expertiseTransparencyLineFr(expertise),
          ],
          text: [
            `Pourquoi viral: ${String(a.whyViral || 'Signal potentiellement aligné avec la conversation du moment.')}`,
            `Conseil créateur: ${String(a.creatorTip || 'Teste 2 hooks et 1 format court.')}`,
            `Risque: ${String(a.riskAssessment || 'peaking')}`,
            `Contexte: ${String(a.culturalContext || 'Contexte social en mouvement.')}`,
            `Potentiel: ${String(a.viralPotential ?? '?')}/100`,
          ].join('\n'),
        }
      } else if (mode === 'ideas') {
        const res = await fetch('/api/ai/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: question,
            description: question,
            format: 'short_video',
            platform: 'tiktok',
            targetAudience: country ? `audience ${country}` : 'global',
            expertiseLevel: expertise,
          }),
        })
        const json = (await res.json()) as {
          prediction?: { score?: number; confidence?: number; reasoning?: string; improvements?: string[] }
          transparencyLines?: string[]
        }
        const p = json.prediction
        assistant = {
          id: crypto.randomUUID(),
          role: 'assistant',
          mode,
          at: nowIso(),
          confidence: p?.confidence && p.confidence > 0.65 ? 'high' : 'medium',
          sources: ['/api/ai/predict', '/api/live-trends'],
          transparencyLines: [
            ...(Array.isArray(json.transparencyLines) ? json.transparencyLines : []),
            expertiseTransparencyLineFr(expertise),
          ],
          text: [
            `Score estimé: ${Math.round(p?.score || 60)}/100`,
            `Confiance: ${Math.round((p?.confidence || 0.6) * 100)}%`,
            `Raisonnement: ${p?.reasoning || 'Signal plausible, besoin de test créatif.'}`,
            `Améliorations: ${(p?.improvements || ['Hook plus net', 'CTA explicite']).join(' ; ')}`,
          ].join('\n'),
        }
      } else if (mode === 'exploration') {
        const res = await fetch('/api/ai/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userInterests: ['creator', 'viral', 'business'],
            userCountry: country || 'FR',
            topContent,
          }),
        })
        const json = (await res.json()) as {
          briefing?: {
            topSignals?: Array<{ title: string; viralScore: number; whyImportant: string }>
            predictedBreakouts?: string[]
            creatorOpportunities?: string[]
          }
          transparencyLines?: string[]
        }
        const b = json.briefing
        assistant = {
          id: crypto.randomUUID(),
          role: 'assistant',
          mode,
          at: nowIso(),
          confidence: status === 'ready' ? 'high' : 'medium',
          sources: ['/api/ai/briefing', '/api/youtube', '/api/live-trends'],
          transparencyLines: [
            ...(Array.isArray(json.transparencyLines) ? json.transparencyLines : []),
            expertiseTransparencyLineFr(expertise),
          ],
          text: [
            'Top signaux:',
            ...(b?.topSignals || []).slice(0, 3).map((s) => `- ${s.title} (${s.viralScore}) · ${s.whyImportant}`),
            'Breakouts probables:',
            ...(b?.predictedBreakouts || []).slice(0, 2).map((x) => `- ${x}`),
            'Opportunités créateur:',
            ...(b?.creatorOpportunities || []).slice(0, 2).map((x) => `- ${x}`),
          ].join('\n'),
        }
      } else {
        const n = Number(question.match(/\d+/)?.[0] || 0)
        const localScore = n > 100 ? 100 : n
        const explanation =
          localScore >= 80
            ? 'Signal fort: bon momentum, mais surveille la saturation.'
            : localScore >= 60
              ? 'Signal moyen: angle créatif et timing seront décisifs.'
              : 'Signal faible: utile pour niche spécifique, pas pour volume immédiat.'
        assistant = {
          id: crypto.randomUUID(),
          role: 'assistant',
          mode,
          at: nowIso(),
          confidence: 'medium',
          sources: ['règles ALGO locales'],
          transparencyLines: [...AI_TRANSPARENCY_EXPLAIN_LOCAL_LINES_FR, expertiseTransparencyLineFr(expertise)],
          text: `Lecture score ${localScore}/100:\n${explanation}\n\nPour décider: combine score + fenêtre + concurrence de format.`,
        }
      }

      setMessages((m) => [...m, assistant || fallbackAnswer(mode, question, country, expertise)])
    } catch {
      setMessages((m) => [...m, fallbackAnswer(mode, question, country, expertise)])
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen pb-20 bg-[var(--color-bg-primary)]">
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <Link href="/" className="text-xs text-white/45 hover:text-white/70">
          ← Retour
        </Link>
        <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/35 to-violet-950/25 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                <BrainCircuit size={28} className="text-cyan-300" />
                ALGO AI
              </h1>
              <p className="text-sm text-white/60 mt-1 max-w-2xl">
                Intelligence analytique du système : signaux, tranchage, prochain pas — calibrée sur la même ligne directrice
                que le reste d’ALGO (création, viralité, analyse, garde-fous). Les scores et briefings sont des indicateurs,
                pas des certitudes.
              </p>
            </div>
            <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full border', status === 'ready' ? 'text-emerald-300 border-emerald-400/35 bg-emerald-500/10' : 'text-amber-300 border-amber-400/30 bg-amber-500/10')}>
              {status === 'ready' ? 'Data live connectée' : status === 'partial' ? 'Data partielle' : 'Chargement'}
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-3">
            Transparence : si les APIs ou le modèle manquent de contexte, elle le dit et baisse la confiance — pas de mémoire
            fantôme, pas de sources inventées. Comportement ancré sur une directive interne sobre (pas de mysticisme, pas de
            promesses irréalistes sur les algorithmes des réseaux).{' '}
            <Link href={SITE_TRANSPARENCY_AI_CALIBRATION_HREF} className="text-cyan-400/85 hover:text-cyan-300 underline underline-offset-2">
              Calibrage &amp; familles de rôle
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 grid lg:grid-cols-[260px,1fr] gap-4 pb-8">
        <aside className="algo-surface rounded-xl p-3 space-y-2 h-fit">
          {(Object.keys(MODE_LABELS) as AiMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                mode === m ? 'bg-violet-500/20 text-violet-200 border border-violet-400/30' : 'text-white/60 hover:bg-white/6'
              )}
            >
              {MODE_LABELS[m]}
            </button>
          ))}

          <div className="pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)] space-y-2">
            <p className="font-semibold text-[var(--color-text-secondary)]">Ton niveau</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'novice' as const, label: 'Débutant' },
                  { id: 'intermediate' as const, label: 'Standard' },
                  { id: 'advanced' as const, label: 'Expert' },
                ] as const
              ).map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setExpertise(x.id)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors',
                    expertise === x.id
                      ? 'border-violet-400/40 bg-violet-500/15 text-violet-200'
                      : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  )}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/35 leading-snug">
              Tous les modes qui appellent le modèle (guide, analyse, idées, veille) calibrent jargon et densité sur ce réglage.
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)] space-y-1">
            <p className="font-semibold text-[var(--color-text-secondary)]">Actions rapides</p>
            <Link href="/viral-analyzer" className="block transition-colors duration-200 hover:text-[var(--color-text-primary)]">Analyser un lien</Link>
            <Link href="/trends" className="block transition-colors duration-200 hover:text-[var(--color-text-primary)]">Explorer tendances</Link>
            <Link href="/intelligence" className="block transition-colors duration-200 hover:text-[var(--color-text-primary)]">Radar intelligence</Link>
            <Link href="/intelligence#algo-core" className="block transition-colors duration-200 hover:text-[var(--color-text-primary)]">Core Intelligence (batch)</Link>
          </div>
        </aside>

        <div className="algo-surface rounded-xl p-3 sm:p-4 flex flex-col min-h-[70vh]">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setInput(p)}
                className="algo-interactive text-[11px] px-2.5 py-1.5 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] transition-colors duration-200"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full grid place-items-center text-center text-white/40 text-sm px-4">
                <div>
                  <Sparkles size={22} className="mx-auto mb-2 text-cyan-300/70" />
                  <p className="text-white/55 font-medium mb-1">Une question nette → une réponse structurée.</p>
                  <p className="text-[12px] text-white/40 max-w-md mx-auto">
                    Elle conclut d’abord, explique vite, puis te donne une action. Choisis un mode ou laisse le guide
                    t’orienter.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <article key={msg.id} className={cn('rounded-lg p-3 border', msg.role === 'assistant' ? 'border-cyan-500/20 bg-cyan-950/20' : 'border-[var(--color-border)] bg-[var(--color-card)]')}>
                  <header className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-white/45">
                      {msg.role === 'assistant' ? `ALGO AI · ${MODE_LABELS[msg.mode]}` : 'Toi'}
                    </div>
                    {msg.confidence ? (
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', msg.confidence === 'high' ? 'text-emerald-300 bg-emerald-500/10' : msg.confidence === 'medium' ? 'text-amber-300 bg-amber-500/10' : 'text-rose-300 bg-rose-500/10')}>
                        confiance {msg.confidence}
                      </span>
                    ) : null}
                  </header>
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{msg.text}</p>
                  {msg.role === 'assistant' &&
                  msg.mode === 'assistant' &&
                  msg.structured &&
                  ((msg.structured.options?.length ?? 0) > 0 ||
                    msg.structured.recommendedChoice ||
                    msg.structured.nextStep) ? (
                    <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-950/25 p-3 space-y-2 text-[12px]">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-violet-200/90">
                        Décision & pistes
                      </p>
                      {msg.structured.options && msg.structured.options.length > 0 ? (
                        <ul className="space-y-2 text-white/75">
                          {msg.structured.options.map((opt, i) => (
                            <li key={i} className="border-l border-violet-400/30 pl-2">
                              <span className="font-semibold text-white/90">{opt.title}</span>
                              {opt.upside ? (
                                <p className="text-[11px] text-emerald-200/80 mt-0.5">+ {opt.upside}</p>
                              ) : null}
                              {opt.downside ? (
                                <p className="text-[11px] text-amber-200/75 mt-0.5">− {opt.downside}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {msg.structured.recommendedChoice ? (
                        <p className="text-white/80 text-[12px]">
                          <span className="text-violet-200/90 font-semibold">Piste privilégiée : </span>
                          {msg.structured.recommendedChoice.title}
                          {msg.structured.recommendedChoice.criterion ? (
                            <span className="text-white/55"> — {msg.structured.recommendedChoice.criterion}</span>
                          ) : null}
                        </p>
                      ) : null}
                      {msg.structured.nextStep ? (
                        <p className="text-[11px] text-cyan-200/85 border-t border-white/10 pt-2 mt-1">
                          <span className="font-semibold text-cyan-300/90">Prochain pas : </span>
                          {msg.structured.nextStep}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {msg.role === 'assistant' && msg.transparencyLines && msg.transparencyLines.length > 0 ? (
                    <details className="mt-3 rounded-lg border border-cyan-500/15 bg-black/25 p-2.5 group">
                      <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-[11px] font-semibold text-cyan-200/95 hover:text-cyan-100 [&::-webkit-details-marker]:hidden">
                        <span>Contexte utilisé & limites</span>
                        <span className="text-[10px] text-white/35 font-normal group-open:hidden">Afficher</span>
                        <span className="text-[10px] text-white/35 font-normal hidden group-open:inline">Masquer</span>
                      </summary>
                      <ul className="mt-2 space-y-1.5 text-[11px] text-white/60">
                        {msg.transparencyLines.map((line, i) => (
                          <li key={i} className="leading-relaxed border-l border-cyan-500/20 pl-2">
                            {line}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2.5 text-[10px] text-white/45 leading-relaxed border-t border-white/10 pt-2">
                        {AI_TRANSPARENCY_LIMITS_FR}
                      </p>
                      <Link
                        href={SITE_TRANSPARENCY_AI_CALIBRATION_HREF}
                        className="inline-block mt-2 text-[10px] font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                      >
                        Calibrage IA & doctrine →
                      </Link>
                    </details>
                  ) : null}
                  {msg.sources?.length ? (
                    <p className="mt-2 text-[10px] text-white/35">Sources: {msg.sources.join(' · ')}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>

          <div className="mt-3 space-y-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              placeholder={`${MODE_LABELS[mode]} — objectif, plateforme, contrainte (une question précise)...`}
              className={cn('algo-input-field resize-y min-h-[5.5rem]')}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                {mode === 'assistant' && <Compass size={12} />}
                {mode === 'analysis' && <Radar size={12} />}
                {mode === 'ideas' && <Lightbulb size={12} />}
                Mode {MODE_LABELS[mode]}{country ? ` · ${country}` : ''}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] transition-colors"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={() => void ask()}
                  disabled={sending || !input.trim()}
                  className="text-xs px-4 py-2 rounded-lg border border-[color-mix(in_srgb,var(--color-violet)_40%,var(--color-border))] bg-[var(--color-violet-muted)] text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-violet)_32%,transparent)] disabled:opacity-50 transition-colors"
                >
                  {sending ? 'Analyse…' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
          {sending ? <AlgoLoader message={ALGO_UI_LOADING.aiSending} /> : null}
        </div>
      </section>
    </main>
  )
}
