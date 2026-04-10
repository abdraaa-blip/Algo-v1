import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title:      string
  subtitle?:  string
  action?: {
    label:   string
    onClick: () => void
  }
  trailing?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, trailing, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-0.5 min-w-0">
        <h2 className="text-white font-bold text-base tracking-tight leading-snug truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-white/35 text-xs">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {trailing}
        
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'shrink-0 inline-flex items-center gap-1 text-xs text-white/35 font-semibold',
              'hover:text-white/65 transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 rounded',
            )}
          >
            {action.label}
            <ChevronRight size={12} strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
