const DEFAULT_STEP_MS = 90_000

function safeNow(): number {
  return Date.now()
}

export function getSyncedRegionIndex(key: string, listLength: number, stepMs = DEFAULT_STEP_MS): number {
  if (listLength <= 0) return 0
  if (typeof window === 'undefined') {
    return Math.floor(safeNow() / stepMs) % listLength
  }

  const storageKey = `algo:region-rotation:${key}`
  const currentBucket = Math.floor(safeNow() / stepMs)
  const raw = window.sessionStorage.getItem(storageKey)
  const parsed = raw ? Number(raw) : Number.NaN

  if (!Number.isFinite(parsed) || parsed !== currentBucket) {
    window.sessionStorage.setItem(storageKey, String(currentBucket))
  }
  return currentBucket % listLength
}

export function getSyncedRegionByIndex<T>(key: string, regions: readonly T[], stepMs = DEFAULT_STEP_MS): T {
  const idx = getSyncedRegionIndex(key, regions.length, stepMs)
  return regions[idx]
}
