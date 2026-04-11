type InsightBoxProps = {
  title?: string
  text: string
  loading?: boolean
  /** Relance `fetchAlgo` avec le contexte radar actuel (sans recharger la page). */
  onRefreshInsight?: () => void | Promise<void>
}

export function InsightBox({ title = 'Lecture ALGO AI', text, loading, onRefreshInsight }: InsightBoxProps) {
  return (
    <div className="algo-surface rounded-xl p-4 border border-[var(--color-border)] space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">{title}</p>
        {onRefreshInsight ? (
          <button
            type="button"
            onClick={() => void onRefreshInsight()}
            disabled={loading}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-45 disabled:pointer-events-none transition-colors"
          >
            Rafraîchir la lecture
          </button>
        ) : null}
      </div>
      {loading ? (
        <p className="text-sm text-[var(--color-text-tertiary)]">Analyse en cours…</p>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{text}</p>
      )}
    </div>
  )
}
