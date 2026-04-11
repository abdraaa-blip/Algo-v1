export type RiskLevel = "low" | "medium" | "high";
export type AutonomyMode = "advisory" | "guarded_auto" | "manual_only";
export type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected";
export type ExecutionStatus =
  | "not_executed"
  | "simulated"
  | "executed"
  | "blocked";

export interface ActionProposal {
  id: string;
  type:
    | "content_boost"
    | "ux_fix"
    | "product_test"
    | "campaign_pause"
    | "watch_signal";
  title: string;
  rationale: string;
  confidence: number;
  expectedImpact: number;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
  idempotencyKey: string;
}

export interface SimulationScenario {
  engagementDelta?: number;
  frictionDelta?: number;
  anomalyBoost?: number;
  viralityDelta?: number;
}

export interface SimulationResult {
  baselineScore: number;
  simulatedScore: number;
  delta: number;
  riskShift: "lower" | "neutral" | "higher";
  recommendation: "execute" | "watch" | "hold";
}

export interface AutonomyCounters {
  autoExecuted: number;
  approvalRequired: number;
  approvalDenied: number;
  simRuns: number;
  rollbacks: number;
  feedbackHelpful: number;
  feedbackWrong: number;
  feedbackNeutral: number;
}
