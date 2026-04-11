/**
 * Visual preferences for AlgoDataPlanet (totem). Persisted in localStorage.
 */

export const PLANET_PREFS_STORAGE_KEY = "algo_planet_prefs";
export const PLANET_PREFS_EVENT = "algo:planet-prefs";

export interface PlanetVisualPrefs {
  /** Overall layer opacity (canvas + glow strength multiplier). 0.25–1 */
  opacity: number;
  /** Planet radius multiplier vs variant default. 0.6–1.4 */
  size: number;
  /** Particle gravity, density, shooting stars. 0.5–1.5 */
  intensity: number;
}

export const DEFAULT_PLANET_PREFS: PlanetVisualPrefs = {
  opacity: 1,
  size: 1,
  intensity: 1,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function loadPlanetPrefs(): PlanetVisualPrefs {
  if (typeof window === "undefined") return DEFAULT_PLANET_PREFS;
  try {
    const raw = window.localStorage.getItem(PLANET_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PLANET_PREFS;
    const parsed = JSON.parse(raw) as Partial<PlanetVisualPrefs>;
    return {
      opacity: clamp(Number(parsed.opacity ?? 1), 0.25, 1),
      size: clamp(Number(parsed.size ?? 1), 0.6, 1.4),
      intensity: clamp(Number(parsed.intensity ?? 1), 0.5, 1.5),
    };
  } catch {
    return DEFAULT_PLANET_PREFS;
  }
}

export function savePlanetPrefs(prefs: PlanetVisualPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLANET_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event(PLANET_PREFS_EVENT));
}

export function resetPlanetPrefs(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLANET_PREFS_STORAGE_KEY);
  window.dispatchEvent(new Event(PLANET_PREFS_EVENT));
}
