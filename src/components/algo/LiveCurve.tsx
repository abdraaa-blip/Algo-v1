'use client'

interface LiveCurveProps {
  rate?: number
  color?: 'violet' | 'blue' | 'green'
  opacity?: number
}

export function LiveCurve({ rate = 60, color = 'violet', opacity = 0.08 }: LiveCurveProps) {
  const hex = color === 'violet' ? '#7B61FF' : color === 'blue' ? '#00D1FF' : '#00FFB2'
  const amp = Math.min(Math.max(Math.abs(rate) / 300, 0.08), 0.9) * 42
  const W = 900
  const H = 120
  const mid = H / 2
  
  const p1 = Array.from({ length: 24 }, (_, i) => 
    `${i === 0 ? 'M' : 'L'} ${((i / 23) * W).toFixed(1)},${(mid + Math.sin(i * 0.7) * amp).toFixed(1)}`
  ).join(' ')
  
  const dur = rate > 150 ? '10s' : rate > 60 ? '14s' : '18s'
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg 
        viewBox={`0 0 ${W} ${H}`} 
        preserveAspectRatio="xMidYMid slice" 
        className="w-full h-full"
        style={{ opacity, filter: 'blur(0.6px)' }}
      >
        <path d={p1} fill="none" stroke={hex} strokeWidth="1.8">
          <animateTransform 
            attributeName="transform" 
            type="translate" 
            from={`-${W} 0`} 
            to="0 0" 
            dur={dur} 
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  )
}
