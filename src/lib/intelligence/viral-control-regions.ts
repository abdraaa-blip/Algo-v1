/** Régions supportées par le radar intelligence / Viral Control (codes pays ISO2). */
export const VIRAL_CONTROL_REGION_CODES = ['FR', 'US', 'GB', 'NG', 'MA', 'SN'] as const

export type ViralControlRegionCode = (typeof VIRAL_CONTROL_REGION_CODES)[number]

export function isViralControlRegion(code: string): code is ViralControlRegionCode {
  return (VIRAL_CONTROL_REGION_CODES as readonly string[]).includes(code)
}
