/**
 * États visuels pour la Control Room (couche perception uniquement).
 * Ne reflètent pas une cartographie cognitive réelle — uniquement l’activité UI / probes.
 */

import type { ControlRoomModuleId } from '@/lib/control-room/module-graph'

export type AlgoControlRoomMode = 'idle' | 'analyzing' | 'predicting' | 'syncing' | 'alert'

export type AlgoControlRoomBrainState = {
  mode: AlgoControlRoomMode
  /** 0–100 · amplitude des animations côté client */
  intensity: number
  /** 0–100 · vitesse relative des flux SVG (traits en pointillés) */
  flowSpeed: number
  /** Modules du schéma statique actuellement « actifs » (lisibilité, pas runtime) */
  activeModuleIds: readonly ControlRoomModuleId[]
}

export function clampControlRoomIntensity(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

export const DEFAULT_CONTROL_ROOM_BRAIN_STATE: AlgoControlRoomBrainState = {
  mode: 'idle',
  intensity: 28,
  flowSpeed: 26,
  activeModuleIds: ['probe', 'health', 'pipeline', 'radar', 'trends'],
}
