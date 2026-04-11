"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Database,
  Radio,
  Shield,
  Zap,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAlgoMetrics, useAutonomyMetrics } from "@/hooks/useAlgoSystem";
import { cn } from "@/lib/utils";

/**
 * Tableau de bord technique (dev) : état temps réel des sous-systèmes ALGO.
 * Libellés interface en français ; identifiants techniques API inchangés.
 */
export function MonitorDashboard() {
  const metrics = useAlgoMetrics();
  const autonomy = useAutonomyMetrics();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [opsAlerts, setOpsAlerts] = useState<
    Array<{
      id: string;
      domain: "autonomy" | "learning" | "resilience";
      severity: "low" | "medium" | "high";
      message: string;
    }>
  >([]);
  const [circuitSummary, setCircuitSummary] = useState<{
    total: number;
    open: string[];
  }>({ total: 0, open: [] });

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateOps = async () => {
      try {
        const res = await fetch("/api/intelligence/ops-alerts", {
          cache: "no-store",
        });
        const json = (await res.json()) as {
          success: boolean;
          alerts?: Array<{
            id: string;
            domain: "autonomy" | "learning" | "resilience";
            severity: "low" | "medium" | "high";
            message: string;
          }>;
          resilience?: { totalCircuits: number; openCircuits: string[] };
        };
        if (json.success) {
          setOpsAlerts(Array.isArray(json.alerts) ? json.alerts : []);
          setCircuitSummary({
            total: json.resilience?.totalCircuits || 0,
            open: Array.isArray(json.resilience?.openCircuits)
              ? json.resilience!.openCircuits
              : [],
          });
        }
      } catch {
        // silent
      }
    };
    void updateOps();
    const interval = setInterval(() => void updateOps(), 10000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="min-h-0 w-full bg-[#030014] text-white flex items-center justify-center">
        <div className="animate-pulse">Initialisation du moniteur ALGO…</div>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3600000)
      return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="min-h-0 w-full bg-[#030014] text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-violet-400" size={32} />
            <div>
              <h1 className="text-2xl font-black">Moniteur ALGO</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Vue système en temps réel
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--color-text-muted)]">
              Dernière mise à jour
            </div>
            <div className="font-mono text-sm">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Statut orchestrateur */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-yellow-400" size={20} />
            <h2 className="font-bold">Orchestrateur</h2>
            <div
              className={cn(
                "ml-auto size-3 rounded-full",
                metrics.orchestrator.isRunning
                  ? "bg-green-500 animate-pulse"
                  : "bg-red-500",
              )}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Disponibilité
              </span>
              <span className="font-mono">
                {formatUptime(metrics.orchestrator.uptime)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Total des appels
              </span>
              <span className="font-mono">
                {metrics.orchestrator.totalFetches}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Taux de réussite
              </span>
              <span
                className={cn(
                  "font-mono",
                  metrics.orchestrator.totalFetches > 0 &&
                    metrics.orchestrator.successfulFetches /
                      metrics.orchestrator.totalFetches >
                      0.9
                    ? "text-green-400"
                    : "text-yellow-400",
                )}
              >
                {metrics.orchestrator.totalFetches > 0
                  ? `${Math.round((metrics.orchestrator.successfulFetches / metrics.orchestrator.totalFetches) * 100)}%`
                  : "—"}
              </span>
            </div>

            {/* Next Ticks */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">
                Prochaine synchro
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(metrics.orchestrator.nextTicks).map(
                  ([source, ms]) => (
                    <div key={source} className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">
                        {source}
                      </span>
                      <span className="font-mono">
                        {formatTime(ms as number)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cache Status */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Database className="text-blue-400" size={20} />
            <h2 className="font-bold">Cache</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Entrées totales
              </span>
              <span className="font-mono">{metrics.cache.totalEntries}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Efficacité cache
              </span>
              <span
                className={cn(
                  "font-mono",
                  metrics.cache.hitRate > 0.7
                    ? "text-green-400"
                    : "text-yellow-400",
                )}
              >
                {Math.round(metrics.cache.hitRate * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Hits / ratés
              </span>
              <span className="font-mono">
                {metrics.cache.hits} / {metrics.cache.misses}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Hits périmés
              </span>
              <span className="font-mono text-yellow-400">
                {metrics.cache.staleHits}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Évictions
              </span>
              <span className="font-mono">{metrics.cache.evictions}</span>
            </div>

            {/* Entries per source */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">
                Entrées par source
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(metrics.cache.entriesPerSource).map(
                  ([source, count]) => (
                    <div key={source} className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">
                        {source}
                      </span>
                      <span className="font-mono">{count as number}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bus d’événements */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="text-purple-400" size={20} />
            <h2 className="font-bold">Bus d’événements</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Événements publiés
              </span>
              <span className="font-mono">
                {metrics.eventBus.eventsPublished}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Événements livrés
              </span>
              <span className="font-mono">
                {metrics.eventBus.eventsDelivered}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Abonnés
              </span>
              <span className="font-mono">
                {metrics.eventBus.subscriberCount}
              </span>
            </div>

            {/* Événements récents */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">
                Événements récents
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {metrics.eventBus.recentEvents
                  .slice(-5)
                  .reverse()
                  .map((event, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)] truncate">
                        {event.event}
                      </span>
                      <span className="font-mono text-[var(--color-text-muted)]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Garde cohérence */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-green-400" size={20} />
            <h2 className="font-bold">Garde cohérence</h2>
            <div
              className={cn(
                "ml-auto size-3 rounded-full",
                metrics.coherence.isRunning ? "bg-green-500" : "bg-red-500",
              )}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Vérifications
              </span>
              <span className="font-mono">
                {metrics.coherence.checksPerformed}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Incohérences
              </span>
              <span
                className={cn(
                  "font-mono",
                  metrics.coherence.inconsistenciesDetected > 0
                    ? "text-yellow-400"
                    : "text-green-400",
                )}
              >
                {metrics.coherence.inconsistenciesDetected}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Corrections auto
              </span>
              <span className="font-mono">{metrics.coherence.autoFixes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Auto-guérisons
              </span>
              <span className="font-mono">{metrics.coherence.selfHeals}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Composants suivis
              </span>
              <span className="font-mono">
                {metrics.coherence.trackedComponents}
              </span>
            </div>

            {/* Check Results */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">
                État des vérifications
              </div>
              <div className="space-y-1">
                {Object.entries(metrics.coherence.checks).map(
                  ([name, check]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-[var(--color-text-secondary)]">
                        {name}
                      </span>
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          (check as { lastResult: string }).lastResult ===
                            "pass"
                            ? "bg-green-500"
                            : (check as { lastResult: string }).lastResult ===
                                "fail"
                              ? "bg-red-500"
                              : "bg-gray-500",
                        )}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Optimiseur de performances */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="text-cyan-400" size={20} />
            <h2 className="font-bold">Performances</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Préchargements
              </span>
              <span className="font-mono">
                {metrics.performance.prefetchesPerformed}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Hits préchargement
              </span>
              <span className="font-mono">
                {metrics.performance.prefetchHits}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Efficacité préchargement
              </span>
              <span
                className={cn(
                  "font-mono",
                  metrics.performance.prefetchHitRate > 0.5
                    ? "text-green-400"
                    : "text-[var(--color-text-secondary)]",
                )}
              >
                {Math.round(metrics.performance.prefetchHitRate * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Pauses de rafraîchissement
              </span>
              <span className="font-mono">
                {metrics.performance.adaptiveRefreshPauses}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Motifs suivis
              </span>
              <span className="font-mono">
                {metrics.performance.trackedPatterns}
              </span>
            </div>

            {/* Qualité de connexion */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 text-sm">
                {metrics.performance.connectionQuality.type === "fast" ? (
                  <Wifi className="text-green-400" size={16} />
                ) : metrics.performance.connectionQuality.type === "medium" ? (
                  <Wifi className="text-yellow-400" size={16} />
                ) : (
                  <WifiOff className="text-red-400" size={16} />
                )}
                <span className="text-[var(--color-text-secondary)]">
                  Connexion
                </span>
                <span className="ml-auto font-mono">
                  {metrics.performance.connectionQuality.effectiveType}(
                  {metrics.performance.connectionQuality.type})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* État du système */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-orange-400" size={20} />
            <h2 className="font-bold">État du système</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-4 rounded-full",
                  metrics.orchestrator.isRunning
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500",
                )}
              />
              <span>Orchestrateur</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-4 rounded-full",
                  metrics.coherence.isRunning
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500",
                )}
              />
              <span>Garde cohérence</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-4 rounded-full bg-green-500 animate-pulse" />
              <span>Bus d’événements</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-4 rounded-full",
                  !metrics.performance.isInBackground
                    ? "bg-green-500 animate-pulse"
                    : "bg-yellow-500",
                )}
              />
              <span>Optimiseur de performances</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
            <div className="text-xs text-[var(--color-text-muted)] mb-2">
              Page actuelle
            </div>
            <div className="font-mono text-sm">
              {metrics.performance.currentPage}
            </div>
          </div>
        </div>

        {/* Autonomie Metrics */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-cyan-400" size={20} />
            <h2 className="font-bold">Autonomie</h2>
          </div>
          {!autonomy ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Lecture de la télémétrie d’autonomie…
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Mode</span>
                <span className="font-mono">{autonomy.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">
                  Arrêt d’urgence
                </span>
                <span
                  className={
                    autonomy.killSwitch
                      ? "text-rose-300 font-mono"
                      : "text-emerald-300 font-mono"
                  }
                >
                  {autonomy.killSwitch ? "actif" : "inactif"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">
                  Exécutions auto
                </span>
                <span className="font-mono">
                  {autonomy.counters.autoExecuted}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">
                  Approbation requise
                </span>
                <span className="font-mono">
                  {autonomy.counters.approvalRequired}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">
                  Approbations refusées
                </span>
                <span className="font-mono">
                  {autonomy.counters.approvalDenied}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">
                  Simulations
                </span>
                <span className="font-mono">{autonomy.counters.simRuns}</span>
              </div>
            </div>
          )}
        </div>

        {/* SRE Alerts */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-amber-400" size={20} />
            <h2 className="font-bold">Mode SRE</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">
                Disjoncteurs
              </span>
              <span className="font-mono">{circuitSummary.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">
                Circuits ouverts
              </span>
              <span
                className={cn(
                  "font-mono",
                  circuitSummary.open.length > 0
                    ? "text-rose-300"
                    : "text-emerald-300",
                )}
              >
                {circuitSummary.open.length}
              </span>
            </div>
            <div className="pt-2 border-t border-[var(--color-border)] space-y-1">
              {opsAlerts.length === 0 ? (
                <p className="text-xs text-emerald-300">
                  Aucune alerte ops active
                </p>
              ) : (
                opsAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="text-xs">
                    <p
                      className={cn(
                        "font-semibold",
                        alert.severity === "high" && "text-rose-300",
                        alert.severity === "medium" && "text-amber-300",
                        alert.severity === "low" && "text-emerald-300",
                      )}
                    >
                      [{alert.domain}] {alert.severity}
                    </p>
                    <p className="text-[var(--color-text-secondary)]">
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
        Moniteur système ALGO · usage développement
      </footer>
    </div>
  );
}
