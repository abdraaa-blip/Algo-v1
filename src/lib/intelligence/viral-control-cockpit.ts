import type { RadarHistoryPointDTO } from '@/lib/intelligence/radar-history-utils'
import { deriveRadarDeltaHint, type RadarDeltaHint } from '@/lib/intelligence/radar-series-hint'
import type { GlobalIntelligenceSnapshot } from '@/lib/intelligence/predictive-intelligence-bundle'

const MS_HOUR = 60 * 60 * 1000

export type ViralControlMomentum = 'up' | 'stable' | 'down'

export type ViralControlCockpitPayload = {
  success: true
  kind: 'algo.viral_control_cockpit'
  generatedAt: string
  region: string
  locale: string
  disclaimerFr: string
  global: {
    viralScore: number
    confidence: number
    momentum: ViralControlMomentum
    velocityPerHour: number | null
    accelerationPerHour2: number | null
  }
  series: RadarHistoryPointDTO[]
  engagementProxy: {
    viewsIndex: number
    likesIndex: number
    commentsIndex: number
    sharesIndex: number
    noteFr: string
  }
  anomalies: GlobalIntelligenceSnapshot['anomalies']
  trendVsGlobal: { headlineFr: string; detailFr: string }
  actions: Array<{ title: string; detailFr: string; priority: 'now' | 'soon' | 'watch' }>
  topCategory: string | null
  /** Variation récente sur la série radar (2 derniers points), si significative. */
  radarDeltaHint?: RadarDeltaHint
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function momentumFromVelocity(v: number | null): ViralControlMomentum {
  if (v == null || !Number.isFinite(v)) return 'stable'
  if (v > 0.35) return 'up'
  if (v < -0.35) return 'down'
  return 'stable'
}

/**
 * Dérivées simples sur l’historique radar (scores agrégés, pas des vues réelles par post).
 */
export function deriveVelocityAcceleration(points: RadarHistoryPointDTO[]): {
  velocityPerHour: number | null
  accelerationPerHour2: number | null
} {
  const sorted = [...points].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  if (sorted.length < 2) return { velocityPerHour: null, accelerationPerHour2: null }
  const last = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  const t1 = new Date(prev.at).getTime()
  const t2 = new Date(last.at).getTime()
  const dtH = (t2 - t1) / MS_HOUR
  if (!Number.isFinite(dtH) || dtH <= 0) return { velocityPerHour: null, accelerationPerHour2: null }
  const v1 = (last.viralityScore - prev.viralityScore) / dtH
  if (sorted.length < 4) return { velocityPerHour: v1, accelerationPerHour2: null }
  const p2 = sorted[sorted.length - 3]
  const p3 = sorted[sorted.length - 4]
  const t0 = new Date(p3.at).getTime()
  const tMid = new Date(p2.at).getTime()
  const dtH0 = (tMid - t0) / MS_HOUR
  const dtH1 = (t1 - tMid) / MS_HOUR
  if (!Number.isFinite(dtH0) || dtH0 <= 0 || !Number.isFinite(dtH1) || dtH1 <= 0) {
    return { velocityPerHour: v1, accelerationPerHour2: null }
  }
  const v0 = (prev.viralityScore - p2.viralityScore) / dtH1
  const acc = (v1 - v0) / ((dtH + dtH1) / 2 || 1)
  return { velocityPerHour: v1, accelerationPerHour2: Number.isFinite(acc) ? acc : null }
}

function engagementProxyFromSnapshot(snapshot: GlobalIntelligenceSnapshot): ViralControlCockpitPayload['engagementProxy'] {
  const e = snapshot.sources.firstPartySignals.engagementRate
  const f = snapshot.sources.firstPartySignals.frictionRate
  const top = [...snapshot.categories].sort((a, b) => b.score - a.score)[0]
  const base = top ? top.score : 50
  const viewsIndex = clamp(Math.round(base + e * 15), 0, 100)
  const likesIndex = clamp(Math.round(base * 0.92 + e * 22), 0, 100)
  const commentsIndex = clamp(Math.round(base * 0.78 + e * 18 - f * 12), 0, 100)
  const sharesIndex = clamp(Math.round(base * 0.85 + e * 20 - f * 8), 0, 100)
  return {
    viewsIndex,
    likesIndex,
    commentsIndex,
    sharesIndex,
    noteFr:
      'Indices normalisés 0 à 100 dérivés des signaux agrégés ALGO (pas des compteurs plateforme bruts). À croiser avec ton terrain.',
  }
}

function buildTrendVsGlobal(
  top: GlobalIntelligenceSnapshot['categories'][number] | undefined,
  snapshot: GlobalIntelligenceSnapshot
): ViralControlCockpitPayload['trendVsGlobal'] {
  const avgCat =
    snapshot.categories.length > 0
      ? snapshot.categories.reduce((s, c) => s + c.score, 0) / snapshot.categories.length
      : 50
  const alignDelta = top ? top.score - avgCat : 0
  if (Math.abs(alignDelta) < 4) {
    return {
      headlineFr: 'Aligné avec le panier de tendances',
      detailFr: 'Ta catégorie dominante suit la moyenne des scores thématiques du radar.',
    }
  }
  if (alignDelta > 0) {
    return {
      headlineFr: 'Catégorie au-dessus du panier',
      detailFr: `${top?.name ?? 'Sujet'} pousse plus fort que la moyenne des autres thèmes suivis.`,
    }
  }
  return {
    headlineFr: 'Écart sous la moyenne',
    detailFr:
      'Le panier global est plus chaud que ta catégorie tête de liste. Vérifie saturation et angles.',
  }
}

export function buildViralControlCockpitPayload(input: {
  region: string
  locale: string
  snapshot: GlobalIntelligenceSnapshot
  predictedViralityScore: number
  confidence: number
  radarPoints: RadarHistoryPointDTO[]
  recommendations: Array<{ type: string; title: string; confidence: number }>
}): ViralControlCockpitPayload {
  const { snapshot, predictedViralityScore, confidence, radarPoints, recommendations, region, locale } = input
  const top = [...snapshot.categories].sort((a, b) => b.score - a.score)[0]
  const { velocityPerHour, accelerationPerHour2 } = deriveVelocityAcceleration(radarPoints)
  const momentum = momentumFromVelocity(velocityPerHour)

  const actions: ViralControlCockpitPayload['actions'] = []
  for (const r of recommendations.slice(0, 5)) {
    const priority: 'now' | 'soon' | 'watch' =
      r.confidence >= 0.72 ? 'now' : r.confidence >= 0.55 ? 'soon' : 'watch'
    actions.push({
      title: r.title,
      detailFr: `Piste ${r.type} · confiance indicative ${Math.round(r.confidence * 100)} %.`,
      priority,
    })
  }
  if (actions.length === 0) {
    actions.push({
      title: 'Consolider le hook sur 3 secondes',
      detailFr: 'Sans métriques fines par post, garde un test court avant de scaler la prod.',
      priority: 'soon',
    })
  }

  const radarDeltaHint = deriveRadarDeltaHint(radarPoints) ?? undefined

  return {
    success: true,
    kind: 'algo.viral_control_cockpit',
    generatedAt: new Date().toISOString(),
    region: region.toUpperCase(),
    locale: locale.toLowerCase(),
    disclaimerFr:
      'Cockpit indicatif : courbes et indices viennent du radar ALGO (agrégats publics), pas d’un compte créateur relié.',
    global: {
      viralScore: predictedViralityScore,
      confidence,
      momentum,
      velocityPerHour,
      accelerationPerHour2,
    },
    series: [...radarPoints].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    engagementProxy: engagementProxyFromSnapshot(snapshot),
    anomalies: snapshot.anomalies,
    trendVsGlobal: buildTrendVsGlobal(top, snapshot),
    actions,
    topCategory: top?.name ?? null,
    ...(radarDeltaHint ? { radarDeltaHint } : {}),
  }
}
