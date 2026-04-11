'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { 
  Search, Zap, TrendingUp, Sparkles, Video, Newspaper, 
  User, Settings, Bell, Bookmark, Film, Info,
  ArrowRight, Command, Clock, Flame, Mic, BrainCircuit, Scale,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SITE_TRANSPARENCY_AI_CALIBRATION_HREF } from '@/lib/seo/site'
import { useDebounce } from '@/hooks/useDebounce'

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void
  category: 'navigation' | 'search' | 'trending' | 'recent' | 'action'
  keywords?: string[]
  score?: number
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trendingNow, setTrendingNow] = useState<Array<{ keyword: string; score: number }>>([])
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debouncedQuery = useDebounce(query, 150)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('algo_recent_searches')
      if (saved) setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('/api/realtime/trends?limit=5')
        const data = await res.json()
        if (data.trends) {
          setTrendingNow(data.trends.map((t: { keyword: string; score: { overall: number } }) => ({
            keyword: t.keyword,
            score: t.score.overall
          })))
        }
      } catch {
        /* ignore */
      }
    }
    if (isOpen) fetchTrending()
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setSelectedIndex(0) }
  }, [isOpen])

  const navigate = useCallback((path: string) => {
    setIsOpen(false)
    router.push(path)
  }, [router])

  const saveSearch = useCallback((term: string) => {
    if (!term.trim()) return
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('algo_recent_searches', JSON.stringify(updated))
  }, [recentSearches])

  const allCommands = useMemo<CommandItem[]>(() => [
    { id: 'nav-home', title: 'Accueil', subtitle: 'Page principale', icon: <Zap size={18} />, action: () => navigate('/'), category: 'navigation', keywords: ['home', 'now'] },
    { id: 'nav-trends', title: 'Tendances', subtitle: 'Ce qui explose', icon: <TrendingUp size={18} />, action: () => navigate('/trends'), category: 'navigation', keywords: ['trends', 'viral'] },
    { id: 'nav-stars', title: 'Stars montantes', subtitle: 'Artistes du moment', icon: <Sparkles size={18} />, action: () => navigate('/rising-stars'), category: 'navigation', keywords: ['stars', 'artistes'] },
    { id: 'nav-videos', title: 'Videos', subtitle: 'Contenus video', icon: <Video size={18} />, action: () => navigate('/videos'), category: 'navigation', keywords: ['videos', 'tiktok'] },
    { id: 'nav-movies', title: 'Films et Series', subtitle: 'A regarder', icon: <Film size={18} />, action: () => navigate('/movies'), category: 'navigation', keywords: ['films', 'movies', 'series', 'netflix'] },
    { id: 'nav-news', title: 'Actualités', subtitle: 'Les dernières infos', icon: <Newspaper size={18} />, action: () => navigate('/news'), category: 'navigation', keywords: ['news', 'actualités', 'actualites', 'données', 'donnees'] },
    { id: 'nav-creator', title: 'Mode Createur', subtitle: 'Outils pour creer', icon: <Mic size={18} />, action: () => navigate('/creator-mode'), category: 'navigation', keywords: ['creator'] },
    { id: 'nav-watchlist', title: 'A regarder', subtitle: 'Tes favoris', icon: <Bookmark size={18} />, action: () => navigate('/watchlist'), category: 'navigation', keywords: ['watchlist'] },
    { id: 'nav-profile', title: 'Profil', subtitle: 'Mon compte', icon: <User size={18} />, action: () => navigate('/profile'), category: 'navigation', keywords: ['profile'] },
    { id: 'nav-ai', title: 'ALGO AI', subtitle: 'Guide & analyse', icon: <BrainCircuit size={18} />, action: () => navigate('/ai'), category: 'navigation', keywords: ['ai', 'assistant', 'chat', 'intelligence'] },
    { id: 'nav-transparency', title: 'Transparence', subtitle: 'Données, scores & calibrage IA', icon: <Scale size={18} />, action: () => navigate(SITE_TRANSPARENCY_AI_CALIBRATION_HREF), category: 'navigation', keywords: ['transparence', 'données', 'donnees', 'sources', 'calibrage', 'scores'] },
    { id: 'nav-about', title: 'A propos d\'ALGO', subtitle: 'Notre histoire', icon: <Info size={18} />, action: () => navigate('/about'), category: 'navigation', keywords: ['about', 'histoire', 'story', 'mission'] },
    { id: 'action-notifications', title: 'Notifications', icon: <Bell size={18} />, action: () => navigate('/profile?tab=notifications'), category: 'action', keywords: ['notifications'] },
    { id: 'action-settings', title: 'Parametres', icon: <Settings size={18} />, action: () => navigate('/profile?tab=settings'), category: 'action', keywords: ['settings'] },
    ...trendingNow.map((t, i) => ({
      id: `trending-${i}`,
      title: t.keyword,
      subtitle: `Score ${t.score}`,
      icon: <Flame size={18} className="text-orange-400" />,
      action: () => { saveSearch(t.keyword); navigate(`/search?q=${encodeURIComponent(t.keyword)}`) },
      category: 'trending' as const,
      score: t.score,
      keywords: [t.keyword.toLowerCase()]
    })),
    ...recentSearches.map((s, i) => ({
      id: `recent-${i}`,
      title: s,
      subtitle: 'Recherche recente',
      icon: <Clock size={18} className="text-white/40" />,
      action: () => navigate(`/search?q=${encodeURIComponent(s)}`),
      category: 'recent' as const,
      keywords: [s.toLowerCase()]
    }))
  ], [navigate, trendingNow, recentSearches, saveSearch])

  const filteredCommands = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return allCommands.filter(c => c.category === 'navigation' || c.category === 'trending' || c.category === 'recent').slice(0, 16)
    }
    const q = debouncedQuery.toLowerCase()
    return allCommands.filter(c => {
      const titleMatch = c.title.toLowerCase().includes(q)
      const subtitleMatch = c.subtitle?.toLowerCase().includes(q)
      const keywordMatch = c.keywords?.some(k => k.includes(q))
      return titleMatch || subtitleMatch || keywordMatch
    }).slice(0, 10)
  }, [allCommands, debouncedQuery])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter' && filteredCommands[selectedIndex]) { e.preventDefault(); filteredCommands[selectedIndex].action() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  useEffect(() => { setSelectedIndex(0) }, [debouncedQuery])

  if (!mounted || !isOpen) return null

  const groupedCommands = {
    navigation: filteredCommands.filter(c => c.category === 'navigation'),
    trending: filteredCommands.filter(c => c.category === 'trending'),
    recent: filteredCommands.filter(c => c.category === 'recent'),
    action: filteredCommands.filter(c => c.category === 'action'),
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setIsOpen(false)}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className={cn('relative w-full max-w-xl mx-4 algo-modal-panel overflow-hidden')} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--color-border)]">
          <Search size={20} className="text-[var(--color-text-tertiary)] shrink-0" />
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher dans ALGO..." className="flex-1 bg-transparent text-[var(--color-text-primary)] text-lg placeholder:text-[var(--color-text-muted)] focus:outline-none" />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-card)] border border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)]">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-white/40">Aucun resultat pour &quot;{query}&quot;</p>
              <button onClick={() => { saveSearch(query); navigate(`/search?q=${encodeURIComponent(query)}`) }} className="mt-3 inline-flex items-center gap-2 text-violet-400 hover:text-violet-300">
                <Search size={16} /><span>Rechercher &quot;{query}&quot; partout</span>
              </button>
            </div>
          )}
          {groupedCommands.navigation.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-2 text-[11px] font-medium text-white/30 uppercase tracking-wider">Navigation</div>
              {groupedCommands.navigation.map((cmd) => {
                const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id)
                return <CommandRow key={cmd.id} item={cmd} isSelected={selectedIndex === globalIndex} onClick={cmd.action} onMouseEnter={() => setSelectedIndex(globalIndex)} />
              })}
            </div>
          )}
          {groupedCommands.trending.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-2 text-[11px] font-medium text-white/30 uppercase tracking-wider flex items-center gap-2"><Flame size={12} className="text-orange-400" />Trending Now</div>
              {groupedCommands.trending.map((cmd) => {
                const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id)
                return <CommandRow key={cmd.id} item={cmd} isSelected={selectedIndex === globalIndex} onClick={cmd.action} onMouseEnter={() => setSelectedIndex(globalIndex)} />
              })}
            </div>
          )}
          {groupedCommands.recent.length > 0 && !query && (
            <div className="mb-2">
              <div className="px-4 py-2 text-[11px] font-medium text-white/30 uppercase tracking-wider">Recherches recentes</div>
              {groupedCommands.recent.map((cmd) => {
                const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id)
                return <CommandRow key={cmd.id} item={cmd} isSelected={selectedIndex === globalIndex} onClick={cmd.action} onMouseEnter={() => setSelectedIndex(globalIndex)} />
              })}
            </div>
          )}
          {groupedCommands.action.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-2 text-[11px] font-medium text-white/30 uppercase tracking-wider">Actions</div>
              {groupedCommands.action.map((cmd) => {
                const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id)
                return <CommandRow key={cmd.id} item={cmd} isSelected={selectedIndex === globalIndex} onClick={cmd.action} onMouseEnter={() => setSelectedIndex(globalIndex)} />
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_80%,transparent)]">
          <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-[var(--color-card)] border border-[var(--color-border)]">↑</kbd><kbd className="px-1.5 py-0.5 rounded bg-[var(--color-card)] border border-[var(--color-border)]">↓</kbd><span className="ml-1">naviguer</span></span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-[var(--color-card)] border border-[var(--color-border)]">↵</kbd><span className="ml-1">ouvrir</span></span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]"><Command size={12} /><span>K</span></div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function CommandRow({ item, isSelected, onClick, onMouseEnter }: { item: CommandItem; isSelected: boolean; onClick: () => void; onMouseEnter: () => void }) {
  return (
    <button className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-left transition-[background-color,color] duration-200', isSelected ? 'bg-[var(--color-violet-muted)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]')} onClick={onClick} onMouseEnter={onMouseEnter}>
      <div className={cn('shrink-0', isSelected ? 'text-[var(--color-violet)]' : 'text-[var(--color-text-muted)]')}>{item.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.title}</div>
        {item.subtitle && <div className="text-[12px] text-[var(--color-text-tertiary)] truncate">{item.subtitle}</div>}
      </div>
      {item.score && <div className="shrink-0 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-bold">{item.score}</div>}
      {isSelected && <ArrowRight size={16} className="shrink-0 text-[var(--color-violet)]" />}
    </button>
  )
}
