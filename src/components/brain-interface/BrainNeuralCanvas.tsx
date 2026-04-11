"use client";

import { cn } from "@/lib/utils";
import styles from "./brain-interface.module.css";
import { ALGO_UI_BRAIN_INTERFACE } from "@/lib/copy/ui-strings";

export type BrainStatusTone = "ok" | "sync" | "alert";

export type BrainNeuralCanvasProps = {
  globalScore: number;
  stabilityScore: number;
  statusTone: BrainStatusTone;
  reduceMotion: boolean;
};

const cx = 160;
const cy = 188;
/** Quatre hubs autour du centre (wireframe « tête » abstraite). */
const MODULES = [
  { id: "core", mx: 160, my: 72, labelKey: "moduleCore" as const },
  { id: "product", mx: 252, my: 188, labelKey: "moduleProduct" as const },
  { id: "ui", mx: 160, my: 308, labelKey: "moduleUi" as const },
  { id: "brain", mx: 68, my: 188, labelKey: "moduleBrain" as const },
];

function strokeForTone(tone: BrainStatusTone): string {
  if (tone === "alert") return "rgba(232,93,117,0.55)";
  if (tone === "sync") return "rgba(232,200,106,0.5)";
  return "rgba(94,207,255,0.42)";
}

function nodeFill(tone: BrainStatusTone): string {
  if (tone === "alert") return "rgba(232,93,117,0.35)";
  if (tone === "sync") return "rgba(232,200,106,0.3)";
  return "rgba(123,97,255,0.35)";
}

export function BrainNeuralCanvas({
  globalScore,
  stabilityScore,
  statusTone,
  reduceMotion,
}: BrainNeuralCanvasProps) {
  const t = ALGO_UI_BRAIN_INTERFACE;
  const stroke = strokeForTone(statusTone);
  const fillHub = nodeFill(statusTone);
  const flowOpacity = 0.12 + (Math.min(100, globalScore) / 100) * 0.38;
  const hubR = 5 + (Math.min(100, stabilityScore) / 100) * 3;

  return (
    <div
      className="relative w-full max-w-md mx-auto aspect-[320/400] select-none"
      style={{ contain: "layout paint" }}
    >
      <svg
        viewBox="0 0 320 400"
        className="w-full h-full drop-shadow-[0_0_24px_rgba(94,207,255,0.08)]"
        role="img"
        aria-label="Visualisation abstraite des modules ALGO et des flux"
      >
        <defs>
          <linearGradient id="brain-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(94,207,255,0.15)" />
            <stop offset="50%" stopColor="rgba(123,97,255,0.35)" />
            <stop offset="100%" stopColor="rgba(244,244,252,0.12)" />
          </linearGradient>
        </defs>

        {/* Silhouette tête · wireframe minimal */}
        <ellipse
          cx={cx}
          cy={cy - 8}
          rx={102}
          ry={128}
          fill="none"
          stroke="rgba(244,244,252,0.14)"
          strokeWidth={1.1}
        />
        <path
          d={`M ${cx - 38} ${cy + 108} Q ${cx} ${cy + 138} ${cx + 38} ${cy + 108}`}
          fill="none"
          stroke="rgba(244,244,252,0.1)"
          strokeWidth={1}
        />

        {/* Connexions centre ↔ modules */}
        {MODULES.map((m) => (
          <line
            key={m.id}
            x1={cx}
            y1={cy}
            x2={m.mx}
            y2={m.my}
            stroke="url(#brain-line-grad)"
            strokeWidth={1.2}
            opacity={flowOpacity}
            className={cn(!reduceMotion && styles.flow)}
          />
        ))}

        {/* Noyau central */}
        <circle
          cx={cx}
          cy={cy}
          r={hubR}
          fill={fillHub}
          stroke={stroke}
          strokeWidth={1.5}
          className={cn(!reduceMotion && styles.nodePulse)}
        />

        {MODULES.map((m, i) => (
          <g key={m.id}>
            <circle
              cx={m.mx}
              cy={m.my}
              r={4.5}
              fill="rgba(244,244,252,0.08)"
              stroke={stroke}
              strokeWidth={1.2}
              className={cn(!reduceMotion && styles.nodePulse)}
              style={
                !reduceMotion ? { animationDelay: `${i * 0.35}s` } : undefined
              }
            />
            <text
              x={m.mx}
              y={m.my + (m.my > cy ? 22 : -14)}
              textAnchor="middle"
              className="fill-[var(--color-text-tertiary)]"
              style={{
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {t[m.labelKey]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
