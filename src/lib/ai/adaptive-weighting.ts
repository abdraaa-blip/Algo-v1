export interface AdaptiveSignals {
  engagementRate: number
  frictionRate: number
}

export interface AdaptiveWeights {
  hook: number
  trend: number
  format: number
  emotion: number
  timing: number
}

export const BASE_WEIGHTS: AdaptiveWeights = {
  hook: 0.25,
  trend: 0.3,
  format: 0.15,
  emotion: 0.15,
  timing: 0.15,
}

const MAX_WEIGHT_SHIFT = 0.03
const MIN_WEIGHT = 0.1
const MAX_WEIGHT = 0.4

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalize(weights: AdaptiveWeights): AdaptiveWeights {
  const sum = weights.hook + weights.trend + weights.format + weights.emotion + weights.timing
  if (sum === 0) return BASE_WEIGHTS
  return {
    hook: weights.hook / sum,
    trend: weights.trend / sum,
    format: weights.format / sum,
    emotion: weights.emotion / sum,
    timing: weights.timing / sum,
  }
}

export function computeAdaptiveWeights(signals?: Partial<AdaptiveSignals>): {
  weights: AdaptiveWeights
  notes: string[]
  rollbackApplied: boolean
  version: string
} {
  if (!signals || typeof signals.engagementRate !== 'number' || typeof signals.frictionRate !== 'number') {
    return {
      weights: BASE_WEIGHTS,
      notes: ['baseline: missing adaptive signals'],
      rollbackApplied: true,
      version: getWeightVersion(BASE_WEIGHTS),
    }
  }

  const engagementRate = clamp(signals.engagementRate, 0, 1)
  const frictionRate = clamp(signals.frictionRate, 0, 1)
  const notes: string[] = []

  // Automatic rollback guard: if quality signals are degraded, force baseline.
  if (frictionRate > 0.2 || (frictionRate > 0.12 && engagementRate < 0.1)) {
    return {
      weights: BASE_WEIGHTS,
      notes: ['automatic rollback: degraded adaptive signals, reverted to baseline'],
      rollbackApplied: true,
      version: getWeightVersion(BASE_WEIGHTS),
    }
  }

  const adjusted: AdaptiveWeights = { ...BASE_WEIGHTS }

  // If engagement is weak, slightly increase trend+hook sensitivity.
  if (engagementRate < 0.15) {
    adjusted.trend = clamp(adjusted.trend + MAX_WEIGHT_SHIFT, MIN_WEIGHT, MAX_WEIGHT)
    adjusted.hook = clamp(adjusted.hook + MAX_WEIGHT_SHIFT / 2, MIN_WEIGHT, MAX_WEIGHT)
    notes.push('engagement low: boosted trend/hook weights')
  } else if (engagementRate > 0.35) {
    adjusted.format = clamp(adjusted.format + MAX_WEIGHT_SHIFT / 2, MIN_WEIGHT, MAX_WEIGHT)
    notes.push('engagement high: boosted format weight')
  }

  // If friction is high, increase timing+emotion penalties sensitivity.
  if (frictionRate > 0.08) {
    adjusted.timing = clamp(adjusted.timing + MAX_WEIGHT_SHIFT, MIN_WEIGHT, MAX_WEIGHT)
    adjusted.emotion = clamp(adjusted.emotion + MAX_WEIGHT_SHIFT / 2, MIN_WEIGHT, MAX_WEIGHT)
    notes.push('friction high: boosted timing/emotion weights')
  }

  const normalized = normalize(adjusted)
  return {
    weights: normalized,
    notes: notes.length ? notes : ['adaptive signals stable: baseline-biased weights'],
    rollbackApplied: false,
    version: getWeightVersion(normalized),
  }
}

export function getWeightVersion(weights: AdaptiveWeights): string {
  const signature = [
    weights.hook.toFixed(4),
    weights.trend.toFixed(4),
    weights.format.toFixed(4),
    weights.emotion.toFixed(4),
    weights.timing.toFixed(4),
  ].join('|')
  let hash = 0
  for (let i = 0; i < signature.length; i++) {
    hash = (hash << 5) - hash + signature.charCodeAt(i)
    hash |= 0
  }
  return `w_${Math.abs(hash)}`
}
