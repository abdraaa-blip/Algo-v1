import { NextRequest, NextResponse } from "next/server";
import { parseDefaultedListLimit } from "@/lib/api/query-limit";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import {
  getIncidents,
  persistIncident,
  pushIncident,
} from "@/lib/intelligence/ops-incidents";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const expected = process.env.INTELLIGENCE_DASHBOARD_TOKEN;
  if (!expected) return false;
  const provided =
    request.headers.get("x-intelligence-ops-token") ||
    request.cookies.get("intelligence_ops_token")?.value ||
    null;
  return provided === expected;
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
    `intelligence-ops-incidents-get:${identifier}`,
    { limit: 120, windowMs: 60_000 },
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
  const { searchParams } = new URL(request.url);
  const limit = parseDefaultedListLimit(searchParams.get("limit"), 100, 500);
  return NextResponse.json({ success: true, data: getIncidents(limit) });
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
    `intelligence-ops-incidents-post:${identifier}`,
    { limit: 40, windowMs: 60_000 },
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
  try {
    const body = (await request.json()) as {
      severity: "low" | "medium" | "high";
      title: string;
      details: string;
      actions?: string[];
    };
    if (!body?.severity || !body?.title || !body?.details) {
      return NextResponse.json(
        { success: false, error: "severity, title, details required" },
        { status: 400 },
      );
    }
    const incident = pushIncident({
      severity: body.severity,
      title: body.title,
      details: body.details,
      actions: Array.isArray(body.actions) ? body.actions.slice(0, 20) : [],
    });
    void persistIncident(incident);
    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid payload",
      },
      { status: 400 },
    );
  }
}
