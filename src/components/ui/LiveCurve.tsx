'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

// Seeded random number generator for deterministic values
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

type CurveColor    = 'violet' | 'blue' | 'green' | 'red' | 'orange' | 'cyan' | 'rainbow'
type CurvePosition = 'background' | 'inline'

const colorHex: Record<Exclude<CurveColor, 'rainbow'>, string> = {
  violet: '#7B61FF',
  blue:   '#00D1FF',
  green:  '#00FFB2',
  red:    '#FF4D6D',
  orange: '#FF9500',
  cyan:   '#00E5FF',
}

interface LiveCurveProps {
  growthRate?: number
  color?:      CurveColor
  opacity?:    number
  position?:   CurvePosition
  showShootingStars?: boolean
  showECGLine?: boolean
  className?:  string
}

/**
 * Genere un path SVG style ECG/trading a partir d'une amplitude.
 * Amplitude pilotee par growthRate · plus le contenu monte, plus la courbe pulse.
 */
function buildPath(w: number, h: number, amplitude: number, phaseShift: number = 0): string {
  const mid = h / 2
  return Array.from({ length: 24 }, (_, i) => {
    const x = (i / 23) * w
    const y = mid
      + Math.sin(i * 0.7 + phaseShift) * amplitude
      + Math.sin(i * 1.4 + phaseShift) * amplitude * 0.35
      + Math.cos(i * 0.35)             * amplitude * 0.20
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

/**
 * Genere un path ECG realiste avec pics et valeurs
 */
function buildECGPath(w: number, h: number, phaseShift: number = 0, intensity: number = 1): string {
  const mid = h / 2
  const points: string[] = []
  const segments = 60
  
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * w
    const t = (i / segments) * Math.PI * 8 + phaseShift
    
    // ECG-like pattern with sharp peaks
    let y = mid
    const localT = (t % (Math.PI * 2)) / (Math.PI * 2)
    
    if (localT > 0.1 && localT < 0.15) {
      // Small P wave
      y = mid - Math.sin((localT - 0.1) * Math.PI / 0.05) * 8 * intensity
    } else if (localT > 0.2 && localT < 0.22) {
      // Sharp Q dip
      y = mid + 5 * intensity
    } else if (localT > 0.22 && localT < 0.28) {
      // Large R peak (main spike)
      const peakT = (localT - 0.22) / 0.06
      y = mid - Math.sin(peakT * Math.PI) * 35 * intensity
    } else if (localT > 0.28 && localT < 0.32) {
      // S wave dip
      y = mid + Math.sin((localT - 0.28) * Math.PI / 0.04) * 10 * intensity
    } else if (localT > 0.4 && localT < 0.5) {
      // T wave
      y = mid - Math.sin((localT - 0.4) * Math.PI / 0.1) * 12 * intensity
    } else {
      // Baseline with slight noise
      y = mid + Math.sin(t * 3) * 1.5
    }
    
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`)
  }
  
  return points.join(' ')
}

// Shooting star component - uses pre-computed values to avoid hydration mismatch
function ShootingStar({ delay, duration, startX, startY, angle, length }: { 
  delay: number
  duration: number
  startX: number
  startY: number
  angle: number
  length: number
}) {
  const endX = startX + Math.cos(angle) * length
  const endY = startY + Math.sin(angle) * length
  
  return (
    <g>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="url(#shootingStarGradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0"
      >
        <animate
          attributeName="opacity"
          values="0;0;1;1;0"
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          from="0 0"
          to={`${Math.cos(angle) * 200} ${Math.sin(angle) * 200}`}
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </line>
      {/* Tete lumineuse de l'etoile */}
      <circle
        cx={startX}
        cy={startY}
        r="2"
        fill="white"
        opacity="0"
      >
        <animate
          attributeName="opacity"
          values="0;0;1;0.8;0"
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          from="0 0"
          to={`${Math.cos(angle) * 200} ${Math.sin(angle) * 200}`}
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </circle>
    </g>
  )
}

export function LiveCurve({
  growthRate = 50,
  color      = 'violet',
  opacity    = 0.08,
  position   = 'background',
  showShootingStars = true,
  showECGLine = true,
  className,
}: LiveCurveProps) {
  const hex = color === 'rainbow' ? colorHex.violet : colorHex[color]
  const amplitude = Math.min(Math.max(Math.abs(growthRate) / 300, 0.08), 0.9) * 42
  const dur1 = growthRate > 150 ? '9s'  : growthRate > 60 ? '13s' : '18s'
  const dur2 = growthRate > 150 ? '13s' : growthRate > 60 ? '17s' : '24s'

  const W = 900
  const H = 120
  const path1 = buildPath(W, H, amplitude, 0)
  const path2 = buildPath(W, H, amplitude * 0.65, 1.2)
  
  // ECG path with dynamic intensity based on growth rate
  const ecgIntensity = Math.min(growthRate / 100, 1.5)
  const ecgPath = buildECGPath(W, H, 0, ecgIntensity)

  // Generate shooting stars with seeded random for consistent SSR/client values
  const shootingStars = useMemo(() => {
    const rng = seededRandom(42) // Fixed seed for deterministic values
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 3 + rng() * 2,
      duration: 1.5 + rng() * 1,
      startX: rng() * W * 0.8 + W * 0.1,
      startY: rng() * H * 0.3,
      angle: Math.PI / 4 + (rng() - 0.5) * 0.5,
      length: 60 + rng() * 40,
    }))
  }, [])

  const wrapper = cn(
    'overflow-hidden pointer-events-none',
    position === 'background' ? 'absolute inset-0' : 'relative',
    className,
  )

  return (
    <div className={wrapper} aria-hidden>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        style={{ opacity: opacity * 1.5, filter: 'blur(0.4px)' }}
      >
        <defs>
          {/* Gradient pour les etoiles filantes */}
          <linearGradient id="shootingStarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="30%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          
          {/* Gradient ECG qui change selon la hauteur */}
          <linearGradient id="ecgGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF4444" />
            <stop offset="25%" stopColor="#FF8800" />
            <stop offset="50%" stopColor="#FFCC00" />
            <stop offset="75%" stopColor="#88FF00" />
            <stop offset="100%" stopColor="#00FF88" />
          </linearGradient>
          
          {/* Glow filter pour ECG */}
          <filter id="ecgGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Etoiles filantes */}
        {showShootingStars && shootingStars.map(star => (
          <ShootingStar key={star.id} {...star} />
        ))}

        {/* Courbe principale violette/bleue */}
        <path
          d={path1}
          fill="none"
          stroke={hex}
          strokeWidth="1.8"
          style={{ filter: `drop-shadow(0 0 3px ${hex}90)` }}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            from={`-${W} 0`}
            to="0 0"
            dur={dur1}
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>

        {/* Courbe secondaire · opacite reduite */}
        <path
          d={path2}
          fill="none"
          stroke={hex}
          strokeWidth="1"
          opacity={0.45}
          style={{ filter: `drop-shadow(0 0 2px ${hex}60)` }}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            from={`-${W} 0`}
            to="0 0"
            dur={dur2}
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>

        {/* Ligne ECG rouge/orange/vert style trading */}
        {showECGLine && (
          <g filter="url(#ecgGlow)">
            <path
              d={ecgPath}
              fill="none"
              stroke="url(#ecgGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                from={`-${W} 0`}
                to="0 0"
                dur="8s"
                repeatCount="indefinite"
                calcMode="linear"
              />
            </path>
            
            {/* Deuxieme ligne ECG decalee */}
            <path
              d={buildECGPath(W, H, Math.PI, ecgIntensity * 0.8)}
              fill="none"
              stroke="url(#ecgGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.4}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                from={`-${W} 0`}
                to="0 0"
                dur="12s"
                repeatCount="indefinite"
                calcMode="linear"
              />
            </path>
          </g>
        )}

        {/* Particules de poussiere d'etoiles - pre-computed for SSR consistency */}
        {showShootingStars && (() => {
          const rng = seededRandom(123)
          return Array.from({ length: 20 }, (_, i) => {
            const cx = rng() * W
            const cy = rng() * H
            const r = 0.5 + rng() * 1
            const baseOpacity = 0.1 + rng() * 0.3
            const v1 = 0.1 + rng() * 0.2
            const v2 = 0.4 + rng() * 0.3
            const v3 = 0.1 + rng() * 0.2
            const dur = 2 + rng() * 3
            return (
              <circle
                key={`particle-${i}`}
                cx={cx}
                cy={cy}
                r={r}
                fill="white"
                opacity={baseOpacity}
              >
                <animate
                  attributeName="opacity"
                  values={`${v1};${v2};${v3}`}
                  dur={`${dur}s`}
                  repeatCount="indefinite"
                />
              </circle>
            )
          })
        })()}
      </svg>
    </div>
  )
}
