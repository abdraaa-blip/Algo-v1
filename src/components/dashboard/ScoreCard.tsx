import type { ViralControlMomentum } from '@/lib/intelligence/viral-control-cockpit'

type ScoreCardProps = {
  score: number
  confidence?: number
  momentum?: ViralControlMomentum
}

const momentumLabel: Record<ViralControlMomentum, string> = {
  up: 'Momentum · hausse',
  stable: 'Momentum · stable',
  down: 'Momentum · refroidit',
}

export function ScoreCard({ score, confidence, momentum }: ScoreCardProps) {
  const clamped = Math.round(Math.min(100, Math.max(0, score)))
  const mom = momentum ? momentumLabel[momentum] : null

  return (
    <div className="algo-surface rounded-xl p-4 border border-[var(--color-border)]">
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Score viral (indicateur)</p>
      <h2 className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums mt-1">{clamped}/100</h2>
      {confidence != null && Number.isFinite(confidence) ? (
        <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1">
          Confiance bundle · {Math.round(confidence * 100)} %
        </p>
      ) : null}
      {mom ? <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">{mom}</p> : null}
    </div>
  )
}
