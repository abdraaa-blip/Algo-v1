"use client";

import {
  type ElementType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Activity,
  BrainCircuit,
  Database,
  Lightbulb,
  PackageSearch,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlgoCoreIntelligencePanel } from "@/components/intelligence/AlgoCoreIntelligencePanel";
import { SITE_TRANSPARENCY_AI_CALIBRATION_HREF } from "@/lib/seo/site";
import {
  ALGO_DATA_RELIABILITY_PANEL,
  ALGO_PRODUCT_RADAR,
  ALGO_UI_LOADING,
} from "@/lib/copy/ui-strings";
import { mapUserFacingApiError } from "@/lib/copy/api-error-fr";
import { mergeRadarHistoryPoints } from "@/lib/intelligence/radar-history-utils";
import { VIRAL_CONTROL_REGION_CODES } from "@/lib/intelligence/viral-control-regions";

const RADAR_HISTORY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const RADAR_HISTORY_CAP = 240;

interface GlobalResponse {
  success: boolean;
  cached?: boolean;
  stale?: boolean;
  cacheTtlMs?: number;
  data?: {
    generatedAt: string;
    scope: { region: string; locale: string };
    sources: {
      news: { count: number; source: string };
      social: { count: number; source: string };
      videos: { count: number; source: string };
      finance: { count: number; source: string };
      science?: { count: number; source: string };
      economic?: { count: number; source: string };
      socialExternal?: { count: number; source: string };
      commerce?: { count: number; source: string };
      firstPartySignals: {
        engagementRate: number;
        frictionRate: number;
        source: string;
      };
    };
    categories: Array<{
      name: string;
      score: number;
      momentum: "up" | "stable" | "down";
      signals: string[];
    }>;
    anomalies: Array<{
      type: "spike" | "friction" | "drop";
      severity: "low" | "medium" | "high";
      message: string;
    }>;
    opportunities: Array<{
      type: "content" | "product" | "timing";
      title: string;
      confidence: number;
      rationale: string;
    }>;
  };
}

interface PredictiveResponse {
  success: boolean;
  cached?: boolean;
  stale?: boolean;
  cacheTtlMs?: number;
  data?: {
    predictedViralityScore: number;
    confidence: number;
    drivers: {
      topCategory: string;
      engagementRate: number;
      frictionRate: number;
      anomalies: Array<{ type: string; severity: string; message: string }>;
    };
    recommendations: Array<{ type: string; title: string; confidence: number }>;
    autonomy?: {
      mode: "advisory" | "guarded_auto" | "manual_only";
      killSwitch: boolean;
      proposals: AutonomyProposal[];
    };
  };
}

interface ProductsResponse {
  success: boolean;
  data?: {
    products: Array<{
      keyword: string;
      score: number;
      potential: "high" | "medium" | "emerging";
      potentialLabel?: string;
      rationale: string;
    }>;
    missionFr?: string;
  };
}

interface RadarHistoryPoint {
  at: string;
  viralityScore: number;
  confidence: number;
  anomalyCount: number;
}

interface DecisionItem {
  id: string;
  level: "action_now" | "watch" | "ignore";
  title: string;
  reason: string;
  riskLevel?: "low" | "medium" | "high";
  requiresApproval?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected" | "not_required";
  executionStatus?: "not_executed" | "simulated" | "executed" | "blocked";
  policyReason?: string;
}

interface DecisionLogEntry {
  at: string;
  region: string;
  viralityScore: number | null;
  confidence: number | null;
  items: DecisionItem[];
  mode?: "advisory" | "guarded_auto" | "manual_only";
  source?: string;
  executedAt?: string | null;
}

interface AutonomyProposal {
  id: string;
  type: string;
  title: string;
  rationale: string;
  confidence: number;
  expectedImpact: number;
  riskLevel: "low" | "medium" | "high";
  requiresApproval: boolean;
  policyDecision: {
    allowed: boolean;
    requiresApproval: boolean;
    reason: string;
    idempotencyKey: string;
  };
}

interface AutonomyState {
  mode: "advisory" | "guarded_auto" | "manual_only";
  killSwitch: boolean;
  minConfidenceForAuto: number;
}

interface CrossPageHealth {
  id: string;
  label: string;
  status: "up" | "degraded" | "down";
  details: string;
}

interface CrossHealthResponse {
  success: boolean;
  cached?: boolean;
  stale?: boolean;
  cacheTtlMs?: number;
  data?: CrossPageHealth[];
}

interface DataReliabilitySourceRow {
  id: string;
  primaryRoute: string;
  fallbacksFr: readonly string[];
  baselineReliability: number;
  limitsFr: string;
}

interface DataReliabilityApiPayload {
  success: boolean;
  kind?: string;
  generatedAt?: string;
  noteFr?: string;
  sources?: DataReliabilitySourceRow[];
}

function priorityRank(level: DecisionItem["level"]): number {
  if (level === "action_now") return 0;
  if (level === "watch") return 1;
  return 2;
}

export default function IntelligencePage() {
  const [region, setRegion] = useState("FR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalData, setGlobalData] = useState<GlobalResponse["data"] | null>(
    null,
  );
  const [predictive, setPredictive] = useState<
    PredictiveResponse["data"] | null
  >(null);
  const [products, setProducts] = useState<ProductsResponse["data"] | null>(
    null,
  );
  const [crossHealth, setCrossHealth] = useState<CrossPageHealth[]>([]);
  const [cacheTelemetry, setCacheTelemetry] = useState<{
    global: { cached: boolean; stale: boolean; ttlMs: number | null };
    predictive: { cached: boolean; stale: boolean; ttlMs: number | null };
    health: { cached: boolean; stale: boolean; ttlMs: number | null };
  }>({
    global: { cached: false, stale: false, ttlMs: null },
    predictive: { cached: false, stale: false, ttlMs: null },
    health: { cached: false, stale: false, ttlMs: null },
  });
  const [history, setHistory] = useState<RadarHistoryPoint[]>([]);
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([]);
  const [autonomyState, setAutonomyState] = useState<AutonomyState | null>(
    null,
  );
  const [autonomyProposals, setAutonomyProposals] = useState<
    AutonomyProposal[]
  >([]);
  const [simulated, setSimulated] = useState<{
    baselineScore: number;
    simulatedScore: number;
    delta: number;
    recommendation: string;
  } | null>(null);
  const [learnResult, setLearnResult] = useState<{
    learningApplied: boolean;
    minConfidenceForAuto?: number;
  } | null>(null);
  const [opsToken, setOpsToken] = useState("");
  const [autoRefreshMs, setAutoRefreshMs] = useState(60_000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const syncInFlightRef = useRef(false);
  const lastSyncedAtRef = useRef<string | null>(null);
  const reliabilityLoadRef = useRef(false);
  const [reliabilityData, setReliabilityData] =
    useState<DataReliabilityApiPayload | null>(null);
  const [reliabilityLoading, setReliabilityLoading] = useState(false);
  const [reliabilityError, setReliabilityError] = useState<string | null>(null);

  const fetchRadar = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const [g, p, pr, healthRes] = await Promise.all([
        fetch(`/api/intelligence/global?region=${region}&locale=fr`, {
          cache: "no-store",
        }),
        fetch(`/api/intelligence/predictive?region=${region}&locale=fr`, {
          cache: "no-store",
        }),
        fetch(`/api/intelligence/products?region=${region}&locale=fr`, {
          cache: "no-store",
        }),
        fetch(`/api/intelligence/health?region=${region}`, {
          cache: "no-store",
        }),
      ]);
      const gJson = (await g.json()) as GlobalResponse;
      const pJson = (await p.json()) as PredictiveResponse;
      const prJson = (await pr.json()) as ProductsResponse;
      const healthJson = (await healthRes.json()) as CrossHealthResponse;
      setCacheTelemetry({
        global: {
          cached: Boolean(gJson.cached),
          stale: Boolean(gJson.stale),
          ttlMs: typeof gJson.cacheTtlMs === "number" ? gJson.cacheTtlMs : null,
        },
        predictive: {
          cached: Boolean(pJson.cached),
          stale: Boolean(pJson.stale),
          ttlMs: typeof pJson.cacheTtlMs === "number" ? pJson.cacheTtlMs : null,
        },
        health: {
          cached: Boolean(healthJson.cached),
          stale: Boolean(healthJson.stale),
          ttlMs:
            typeof healthJson.cacheTtlMs === "number"
              ? healthJson.cacheTtlMs
              : null,
        },
      });

      if (!gJson.success || !pJson.success || !prJson.success) {
        throw new Error("Les APIs intelligence ont renvoyé une erreur.");
      }
      const globalSnapshot = gJson.data ?? null;
      const predictiveSnapshot = pJson.data ?? null;
      setGlobalData(globalSnapshot);
      setPredictive(predictiveSnapshot);
      setAutonomyProposals(predictiveSnapshot?.autonomy?.proposals || []);
      setProducts(prJson.data ?? null);
      if (
        healthRes.ok &&
        healthJson.success &&
        Array.isArray(healthJson.data)
      ) {
        setCrossHealth(healthJson.data);
      } else {
        setCrossHealth([
          {
            id: "news",
            label: "News",
            status: "degraded",
            details: "fallback mode",
          },
          {
            id: "music",
            label: "Music",
            status: "degraded",
            details: "fallback mode",
          },
          {
            id: "videos",
            label: "Videos",
            status: "degraded",
            details: "fallback mode",
          },
          {
            id: "trends",
            label: "Trends",
            status: "degraded",
            details: "fallback mode",
          },
          {
            id: "creator",
            label: "Creator",
            status: "degraded",
            details: "fallback mode",
          },
        ]);
      }

      if (globalSnapshot && predictiveSnapshot) {
        const anomalyCount = globalSnapshot.anomalies.length;
        const hasHighFriction = globalSnapshot.anomalies.some(
          (a) => a.type === "friction" && a.severity === "high",
        );
        const nextInterval =
          hasHighFriction || anomalyCount >= 2
            ? 30_000
            : anomalyCount === 1
              ? 45_000
              : 75_000;
        setAutoRefreshMs(nextInterval);

        const point: RadarHistoryPoint = {
          at: new Date().toISOString(),
          viralityScore: predictiveSnapshot.predictedViralityScore,
          confidence: predictiveSnapshot.confidence,
          anomalyCount,
        };
        setHistory((prev) =>
          mergeRadarHistoryPoints(prev, [point], {
            maxAgeMs: RADAR_HISTORY_MAX_AGE_MS,
            cap: RADAR_HISTORY_CAP,
          }),
        );
      }
    } catch (e) {
      setError(
        mapUserFacingApiError(
          e instanceof Error
            ? e.message
            : "Impossible de charger le radar intelligence.",
        ),
      );
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/intelligence/radar-history?region=${encodeURIComponent(region)}&days=7`,
          { cache: "no-store" },
        );
        const json = (await res.json()) as {
          success?: boolean;
          points?: RadarHistoryPoint[];
        };
        if (cancelled || !json.success || !Array.isArray(json.points)) return;
        const incomingPoints = json.points;
        setHistory((prev) =>
          mergeRadarHistoryPoints(incomingPoints, prev, {
            maxAgeMs: RADAR_HISTORY_MAX_AGE_MS,
            cap: RADAR_HISTORY_CAP,
          }),
        );
      } catch {
        /* session seule */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [region]);

  useEffect(() => {
    const scheduleNext = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (
          typeof document !== "undefined" &&
          document.visibilityState !== "visible"
        ) {
          scheduleNext();
          return;
        }
        void fetchRadar().finally(scheduleNext);
      }, autoRefreshMs);
    };

    void fetchRadar().finally(scheduleNext);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchRadar();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [autoRefreshMs, fetchRadar]);

  const historyStats = useMemo(() => {
    if (history.length === 0)
      return { min: 0, max: 100, avg: null as number | null };
    const scores = history.map((h) => h.viralityScore);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((acc, cur) => acc + cur, 0) / scores.length;
    return { min, max, avg };
  }, [history]);

  const decisionFeed = useMemo<DecisionItem[]>(() => {
    if (autonomyProposals.length > 0) {
      return autonomyProposals.map((proposal) => ({
        id: proposal.id,
        level: proposal.policyDecision.requiresApproval
          ? "watch"
          : proposal.policyDecision.allowed
            ? "action_now"
            : "ignore",
        title: proposal.title,
        reason: proposal.rationale,
        riskLevel: proposal.riskLevel,
        requiresApproval: proposal.requiresApproval,
        approvalStatus: proposal.policyDecision.requiresApproval
          ? "pending"
          : "not_required",
        executionStatus: proposal.policyDecision.allowed
          ? "simulated"
          : "blocked",
        policyReason: proposal.policyDecision.reason,
      }));
    }
    const items: DecisionItem[] = [];
    if (!globalData || !predictive) return items;

    const friction = globalData.sources.firstPartySignals.frictionRate;
    const engagement = globalData.sources.firstPartySignals.engagementRate;
    const highFriction = globalData.anomalies.some(
      (a) => a.type === "friction" && a.severity === "high",
    );
    const topOpportunity = globalData.opportunities[0];
    const topProduct = products?.products?.[0];

    if (highFriction || friction >= 0.28) {
      items.push({
        id: "ux-friction",
        level: "action_now",
        title: "Reduce UX friction now",
        reason: `Friction is ${(friction * 100).toFixed(1)}% and may suppress virality conversion.`,
      });
    }

    if (
      predictive.predictedViralityScore >= 72 &&
      predictive.confidence >= 0.68
    ) {
      items.push({
        id: "content-push",
        level: "action_now",
        title: `Accelerate ${predictive.drivers.topCategory} publishing`,
        reason: `Virality ${predictive.predictedViralityScore} with ${Math.round(predictive.confidence * 100)}% confidence.`,
      });
    } else if (predictive.predictedViralityScore >= 58) {
      items.push({
        id: "content-watch",
        level: "watch",
        title: `Monitor ${predictive.drivers.topCategory} momentum`,
        reason: `Signal is promising but confidence remains moderate.`,
      });
    } else {
      items.push({
        id: "content-ignore",
        level: "ignore",
        title: "Avoid aggressive amplification",
        reason: `Virality pressure is low (${predictive.predictedViralityScore}).`,
      });
    }

    if (topOpportunity && topOpportunity.confidence >= 0.7) {
      items.push({
        id: "opportunity",
        level: "watch",
        title: topOpportunity.title,
        reason: `Opportunity confidence at ${Math.round(topOpportunity.confidence * 100)}%.`,
      });
    }

    if (topProduct && topProduct.score >= 75) {
      items.push({
        id: "product-launch",
        level: "action_now",
        title: `Test product angle: ${topProduct.keyword}`,
        reason: `Product radar score ${topProduct.score} (${topProduct.potential}).`,
      });
    } else if (topProduct && topProduct.score >= 55) {
      items.push({
        id: "product-watch",
        level: "watch",
        title: `Track product: ${topProduct.keyword}`,
        reason: `Emerging product signal at score ${topProduct.score}.`,
      });
    }

    if (engagement < 0.12 && predictive.predictedViralityScore < 55) {
      items.push({
        id: "deprioritize",
        level: "ignore",
        title: "Deprioritize broad campaigns",
        reason: "Low engagement and weak virality suggest preserving budget.",
      });
    }

    return items
      .sort((a, b) => priorityRank(a.level) - priorityRank(b.level))
      .slice(0, 6);
  }, [autonomyProposals, globalData, predictive, products]);

  const globalCoherence = useMemo(() => {
    if (!globalData || !predictive) return null;
    const sourceCounts = [
      globalData.sources.news.count,
      globalData.sources.social.count,
      globalData.sources.videos.count,
      globalData.sources.finance.count,
    ];
    const nonZeroSources = sourceCounts.filter((v) => v > 0).length;
    const coverageScore = Math.round(
      (nonZeroSources / sourceCounts.length) * 100,
    );
    const anomalyPenalty = Math.min(25, globalData.anomalies.length * 6);
    const engagementBonus = Math.round(
      globalData.sources.firstPartySignals.engagementRate * 20,
    );
    const predictiveAlignment = Math.round(
      (predictive.predictedViralityScore + predictive.confidence * 100) / 2,
    );
    const value = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          coverageScore * 0.35 +
            predictiveAlignment * 0.45 +
            engagementBonus -
            anomalyPenalty,
        ),
      ),
    );
    const status = value >= 75 ? "high" : value >= 50 ? "medium" : "low";
    return {
      value,
      status,
      coverageScore,
      predictiveAlignment,
      anomalyPenalty,
    };
  }, [globalData, predictive]);

  const systemStatus = useMemo(() => {
    const downCount = crossHealth.filter(
      (item) => item.status === "down",
    ).length;
    const degradedCount = crossHealth.filter(
      (item) => item.status === "degraded",
    ).length;
    const staleCount = [
      cacheTelemetry.global,
      cacheTelemetry.predictive,
      cacheTelemetry.health,
    ].filter((s) => s.stale).length;

    if (downCount > 0 || staleCount >= 2) {
      return {
        label: "degraded",
        color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      };
    }
    if (degradedCount > 1 || staleCount === 1) {
      return {
        label: "watch",
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      };
    }
    return {
      label: "operational",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
  }, [
    cacheTelemetry.global,
    cacheTelemetry.health,
    cacheTelemetry.predictive,
    crossHealth,
  ]);

  useEffect(() => {
    if (!globalData || !predictive || decisionFeed.length === 0) return;
    const entry: DecisionLogEntry = {
      at: new Date().toISOString(),
      region,
      viralityScore: predictive.predictedViralityScore,
      confidence: predictive.confidence,
      items: decisionFeed,
      mode: autonomyState?.mode,
      source: "intelligence-radar-autonomy",
    };
    setDecisionLog((prev) => {
      const horizon = Date.now() - 60 * 60 * 1000;
      const pruned = prev.filter(
        (item) => new Date(item.at).getTime() >= horizon,
      );
      const last = pruned[pruned.length - 1];
      const dedupeWindowMs = 20_000;
      const sameAsLast =
        last &&
        Date.now() - new Date(last.at).getTime() < dedupeWindowMs &&
        JSON.stringify(last.items) === JSON.stringify(entry.items) &&
        last.region === entry.region;
      if (sameAsLast) return pruned;
      return [...pruned, entry].slice(-80);
    });
  }, [autonomyState?.mode, decisionFeed, globalData, predictive, region]);

  const exportDecisionLog = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      region,
      autoRefreshSeconds: Math.round(autoRefreshMs / 1000),
      latestVirality: predictive?.predictedViralityScore ?? null,
      decisionLog,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `intelligence-decision-log-${region.toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [autoRefreshMs, decisionLog, predictive?.predictedViralityScore, region]);

  useEffect(() => {
    const latest = decisionLog[decisionLog.length - 1];
    if (!latest) return;
    if (lastSyncedAtRef.current === latest.at || syncInFlightRef.current)
      return;

    syncInFlightRef.current = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    void fetch("/api/intelligence/decision-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "intelligence-radar",
        entries: [latest],
      }),
      keepalive: true,
      signal: controller.signal,
    })
      .then((res) => {
        if (res.ok) {
          lastSyncedAtRef.current = latest.at;
        }
      })
      .catch(() => {
        // Silent fail: do not block dashboard UX on telemetry sync issues.
      })
      .finally(() => {
        clearTimeout(timeout);
        syncInFlightRef.current = false;
      });
  }, [decisionLog]);

  const fetchAutonomyState = useCallback(async () => {
    try {
      const res = await fetch("/api/intelligence/autonomy", {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        success: boolean;
        policy?: AutonomyState;
      };
      if (json.success && json.policy) setAutonomyState(json.policy);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem("intelligence-ops-token");
    if (stored) setOpsToken(stored);
  }, []);

  useEffect(() => {
    void fetchAutonomyState();
  }, [fetchAutonomyState]);

  const runSimulation = useCallback(async () => {
    if (!predictive) return;
    const res = await fetch("/api/intelligence/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region,
        locale: "fr",
        baselineScore: predictive.predictedViralityScore,
        scenario: {
          engagementDelta: 0.03,
          frictionDelta: -0.02,
          anomalyBoost: 0,
        },
      }),
    });
    const json = (await res.json()) as {
      success: boolean;
      data?: {
        simulation: {
          baselineScore: number;
          simulatedScore: number;
          delta: number;
          recommendation: string;
        };
      };
    };
    if (json.success && json.data) setSimulated(json.data.simulation);
  }, [predictive, region]);

  const executeProposal = useCallback(async (proposal: AutonomyProposal) => {
    const res = await fetch("/api/intelligence/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposal }),
    });
    const json = (await res.json()) as {
      success: boolean;
      data?: { status: string; policyReason: string };
    };
    if (!json.success) return;
    const nextExecution: DecisionItem["executionStatus"] =
      json.data?.status === "executed" ? "executed" : "blocked";
    setDecisionLog((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      const nextItems = last.items.map((item) =>
        item.id === proposal.id
          ? {
              ...item,
              executionStatus: nextExecution,
              policyReason: json.data?.policyReason ?? item.policyReason,
            }
          : item,
      );
      return [
        ...prev.slice(0, -1),
        { ...last, items: nextItems, executedAt: new Date().toISOString() },
      ];
    });
  }, []);

  const updateAutonomyMode = useCallback(
    async (mode: AutonomyState["mode"]) => {
      if (!opsToken) return;
      const res = await fetch("/api/intelligence/autonomy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-intelligence-ops-token": opsToken,
        },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) void fetchAutonomyState();
    },
    [fetchAutonomyState, opsToken],
  );

  const toggleKillSwitch = useCallback(async () => {
    if (!opsToken || !autonomyState) return;
    const res = await fetch("/api/intelligence/autonomy", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-intelligence-ops-token": opsToken,
      },
      body: JSON.stringify({ killSwitch: !autonomyState.killSwitch }),
    });
    if (res.ok) void fetchAutonomyState();
  }, [autonomyState, fetchAutonomyState, opsToken]);

  const runLearningLoop = useCallback(async () => {
    const res = await fetch("/api/intelligence/learn", { method: "POST" });
    const json = (await res.json()) as {
      success: boolean;
      learningApplied: boolean;
      policy?: { minConfidenceForAuto: number };
    };
    if (json.success) {
      setLearnResult({
        learningApplied: json.learningApplied,
        minConfidenceForAuto: json.policy?.minConfidenceForAuto,
      });
      void fetchAutonomyState();
    }
  }, [fetchAutonomyState]);

  const loadDataReliabilityMap = useCallback(async () => {
    if (reliabilityLoadRef.current) return;
    reliabilityLoadRef.current = true;
    setReliabilityLoading(true);
    setReliabilityError(null);
    try {
      const res = await fetch(ALGO_DATA_RELIABILITY_PANEL.apiPath, {
        cache: "no-store",
      });
      const json = (await res.json()) as DataReliabilityApiPayload;
      if (!res.ok || !json.success || !Array.isArray(json.sources)) {
        throw new Error("data reliability map failed");
      }
      setReliabilityData(json);
    } catch {
      reliabilityLoadRef.current = false;
      setReliabilityError(ALGO_DATA_RELIABILITY_PANEL.errorShort);
    } finally {
      setReliabilityLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen text-[var(--color-text-primary)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Intelligence Radar
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1 max-w-xl">
              Vue agrégée : signaux globaux, estimation de dynamique virale et
              pistes produit. Tout est indicatif, mis en cache, et soumis aux
              limites des APIs · pas d’exécution automatique sans politique
              explicite sur votre déploiement.
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
              <Link
                href="/ai"
                className="text-cyan-400/90 hover:text-cyan-300 underline-offset-2 hover:underline"
              >
                ALGO AI
              </Link>
              <span aria-hidden> · </span>
              <Link
                href={SITE_TRANSPARENCY_AI_CALIBRATION_HREF}
                className="text-cyan-400/90 hover:text-cyan-300 underline-offset-2 hover:underline"
              >
                Calibrage &amp; familles de rôle
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold",
                systemStatus.color,
              )}
            >
              system: {systemStatus.label}
            </span>
            <Link
              href="/intelligence/logs"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              View Logs
            </Link>
            <Link
              href="/intelligence/learning"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Learning
            </Link>
            <Link
              href="/intelligence/viral-control"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Viral Control
            </Link>
            <Link
              href="/intelligence/ops"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Ops
            </Link>
            <Link
              href="/control-room"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
            >
              Control room
            </Link>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              {VIRAL_CONTROL_REGION_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              type="password"
              value={opsToken}
              onChange={(e) => {
                setOpsToken(e.target.value);
                if (typeof window !== "undefined") {
                  if (e.target.value) {
                    window.sessionStorage.setItem(
                      "intelligence-ops-token",
                      e.target.value,
                    );
                  } else {
                    window.sessionStorage.removeItem("intelligence-ops-token");
                  }
                }
              }}
              placeholder="Ops token"
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-2 py-2 text-xs w-28 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            <button
              onClick={() => void fetchRadar()}
              disabled={loading}
              className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={18} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </div>

        <details
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]/80 overflow-hidden"
          onToggle={(e) => {
            if (e.currentTarget.open) void loadDataReliabilityMap();
          }}
        >
          <summary className="cursor-pointer select-none list-none flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)]/60 [&::-webkit-details-marker]:hidden">
            <Database
              size={16}
              className="text-cyan-400/90 shrink-0"
              aria-hidden
            />
            <span>{ALGO_DATA_RELIABILITY_PANEL.summary}</span>
            <span className="text-[10px] font-normal text-[var(--color-text-tertiary)] ml-auto font-mono">
              {ALGO_DATA_RELIABILITY_PANEL.apiPath}
            </span>
          </summary>
          <div className="px-4 pb-4 pt-0 space-y-3 border-t border-[var(--color-border)]/60">
            <p className="text-[11px] text-[var(--color-text-secondary)] pt-3">
              {ALGO_DATA_RELIABILITY_PANEL.note}
            </p>
            {reliabilityLoading && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {ALGO_DATA_RELIABILITY_PANEL.loading}
              </p>
            )}
            {reliabilityError && (
              <p className="text-xs text-rose-300/90">{reliabilityError}</p>
            )}
            {reliabilityData?.sources && reliabilityData.sources.length > 0 && (
              <ul className="space-y-3 text-xs">
                {reliabilityData.sources.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-lg border border-[var(--color-border)]/80 bg-[var(--color-bg-primary)]/40 p-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {row.id}
                      </span>
                      <span className="text-[10px] text-emerald-300/90 tabular-nums">
                        baseline ~{(row.baselineReliability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono mt-1 break-all">
                      {row.primaryRoute}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-2">
                      {row.limitsFr}
                    </p>
                    {row.fallbacksFr.length > 0 && (
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                        Fallbacks : {row.fallbacksFr.join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {reliabilityData?.generatedAt && (
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Généré :{" "}
                {new Date(reliabilityData.generatedAt).toLocaleString("fr-FR")}
              </p>
            )}
            <p className="text-[10px]">
              <Link
                href="/transparency"
                className="text-cyan-400/90 hover:text-cyan-300 underline-offset-2 hover:underline"
              >
                {ALGO_DATA_RELIABILITY_PANEL.linkTransparency}
              </Link>
            </p>
          </div>
        </details>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        <AlgoCoreIntelligencePanel region={region} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card icon={BrainCircuit} title="Autonomy Control">
            <div className="space-y-2">
              <p className="text-xs text-white/60">
                mode:{" "}
                <span className="font-semibold text-white/90">
                  {autonomyState?.mode || "loading"}
                </span>
              </p>
              <p className="text-xs text-white/60">
                kill-switch:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    autonomyState?.killSwitch
                      ? "text-rose-300"
                      : "text-emerald-300",
                  )}
                >
                  {autonomyState?.killSwitch ? "ON" : "OFF"}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={autonomyState?.mode || "guarded_auto"}
                  onChange={(e) =>
                    void updateAutonomyMode(
                      e.target.value as AutonomyState["mode"],
                    )
                  }
                  className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-md px-2 py-1 text-xs text-[var(--color-text-primary)]"
                >
                  <option value="advisory">advisory</option>
                  <option value="guarded_auto">guarded_auto</option>
                  <option value="manual_only">manual_only</option>
                </select>
                <button
                  type="button"
                  onClick={() => void toggleKillSwitch()}
                  className="text-xs px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-card-hover)] hover:bg-[var(--color-card)] transition-colors"
                >
                  Toggle Kill-Switch
                </button>
              </div>
              <button
                type="button"
                onClick={() => void runSimulation()}
                className="text-xs px-2 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30"
              >
                Run What-if
              </button>
              <button
                type="button"
                onClick={() => void runLearningLoop()}
                className="text-xs px-2 py-1 rounded-md bg-violet-500/20 hover:bg-violet-500/30"
              >
                Run Learning Loop
              </button>
              {simulated && (
                <p className="text-xs text-white/60">
                  sim: {simulated.baselineScore} → {simulated.simulatedScore} (
                  {simulated.delta >= 0 ? "+" : ""}
                  {simulated.delta}) · {simulated.recommendation}
                </p>
              )}
              {learnResult && (
                <p className="text-xs text-white/60">
                  learning:{" "}
                  {learnResult.learningApplied ? "applied" : "no-change"} ·
                  minConfidence:{" "}
                  {learnResult.minConfidenceForAuto?.toFixed(2) ?? "n/a"}
                </p>
              )}
            </div>
          </Card>

          <Card icon={Activity} title="Predicted Virality">
            <p className="text-3xl font-black text-cyan-300">
              {predictive?.predictedViralityScore ?? "--"}
            </p>
            <p className="text-xs text-white/60 mt-1">
              confidence:{" "}
              {predictive
                ? `${Math.round(predictive.confidence * 100)}%`
                : "--"}
            </p>
            <p className="text-xs text-white/50 mt-2">
              top driver: {predictive?.drivers.topCategory || "n/a"}
            </p>
          </Card>

          <Card icon={BrainCircuit} title="Behavioral Signals">
            <p className="text-sm text-white/80">
              engagement:{" "}
              {globalData
                ? `${(globalData.sources.firstPartySignals.engagementRate * 100).toFixed(2)}%`
                : "--"}
            </p>
            <p className="text-sm text-white/80">
              friction:{" "}
              {globalData
                ? `${(globalData.sources.firstPartySignals.frictionRate * 100).toFixed(2)}%`
                : "--"}
            </p>
            <p className="text-xs text-white/50 mt-2">
              source: {globalData?.sources.firstPartySignals.source || "n/a"}
            </p>
            {globalData?.sources.science && (
              <p className="text-xs text-white/50 mt-1">
                science signals: {globalData.sources.science.count} (
                {globalData.sources.science.source})
              </p>
            )}
            {globalData?.sources.economic && (
              <p className="text-xs text-white/50 mt-1">
                economic signals: {globalData.sources.economic.count} (
                {globalData.sources.economic.source})
              </p>
            )}
            {globalData?.sources.socialExternal && (
              <p className="text-xs text-white/50 mt-1">
                social ext: {globalData.sources.socialExternal.count} (
                {globalData.sources.socialExternal.source})
              </p>
            )}
            {globalData?.sources.commerce && (
              <p className="text-xs text-white/50 mt-1">
                commerce: {globalData.sources.commerce.count} (
                {globalData.sources.commerce.source})
              </p>
            )}
          </Card>

          <Card icon={TriangleAlert} title="Anomalies">
            <p className="text-sm text-white/80">
              {globalData?.anomalies.length ?? 0} detected
            </p>
            <ul className="mt-2 space-y-1 text-xs text-white/60">
              {(globalData?.anomalies || []).slice(0, 3).map((a) => (
                <li key={`${a.type}-${a.message}`}>- {a.message}</li>
              ))}
              {(globalData?.anomalies || []).length === 0 && (
                <li>- no active anomaly</li>
              )}
            </ul>
          </Card>
        </div>

        <Card icon={Activity} title="Data Freshness Telemetry">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                { id: "global", label: "Global", ...cacheTelemetry.global },
                {
                  id: "predictive",
                  label: "Predictive",
                  ...cacheTelemetry.predictive,
                },
                { id: "health", label: "Health", ...cacheTelemetry.health },
              ] as const
            ).map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.label}</p>
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-bold",
                      item.stale && "bg-rose-500/20 text-rose-300",
                      !item.stale &&
                        item.cached &&
                        "bg-amber-500/20 text-amber-300",
                      !item.stale &&
                        !item.cached &&
                        "bg-emerald-500/20 text-emerald-300",
                    )}
                  >
                    {item.stale ? "stale" : item.cached ? "cached" : "fresh"}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 mt-1">
                  ttl:{" "}
                  {item.ttlMs === null
                    ? "n/a"
                    : `${Math.round(item.ttlMs / 1000)}s`}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={BrainCircuit} title="Global Coherence Score">
          <div className="flex items-center justify-between gap-3">
            <p className="text-3xl font-black text-violet-300">
              {globalCoherence?.value ?? "--"}
            </p>
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold",
                globalCoherence?.status === "high" &&
                  "bg-emerald-500/20 text-emerald-300",
                globalCoherence?.status === "medium" &&
                  "bg-amber-500/20 text-amber-300",
                globalCoherence?.status === "low" &&
                  "bg-rose-500/20 text-rose-300",
              )}
            >
              {globalCoherence?.status || "pending"}
            </span>
          </div>
          <div className="mt-2 text-xs text-white/60 space-y-1">
            <p>coverage: {globalCoherence?.coverageScore ?? "--"}</p>
            <p>
              predictive alignment:{" "}
              {globalCoherence?.predictiveAlignment ?? "--"}
            </p>
            <p>anomaly penalty: {globalCoherence?.anomalyPenalty ?? "--"}</p>
          </div>
        </Card>

        <Card icon={Activity} title="Cross-Page Health">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {crossHealth.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.label}</p>
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-bold",
                      item.status === "up" &&
                        "bg-emerald-500/20 text-emerald-300",
                      item.status === "degraded" &&
                        "bg-amber-500/20 text-amber-300",
                      item.status === "down" && "bg-rose-500/20 text-rose-300",
                    )}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 mt-1">{item.details}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={Activity} title="Radar history (7j) + adaptive refresh">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs text-white/60">
              auto refresh: every {Math.round(autoRefreshMs / 1000)}s (adjusts
              with anomaly pressure) · serveur échantillonne ~1 point / 10 min /
              région
            </p>
            <p className="text-xs text-white/50">points: {history.length}</p>
          </div>
          <div className="h-20 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] p-2 flex items-end gap-1">
            {history.length === 0 ? (
              <p className="text-xs text-white/40">
                Waiting for first samples...
              </p>
            ) : (
              history.map((point) => {
                const range = Math.max(1, historyStats.max - historyStats.min);
                const normalized =
                  (point.viralityScore - historyStats.min) / range;
                const heightPx = Math.max(6, Math.round(10 + normalized * 50));
                const isAlert = point.anomalyCount > 0;
                return (
                  <div
                    key={point.at}
                    className={cn(
                      "w-2 rounded-sm",
                      isAlert ? "bg-amber-300/80" : "bg-cyan-300/80",
                    )}
                    style={{ height: `${heightPx}px` }}
                    title={`${new Date(point.at).toLocaleTimeString()} · score ${point.viralityScore}`}
                  />
                );
              })
            )}
          </div>
          <p className="text-xs text-white/50 mt-2">
            avg:{" "}
            {historyStats.avg === null ? "--" : historyStats.avg.toFixed(1)} ·
            min: {historyStats.min} · max: {historyStats.max}
          </p>
        </Card>

        <Card icon={Lightbulb} title="Decision Feed">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs text-white/50">
              journal: {decisionLog.length} entries (last 60 min)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40">
                sync: {lastSyncedAtRef.current ? "server connected" : "pending"}
              </span>
              <button
                type="button"
                onClick={exportDecisionLog}
                disabled={decisionLog.length === 0}
                className="text-xs px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] disabled:opacity-50 transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {decisionFeed.length === 0 ? (
              <p className="text-xs text-white/50">
                No decision yet. Waiting for complete signal set.
              </p>
            ) : (
              decisionFeed.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold",
                        item.level === "action_now" &&
                          "bg-rose-500/20 text-rose-300",
                        item.level === "watch" &&
                          "bg-amber-500/20 text-amber-300",
                        item.level === "ignore" &&
                          "bg-[var(--color-card-hover)] text-[var(--color-text-secondary)]",
                      )}
                    >
                      {item.level === "action_now"
                        ? "Action now"
                        : item.level === "watch"
                          ? "Watch"
                          : "Ignore"}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">{item.reason}</p>
                  {(item.riskLevel || item.policyReason) && (
                    <p className="text-[11px] text-white/45 mt-1">
                      risk: {item.riskLevel || "n/a"} · policy:{" "}
                      {item.policyReason || "n/a"}
                    </p>
                  )}
                  {"riskLevel" in item && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const proposal = autonomyProposals.find(
                            (p) => p.id === item.id,
                          );
                          if (proposal) void executeProposal(proposal);
                        }}
                        className="text-[11px] px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30"
                        disabled={
                          !autonomyProposals.some((p) => p.id === item.id)
                        }
                      >
                        Execute
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card icon={Lightbulb} title="Top Opportunities">
            <div className="space-y-2">
              {(globalData?.opportunities || []).slice(0, 5).map((o) => (
                <div
                  key={`${o.type}-${o.title}`}
                  className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
                >
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-white/50 mt-1">
                    {o.type} · confidence {Math.round(o.confidence * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card icon={PackageSearch} title={ALGO_PRODUCT_RADAR.cardTitle}>
            <p className="text-xs text-white/50 mb-3 leading-relaxed">
              {ALGO_PRODUCT_RADAR.cardIntro}
            </p>
            {products?.missionFr && (
              <p className="text-[11px] text-violet-300/90 mb-3 leading-relaxed">
                {products.missionFr}
              </p>
            )}
            <div className="space-y-2">
              {(products?.products || []).length === 0 && loading ? (
                <p className="text-xs text-white/35">
                  {ALGO_UI_LOADING.coreIntelligence}
                </p>
              ) : (products?.products || []).length === 0 ? (
                <p className="text-xs text-white/45">
                  {ALGO_PRODUCT_RADAR.empty}
                </p>
              ) : (
                (products?.products || []).slice(0, 6).map((p) => (
                  <div
                    key={p.keyword}
                    className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize">
                        {p.keyword}
                      </p>
                      <p className="text-xs text-violet-300/90">
                        {p.potentialLabel ?? p.potential}
                      </p>
                      <p className="text-[11px] text-white/45 mt-1 leading-relaxed">
                        {p.rationale}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-emerald-300 shrink-0 tabular-nums">
                      {p.score}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <p className="text-[11px] text-white/40 leading-relaxed">
                {ALGO_PRODUCT_RADAR.disclaimer}
              </p>
              <Link
                href="/trends"
                className="inline-flex text-xs font-semibold text-violet-300 hover:text-violet-200 transition-colors"
              >
                {ALGO_PRODUCT_RADAR.ctaTrends}
              </Link>
            </div>
          </Card>
        </div>

        <Card icon={Activity} title="Category Momentum">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(globalData?.categories || []).map((c) => (
              <div
                key={c.name}
                className="p-3 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
              >
                <p className="text-sm font-semibold capitalize">{c.name}</p>
                <p className="text-xs text-white/50">{c.momentum}</p>
                <p className="text-xl font-black mt-1">{c.score}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-3">
            {globalData?.generatedAt
              ? `last update: ${new Date(globalData.generatedAt).toLocaleString()}`
              : loading
                ? "loading..."
                : "no data"}
          </p>
        </Card>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="algo-surface rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-violet-300" />
        <h2 className="font-bold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}
