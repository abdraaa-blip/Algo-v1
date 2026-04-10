'use client'

interface AlgoEmptyProps {
  icon?: string
  title: string
  cta?: {
    label: string
    onClick: () => void
  }
}

export function AlgoEmpty({ icon = '\u{1F4E1}', title, cta }: AlgoEmptyProps) {
  return (
    <div className="text-center py-12 px-6 flex flex-col items-center gap-3">
      <div 
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-[22px]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {icon}
      </div>
      <p 
        className="text-[13px] font-semibold max-w-[220px] leading-[1.5]"
        style={{ color: 'rgba(240,240,248,0.38)' }}
      >
        {title}
      </p>
      {cta && (
        <button 
          onClick={cta.onClick}
          className="px-4 py-[6px] rounded-full text-[11px] font-bold cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.1)]"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(240,240,248,0.62)'
          }}
        >
          {cta.label}
        </button>
      )}
    </div>
  )
}
