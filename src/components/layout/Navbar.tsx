'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { ScopeSelector } from './ScopeSelector'
import { AlgoHeartbeat } from '@/components/algo/AlgoHeartbeat'
import { useScopeContext } from '@/contexts/ScopeContext'
import { getDateLocaleForCountry, getScopeCountryCode, getTimeZoneForCountry } from '@/lib/geo/country-profile'
import { Flame, TrendingUp, Play, Newspaper, Film, Music, Sparkles, Search, Bell, User, Info, BrainCircuit, Activity, ChevronRight, ChevronLeft, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Accueil', icon: Flame },
  { href: '/trends', label: 'Tendances', icon: TrendingUp },
  { href: '/videos', label: 'Videos', icon: Play },
  { href: '/news', label: 'Actu', icon: Newspaper },
  { href: '/movies', label: 'Films', icon: Film },
  { href: '/music', label: 'Musique', icon: Music },
  { href: '/creator-mode', label: 'Createur', icon: Sparkles },
  { href: '/ai', label: 'ALGO AI', icon: BrainCircuit },
  { href: '/intelligence', label: 'Intelligence', icon: Activity },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/about', label: 'A propos', icon: Info },
] as const

export function Navbar() {
  const pathname = usePathname()
  const { scope, setScope } = useScopeContext()
  const scrollRef = useRef<HTMLElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [nowTs, setNowTs] = useState(() => Date.now())

  // Check scroll position to show/hide indicators
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 5)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  // Scroll to active item on mount
  useEffect(() => {
    if (scrollRef.current) {
      const activeItem = scrollRef.current.querySelector('[aria-current="page"]')
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [pathname])

  const scrollNav = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 150
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const scopeCountryCode = getScopeCountryCode(scope)
  const scopeTimeZone = getTimeZoneForCountry(scopeCountryCode)
  const scopeDateLocale = getDateLocaleForCountry(scopeCountryCode)
  const localTime = new Intl.DateTimeFormat(scopeDateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: scopeTimeZone,
  }).format(nowTs)

  return (
    <header className="fixed top-0 inset-x-0 z-[200]">
      {/* Main navbar container */}
      <div className="algo-nav-chrome">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 h-14 flex items-center gap-2 sm:gap-4">
          {/* Logo - always visible */}
          <Link href="/" className="flex items-center group shrink-0">
            <AlgoHeartbeat />
          </Link>

          {/* Navigation container with scroll indicators */}
          <div className="relative flex-1 flex items-center min-w-0">
            {/* Left scroll indicator */}
            <button
              onClick={() => scrollNav('left')}
              className={cn(
                'absolute left-0 z-10 w-8 h-10 flex items-center justify-start pl-1',
                'bg-gradient-to-r from-[var(--color-bg-primary)] via-[color-mix(in_srgb,var(--color-bg-primary)_88%,transparent)] to-transparent',
                'text-white/60 hover:text-white transition-opacity duration-200',
                'md:hidden', // Only show on mobile/tablet
                canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
              aria-label="Defiler vers la gauche"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Scrollable navigation */}
            <nav 
              ref={scrollRef}
              onScroll={checkScroll}
              className={cn(
                'flex items-center gap-1 overflow-x-auto scroll-smooth',
                'px-1 sm:px-2 md:justify-center',
                // Hide scrollbar but keep functionality
                'scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]',
                '[&::-webkit-scrollbar]:hidden'
              )}
              aria-label="Navigation principale"
            >
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'algo-interactive flex items-center gap-1.5 px-3 py-2 rounded-lg',
                      'text-xs font-medium whitespace-nowrap',
                      'transition-[color,background-color,box-shadow] duration-200 ease-out',
                      'min-h-[40px] min-w-[44px]', // Touch-friendly size
                      'shrink-0', // Prevent shrinking
                      isActive 
                        ? 'text-white bg-[var(--color-violet-muted)] shadow-[0_0_16px_color-mix(in_srgb,var(--color-violet)_22%,transparent)]' 
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] active:bg-[color-mix(in_srgb,var(--color-text-primary)_11%,transparent)]'
                    )}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />
                    {/* Always show label on all devices */}
                    <span className="text-[11px] sm:text-xs">{label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right scroll indicator */}
            <button
              onClick={() => scrollNav('right')}
              className={cn(
                'absolute right-0 z-10 w-8 h-10 flex items-center justify-end pr-1',
                'bg-gradient-to-l from-[var(--color-bg-primary)] via-[color-mix(in_srgb,var(--color-bg-primary)_88%,transparent)] to-transparent',
                'text-white/60 hover:text-white transition-opacity duration-200',
                'md:hidden', // Only show on mobile/tablet
                canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
              aria-label="Defiler vers la droite"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <div className="hidden lg:flex items-center rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-tertiary)]">
              {scope.type === 'global' ? `UTC ${localTime}` : `${scope.code} ${localTime}`}
            </div>
            {/* Scope selector - hidden on very small screens */}
            <div className="hidden sm:block">
              <ScopeSelector scope={scope} onScopeChange={setScope} />
            </div>
            
            <Link 
              href="/search" 
              aria-label="Rechercher"
              className="algo-interactive w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] transition-[color,background-color,transform] duration-200 active:bg-[color-mix(in_srgb,var(--color-text-primary)_11%,transparent)]"
            >
              <Search size={18} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            
            <Link 
              href="/watchlist" 
              aria-label="Watchlist - notifications"
              className="algo-interactive w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] transition-[color,background-color,transform] duration-200 relative active:bg-[color-mix(in_srgb,var(--color-text-primary)_11%,transparent)]"
            >
              <Bell size={18} strokeWidth={1.5} aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-[var(--color-red-alert)] rounded-full" aria-label="Nouvelles notifications" />
            </Link>
            
            <Link 
              href="/login" 
              aria-label="Se connecter"
              className="algo-interactive w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] transition-[color,background-color,transform] duration-200 active:bg-[color-mix(in_srgb,var(--color-text-primary)_11%,transparent)]"
            >
              <User size={18} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile scope selector bar - shown only on small screens */}
      <div className="sm:hidden px-3 py-1.5 flex items-center justify-between border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_92%,transparent)] backdrop-blur-xl">
        <span className="text-[10px] text-white/30 font-medium">Zone</span>
        <ScopeSelector scope={scope} onScopeChange={setScope} />
      </div>
    </header>
  )
}
