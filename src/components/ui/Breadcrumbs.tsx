'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'


interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  showHome?: boolean
  className?: string
}

// Route to label mapping (French)
const ROUTE_LABELS: Record<string, string> = {
  '': 'Accueil',
  'trends': 'Tendances',
  'videos': 'Videos',
  'news': 'Actualites',
  'rising-stars': 'Stars montantes',
  'watchlist': 'A regarder',
  'favorites': 'Favoris',
  'profile': 'Profil',
  'settings': 'Parametres',
  'creator-mode': 'Mode Createur',
  'fail-lab': 'Labo Echecs',
  'search': 'Recherche',
  'content': 'Contenu',
  'login': 'Connexion',
  'signup': 'Inscription',
  'movies': 'Films',
  'music': 'Musique',
  'stars': 'Stars',
  'viral-analyzer': 'Analyseur Viral',
  'about': 'A propos',
}

export function Breadcrumbs({ items, showHome = true, className }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const segments = pathname.split('/').filter(Boolean)
    const crumbs: BreadcrumbItem[] = []
    
    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const isLast = index === segments.length - 1
      
      // Skip dynamic segments like IDs
      if (segment.match(/^[a-f0-9-]{36}$|^\d+$/)) {
        crumbs.push({ label: 'Detail', href: isLast ? undefined : href })
      } else {
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        crumbs.push({ label, href: isLast ? undefined : href })
      }
    })
    
    return crumbs
  })()

  if (breadcrumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {showHome && (
        <>
          <Link
            href="/"
            aria-label="Home"
            className="text-white/40 hover:text-white/70 transition-colors p-1 rounded"
          >
            <Home size={14} strokeWidth={2} aria-hidden />
          </Link>
          <ChevronRight size={12} className="text-white/20" aria-hidden />
        </>
      )}
      
      {breadcrumbs.map((crumb, index) => (
        <span key={index} className="flex items-center gap-1">
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-white/70 font-medium">{crumb.label}</span>
          )}
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight size={12} className="text-white/20" aria-hidden />
          )}
        </span>
      ))}
    </nav>
  )
}
