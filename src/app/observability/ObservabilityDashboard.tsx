"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mapUserFacingApiError } from "@/lib/copy/api-error-fr";

type ObsSeverity = "info" | "warning" | "error" | "critical";

type ObsLog = {
  timestamp: number;
  layer: string;
  type: ObsSeverity;
  message: string;
  metadata?: Record<string, unknown>;
};

type Snapshot = {
  success?: boolean;
  logs?: ObsLog[];
  metrics1m?: Record<string, unknown>;
  metrics5m?: Record<string, unknown>;
  anomalies?: Array<{ level: string; code: string; detail: string }>;
  activeModules?: string[];
  generatedAt?: string;
};

export function ObservabilityDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [filterType, setFilterType] = useState<ObsSeverity | "all">("all");
  const [error, setError] = useState<string | null>(null);

  const fetchSnap = useCallback(async () => {
    try {
      const res = await fetch("/api/observability/logs", { cache: "no-store" });
      if (!res.ok) {
        setError(mapUserFacingApiError(`HTTP ${res.status}`));
        return;
      }
      const json = (await res.json()) as Snapshot;
      setSnapshot(json);
      setError(null);
    } catch (err) {
      setError(
        mapUserFacingApiError(
          err instanceof Error ? err.message : "Failed to fetch",
        ),
      );
    }
  }, []);

  useEffect(() => {
    void fetchSnap();
    const id = setInterval(() => void fetchSnap(), 2500);
    return () => clearInterval(id);
  }, [fetchSnap]);

  const filtered = useMemo(() => {
    const logs = snapshot?.logs ?? [];
    if (filterType === "all") return logs;
    return logs.filter((l) => l.type === filterType);
  }, [snapshot, filterType]);

  const globalState = useMemo(() => {
    const a = snapshot?.anomalies ?? [];
    if (a.some((x) => x.level === "error"))
      return { label: "Attention", tone: "text-rose-300" as const };
    if (a.some((x) => x.level === "warning"))
      return { label: "Veille", tone: "text-amber-300" as const };
    return { label: "Stable", tone: "text-emerald-300" as const };
  }, [snapshot]);

  return (
    <main className="min-h-dvh text-[var(--color-text-primary)] px-4 py-8 max-w-5xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Observabilité ALGO</h1>
        <p className="text-[13px] text-[var(--color-text-tertiary)]">
          Tampon process · rafraîchissement ~2,5s · dev ou{" "}
          <code className="text-[11px]">ALGO_OBSERVABILITY_DASHBOARD=1</code>
        </p>
      </header>

      {error ? (
        <p className="text-sm text-rose-300">
          Lecture snapshot impossible ({error}).
        </p>
      ) : null}

      <section className="algo-surface rounded-xl p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-[12px]">
        <Metric
          label="État global"
          value={globalState.label}
          valueClass={globalState.tone}
        />
        <Metric
          label="Événements (1 min)"
          value={String(
            (snapshot?.metrics1m as { totalInWindow?: number } | undefined)
              ?.totalInWindow ?? "—",
          )}
        />
        <Metric
          label="Erreurs / min"
          value={fmtNum(
            (snapshot?.metrics1m as { errorsPerMinute?: number } | undefined)
              ?.errorsPerMinute,
          )}
        />
        <Metric
          label="Latence API moy. (1 min)"
          value={
            (
              snapshot?.metrics1m as
                | { avgApiDurationMs?: number | null }
                | undefined
            )?.avgApiDurationMs != null
              ? `${(snapshot?.metrics1m as { avgApiDurationMs: number }).avgApiDurationMs} ms`
              : "—"
          }
        />
      </section>

      <section className="algo-surface rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Anomalies (heuristique)
        </h2>
        {(snapshot?.anomalies?.length ?? 0) === 0 ? (
          <p className="text-[12px] text-[var(--color-text-muted)]">
            Aucun signal sur la fenêtre récente.
          </p>
        ) : (
          <ul className="space-y-2 text-[12px]">
            {snapshot!.anomalies!.map((a) => (
              <li
                key={`${a.code}-${a.detail}`}
                className={
                  a.level === "error"
                    ? "border-l-2 border-rose-500/60 pl-2 text-rose-200/90"
                    : "border-l-2 border-amber-500/50 pl-2 text-amber-200/85"
                }
              >
                <span className="font-mono text-[10px] opacity-70">
                  {a.code}
                </span>{" "}
                · {a.detail}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="algo-surface rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Flux de logs
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "info", "warning", "error", "critical"] as const).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                    filterType === t
                      ? "border-[var(--color-violet)] bg-[var(--color-violet-muted)] text-[var(--color-text-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  {t}
                </button>
              ),
            )}
          </div>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Modules actifs (registre) :{" "}
          {(snapshot?.activeModules ?? []).join(" · ")} ·{" "}
          {snapshot?.generatedAt ? `snapshot ${snapshot.generatedAt}` : ""}
        </p>
        <ul className="max-h-[50vh] overflow-y-auto space-y-1.5 font-mono text-[11px]">
          {filtered.map((l) => (
            <li
              key={`${l.timestamp}-${l.message}-${l.layer}`}
              className="border-b border-[var(--color-border)]/60 pb-1.5 text-[var(--color-text-secondary)]"
            >
              <span className="text-[var(--color-text-muted)]">
                {new Date(l.timestamp).toISOString()}
              </span>{" "}
              <span className="text-cyan-300/80">{l.layer}</span>{" "}
              <span
                className={
                  l.type === "critical"
                    ? "text-rose-400"
                    : l.type === "error"
                      ? "text-rose-300/90"
                      : l.type === "warning"
                        ? "text-amber-300/90"
                        : "text-emerald-300/80"
                }
              >
                [{l.type}]
              </span>{" "}
              {l.message}
              {l.metadata ? (
                <pre className="mt-0.5 text-[10px] text-[var(--color-text-muted)] whitespace-pre-wrap break-all">
                  {JSON.stringify(l.metadata, null, 0).slice(0, 280)}
                  {(JSON.stringify(l.metadata).length ?? 0) > 280 ? "…" : ""}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </p>
      <p
        className={`text-lg font-semibold mt-0.5 ${valueClass ?? "text-[var(--color-text-primary)]"}`}
      >
        {value}
      </p>
    </div>
  );
}

function fmtNum(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}
