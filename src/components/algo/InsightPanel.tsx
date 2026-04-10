'use client'

interface Insight {
  postNowProbability: 'high' | 'medium' | 'low'
  timing: 'now' | 'too_late' | 'too_early'
  postWindow?: { status: 'optimal' | 'saturated' | 'fading' }
  bestPlatform?: string[]
  bestFormat?: string
}

interface InsightPanelProps {
  insight: Insight
  watchersCount?: number
}

export function InsightPanel({ insight, watchersCount = 0 }: InsightPanelProps) {
  const prob = {
    high: { col: '#00FFB2', bg: 'rgba(0,255,178,0.08)', label: 'Fort potentiel' },
    medium: { col: '#FFD166', bg: 'rgba(255,209,102,0.08)', label: 'Risque' },
    low: { col: '#FF4D6D', bg: 'rgba(255,77,109,0.08)', label: 'Trop tard' }
  }[insight.postNowProbability]
  
  const window = {
    optimal: { icon: '\u{1F7E2}', label: 'Fenetre ouverte - moment ideal' },
    saturated: { icon: '\u{1F7E1}', label: 'Trend saturee - visibilite reduite' },
    fading: { icon: '\u{1F534}', label: 'Le signal s\'eteint - trop tard' }
  }[insight.postWindow?.status || 'optimal']

  const timingText = {
    now: 'Poste maintenant',
    too_late: 'Trop tard',
    too_early: 'Trop tot'
  }[insight.timing]

  return (
    <div 
      className="rounded-[14px] p-[14px] flex flex-col gap-[10px]"
      style={{ 
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)'
      }}
    >
      <p className="text-[10px] font-bold text-[rgba(240,240,248,0.38)] uppercase tracking-[0.1em]">
        Insight Engine
      </p>
      
      <div 
        className="rounded-[10px] px-3 py-2 flex items-center gap-2"
        style={{ background: prob.bg }}
      >
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: prob.col }}
        />
        <div>
          <p className="text-[13px] font-extrabold m-0" style={{ color: prob.col }}>
            {prob.label}
          </p>
          <p className="text-[10px] text-[rgba(240,240,248,0.38)] m-0">
            {timingText}
          </p>
        </div>
      </div>
      
      <p className="text-[11px] text-[rgba(240,240,248,0.38)]">
        {window.icon} {window.label}
      </p>
      
      {insight.bestPlatform && insight.bestPlatform.length > 0 && (
        <div>
          <p className="text-[10px] text-[rgba(240,240,248,0.2)] mb-[5px]">Plateforme ideale</p>
          <div className="flex flex-wrap gap-1">
            {insight.bestPlatform.map(p => (
              <span 
                key={p} 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ 
                  background: 'rgba(123,97,255,0.12)',
                  color: '#a78bfa',
                  border: '1px solid rgba(123,97,255,0.22)'
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between text-[10px] text-[rgba(240,240,248,0.2)]">
        {insight.bestFormat && (
          <span>
            Format : <b className="text-[rgba(240,240,248,0.38)]">{insight.bestFormat.replace('_', ' ')}</b>
          </span>
        )}
        {watchersCount > 0 && (
          <span>{watchersCount.toLocaleString('fr-FR')} observateurs</span>
        )}
      </div>
    </div>
  )
}
