'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, X, Loader2 } from 'lucide-react'
import { LiveCurve } from '@/components/algo/LiveCurve'
import { ViralScoreRing } from '@/components/algo/ViralScoreRing'
import { MomentumPill } from '@/components/algo/MomentumPill'
import { AlgoLoader } from '@/components/algo/AlgoLoader'
import { AlgoEmpty } from '@/components/algo/AlgoEmpty'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { AudienceScopeToggle } from '@/components/growth/AudienceScopeToggle'
import { cn } from '@/lib/utils'
import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'

interface SearchResult {
  id: string
  type: 'trend' | 'content' | 'news'
  title: string
  score?: number
  growthRate?: number
  growthTrend?: 'up' | 'down' | 'stable'
  platform?: string
  category?: string
  thumbnail?: string
  source?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()
    
    setLoading(true)
    
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=all&limit=20`, {
        signal: abortRef.current.signal
      })
      
      if (!res.ok) throw new Error('Search failed')
      
      const data = await res.json()
      
      // Transform API response to unified result format
      const combined: SearchResult[] = []
      
      // Add trends
      for (const trend of (data.trends || [])) {
        combined.push({
          id: trend.id,
          type: 'trend',
          title: trend.displayName || trend.name,
          score: Math.floor((trend.growth || 0) / 5 + 60),
          growthRate: trend.growth,
          growthTrend: trend.momentum === 'exploding' || trend.momentum === 'rising' ? 'up' : trend.momentum === 'stable' ? 'stable' : 'down',
          platform: undefined,
          category: trend.category
        })
      }
      
      // Add content
      for (const content of (data.content || [])) {
        combined.push({
          id: content.id,
          type: 'content',
          title: content.title,
          score: content.viralScore,
          growthRate: content.engagementRate,
          growthTrend: content.momentum === 'rising' ? 'up' : content.momentum === 'peak' ? 'stable' : 'down',
          platform: content.platform,
          category: content.category,
          thumbnail: content.thumbnail
        })
      }
      
      // Add news
      for (const news of (data.news || [])) {
        combined.push({
          id: news.id,
          type: 'news',
          title: news.title,
          score: news.viralScore,
          platform: news.sourceName,
          category: news.category,
          thumbnail: news.imageUrl,
          source: news.sourceName
        })
      }
      
      setResults(combined)
      setSearched(true)
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      console.error('[ALGO] Search error:', e)
      setResults([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(q.trim()), 300)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    setLoading(false)
    if (abortRef.current) abortRef.current.abort()
  }

  return (
    <main className="min-h-screen pb-20 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <LiveCurve rate={60} color="blue" opacity={0.06} />
        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs mb-4 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>
          <h1 className="text-2xl md:text-3xl font-black mb-2 text-[var(--color-text-primary)]">
            Rechercher
          </h1>
          <p className="text-sm mb-3 text-[var(--color-text-secondary)]">
            Trends, videos, topics, news
          </p>
          <AudienceScopeToggle />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Input */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl px-4 py-3 mb-6 transition-all border',
            query
              ? 'bg-[color-mix(in_srgb,var(--color-violet)_12%,var(--color-card))] border-[color-mix(in_srgb,var(--color-violet)_35%,var(--color-border))]'
              : 'bg-[var(--color-card)] border-[var(--color-border)]'
          )}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin text-violet-400" />
          ) : (
            <Search size={16} className="text-[var(--color-text-muted)]" />
          )}
          <input
            type="search"
            value={query}
            onChange={handleChange}
            placeholder="Rechercher une tendance, un sujet..."
            className="flex-1 bg-transparent text-sm outline-none text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)]"
            autoFocus
            aria-label="Rechercher"
          />
          {query && (
            <button 
              onClick={handleClear} 
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Initial State */}
        {!searched && !loading && (
          <p className="text-center py-12 text-sm text-[var(--color-text-muted)]">
            Tape au moins 2 caracteres pour lancer la recherche
          </p>
        )}

        {/* Loading */}
        {loading && <AlgoLoader message={ALGO_UI_LOADING.search} />}

        {/* No Results */}
        {searched && !loading && results.length === 0 && (
          <AlgoEmpty icon={'\u{1F50D}'} title={`Aucun resultat pour "${query}"`} />
        )}

        {/* Results */}
        {searched && !loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.type === 'trend' ? '/trends' : result.type === 'content' ? `/content/${result.id}` : '#'}
                className="flex items-center gap-4 p-4 algo-card-hit algo-interactive"
              >
                {/* Thumbnail or Score */}
                {result.thumbnail ? (
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={result.thumbnail}
                      alt={result.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : result.score ? (
                  <ViralScoreRing score={result.score} size={40} />
                ) : null}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-[var(--color-text-primary)]">
                    {result.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded',
                        result.type === 'trend' && 'bg-violet-500/15 text-violet-300',
                        result.type === 'content' && 'bg-sky-500/15 text-sky-300',
                        result.type === 'news' && 'bg-emerald-500/15 text-emerald-300'
                      )}
                    >
                      {result.type === 'trend' ? 'Trend' : result.type === 'content' ? 'Contenu' : 'News'}
                    </span>
                    {result.platform && <span>{result.platform}</span>}
                    {result.category && <span>{result.category}</span>}
                  </div>
                </div>
                
                {result.growthRate !== undefined && result.growthTrend && (
                  <MomentumPill value={Math.abs(result.growthRate)} trend={result.growthTrend} />
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
