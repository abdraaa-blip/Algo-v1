/**
 * Tampon circulaire en mémoire process (observabilité · pas de persistance garantie).
 * En serverless, chaque instance a son propre buffer — utile pour dev / debug / staging ciblé.
 */

import type {
  AlgoObsLayer,
  AlgoObsLog,
  AlgoObsSeverity,
} from "@/core/observability/types";

const DEFAULT_MAX = 500;

let maxEntries = DEFAULT_MAX;
const buffer: AlgoObsLog[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  for (const cb of listeners) {
    try {
      cb();
    } catch {
      /* observer ne doit pas casser le flux */
    }
  }
}

export function setObservabilityBufferMax(n: number): void {
  if (Number.isFinite(n) && n >= 10 && n <= 10_000) {
    maxEntries = Math.floor(n);
    while (buffer.length > maxEntries) buffer.shift();
  }
}

export function addLog(
  entry: Omit<AlgoObsLog, "timestamp"> & { timestamp?: number },
): AlgoObsLog {
  const log: AlgoObsLog = {
    timestamp: entry.timestamp ?? Date.now(),
    layer: entry.layer,
    type: entry.type,
    message: entry.message,
    ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
  };
  buffer.push(log);
  if (buffer.length > maxEntries) buffer.shift();
  notify();
  return log;
}

export type LogFilter = {
  layer?: AlgoObsLayer;
  type?: AlgoObsSeverity;
  sinceMs?: number;
};

export function getLogs(filter?: LogFilter): AlgoObsLog[] {
  let out = [...buffer];
  if (filter?.sinceMs !== undefined) {
    const t = Date.now() - filter.sinceMs;
    out = out.filter((l) => l.timestamp >= t);
  }
  if (filter?.layer) out = out.filter((l) => l.layer === filter.layer);
  if (filter?.type) out = out.filter((l) => l.type === filter.type);
  return out.sort((a, b) => b.timestamp - a.timestamp);
}

export function clearLogs(): void {
  buffer.length = 0;
  notify();
}

export function getCriticalErrors(): AlgoObsLog[] {
  return buffer
    .filter((l) => l.type === "critical")
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getErrorLogs(): AlgoObsLog[] {
  return buffer
    .filter((l) => l.type === "error" || l.type === "critical")
    .sort((a, b) => b.timestamp - a.timestamp);
}

/** Souscription légère pour polling ou tests (pas de WebSocket pour limiter la charge). */
export function subscribeObservabilityLogs(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getLogBufferSize(): number {
  return buffer.length;
}
