'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AlgoHeroLogo } from '@/components/algo/AlgoHeroLogo'
import { ViralScoreRing } from '@/components/algo/ViralScoreRing'
import {
  buildViralAnalyzerFormDataDescription,
  buildViralAnalyzerFormDataUrl,
  type ViralQuickScanPlatform,
} from '@/lib/home/viral-quick-scan-request'
import { cn } from '@/lib/utils'
import { mapUserFacingApiError } from '@/lib/copy/api-error-fr'

function detectPlatformFromUrl(urlStr: string): ViralQuickScanPlatform {
  const u = urlStr.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('tiktok.com')) return 'tiktok'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter'
  if (u.includes('reddit.com')) return 'reddit'
  return 'youtube'
}

function potentialLabel(p: string): string {
  const m: Record<string, string> = {
    high: 'Fort potentiel',
    medium: 'Potentiel solide',
    low: 'À renforcer',
    'too-late': 'Timing serré',
    'too-early': 'Tôt dans le cycle',
  }
  return m[p] || 'À valider'
}

type QuickResult = {
  overallScore: number
  hookScore: number
  trendScore: number
  potential: string
  recommendations: { hook: string; thumbnail: string; timing: string }
}

export function HomeFirstMoments({
  trendTitle,
  trendScore,
  dataReady,
}: {
  trendTitle: string
  trendScore: number
  /** false tant que les flux home n'ont pas répondu · évite les puces vides */
  dataReady: boolean
}) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<QuickResult | null>(null)
  const [animScore, setAnimScore] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scoreIntervalRef = useRef<number | null>(null)

  const clearScoreAnim = useCallback(() => {
    if (scoreIntervalRef.current) {
      window.clearInterval(scoreIntervalRef.current)
      scoreIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      clearScoreAnim()
    }
  }, [clearScoreAnim])

  const chips = useMemo(() => {
    const list: { label: string; description: string; platform: ViralQuickScanPlatform }[] = []
    const safeTrend =
      dataReady &&
      trendTitle.length > 4 &&
      !/collecte|en cours|pending|sans titre|d[ée]tection des signaux|pr[ée]coces/i.test(
        trendTitle
      )
    if (safeTrend) {
      list.push({
        label:
          trendTitle.length > 42
            ? `Analyser : ${trendTitle.slice(0, 40)}…`
            : `Analyser : ${trendTitle}`,
        description: `Idée de contenu autour de : ${trendTitle}. Hook : question directe en 3 secondes, promesse claire.`,
        platform: 'youtube',
      })
    }
    list.push({
      label: 'Idée : 60s + 3 erreurs',
      description:
        'Vidéo 60s : les 3 erreurs les plus fréquentes sur ce type de sujet, format vertical, sous-titres, CTA simple.',
      platform: 'tiktok',
    })
    return list
  }, [trendTitle, dataReady])

  const runAnalyze = useCallback(
    async (
      mode: 'url' | 'description',
      payload: { url?: string; description?: string; platform: ViralQuickScanPlatform }
    ) => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const { signal } = abortRef.current
      clearScoreAnim()
      setBusy(true)
      setResult(null)
      setError(null)
      setAnimScore(0)
      try {
        const fd =
          mode === 'url' && payload.url
            ? buildViralAnalyzerFormDataUrl(payload.url, detectPlatformFromUrl(payload.url))
            : buildViralAnalyzerFormDataDescription(
                payload.description || '',
                payload.platform
              )
        const res = await fetch('/api/viral-analyzer', { method: 'POST', body: fd, signal })
        const data = (await res.json()) as QuickResult & { error?: string }
        if (!res.ok || (data as { error?: string }).error) {
          throw new Error((data as { error?: string }).error || 'Analyse indisponible')
        }
        const r: QuickResult = {
          overallScore: Math.round(Number(data.overallScore)),
          hookScore: Math.round(Number(data.hookScore)),
          trendScore: Math.round(Number(data.trendScore)),
          potential: String(data.potential || 'medium'),
          recommendations: {
            hook: data.recommendations?.hook || '',
            thumbnail: data.recommendations?.thumbnail || '',
            timing: data.recommendations?.timing || '',
          },
        }
        setResult(r)
        const target = r.overallScore
        const reduceMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) {
          setAnimScore(target)
        } else {
          let current = 0
          const step = Math.max(1, Math.ceil(target / 35))
          const id = window.setInterval(() => {
            current += step
            if (current >= target) {
              current = target
              window.clearInterval(id)
              scoreIntervalRef.current = null
            }
            setAnimScore(current)
          }, 18)
          scoreIntervalRef.current = id
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return
        setError(
          mapUserFacingApiError(
            e instanceof Error
              ? e.message
              : 'Impossible d\'analyser tout de suite. Vérifie le lien ou ouvre l\'analyseur complet.'
          )
        )
      } finally {
        setBusy(false)
      }
    },
    [clearScoreAnim]
  )

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [result])

  const algoTip = useMemo(() => {
    if (!result) return null
    if (result.overallScore >= 75) {
      return 'ALGO : fenêtre favorable, enchaîne avec un format plus court pour tester le hook.'
    }
    if (result.overallScore >= 55) {
      return 'ALGO : teste deux hooks différents avant de scaler la prod.'
    }
    return 'ALGO : angle niche + preuve rapide bat souvent le volume brut.'
  }, [result])

  return (
    <div
      id="accueil-algo"
      className="relative rounded-2xl border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-transparent px-4 py-8 sm:py-10 mb-8 sm:mb-10 overflow-hidden"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(123,97,255,0.5), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(0,209,255,0.15), transparent)',
        }}
      />

      <div className="relative text-center max-w-2xl mx-auto">
        <h1 className="text-[1.35rem] sm:text-2xl md:text-3xl lg:text-[1.75rem] font-bold tracking-tight leading-snug text-[var(--color-text-primary)] px-1 text-balance">
          Comprends ce qui va devenir viral avant les autres.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-md mx-auto">
          <span className="text-[var(--color-text-secondary)]">L&apos;appli silencieuse qui parle à tout le monde.</span>{' '}
          ALGO lit les signaux publics : tendances, formats, timing. Tu décides en secondes, pas au hasard.
        </p>

        <AlgoHeroLogo variant="mark" />

        <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-2 sm:gap-3">
          <a
            href="#scan-rapide"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] bg-gradient-to-br from-[var(--color-violet)] to-[#5b4ddb] shadow-[0_0_28px_color-mix(in_srgb,var(--color-violet)_25%,transparent)]"
          >
            Analyser un contenu
          </a>
          <Link
            href="/trends"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
          >
            Voir les tendances actuelles
          </Link>
          <Link
            href="/creator-mode"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
          >
            Trouver une idée virale
          </Link>
        </div>
      </div>

      <div id="scan-rapide" className="relative mt-10 max-w-xl mx-auto scroll-mt-24">
        <p
          id="scan-rapide-hint"
          className="text-center text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3"
        >
          Premier test, 10 à 20 secondes
        </p>
        <form
          aria-busy={busy}
          onSubmit={(e) => {
            e.preventDefault()
            if (!url.trim() || busy) return
            void runAnalyze('url', { url, platform: 'youtube' })
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <label htmlFor="scan-rapide-url" className="sr-only">
            Lien vidéo ou réseau social à analyser
          </label>
          <input
            id="scan-rapide-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            enterKeyHint="go"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Colle un lien YouTube, TikTok, Instagram…"
            aria-describedby={
              [error ? 'scan-rapide-error' : null, 'scan-rapide-hint'].filter(Boolean).join(' ') ||
              undefined
            }
            aria-invalid={error ? true : undefined}
            className="flex-1 min-w-0 px-4 py-3 rounded-xl text-sm bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/30"
          />
          <button
            type="submit"
            disabled={busy || !url.trim()}
            className="px-5 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-45 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] bg-gradient-to-br from-[var(--color-blue-neon)] to-[var(--color-violet)]"
          >
            {busy ? 'Analyse…' : 'Obtenir un score'}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              disabled={busy}
              onClick={() => void runAnalyze('description', { description: c.description, platform: c.platform })}
              className={cn(
                'text-left px-3 py-2 rounded-lg text-[11px] sm:text-xs font-medium border transition-colors max-w-[100%] sm:max-w-[280px]',
                'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {error ? (
          <p
            id="scan-rapide-error"
            className="mt-4 text-center text-sm text-amber-200/80"
            role="alert"
          >
            {error}{' '}
            <Link href="/viral-analyzer" className="underline underline-offset-2 text-cyan-300/90 hover:text-cyan-200">
              Ouvrir l’analyseur
            </Link>
          </p>
        ) : null}

        <div className="mt-4 min-h-[1.25rem]" aria-live="polite" aria-atomic="true">
          {busy ? (
            <p className="text-center text-xs text-[var(--color-text-tertiary)]">Lecture des signaux et calcul ALGO…</p>
          ) : null}
        </div>

        {result ? (
          <div
            ref={resultRef}
            role="status"
            aria-live="polite"
            className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-950/15 p-4 sm:p-5 text-left"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex justify-center sm:justify-start">
                <ViralScoreRing score={animScore} size={100} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  Score viral (estimation){' '}
                  <span className="text-emerald-300">{result.overallScore}</span>
                  <span className="text-[var(--color-text-tertiary)] font-normal text-sm">/100</span>
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                    {potentialLabel(result.potential)}
                  </span>
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-tertiary)] font-semibold">Pourquoi :</span>{' '}
                  hook {result.hookScore}, alignement tendance {result.trendScore}.{' '}
                  {result.recommendations.hook.slice(0, 140)}
                  {result.recommendations.hook.length > 140 ? '…' : ''}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-tertiary)] font-semibold">À tester :</span>{' '}
                  {result.recommendations.thumbnail.slice(0, 120)}
                  {result.recommendations.thumbnail.length > 120 ? '…' : ''}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-tertiary)] font-semibold">Timing :</span>{' '}
                  {result.recommendations.timing.slice(0, 100)}
                </p>
              </div>
            </div>

            {algoTip ? (
              <p className="mt-4 pt-4 border-t border-[var(--color-border)] text-xs text-cyan-200/70 leading-relaxed">{algoTip}</p>
            ) : null}

            <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
                Tu veux aller plus loin ?
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/viral-analyzer"
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-violet-500/20 text-violet-200 border border-violet-400/25 hover:bg-violet-500/30"
                >
                  Analyse complète + export
                </Link>
                <Link
                  href="/trends"
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]"
                >
                  Tendances liées
                </Link>
                <Link
                  href="/ai"
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]"
                >
                  ALGO AI, angle et plan
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {trendScore > 0 && dataReady ? (
        <p className="relative text-center text-[10px] text-[var(--color-text-muted)] mt-6">
          Signal live du jour ~ score tendance {Math.round(trendScore)}. Croise avec ton analyse ci-dessus.
        </p>
      ) : null}
    </div>
  )
}
