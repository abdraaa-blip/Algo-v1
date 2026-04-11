"use client";

/**
 * Control room · perception uniquement.
 * Contrat produit : `docs/ALGO_CONTROL_ROOM.md` · garde-fous généraux : `docs/ALGO_OFFLINE_EVOLUTION.md`.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, Radio, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALGO_UI_LOADING } from "@/lib/copy/ui-strings";
import {
  clampControlRoomIntensity,
  DEFAULT_CONTROL_ROOM_BRAIN_STATE,
  type AlgoControlRoomBrainState,
} from "@/lib/control-room/brain-state";
import { defaultActiveModulesForMode } from "@/lib/control-room/module-graph";
import {
  mapHealthProbeResultToBrainState,
  type HealthProbeJson,
} from "@/lib/control-room/map-probe-to-visual";
import { CONTROL_ROOM_QUICK_NAV } from "@/lib/control-room/quick-nav";
import { AlgoControlRoomBrainCore } from "@/components/control-room/AlgoControlRoomBrainCore";
import { AlgoControlRoomModuleGraph } from "@/components/control-room/AlgoControlRoomModuleGraph";

const PREDICTING_DEMO_MS = 8200;

export function AlgoControlRoomClient() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [brainState, setBrainState] = useState<AlgoControlRoomBrainState>(
    DEFAULT_CONTROL_ROOM_BRAIN_STATE,
  );
  const [lastProbeAt, setLastProbeAt] = useState<string | null>(null);
  const [probeNote, setProbeNote] = useState<string | null>(null);
  const [probeTone, setProbeTone] = useState<"neutral" | "sync" | "alert">(
    "neutral",
  );
  const predictingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    return () => {
      if (predictingTimer.current) clearTimeout(predictingTimer.current);
    };
  }, []);

  const pingLightHealth = useCallback(async () => {
    setProbeTone("neutral");
    setBrainState((s) => ({
      ...s,
      mode: "analyzing",
      intensity: clampControlRoomIntensity(s.intensity + 8),
      flowSpeed: clampControlRoomIntensity(s.flowSpeed + 14),
      activeModuleIds: defaultActiveModulesForMode({ mode: "analyzing" }),
    }));
    setProbeNote(null);
    try {
      const res = await fetch("/api/v1/health", { cache: "no-store" });
      let json: HealthProbeJson | null = null;
      try {
        json = (await res.json()) as HealthProbeJson;
      } catch {
        json = null;
      }
      const mapped = mapHealthProbeResultToBrainState({ resOk: res.ok, json });
      setBrainState({
        mode: mapped.mode,
        intensity: mapped.intensity,
        flowSpeed: mapped.flowSpeed,
        activeModuleIds: mapped.activeModuleIds,
      });
      setLastProbeAt(new Date().toISOString());

      if (mapped.mode === "alert") {
        setProbeTone("alert");
        setProbeNote("La probe écosystème ne répond pas comme attendu.");
      } else if (mapped.mode === "syncing") {
        setProbeTone("sync");
        setProbeNote(
          "Ton déploiement répond, mais les clés plateforme ne sont pas toutes présentes : certaines capacités API restent limitées.",
        );
      } else {
        setProbeNote(null);
      }
    } catch {
      setBrainState({
        mode: "alert",
        intensity: clampControlRoomIntensity(52),
        flowSpeed: clampControlRoomIntensity(76),
        activeModuleIds: defaultActiveModulesForMode({ mode: "alert" }),
      });
      setLastProbeAt(new Date().toISOString());
      setProbeTone("alert");
      setProbeNote("Probe locale impossible pour l’instant.");
    }
  }, []);

  useEffect(() => {
    void pingLightHealth();
    const id = window.setInterval(() => void pingLightHealth(), 60_000);
    return () => window.clearInterval(id);
  }, [pingLightHealth]);

  const startPredictingDemo = useCallback(() => {
    if (predictingTimer.current) clearTimeout(predictingTimer.current);
    setProbeNote(null);
    setProbeTone("neutral");
    setBrainState({
      mode: "predicting",
      intensity: 72,
      flowSpeed: 88,
      activeModuleIds: defaultActiveModulesForMode({ mode: "predicting" }),
    });
    predictingTimer.current = setTimeout(() => {
      predictingTimer.current = null;
      setBrainState(DEFAULT_CONTROL_ROOM_BRAIN_STATE);
    }, PREDICTING_DEMO_MS);
  }, []);

  const modeLabel =
    brainState.mode === "analyzing"
      ? "Analyse (probe réseau)"
      : brainState.mode === "predicting"
        ? "Démo flux (visuel)"
        : brainState.mode === "syncing"
          ? "Veille · clés partielles"
          : brainState.mode === "alert"
            ? "Signal d’attention"
            : "Veille";

  const modeChipClass =
    brainState.mode === "analyzing"
      ? "text-cyan-300/95"
      : brainState.mode === "predicting"
        ? "text-[color:var(--color-violet)]"
        : brainState.mode === "syncing"
          ? "text-[color:var(--color-amber)]"
          : brainState.mode === "alert"
            ? "text-[color:var(--color-red-alert)]"
            : "text-[var(--color-text-secondary)]";

  const probeTimeShort = lastProbeAt
    ? new Date(lastProbeAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <main className="min-h-0 w-full text-[var(--color-text-primary)]">
      <div className="relative min-h-0 w-full flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,rgba(94,207,255,0.07),transparent_52%)] pointer-events-none" />

        <div
          role="region"
          aria-label="État control room"
          className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/90 backdrop-blur-md"
        >
          <div
            className={cn(
              "max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] font-medium",
              modeChipClass,
            )}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1">
              <Activity size={12} className="shrink-0 opacity-80" aria-hidden />
              {modeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1">
              <Radio size={12} className="shrink-0 opacity-80" aria-hidden />
              {brainState.intensity}%
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1">
              <Zap size={12} className="shrink-0 opacity-80" aria-hidden />
              {brainState.flowSpeed}%
            </span>
            {probeTimeShort ? (
              <span className="text-[var(--color-text-tertiary)] font-normal tabular-nums">
                Probe · {probeTimeShort}
              </span>
            ) : null}
            {reduceMotion ? (
              <span className="text-[var(--color-text-tertiary)] font-normal">
                Mouvement réduit
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col gap-10">
          <header className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              ALGO · cockpit
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Control room
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Lecture calme : signaux légers, schéma statique. Pas la pensée du
              modèle, pas la topologie serveur réelle.
            </p>
            <p className="text-xs pt-1">
              <Link
                href="/control-center"
                className="font-semibold text-[color:var(--color-violet)] hover:underline"
              >
                Control Center
              </Link>
              <span className="text-[var(--color-text-muted)]">
                {" "}
                · pilotage (sondes, build, audits)
              </span>
            </p>
          </header>

          <section
            aria-labelledby="cr-visual-title"
            className="grid gap-10 lg:grid-cols-2 lg:gap-8 lg:items-start"
          >
            <h2 id="cr-visual-title" className="sr-only">
              Visualisation centrale et schéma de flux
            </h2>
            <div className="flex flex-col items-center gap-2 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] lg:hidden">
                Signal visuel
              </p>
              <AlgoControlRoomBrainCore
                state={brainState}
                reduceMotion={reduceMotion}
                lastProbeAt={lastProbeAt}
              />
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              <p
                id="cr-flow-label"
                className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] px-1"
              >
                Schéma flux (statique)
              </p>
              <AlgoControlRoomModuleGraph
                state={brainState}
                reduceMotion={reduceMotion}
              />
            </div>
          </section>

          {brainState.mode === "analyzing" ? (
            <p className="text-sm text-center text-[var(--color-text-secondary)]">
              {ALGO_UI_LOADING.status}
            </p>
          ) : null}

          {probeNote ? (
            <p
              className={cn(
                "text-sm max-w-lg mx-auto text-center leading-relaxed",
                probeTone === "alert" && "text-amber-200/95",
                probeTone === "sync" && "text-[var(--color-text-secondary)]",
                probeTone === "neutral" && "text-[var(--color-text-secondary)]",
              )}
            >
              {probeNote}
            </p>
          ) : null}

          {lastProbeAt ? (
            <p className="text-[11px] text-center text-[var(--color-text-tertiary)]">
              Dernière probe légère :{" "}
              {new Date(lastProbeAt).toLocaleString("fr-FR")}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => void pingLightHealth()}
              className="text-xs px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Relancer la probe
            </button>
            <button
              type="button"
              onClick={startPredictingDemo}
              disabled={reduceMotion}
              className="text-xs px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] disabled:opacity-40 transition-colors"
              title={
                reduceMotion
                  ? "Désactivé quand le système demande moins de mouvement."
                  : "Animation locale uniquement, sans appel modèle."
              }
            >
              Démo flux (visuel)
            </button>
          </div>

          <nav
            aria-label="Navigation rapide"
            className="border-t border-[var(--color-border)] pt-8"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] text-center mb-4">
              Navigation rapide
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-w-3xl mx-auto">
              {CONTROL_ROOM_QUICK_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-3 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)] hover:border-cyan-500/25 transition-colors text-center"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-wrap gap-4 justify-center pb-10 text-sm border-t border-[var(--color-border)] pt-8">
            <Link
              href="/intelligence"
              className="text-cyan-400/90 hover:text-cyan-300 underline-offset-2 hover:underline"
            >
              Intelligence radar
            </Link>
            <Link
              href="/transparency"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline-offset-2 hover:underline"
            >
              Transparence
            </Link>
            <Link
              href="/status"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline-offset-2 hover:underline"
            >
              Statut produit
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
