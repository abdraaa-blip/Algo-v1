'use client'

import type { AlgoControlRoomBrainState } from '@/lib/control-room/brain-state'
import { clampControlRoomIntensity } from '@/lib/control-room/brain-state'
import styles from './AlgoControlRoomBrain.module.css'

type Props = {
  state: AlgoControlRoomBrainState
  reduceMotion: boolean
}

const RINGS = [
  { rx: 118, ry: 52, rot: 0 },
  { rx: 118, ry: 52, rot: 60 },
  { rx: 118, ry: 52, rot: 120 },
] as const

/**
 * Visualisation abstraite (wireframe 2D) — pas une modélisation cognitive.
 */
export function AlgoControlRoomBrain({ state, reduceMotion }: Props) {
  const intensity = clampControlRoomIntensity(state.intensity)
  const flow = clampControlRoomIntensity(state.flowSpeed) / 100
  const t = intensity / 100
  const strokeW = 0.35 + t * 0.55

  return (
    <div
      className={styles.root}
      data-mode={state.mode}
      data-reduce-motion={reduceMotion ? 'true' : 'false'}
      style={{
        ['--cr-intensity' as string]: String(t),
        ['--cr-flow' as string]: String(flow),
      }}
      aria-hidden
    >
      <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_28px_rgba(94,207,255,0.12)]">
        <defs>
          <linearGradient id="crStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-blue-neon, #5ecfff)" stopOpacity="0.35" />
            <stop offset="50%" stopColor="var(--color-blue-neon, #5ecfff)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--color-violet, #7B61FF)" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        <g className={styles.shell} transform="translate(200 200)">
          {RINGS.map((r) => (
            <ellipse
              key={r.rot}
              rx={r.rx}
              ry={r.ry}
              fill="none"
              stroke="url(#crStroke)"
              strokeWidth={strokeW}
              transform={`rotate(${r.rot})`}
            />
          ))}
          <circle r="22" fill="rgba(94,207,255,0.06)" stroke="url(#crStroke)" strokeWidth={strokeW * 0.9} />
        </g>

        <g
          className={styles.flow}
          fill="none"
          stroke="url(#crStroke)"
          strokeWidth={strokeW * 0.85}
          strokeLinecap="round"
        >
          <path d="M 72 200 L 328 200" opacity={0.55} />
          <path d="M 200 72 L 200 328" opacity={0.45} />
          <path d="M 108 108 L 292 292" opacity={0.35} />
          <path d="M 292 108 L 108 292" opacity={0.35} />
        </g>

        {[
          [200, 64],
          [336, 200],
          [200, 336],
          [64, 200],
        ].map(([cx, cy], i) => (
          <circle key={i} className={styles.node} cx={cx} cy={cy} r={3.2 + t * 2} fill="var(--color-blue-neon, #5ecfff)" />
        ))}
      </svg>
    </div>
  )
}
