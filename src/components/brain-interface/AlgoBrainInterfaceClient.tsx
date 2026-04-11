"use client";

/**
 * Brain Interface · immersion optionnelle, sondes réelles (alignées Control Center).
 * Pas de promesse de « pensée » du modèle — décor + état, voir `docs/ALGO_CONTROL_ROOM.md`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ALGO_UI_BRAIN_INTERFACE, ALGO_UI_CONTROL_CENTER } from "@/lib/copy/ui-strings";
import {
  scoresFromFullHealth,
  scoresFromV1Probe,
  type HealthProbeShape,
} from "@/lib/control-center/scores-from-health";
import {
  BrainNeuralCanvas,
  type BrainStatusTone,
} from "@/components/brain-interface/BrainNeuralCanvas";

type SummaryJson = {
  ok: boolean;
  generatedAt: string;
  runtime: {
    vercelEnv: string | null;
    commitShort: string | null;
  };
  ecosystem: { platformKeysConfigured: boolean };
};

type V1HealthJson = {
  ok?: boolean;
  platformKeysConfigured?: boolean;
  timestamp?: string;
};

function toneFromHealth(h: HealthProbeShape | null): BrainStatusTone {
  if (!h?.status) return "ok";
  if (h.status === "unhealthy") return "alert";
  if (h.status === "degraded") return "sync";
  return "ok";
}

export function AlgoBrainInterfaceClient() {
  const t = ALGO_UI_BRAIN_INTERFACE;
  const tc = ALGO_UI_CONTROL_CENTER;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [summary, setSummary] = useState<SummaryJson | null>(null);
  const [v1, setV1] = useState<V1HealthJson | null>(null);
  const [fullHealth, setFullHealth] = useState<HealthProbeShape | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const refreshLight = useCallback(async () => {
    try {
      const [sumRes, v1Res] = await Promise.all([
        fetch("/api/control-center/summary", { cache: "no-store" }),
        fetch("/api/v1/health", { cache: "no-store" }),
      ]);
      try {
        const j = (await sumRes.json()) as SummaryJson;
        if (j.ok) setSummary(j);
      } catch {
        setSummary(null);
      }
      try {
        setV1((await v1Res.json()) as V1HealthJson);
      } catch {
        setV1(null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const refreshFull = useCallback(async () => {
    setBusy(true);
    try {
      await refreshLight();
      try {
        const healthRes = await fetch("/api/health", { cache: "no-store" });
        setFullHealth((await healthRes.json()) as HealthProbeShape);
      } catch {
        setFullHealth(null);
      }
      setLastSync(new Date().toISOString());
    } finally {
      setBusy(false);
    }
  }, [refreshLight]);

  useEffect(() => {
    void refreshFull();
    const id = window.setInterval(() => void refreshLight(), 45_000);
    return () => window.clearInterval(id);
  }, [refreshFull, refreshLight]);

  const scores = useMemo(() => {
    if (fullHealth?.checks) return scoresFromFullHealth(fullHealth);
    return scoresFromV1Probe(v1?.ok === true, summary?.ecosystem.platformKeysConfigured === true);
  }, [fullHealth, v1, summary]);

  const tone = useMemo(() => toneFromHealth(fullHealth), [fullHealth]);

  return (
    <main className="min-h-0 w-full text-[var(--color-text-primary)] pb-20 algo-min-h-viewport-content">
      <div className="algo-page-gutter py-8 sm:py-10 max-w-3xl mx-auto algo-stack-section">
        <header className="space-y-2 text-center sm:text-left">
          <p className="algo-eyebrow font-semibold text-cyan-400/85">{t.eyebrow}</p>
          <h1 className="algo-type-display">{t.pageTitle}</h1>
          <p className="algo-type-body max-w-prose mx-auto sm:mx-0">{t.subtitle}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-2">
            <Link
              href="/control-center"
              className="text-sm font-semibold text-[color:var(--color-violet)] inline-flex items-center gap-1 hover:underline"
            >
              {t.linkControlCenter}
              <ArrowRight size={14} aria-hidden />
            </Link>
            <Link
              href="/control-room"
              className="text-sm font-semibold text-[var(--color-text-tertiary)] hover:text-[color:var(--color-violet)] transition-colors"
            >
              {tc.linkControlRoom}
            </Link>
          </div>
        </header>

        <div className="algo-surface p-5 sm:p-8 flex flex-col items-center gap-6">
          <BrainNeuralCanvas
            globalScore={scores.global}
            stabilityScore={scores.stability}
            statusTone={tone}
            reduceMotion={reduceMotion}
          />
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2">
              <p className="algo-eyebrow text-[var(--color-text-muted)]">{tc.scoreGlobal}</p>
              <p className="text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
                {scores.global}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2">
              <p className="algo-eyebrow text-[var(--color-text-muted)]">{tc.scoreStability}</p>
              <p className="text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
                {scores.stability}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2">
              <p className="algo-eyebrow text-[var(--color-text-muted)]">{tc.scorePerformance}</p>
              <p className="text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
                {scores.performance}
              </p>
            </div>
          </div>
          <p className="algo-type-caption text-center max-w-md">{t.scoresHint}</p>
          <Button
            variant="outline"
            loading={busy}
            icon={RefreshCw}
            onClick={() => void refreshFull()}
          >
            {t.syncButton}
          </Button>
          {lastSync ? (
            <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
              Dernière synchro :{" "}
              {new Date(lastSync).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "medium",
              })}
            </p>
          ) : null}
          {summary?.runtime.commitShort ? (
            <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
              {summary.runtime.vercelEnv || "—"} · {summary.runtime.commitShort}
            </p>
          ) : null}
          {reduceMotion ? (
            <p className="algo-type-caption text-center">{t.reducedMotionNote}</p>
          ) : null}
        </div>

        <section
          aria-labelledby="brain-product-q"
          className="algo-surface p-5 sm:p-6 space-y-3 border border-[var(--color-border)]"
        >
          <h2 id="brain-product-q" className="algo-type-page-title">
            {t.productQTitle}
          </h2>
          <ul className="space-y-2 text-sm text-[var(--color-text-secondary)] leading-relaxed list-disc list-inside">
            <li>{t.productQValue}</li>
            <li>{t.productQPlace}</li>
            <li>{t.productQDefault}</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
