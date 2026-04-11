import type {
  SimulationResult,
  SimulationScenario,
} from "@/lib/autonomy/types";
import { recordSimulationRun } from "@/lib/autonomy/telemetry";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function runWhatIfSimulation(input: {
  baselineScore: number;
  baselineEngagementRate: number;
  baselineFrictionRate: number;
  baselineAnomalyCount: number;
  scenario: SimulationScenario;
}): SimulationResult {
  recordSimulationRun();
  const {
    baselineScore,
    baselineEngagementRate,
    baselineFrictionRate,
    baselineAnomalyCount,
    scenario,
  } = input;

  const engagement = baselineEngagementRate + (scenario.engagementDelta || 0);
  const friction = baselineFrictionRate + (scenario.frictionDelta || 0);
  const anomalyCount = Math.max(
    0,
    baselineAnomalyCount + (scenario.anomalyBoost || 0),
  );
  const customDelta = scenario.viralityDelta || 0;

  const adjusted = clamp(
    baselineScore +
      customDelta +
      engagement * 35 -
      friction * 42 -
      anomalyCount * 2.5,
  );
  const delta = Math.round((adjusted - baselineScore) * 10) / 10;

  const riskShift: SimulationResult["riskShift"] =
    friction > baselineFrictionRate || anomalyCount > baselineAnomalyCount
      ? "higher"
      : engagement > baselineEngagementRate
        ? "lower"
        : "neutral";

  const recommendation: SimulationResult["recommendation"] =
    adjusted >= 72 && riskShift !== "higher"
      ? "execute"
      : adjusted >= 55
        ? "watch"
        : "hold";

  return {
    baselineScore,
    simulatedScore: adjusted,
    delta,
    riskShift,
    recommendation,
  };
}
