/**
 * Métriques dérivées du tampon de logs (sans instrumentation métier lourde).
 */

import type { AlgoObsLog } from "@/core/observability/types";

export type AlgoObservabilityMetrics = {
  windowMs: number;
  totalInWindow: number;
  byLayer: Record<string, number>;
  byType: Record<string, number>;
  errorsPerMinute: number;
  warningsPerMinute: number;
  avgApiDurationMs: number | null;
  lastEventAt: number | null;
};

function countBy<T extends string>(
  logs: AlgoObsLog[],
  pick: (l: AlgoObsLog) => T,
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const l of logs) {
    const k = pick(l);
    acc[k] = (acc[k] ?? 0) + 1;
  }
  return acc;
}

export function computeObservabilityMetrics(
  logs: AlgoObsLog[],
  windowMs = 60_000,
): AlgoObservabilityMetrics {
  const now = Date.now();
  const inWindow = logs.filter((l) => now - l.timestamp <= windowMs);

  const apiDurations = inWindow
    .filter(
      (l) => l.layer === "api" && typeof l.metadata?.durationMs === "number",
    )
    .map((l) => l.metadata!.durationMs as number);

  const avgApiDurationMs =
    apiDurations.length > 0
      ? Math.round(
          apiDurations.reduce((a, b) => a + b, 0) / apiDurations.length,
        )
      : null;

  const errors = inWindow.filter(
    (l) => l.type === "error" || l.type === "critical",
  ).length;
  const warnings = inWindow.filter((l) => l.type === "warning").length;
  const minutes = windowMs / 60_000;

  return {
    windowMs,
    totalInWindow: inWindow.length,
    byLayer: countBy(inWindow, (l) => l.layer),
    byType: countBy(inWindow, (l) => l.type),
    errorsPerMinute: minutes > 0 ? errors / minutes : 0,
    warningsPerMinute: minutes > 0 ? warnings / minutes : 0,
    avgApiDurationMs,
    lastEventAt: inWindow.length
      ? Math.max(...inWindow.map((l) => l.timestamp))
      : null,
  };
}
