"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FusionContextPanel } from "@/components/dashboard/FusionContextPanel";
import { InsightBox } from "@/components/dashboard/InsightBox";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { ViralChart } from "@/components/dashboard/ViralChart";
import { useScopeContext } from "@/contexts/ScopeContext";
import { fetchAlgo } from "@/lib/api";
import { toViralChartPoints } from "@/lib/dashboard/viral-chart-series";
import { getScopeCountryCode } from "@/lib/geo/country-profile";
import { isViralControlRegion } from "@/lib/intelligence/viral-control-regions";
import type { ViralFusionPayload } from "@/lib/intelligence/viral-fusion";

type ViralPayload = {
  success?: boolean;
  global?: {
    viralScore: number;
    confidence: number;
    momentum?: "up" | "stable" | "down";
  };
  series?: Array<{ at: string; viralityScore: number }>;
  trendVsGlobal?: { headlineFr: string };
  disclaimerFr?: string;
  radarDeltaHint?: { kind: string; deltaPercent: number; noteFr: string };
};

export function DashboardClient() {
  const { scope } = useScopeContext();
  const region = useMemo(() => {
    const code = getScopeCountryCode(scope) ?? "FR";
    return isViralControlRegion(code) ? code : "FR";
  }, [scope]);

  const [viral, setViral] = useState<ViralPayload | null>(null);
  const [viralError, setViralError] = useState<string | null>(null);
  const [radarSyncedAt, setRadarSyncedAt] = useState<Date | null>(null);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(true);
  const [fusion, setFusion] = useState<ViralFusionPayload | null>(null);
  const [fusionError, setFusionError] = useState<string | null>(null);
  const [fusionLoading, setFusionLoading] = useState(true);

  const loadViral = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/intelligence/viral-control?region=${encodeURIComponent(region)}&days=7`,
        {
          cache: "no-store",
        },
      );
      const json = (await res.json()) as ViralPayload;
      if (!res.ok || json.success === false) {
        setViralError("Données radar indisponibles pour l’instant.");
        setViral(null);
        return;
      }
      setViral(json);
      setViralError(null);
      setRadarSyncedAt(new Date());
    } catch {
      setViralError("Réseau ou timeout.");
      setViral(null);
    }
  }, [region]);

  const loadFusion = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/intelligence/viral-fusion?region=${encodeURIComponent(region)}`,
        {
          cache: "no-store",
        },
      );
      const json = (await res.json()) as ViralFusionPayload & {
        success?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setFusionError(
          "Fusion tendance / YouTube indisponible pour l’instant.",
        );
        setFusion(null);
        return;
      }
      if (json.kind === "algo.viral_fusion") {
        setFusion(json);
        setFusionError(null);
      }
    } catch {
      setFusionError("Réseau ou timeout (fusion).");
      setFusion(null);
    } finally {
      setFusionLoading(false);
    }
  }, [region]);

  const loadInsightForPayload = useCallback(
    async (
      payload: ViralPayload | null,
      country: string,
      signal?: AbortSignal,
      extraTrendHint?: string | null,
    ) => {
      const hint = payload?.trendVsGlobal?.headlineFr;
      const merged = [hint, extraTrendHint?.trim()].filter((x): x is string =>
        Boolean(x && x.trim().length > 1),
      );
      const trendsCtx = merged.length ? [...new Set(merged)] : undefined;
      try {
        const r2 = await fetchAlgo(
          "En trois phrases : est-ce que le signal décolle pour cette zone, pourquoi, et quel prochain pas concret ?",
          {
            context: { userCountry: country, currentTrends: trendsCtx },
            country,
          },
        );
        if (signal?.aborted) return;
        const text =
          r2.standard?.reponse?.trim() ||
          r2.text?.trim() ||
          "Pas de lecture pour l’instant. Ouvre /ai pour une question ciblée.";
        const headline = hint ?? extraTrendHint?.trim() ?? "";
        setInsight(headline ? `${headline}\n\n${text}` : text);
      } catch {
        if (!signal?.aborted) {
          setInsight(
            "Lecture IA indisponible pour l’instant. Réessaie ou ouvre /ai.",
          );
        }
      }
    },
    [],
  );

  /** Chargement initial : radar puis **une seule** lecture IA (pas de rappel à chaque poll). */
  useEffect(() => {
    const ac = new AbortController();
    async function boot() {
      setInsightLoading(true);
      setViralError(null);
      let payload: ViralPayload | null = null;
      let fusionPayload: ViralFusionPayload | null = null;
      setFusionLoading(true);
      try {
        const [resViral, resFusion] = await Promise.all([
          fetch(
            `/api/intelligence/viral-control?region=${encodeURIComponent(region)}&days=7`,
            {
              cache: "no-store",
              signal: ac.signal,
            },
          ),
          fetch(
            `/api/intelligence/viral-fusion?region=${encodeURIComponent(region)}`,
            {
              cache: "no-store",
              signal: ac.signal,
            },
          ),
        ]);

        const json = (await resViral.json()) as ViralPayload;
        if (!resViral.ok || json.success === false) {
          if (!ac.signal.aborted) {
            setViralError("Données radar indisponibles pour l’instant.");
            setViral(null);
          }
        } else {
          payload = json;
          if (!ac.signal.aborted) {
            setViral(json);
            setRadarSyncedAt(new Date());
          }
        }

        const fusionJson = (await resFusion.json()) as ViralFusionPayload & {
          success?: boolean;
        };
        if (!ac.signal.aborted) {
          if (resFusion.ok && fusionJson.kind === "algo.viral_fusion") {
            fusionPayload = fusionJson;
            setFusion(fusionJson);
            setFusionError(null);
          } else {
            setFusionError(
              "Fusion tendance / YouTube indisponible pour l’instant.",
            );
            setFusion(null);
          }
          setFusionLoading(false);
        }
      } catch {
        if (ac.signal.aborted) return;
        setViralError("Réseau ou timeout.");
        setViral(null);
        setFusionError("Réseau ou timeout (fusion).");
        setFusion(null);
        setFusionLoading(false);
      }

      const trendHint = !ac.signal.aborted
        ? (fusionPayload?.topTrend?.title ?? null)
        : null;
      await loadInsightForPayload(payload, region, ac.signal, trendHint);
      if (!ac.signal.aborted) setInsightLoading(false);
    }
    void boot();
    return () => ac.abort();
  }, [region, loadInsightForPayload]);

  const refreshInsight = useCallback(async () => {
    setInsightLoading(true);
    await loadInsightForPayload(
      viral,
      region,
      undefined,
      fusion?.topTrend?.title ?? null,
    );
    setInsightLoading(false);
  }, [viral, region, fusion, loadInsightForPayload]);

  useEffect(() => {
    const id = setInterval(() => void loadViral(), 10_000);
    return () => clearInterval(id);
  }, [loadViral]);

  useEffect(() => {
    const id = setInterval(() => void loadFusion(), 45_000);
    return () => clearInterval(id);
  }, [loadFusion]);

  const chartData = useMemo(() => toViralChartPoints(viral?.series), [viral]);

  const score = viral?.global?.viralScore ?? 0;
  const confidence = viral?.global?.confidence;
  const momentum = viral?.global?.momentum;

  return (
    <main className="min-h-0 w-full text-[var(--color-text-primary)] px-4 py-8 max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard signal</h1>
        <p className="text-[13px] text-[var(--color-text-tertiary)] max-w-xl">
          Trois réponses : est-ce que ça décolle ? pourquoi ? quoi faire
          maintenant ? Radar rafraîchi ~10s · zone{" "}
          <span className="font-mono text-[var(--color-text-secondary)]">
            {region}
          </span>
          {radarSyncedAt ? (
            <>
              {" "}
              · dernière synchro locale{" "}
              <time dateTime={radarSyncedAt.toISOString()}>
                {radarSyncedAt.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </time>
            </>
          ) : null}
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          {viral?.disclaimerFr}
        </p>
      </header>

      {viralError ? (
        <p className="text-sm text-amber-200/90">{viralError}</p>
      ) : null}

      <ScoreCard score={score} confidence={confidence} momentum={momentum} />

      <FusionContextPanel
        data={fusion}
        error={fusionError}
        loading={fusionLoading}
      />

      <section className="algo-surface rounded-xl p-4 border border-[var(--color-border)] space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Courbe score (historique radar)
        </h2>
        <ViralChart data={chartData} />
        {viral?.radarDeltaHint ? (
          <p
            className="text-[12px] text-[var(--color-text-tertiary)] leading-relaxed pt-1"
            role="status"
          >
            {viral.radarDeltaHint.noteFr}
          </p>
        ) : null}
      </section>

      <InsightBox
        text={insight}
        loading={insightLoading}
        onRefreshInsight={refreshInsight}
      />

      <footer className="pt-2 text-[12px] text-[var(--color-text-muted)] flex flex-wrap gap-3">
        <Link
          href="/intelligence/viral-control"
          className="text-[var(--color-violet)] hover:underline"
        >
          Cockpit complet Viral Control →
        </Link>
        <Link
          href="/trends"
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        >
          Tendances live
        </Link>
      </footer>
    </main>
  );
}
