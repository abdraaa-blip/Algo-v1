import { getAutonomyPolicy } from "@/lib/autonomy/policy";
import { getAutonomyCounters } from "@/lib/autonomy/telemetry";
import { getLearningHistory } from "@/lib/autonomy/learning-history";
import { getAllCircuitStats } from "@/lib/resilience/circuit-breaker";

export type AlertSeverity = "low" | "medium" | "high";

export interface OpsAlert {
  id: string;
  domain: "autonomy" | "learning" | "resilience";
  severity: AlertSeverity;
  message: string;
}

export function collectOpsStatus() {
  const policy = getAutonomyPolicy();
  const counters = getAutonomyCounters();
  const history = getLearningHistory(25);
  const circuits = getAllCircuitStats();

  const alerts: OpsAlert[] = [];
  const totalFeedback =
    counters.feedbackHelpful +
    counters.feedbackWrong +
    counters.feedbackNeutral;
  const wrongRatio = counters.feedbackWrong / Math.max(1, totalFeedback);

  if (policy.killSwitch) {
    alerts.push({
      id: "autonomy-killswitch",
      domain: "autonomy",
      severity: "high",
      message: "Kill-switch is ON. Autonomy execution is blocked.",
    });
  } else if (policy.mode === "advisory") {
    alerts.push({
      id: "autonomy-advisory",
      domain: "autonomy",
      severity: "medium",
      message: "Autonomy is in advisory mode due to safety posture.",
    });
  }

  if (totalFeedback >= 10 && wrongRatio >= 0.45) {
    alerts.push({
      id: "learning-drift",
      domain: "learning",
      severity: wrongRatio >= 0.55 ? "high" : "medium",
      message: `Wrong feedback ratio elevated (${(wrongRatio * 100).toFixed(0)}%).`,
    });
  }

  const last = history[0];
  const prev = history[1];
  if (last && prev) {
    const jump = Math.abs(last.nextMinConfidence - prev.nextMinConfidence);
    if (jump >= 0.05) {
      alerts.push({
        id: "learning-threshold-jump",
        domain: "learning",
        severity: "medium",
        message: `Autonomy threshold changed rapidly (${jump.toFixed(2)}).`,
      });
    }
  }

  const openCircuits = Object.entries(circuits).filter(
    ([, stat]) => stat.state === "OPEN",
  );
  if (openCircuits.length > 0) {
    alerts.push({
      id: "resilience-open-circuit",
      domain: "resilience",
      severity: openCircuits.length > 2 ? "high" : "medium",
      message: `${openCircuits.length} circuit breaker(s) are OPEN.`,
    });
  }

  const recommendedActions = [
    ...(alerts.some((a) => a.id === "learning-drift")
      ? ["increase_threshold_and_switch_to_advisory"]
      : []),
    ...(alerts.some((a) => a.id === "resilience-open-circuit")
      ? ["slow_external_polling"]
      : []),
    ...(alerts.some((a) => a.id === "autonomy-killswitch")
      ? ["manual_ops_review_required"]
      : []),
  ];

  return {
    generatedAt: new Date().toISOString(),
    alerts,
    recommendedActions,
    policy,
    counters,
    resilience: {
      totalCircuits: Object.keys(circuits).length,
      openCircuits: openCircuits.map(([name]) => name),
      circuits,
    },
    learning: {
      totalFeedback,
      wrongRatio,
      historySize: history.length,
    },
  };
}
