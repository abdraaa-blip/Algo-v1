'use client'

import { Globe2, MapPin } from 'lucide-react'
import { useAudienceHints, setContentScope } from '@/components/growth/PersonalizationProvider'

/**
 * Bascule locale / monde pour prioriser signaux régionaux vs globaux (préférence navigateur uniquement).
 */
export function AudienceScopeToggle({ className }: { className?: string }) {
  const { scope, country } = useAudienceHints()
  const local = scope !== 'global'

  return (
    <div
      className={`inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-0.5 text-[10px] font-semibold ${className ?? ''}`}
      role="group"
      aria-label="Portée des tendances"
    >
      <button
        type="button"
        onClick={() => setContentScope('local')}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
          local ? 'bg-violet-500/25 text-violet-100' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
        }`}
      >
        <MapPin size={11} aria-hidden />
        Local{country ? ` (${country})` : ''}
      </button>
      <button
        type="button"
        onClick={() => setContentScope('global')}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
          !local ? 'bg-cyan-500/20 text-cyan-100' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
        }`}
      >
        <Globe2 size={11} aria-hidden />
        Monde
      </button>
    </div>
  )
}
