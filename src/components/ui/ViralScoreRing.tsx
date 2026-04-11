import { cn } from '@/lib/utils'
import { getScoreColor, clampScore, computeRingOffset } from '@/services/logic/computeViralScore'
import type { GrowthTrend } from '@/types'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const sizeCfg: Record<Size, { ring: number; stroke: number; fontSize: string; fontWeight: number }> = {
  xs: { ring: 28,  stroke: 2.5, fontSize: '8px',  fontWeight: 700 },
  sm: { ring: 36,  stroke: 3,   fontSize: '10px', fontWeight: 800 },
  md: { ring: 52,  stroke: 3.5, fontSize: '13px', fontWeight: 900 },
  lg: { ring: 72,  stroke: 4,   fontSize: '18px', fontWeight: 900 },
}

/** Diamètre extérieur en px (chemins legacy `@/components/algo/ViralScoreRing`). */
function dimensionsFromPixelRing(pixelRing: number): {
  ring: number
  stroke: number
  fontSize: string
  fontWeight: number
} {
  const ring = Math.min(160, Math.max(24, Math.round(pixelRing)))
  const stroke = Math.min(5, Math.max(2, (ring * 3.5) / 52))
  const fsPx = Math.min(22, Math.max(8, Math.round(ring * 0.22)))
  return {
    ring,
    stroke,
    fontSize: `${fsPx}px`,
    fontWeight: ring >= 56 ? 900 : 800,
  }
}

interface ViralScoreRingProps {
  value?:      number
  score?:      number // Alternative prop name for consistency
  trend?:      GrowthTrend
  /** Preset taille, **ou** nombre = diamètre extérieur du ring en px (legacy algo). */
  size?:       Size | number
  showLabel?:  boolean
  className?:  string
  'aria-label'?: string
}

export function ViralScoreRing({
  value,
  score,
  trend,
  size = 'md',
  showLabel = true,
  className,
  'aria-label': ariaLabel,
}: ViralScoreRingProps) {
  void trend
  void showLabel
  // Support both 'value' and 'score' prop names
  const actualValue = value ?? score ?? 0
  const config =
    typeof size === 'number' && !Number.isNaN(size)
      ? dimensionsFromPixelRing(size)
      : sizeCfg[(size as Size) in sizeCfg ? (size as Size) : 'md'] || sizeCfg.md
  const { ring, stroke, fontSize, fontWeight } = config
  
  // Ensure ring dimensions are valid numbers
  const safeRing = typeof ring === 'number' && !Number.isNaN(ring) ? ring : 52
  const safeStroke = typeof stroke === 'number' && !Number.isNaN(stroke) ? stroke : 3.5
  
  const radius   = (safeRing - safeStroke * 2) / 2
  const center   = safeRing / 2
  
  // Ensure value is a valid number, default to 0
  const safeValue = typeof actualValue === 'number' && !Number.isNaN(actualValue) ? actualValue : 0
  const clamped  = clampScore(safeValue)
  const offset   = computeRingOffset(clamped, radius)
  const color    = getScoreColor(clamped)

  return (
    <div
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? `Viral Score : ${clamped}`}
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      style={{ width: safeRing, height: safeRing }}
    >
      <svg
        width={safeRing}
        height={safeRing}
        viewBox={`0 0 ${safeRing} ${safeRing}`}
        className="absolute inset-0"
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={safeStroke}
        />

        {/* Score arc */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={safeStroke}
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * radius}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            filter:     `drop-shadow(0 0 4px ${color}70)`,
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)',
          }}
        />

        {/* Outer rotating arc · visible uniquement si score ≥ 70 */}
        {clamped >= 70 && (
          <circle
            cx={center} cy={center}
            r={radius + safeStroke + 1}
            fill="none"
            stroke={color}
            strokeWidth={0.6}
            strokeDasharray={`${2 * Math.PI * (radius + safeStroke + 1) * 0.08} ${2 * Math.PI * (radius + safeStroke + 1) * 0.92}`}
            opacity={0.4}
            style={{ animation: `algo-spin ${8}s linear infinite` }}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </svg>

      {/* Chiffre centré */}
      <span
        aria-hidden
        style={{
          fontSize,
          fontWeight,
          color,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {clamped}
      </span>
    </div>
  )
}
