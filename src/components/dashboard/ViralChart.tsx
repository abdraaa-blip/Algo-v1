'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ViralChartPoint } from '@/lib/dashboard/viral-chart-series'

export type { ViralChartPoint }

type ViralChartProps = {
  data: ViralChartPoint[]
  /** Score viral 0–100 sur l’axe Y */
  ariaLabel?: string
}

export function ViralChart({ data, ariaLabel = 'Score viral dans le temps' }: ViralChartProps) {
  if (!data.length) {
    return (
      <div
        className="h-56 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex items-center justify-center text-[13px] text-[var(--color-text-muted)] px-4 text-center"
        role="status"
      >
        Pas assez de points d’historique pour tracer la courbe. Ouvre /intelligence/viral-control pour plus de contexte.
      </div>
    )
  }

  return (
    <div className="h-56 w-full" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: 'rgba(240,240,248,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} width={32} tick={{ fill: 'rgba(240,240,248,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#111122',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: 'rgba(240,240,248,0.75)' }}
          />
          <Line
            type="monotone"
            dataKey="score"
            name="Score"
            stroke="#7B61FF"
            strokeWidth={2}
            dot={false}
            isAnimationActive={data.length < 80}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
