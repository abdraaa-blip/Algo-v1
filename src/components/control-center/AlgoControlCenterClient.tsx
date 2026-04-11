"use client";

/**
 * Control Center · pilotage sobre (sondes réelles, pas de surcharge).
 * Complète `/control-room` (perception). Textes : `ALGO_UI_CONTROL_CENTER`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Cpu,
  Gauge,
  Layers,
  LineChart,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ALGO_UI_CONTROL_CENTER } from "@/lib/copy/ui-strings";
import {
  scoresFromFullHealth,
  scoresFromV1Probe,
  type HealthProbeShape,
} from "@/lib/control-center/scores-from-health";

type SummaryJson = {
  ok: boolean;
  generatedAt: string;
  runtime: {
    nodeEnv?: string;
    vercelEnv: string | null;
    deploymentId: string | null;
    commitShort: string | null;
    packageVersion: string | null;
  };
  ecosystem: {
    platformKeysConfigured: boolean;
    ecosystemApiVersion: string;
  };
};

type V1HealthJson = {
  ok?: boolean;
  platformKeysConfigured?: boolean;
  ecosystemApiVersion?: string;
  timestamp?: string;
};

function ScoreCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="algo-surface p-4 flex flex-col gap-1 min-w-0">
      <p className="algo-eyebrow font-semibold text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="algo-type-display text-2xl sm:text-3xl tabular-nums">
        {value}
      </p>
      {sub ? (
        <p className="algo-type-caption text-[length:inherit] mt-1">{sub}</p>
      ) : null}
    </div>
  );
}

function ModuleCard({
  title,
  hint,
  href,
  icon: Icon,
}: {
  title: string;
  hint: string;
  href: string;
  icon: typeof Cpu;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "algo-card-hit group block p-4 min-h-[100px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-violet)_45%,transparent)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] p-2 text-[color:var(--color-violet)]">
          <Icon size={18} strokeWidth={2} aria-hidden />
        </span>
        <ArrowRight
          size={16}
          className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] shrink-0 mt-0.5 transition-colors"
          aria-hidden
        />
      </div>
      <p className="algo-type-title text-base mt-3">{title}</p>
      <p className="algo-type-caption mt-1">{hint}</p>
    </Link>
  );
}

function buildMetaFromHealth(
  h: HealthProbeShape | null,
): { version?: string; buildTime?: string } | null {
  if (!h || typeof h !== "object") return null;
  const o = h as Record<string, unknown>;
  const version = typeof o.version === "string" ? o.version : undefined;
  const buildTime = typeof o.buildTime === "string" ? o.buildTime : undefined;
  if (!version && !buildTime) return null;
  return { version, buildTime };
}

function criticalLinesFromHealth(h: HealthProbeShape): string[] {
  const lines: string[] = [];
  const st = h.status;
  if (st === "unhealthy") lines.push("Statut global : critique.");
  else if (st === "degraded") lines.push("Statut global : dégradé.");
  const c = h.checks;
  if (!c) return lines;
  if (c.server === false) lines.push("Processus serveur : anomalie signalée.");
  if (c.database === false)
    lines.push("Base / Supabase REST : indisponible ou refus.");
  const ext = c.externalApis;
  if (ext && !Object.values(ext).some(Boolean)) {
    lines.push("APIs externes testées : aucune réponse positive.");
  }
  return lines.slice(0, 6);
}

export function AlgoControlCenterClient() {
  const t = ALGO_UI_CONTROL_CENTER;
  const [summary, setSummary] = useState<SummaryJson | null>(null);
  const [v1, setV1] = useState<V1HealthJson | null>(null);
  const [fullHealth, setFullHealth] = useState<HealthProbeShape | null>(null);
  const [lastQuickAt, setLastQuickAt] = useState<string | null>(null);
  const [lastFullAt, setLastFullAt] = useState<string | null>(null);
  const [busyQuick, setBusyQuick] = useState(false);
  const [busyFull, setBusyFull] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/control-center/summary", {
        cache: "no-store",
      });
      const json = (await res.json()) as SummaryJson;
      if (json.ok) setSummary(json);
    } catch {
      setSummary(null);
    }
  }, []);

  const runQuick = useCallback(async () => {
    setBusyQuick(true);
    try {
      const res = await fetch("/api/v1/health", { cache: "no-store" });
      const json = (await res.json()) as V1HealthJson;
      setV1(json);
      setLastQuickAt(new Date().toISOString());
    } catch {
      setV1(null);
      setLastQuickAt(new Date().toISOString());
    } finally {
      setBusyQuick(false);
    }
  }, []);

  const runFull = useCallback(async () => {
    setBusyFull(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      let json: HealthProbeShape | null = null;
      try {
        json = (await res.json()) as HealthProbeShape;
      } catch {
        json = null;
      }
      setFullHealth(json);
      setLastFullAt(new Date().toISOString());
      if (json) {
        setLogLines(criticalLinesFromHealth(json));
      } else {
        setLogLines(["Réponse `/api/health` illisible."]);
      }
    } catch {
      setFullHealth(null);
      setLastFullAt(new Date().toISOString());
      setLogLines(["Sonde complète impossible (réseau ou timeout)."]);
    } finally {
      setBusyFull(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
    void runQuick();
  }, [loadSummary, runQuick]);

  const scores = useMemo(() => {
    if (fullHealth?.checks) return scoresFromFullHealth(fullHealth);
    const v1Ok = v1?.ok === true;
    const keys = summary?.ecosystem.platformKeysConfigured === true;
    return scoresFromV1Probe(v1Ok, keys);
  }, [fullHealth, v1, summary]);

  const healthMeta = useMemo(
    () => buildMetaFromHealth(fullHealth),
    [fullHealth],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/observability/logs", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          critical?: Array<{ message?: string }>;
        };
        const crit = (data.critical || [])
          .slice(0, 5)
          .map((x) => x.message)
          .filter(Boolean) as string[];
        if (crit.length === 0 || cancelled) return;
        setLogLines((prev) => {
          if (prev.length > 0) return prev;
          return crit;
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-0 w-full text-[var(--color-text-primary)] pb-16 algo-min-h-viewport-content">
      <div className="algo-page-gutter py-8 sm:py-10 algo-stack-section max-w-5xl">
        <header className="space-y-2">
          <p className="algo-eyebrow font-semibold text-cyan-400/85">
            {t.eyebrowOps}
          </p>
          <h1 className="algo-type-display">{t.pageTitle}</h1>
          <p className="algo-type-body max-w-prose">{t.pageSubtitle}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/control-room"
              className="text-sm font-semibold text-[var(--color-text-tertiary)] hover:text-[color:var(--color-violet)] transition-colors inline-flex items-center gap-1"
            >
              {t.linkControlRoom}
              <ArrowRight size={14} aria-hidden />
            </Link>
            <Link
              href="/status"
              className="text-sm font-semibold text-[var(--color-text-tertiary)] hover:text-[color:var(--color-violet)] transition-colors"
            >
              {t.linkStatus}
            </Link>
            <a
              href="https://github.com/abdraaa-blip/Algo-v1/blob/main/docs/ALGO_SYSTEM_V1_CORES.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[var(--color-text-tertiary)] hover:text-[color:var(--color-violet)] transition-colors"
            >
              {t.linkDocsCores}
            </a>
          </div>
        </header>

        <section aria-labelledby="cc-scores" className="space-y-3">
          <h2 id="cc-scores" className="algo-type-page-title">
            {t.methodology}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <ScoreCard label={t.scoreGlobal} value={scores.global} />
            <ScoreCard label={t.scoreStability} value={scores.stability} />
            <ScoreCard label={t.scorePerformance} value={scores.performance} />
            <ScoreCard
              label={t.scoreUx}
              value="—"
              sub={t.uxNotAutomated}
            />
          </div>
          <p className="algo-type-caption max-w-prose border-l-2 border-[var(--color-border)] pl-3">
            {scores.methodologyFr}
          </p>
        </section>

        <section aria-labelledby="cc-modules" className="space-y-3">
          <h2 id="cc-modules" className="algo-type-page-title">
            {t.modulesTitle}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            <ModuleCard
              title={t.moduleCore}
              hint={t.moduleCoreHint}
              href="/status"
              icon={Cpu}
            />
            <ModuleCard
              title={t.moduleProduct}
              hint={t.moduleProductHint}
              href="/trends"
              icon={LineChart}
            />
            <ModuleCard
              title={t.moduleUi}
              hint={t.moduleUiHint}
              href="/"
              icon={Layers}
            />
            <ModuleCard
              title={t.moduleBrain}
              hint={t.moduleBrainHint}
              href="/ai"
              icon={Sparkles}
            />
          </div>
        </section>

        <section aria-labelledby="cc-build" className="space-y-3">
          <h2 id="cc-build" className="algo-type-page-title">
            {t.buildTitle}
          </h2>
          <div className="algo-surface p-4 sm:p-5 grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="algo-eyebrow font-semibold text-[var(--color-text-muted)] mb-1">
                {t.buildEnv}
              </p>
              <p className="text-[var(--color-text-primary)] font-medium">
                {summary?.runtime.vercelEnv ||
                  summary?.runtime.nodeEnv ||
                  t.buildUnknown}
              </p>
            </div>
            <div>
              <p className="algo-eyebrow font-semibold text-[var(--color-text-muted)] mb-1">
                {t.buildCommit}
              </p>
              <p className="font-mono text-[var(--color-text-secondary)]">
                {summary?.runtime.commitShort || "—"}
              </p>
            </div>
            <div>
              <p className="algo-eyebrow font-semibold text-[var(--color-text-muted)] mb-1">
                {t.buildDeploy}
              </p>
              <p className="font-mono text-xs text-[var(--color-text-tertiary)] break-all">
                {summary?.runtime.deploymentId || "—"}
              </p>
            </div>
            <div>
              <p className="algo-eyebrow font-semibold text-[var(--color-text-muted)] mb-1">
                {t.buildVersion}
              </p>
              <p className="text-[var(--color-text-secondary)]">
                {summary?.runtime.packageVersion || "—"}
              </p>
            </div>
            <p className="sm:col-span-2 algo-type-caption">{t.productionHint}</p>
            {healthMeta ? (
              <p className="sm:col-span-2 text-xs text-[var(--color-text-muted)]">
                Dernière sonde complète · version déclarée :{" "}
                <span className="font-mono">{healthMeta.version || "—"}</span>
                {" · "}
                buildTime :{" "}
                <span className="font-mono">{healthMeta.buildTime || "—"}</span>
              </p>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="cc-audit" className="space-y-3">
          <h2 id="cc-audit" className="algo-type-page-title">
            {t.auditTitle}
          </h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              variant="primary"
              loading={busyFull}
              onClick={() => void runFull()}
              icon={Gauge}
            >
              {t.auditFull}
            </Button>
            <Button
              variant="outline"
              loading={busyQuick}
              onClick={() => void runQuick()}
              icon={Activity}
            >
              {t.auditQuick}
            </Button>
          </div>
          <p className="algo-type-caption">{t.auditFullHint}</p>
          <p className="algo-type-caption -mt-2">{t.auditQuickHint}</p>
          {(lastQuickAt || lastFullAt) && (
            <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
              {lastQuickAt
                ? `Sonde légère : ${new Date(lastQuickAt).toLocaleString("fr-FR")}`
                : null}
              {lastQuickAt && lastFullAt ? " · " : null}
              {lastFullAt
                ? `Sonde complète : ${new Date(lastFullAt).toLocaleString("fr-FR")}`
                : null}
            </p>
          )}
        </section>

        <section aria-labelledby="cc-logs" className="space-y-3">
          <h2 id="cc-logs" className="algo-type-page-title">
            {t.logsTitle}
          </h2>
          <div className="algo-surface p-4 min-h-[120px]">
            {logLines.length === 0 ? (
              <p className="algo-type-caption">{t.logsEmpty}</p>
            ) : (
              <ul className="space-y-2 list-disc list-inside text-sm text-[var(--color-text-secondary)]">
                {logLines.map((line, i) => (
                  <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
