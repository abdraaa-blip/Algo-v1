'use client'

interface ViralScoreRingProps {
  score?: number
  value?: number // Alternative prop name for consistency with ui/ViralScoreRing
  size?: number
}

export function ViralScoreRing({ score, value, size = 44 }: ViralScoreRingProps) {
  // Support both 'score' and 'value' prop names
  const actualScore = score ?? value ?? 0
  const col = actualScore >= 85 ? '#7B61FF' : actualScore >= 65 ? '#00FFB2' : actualScore >= 45 ? '#00D1FF' : 'rgba(240,240,248,0.2)'
  const r = (size - 5) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(actualScore, 100) / 100) * circ
  
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        {/* Background circle */}
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={r} 
          fill="none" 
          stroke="rgba(255,255,255,0.07)" 
          strokeWidth={3.5}
        />
        {/* Progress circle */}
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={r} 
          fill="none" 
          stroke={col} 
          strokeWidth={3.5}
          strokeLinecap="round" 
          strokeDasharray={circ} 
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ 
            filter: `drop-shadow(0 0 4px ${col}80)`,
            transition: 'stroke-dashoffset 0.6s'
          }}
        />
        {/* Outer decorative arc for high scores */}
        {actualScore >= 70 && (
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={r + 4} 
            fill="none" 
            stroke={col} 
            strokeWidth={0.6}
            strokeDasharray={`${circ * 0.08} ${circ * 0.92}`} 
            opacity={0.4}
            className="animate-[algo-spin_8s_linear_infinite]"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      {/* Score number */}
      <span 
        className="absolute inset-0 flex items-center justify-center font-black"
        style={{ 
          fontSize: size < 40 ? 10 : 12, 
          color: col 
        }}
      >
        {actualScore}
      </span>
    </div>
  )
}
