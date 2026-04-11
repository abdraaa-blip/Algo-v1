import type {
  ActionProposal,
  AutonomyMode,
  PolicyDecision,
} from "@/lib/autonomy/types";
import {
  recordApprovalDenied,
  recordApprovalRequired,
} from "@/lib/autonomy/telemetry";

interface PolicyConfig {
  mode: AutonomyMode;
  killSwitch: boolean;
  minConfidenceForAuto: number;
  allowlist: ActionProposal["type"][];
  cooldownMs: number;
}

const defaultConfig: PolicyConfig = {
  mode: "guarded_auto",
  killSwitch: false,
  minConfidenceForAuto: 0.7,
  allowlist: ["watch_signal", "content_boost", "product_test"],
  cooldownMs: 120_000,
};

let policyConfig: PolicyConfig = {
  ...defaultConfig,
  mode: (process.env.ALGO_AUTONOMY_MODE as AutonomyMode) || defaultConfig.mode,
  killSwitch: process.env.ALGO_AUTONOMY_KILL_SWITCH === "1",
};

const actionLastRunAt = new Map<string, number>();

function isInCooldown(idempotencyKey: string): boolean {
  const last = actionLastRunAt.get(idempotencyKey);
  if (!last) return false;
  return Date.now() - last < policyConfig.cooldownMs;
}

function markRun(idempotencyKey: string) {
  actionLastRunAt.set(idempotencyKey, Date.now());
}

export function getAutonomyPolicy() {
  return { ...policyConfig };
}

export function updateAutonomyPolicy(patch: Partial<PolicyConfig>) {
  policyConfig = { ...policyConfig, ...patch };
  return getAutonomyPolicy();
}

export function evaluatePolicy(
  proposal: ActionProposal,
  options?: { dryRun?: boolean },
): PolicyDecision {
  const idempotencyKey = `${proposal.type}:${proposal.id}`;

  if (policyConfig.killSwitch) {
    recordApprovalDenied();
    return {
      allowed: false,
      requiresApproval: true,
      reason: "Blocked by kill-switch",
      idempotencyKey,
    };
  }

  if (policyConfig.mode === "manual_only") {
    recordApprovalRequired();
    return {
      allowed: false,
      requiresApproval: true,
      reason: "Manual mode requires approval",
      idempotencyKey,
    };
  }

  if (proposal.riskLevel !== "low") {
    recordApprovalRequired();
    return {
      allowed: false,
      requiresApproval: true,
      reason: "Risk level requires approval",
      idempotencyKey,
    };
  }

  if (!policyConfig.allowlist.includes(proposal.type)) {
    recordApprovalRequired();
    return {
      allowed: false,
      requiresApproval: true,
      reason: "Action type not allowlisted",
      idempotencyKey,
    };
  }

  if (proposal.confidence < policyConfig.minConfidenceForAuto) {
    recordApprovalRequired();
    return {
      allowed: false,
      requiresApproval: true,
      reason: "Confidence below auto-execution threshold",
      idempotencyKey,
    };
  }

  if (isInCooldown(idempotencyKey)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: "Action in cooldown window",
      idempotencyKey,
    };
  }

  if (policyConfig.mode === "advisory") {
    return {
      allowed: false,
      requiresApproval: false,
      reason: "Advisory mode: no auto-execution",
      idempotencyKey,
    };
  }

  if (!options?.dryRun) {
    markRun(idempotencyKey);
  }
  return {
    allowed: true,
    requiresApproval: false,
    reason: "Guarded auto-execution allowed",
    idempotencyKey,
  };
}
