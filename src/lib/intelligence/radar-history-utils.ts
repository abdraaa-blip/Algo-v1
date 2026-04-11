/** Types partagés · historique score radar intelligence (pas de logique serveur). */

export type RadarHistoryPointDTO = {
  at: string
  viralityScore: number
  confidence: number
  anomalyCount: number
}

const MS_DAY = 24 * 60 * 60 * 1000

export function pruneRadarPointsByAge(
  points: RadarHistoryPointDTO[],
  nowMs: number,
  maxAgeMs: number
): RadarHistoryPointDTO[] {
  const cutoff = nowMs - maxAgeMs
  return points
    .filter((p) => {
      const t = new Date(p.at).getTime()
      return Number.isFinite(t) && t >= cutoff
    })
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

export function dedupeRadarPointsByAt(points: RadarHistoryPointDTO[]): RadarHistoryPointDTO[] {
  const seen = new Set<string>()
  const out: RadarHistoryPointDTO[] = []
  for (const p of points) {
    if (!p.at || seen.has(p.at)) continue
    seen.add(p.at)
    out.push(p)
  }
  return out.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

export function mergeRadarHistoryPoints(
  a: RadarHistoryPointDTO[],
  b: RadarHistoryPointDTO[],
  opts?: { nowMs?: number; maxAgeMs?: number; cap?: number }
): RadarHistoryPointDTO[] {
  const nowMs = opts?.nowMs ?? Date.now()
  const maxAgeMs = opts?.maxAgeMs ?? 7 * MS_DAY
  const cap = opts?.cap ?? 240
  const merged = dedupeRadarPointsByAt([...a, ...b])
  const pruned = pruneRadarPointsByAge(merged, nowMs, maxAgeMs)
  return pruned.length > cap ? pruned.slice(-cap) : pruned
}
