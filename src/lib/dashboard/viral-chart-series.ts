export type ViralChartPoint = {
  time: string
  score: number
}

type SeriesPoint = { at: string; viralityScore: number }

const MAX_POINTS = 32

/**
 * Convertit la série API Viral Control en points Recharts (tri chronologique, dernières valeurs).
 */
export function toViralChartPoints(series: SeriesPoint[] | undefined): ViralChartPoint[] {
  if (!series?.length) return []
  const sorted = [...series].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  const tail = sorted.slice(-MAX_POINTS)
  return tail.map((p) => {
    const d = new Date(p.at)
    const label = Number.isFinite(d.getTime())
      ? d.toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : p.at.slice(0, 12)
    return { time: label, score: Math.round(p.viralityScore) }
  })
}
