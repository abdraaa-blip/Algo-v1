import type { AutonomyCounters } from "@/lib/autonomy/types";

const counters: AutonomyCounters = {
  autoExecuted: 0,
  approvalRequired: 0,
  approvalDenied: 0,
  simRuns: 0,
  rollbacks: 0,
  feedbackHelpful: 0,
  feedbackWrong: 0,
  feedbackNeutral: 0,
};

export function getAutonomyCounters(): AutonomyCounters {
  return { ...counters };
}

export function recordAutoExecuted() {
  counters.autoExecuted += 1;
}

export function recordApprovalRequired() {
  counters.approvalRequired += 1;
}

export function recordApprovalDenied() {
  counters.approvalDenied += 1;
}

export function recordSimulationRun() {
  counters.simRuns += 1;
}

export function recordRollback() {
  counters.rollbacks += 1;
}

export function recordFeedback(kind: "helpful" | "wrong" | "neutral") {
  if (kind === "helpful") counters.feedbackHelpful += 1;
  if (kind === "wrong") counters.feedbackWrong += 1;
  if (kind === "neutral") counters.feedbackNeutral += 1;
}
