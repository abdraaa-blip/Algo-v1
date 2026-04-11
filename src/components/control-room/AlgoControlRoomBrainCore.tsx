"use client";

import Link from "next/link";
import type { AlgoControlRoomBrainState } from "@/lib/control-room/brain-state";
import {
  CONTROL_ROOM_MODULE_LAYOUT,
  CONTROL_ROOM_MODULE_ROUTES,
  type ControlRoomModuleId,
} from "@/lib/control-room/module-graph";
import { AlgoControlRoomBrain } from "@/components/control-room/AlgoControlRoomBrain";
import styles from "./AlgoControlRoomBrainCore.module.css";

const MODULE_ORDER: ControlRoomModuleId[] = [
  "probe",
  "health",
  "pipeline",
  "radar",
  "trends",
];

type Props = {
  state: AlgoControlRoomBrainState;
  reduceMotion: boolean;
  lastProbeAt: string | null;
};

/**
 * Cœur visuel Control Room : schéma wireframe discret + cerveau abstrait existant
 * + liens modules (valeur UX, pas une métaphore cognitive).
 */
export function AlgoControlRoomBrainCore({
  state,
  reduceMotion,
  lastProbeAt,
}: Props) {
  const active = new Set(state.activeModuleIds);
  const probeTime = lastProbeAt
    ? new Date(lastProbeAt).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : null;

  return (
    <div className="flex flex-col items-center gap-1 min-w-0 w-full">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
        Schéma central (illustration)
      </p>

      <div
        className={styles.wrap}
        data-mode={state.mode}
        data-reduce-motion={reduceMotion ? "true" : "false"}
      >
        <svg
          className={styles.silhouetteSvg}
          viewBox="0 0 400 400"
          aria-hidden
        >
          <defs>
            <linearGradient id="crSilStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                stopColor="var(--color-blue-neon, #5ecfff)"
                stopOpacity="0.2"
              />
              <stop
                offset="100%"
                stopColor="var(--color-violet, #7B61FF)"
                stopOpacity="0.35"
              />
            </linearGradient>
          </defs>
          <g className={styles.silhouetteGroup} fill="none">
            <ellipse
              cx="200"
              cy="168"
              rx="118"
              ry="132"
              stroke="url(#crSilStroke)"
              strokeWidth="0.9"
            />
            <path
              d="M 200 56 L 200 292"
              stroke="url(#crSilStroke)"
              strokeWidth="0.55"
              opacity={0.55}
            />
            <path
              d="M 118 168 Q 200 228 282 168"
              stroke="url(#crSilStroke)"
              strokeWidth="0.55"
              opacity={0.45}
            />
            <path
              d="M 128 248 Q 200 312 272 248"
              stroke="url(#crSilStroke)"
              strokeWidth="0.65"
              opacity={0.5}
            />
            <path
              d="M 200 292 Q 200 338 168 352 Q 136 360 104 338"
              stroke="url(#crSilStroke)"
              strokeWidth="0.7"
              opacity={0.4}
            />
            <path
              d="M 200 292 Q 200 338 232 352 Q 264 360 296 338"
              stroke="url(#crSilStroke)"
              strokeWidth="0.7"
              opacity={0.4}
            />
          </g>
        </svg>

        <div className={styles.brainLift}>
          <AlgoControlRoomBrain state={state} reduceMotion={reduceMotion} />
        </div>
      </div>

      <p className="text-[11px] text-center text-[var(--color-text-tertiary)] max-w-sm leading-relaxed px-1 mt-1">
        Contours indicatifs uniquement : ce n’est pas une image du modèle ni de
        l’infra réelle. L’intensité suit la probe et le mode affiché en bandeau.
      </p>

      <div className={styles.explorer}>
        <p
          id="cr-module-explorer-label"
          className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)] mb-2 text-center"
        >
          Explorer les modules (liens produit)
        </p>
        {probeTime ? (
          <p className="text-[10px] text-center text-[var(--color-text-tertiary)] tabular-nums mb-2">
            Dernière probe : {probeTime}
          </p>
        ) : null}
        <nav
          aria-labelledby="cr-module-explorer-label"
          className={styles.moduleNav}
        >
          <ul className="grid gap-2">
            {MODULE_ORDER.map((id) => {
              const { label } = CONTROL_ROOM_MODULE_LAYOUT[id];
              const { href, blurb } = CONTROL_ROOM_MODULE_ROUTES[id];
              const on = active.has(id);
              return (
                <li key={id}>
                  <Link
                    href={href}
                    className={styles.moduleLink}
                    data-active={on ? "true" : "false"}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={styles.moduleTitle}>{label}</span>
                      <span className={styles.moduleMeta}>
                        {on ? "sous tension" : "veille"}
                      </span>
                    </div>
                    <p className={styles.moduleBlurb}>{blurb}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
