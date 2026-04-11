import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { collectOpsStatus } from "@/lib/intelligence/ops-alerts";
import {
  pushIncident,
  persistIncident,
} from "@/lib/intelligence/ops-incidents";
import { updateAutonomyPolicy } from "@/lib/autonomy/policy";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const opsToken = process.env.INTELLIGENCE_DASHBOARD_TOKEN;
  const cronSecret = process.env.CRON_SECRET;
  const providedOps =
    request.headers.get("x-intelligence-ops-token") ||
    request.cookies.get("intelligence_ops_token")?.value ||
    null;
  const authHeader = request.headers.get("authorization");
  return (
    (opsToken && providedOps === opsToken) ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`)
  );
}

function applyRunbook() {
  const snapshot = collectOpsStatus();
  const actions: string[] = [];

  if (snapshot.alerts.some((a) => a.id === "learning-drift")) {
    updateAutonomyPolicy({
      mode: "advisory",
      minConfidenceForAuto: Math.max(
        snapshot.policy.minConfidenceForAuto,
        0.82,
      ),
    });
    actions.push("switch_to_advisory_and_raise_threshold");
  }

  if (snapshot.alerts.some((a) => a.id === "resilience-open-circuit")) {
    updateAutonomyPolicy({
      minConfidenceForAuto: Math.max(
        snapshot.policy.minConfidenceForAuto,
        0.78,
      ),
    });
    actions.push("raise_threshold_due_to_resilience_pressure");
  }

  if (snapshot.alerts.some((a) => a.id === "autonomy-killswitch")) {
    actions.push("manual_review_required_killswitch_on");
  }

  if (actions.length > 0) {
    const incident = pushIncident({
      severity: snapshot.alerts.some((a) => a.severity === "high")
        ? "high"
        : "medium",
      title: "ops_runbook_applied",
      details: `Runbook applied with ${actions.length} action(s).`,
      actions,
    });
    void persistIncident(incident);
  }

  return { snapshot, actions, policyAfter: collectOpsStatus().policy };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(
    `intelligence-ops-runbook-get:${identifier}`,
    { limit: 60, windowMs: 60_000 },
  );
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded",
        retryAfter: rateLimit.retryAfter,
      },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }
  return NextResponse.json({
    success: true,
    dryRun: true,
    snapshot: collectOpsStatus(),
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(
    `intelligence-ops-runbook-post:${identifier}`,
    { limit: 20, windowMs: 60_000 },
  );
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded",
        retryAfter: rateLimit.retryAfter,
      },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }
  const result = applyRunbook();
  return NextResponse.json({
    success: true,
    applied: result.actions.length > 0,
    actions: result.actions,
    policyAfter: result.policyAfter,
    snapshot: result.snapshot,
  });
}
