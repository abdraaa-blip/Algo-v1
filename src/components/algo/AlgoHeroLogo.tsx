'use client'

import { useState, useEffect } from 'react'

// Rotating taglines - changes every 7 seconds
const TAGLINES = [
  {
    text: 'On te dit',
    highlights: [
      { text: 'quoi poster', color: 'text-violet-400' },
      { text: 'quand', color: 'text-emerald-400' },
      { text: 'pourquoi ça va marcher', color: 'text-orange-400' },
    ],
    connector: ', ',
    ending: '.'
  },
  {
    text: 'Détecte les tendances',
    highlights: [
      { text: 'tôt sur la courbe', color: 'text-cyan-400' },
    ],
    connector: ' ',
    ending: '.'
  },
  {
    text: 'Analyse',
    highlights: [
      { text: 'TikTok', color: 'text-pink-400' },
      { text: 'YouTube', color: 'text-red-400' },
      { text: 'Twitter', color: 'text-blue-400' },
    ],
    connector: ', ',
    ending: ' en temps réel.'
  },
  {
    text: 'Ton avantage',
    highlights: [
      { text: 'compétitif', color: 'text-emerald-400' },
    ],
    connector: ' ',
    ending: ' sur les autres créateurs.'
  },
  {
    text: 'Transforme les',
    highlights: [
      { text: 'signaux faibles', color: 'text-violet-400' },
    ],
    connector: ' ',
    ending: ' en contenus viraux.'
  },
  {
    text: 'L\'algorithme qui',
    highlights: [
      { text: 'decode', color: 'text-cyan-400' },
    ],
    connector: ' ',
    ending: ' tous les autres.'
  },
  {
    text: 'Prévois ce qui va',
    highlights: [
      { text: 'exploser', color: 'text-orange-400' },
    ],
    connector: ' ',
    ending: ' demain.'
  },
  {
    text: 'Fini de',
    highlights: [
      { text: 'deviner', color: 'text-red-400' },
    ],
    connector: ' ',
    ending: '. Commence à savoir.'
  },
  {
    text: 'Un meta-radar',
    highlights: [
      { text: 'au-dessus', color: 'text-violet-400' },
    ],
    connector: ' ',
    ending: ' des feeds · pas une copie, une couche au-dessus.'
  },
  {
    text: 'Lis',
    highlights: [
      { text: 'plusieurs plateformes', color: 'text-cyan-400' },
    ],
    connector: ' ',
    ending: ', priorise un seul plan d’action.'
  },
]

const markStyle = {
  textShadow: '0 0 40px rgba(123,97,255,0.35), 0 0 80px rgba(123,97,255,0.15)',
  background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.88) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
} as const

/**
 * AlgoHeroLogo · page d'accueil.
 * `full` : grand logo + taglines rotatives (h1 = ALGO).
 * `mark` : petit marqueur sous le hero texte (pas de h1, accessibilité : le titre principal est ailleurs).
 */
export function AlgoHeroLogo({ variant = 'full' }: { variant?: 'full' | 'mark' }) {
  const [mounted, setMounted] = useState(false)
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || variant === 'mark') return

    const interval = setInterval(() => {
      setIsTransitioning(true)

      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % TAGLINES.length)
        setIsTransitioning(false)
      }, 300)
    }, 7000)

    return () => clearInterval(interval)
  }, [mounted, variant])

  if (!mounted) {
    const h = variant === 'mark' ? '48px' : '180px'
    return (
      <div className="flex flex-col items-center text-center select-none" style={{ minHeight: h }}>
        <div className="h-4 w-48 rounded mb-4 opacity-0" />
        <div className="h-20 sm:h-24 w-48 sm:w-64 rounded opacity-0" />
        {variant === 'full' ? <div className="h-4 w-56 rounded mt-4 opacity-0" /> : null}
      </div>
    )
  }

  if (variant === 'mark') {
    return (
      <div className="flex flex-col items-center text-center select-none px-4 mt-2" aria-hidden>
        <p
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none text-white"
          style={markStyle}
        >
          ALGO
        </p>
      </div>
    )
  }

  const currentTagline = TAGLINES[taglineIndex]

  return (
    <div className="flex flex-col items-center text-center select-none px-4">
      <h1
        className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none text-white"
        style={markStyle}
      >
        ALGO
      </h1>

      <p
        className={`text-sm sm:text-base md:text-lg font-medium text-white/70 mt-3 sm:mt-4 max-w-sm sm:max-w-md transition-all duration-300 ${
          isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
        }`}
        style={{ minHeight: '28px' }}
      >
        {currentTagline.text}{' '}
        {currentTagline.highlights.map((highlight, i) => (
          <span key={i}>
            <span className={highlight.color}>{highlight.text}</span>
            {i < currentTagline.highlights.length - 1 && currentTagline.connector}
          </span>
        ))}
        {currentTagline.ending}
      </p>
    </div>
  )
}
