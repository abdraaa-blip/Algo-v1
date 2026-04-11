"use client";

import type { AlgoControlRoomBrainState } from "@/lib/control-room/brain-state";
import { clampControlRoomIntensity } from "@/lib/control-room/brain-state";
import {
  activeFlowEdges,
  CONTROL_ROOM_FLOW_EDGES,
  CONTROL_ROOM_MODULE_LAYOUT,
  type ControlRoomModuleId,
} from "@/lib/control-room/module-graph";
import styles from "./AlgoControlRoomModuleGraph.module.css";

type Props = {
  state: AlgoControlRoomBrainState;
  reduceMotion: boolean;
};

function lineBetween(a: ControlRoomModuleId, b: ControlRoomModuleId): string {
  const A = CONTROL_ROOM_MODULE_LAYOUT[a];
  const B = CONTROL_ROOM_MODULE_LAYOUT[b];
  return `M ${A.cx} ${A.cy} L ${B.cx} ${B.cy}`;
}

/**
 * Schéma statique des modules produit · positions fixes (pas de hasard à chaque rendu).
 */
export function AlgoControlRoomModuleGraph({ state, reduceMotion }: Props) {
  const active = new Set(state.activeModuleIds);
  const litEdges = activeFlowEdges(active);
  const flow = clampControlRoomIntensity(state.flowSpeed) / 100;

  const edgeKeys = (e: {
    from: ControlRoomModuleId;
    to: ControlRoomModuleId;
  }) => `${e.from}->${e.to}`;

  return (
    <figure
      className={styles.wrap}
      data-reduce-motion={reduceMotion ? "true" : "false"}
      style={{ ["--cr-flow" as string]: String(flow) }}
    >
      <figcaption className="sr-only">
        Schéma indicatif des flux entre probe, endpoint santé, pipeline
        question-réponse et surfaces radar — décor, pas une capture runtime.
      </figcaption>
      <svg
        viewBox="0 0 352 104"
        className="w-full h-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]/50"
      >
        <defs>
          <linearGradient id="crGraphStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor="var(--color-blue-neon, #5ecfff)"
              stopOpacity="0.25"
            />
            <stop
              offset="50%"
              stopColor="var(--color-blue-neon, #5ecfff)"
              stopOpacity="0.85"
            />
            <stop
              offset="100%"
              stopColor="var(--color-violet, #7B61FF)"
              stopOpacity="0.35"
            />
          </linearGradient>
        </defs>

        <g opacity={0.22}>
          {CONTROL_ROOM_FLOW_EDGES.map((e) => (
            <path
              key={`dim-${edgeKeys(e)}`}
              d={lineBetween(e.from, e.to)}
              stroke="var(--color-border)"
              strokeWidth={1}
              fill="none"
            />
          ))}
        </g>

        <g>
          {litEdges.map((e) => (
            <path
              key={edgeKeys(e)}
              className={styles.edge}
              d={lineBetween(e.from, e.to)}
            />
          ))}
        </g>

        {(Object.keys(CONTROL_ROOM_MODULE_LAYOUT) as ControlRoomModuleId[]).map(
          (id) => {
            const { cx, cy, label } = CONTROL_ROOM_MODULE_LAYOUT[id];
            const on = active.has(id);
            return (
              <g key={id} opacity={on ? 1 : 0.32}>
                <circle
                  className={styles.nodeDisk}
                  cx={cx}
                  cy={cy}
                  r={on ? 7 : 5}
                  fill={on ? "rgba(94,207,255,0.14)" : "rgba(255,255,255,0.04)"}
                  stroke="var(--color-blue-neon, #5ecfff)"
                  strokeWidth={on ? 1.1 : 0.6}
                />
                <text
                  x={cx}
                  y={cy + 22}
                  textAnchor="middle"
                  className={styles.label}
                >
                  {label}
                </text>
              </g>
            );
          },
        )}

        <text x={176} y={98} textAnchor="middle" className={styles.caption}>
          Schéma statique · pas la topologie réelle des serveurs
        </text>
      </svg>
    </figure>
  );
}
