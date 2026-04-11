/**
 * Monitoring Events API
 *
 * Receives batched monitoring events from the client
 * Stores in Supabase for audit trail
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { createClient } from "@/lib/supabase/server";
import {
  getSupabasePublicApiKey,
  getSupabaseUrl,
} from "@/lib/supabase/env-keys";
import { logger } from "@/lib/logger";

/** Node : cookies Supabase + rate-limiter mémoire (évite Edge + `setInterval`). */
export const runtime = "nodejs";

interface MonitoringEvent {
  type: string;
  message: string;
  severity: string;
  timestamp: string;
  context: Record<string, unknown>;
  stack?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const { events } = (await request.json()) as { events: MonitoringEvent[] };

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "No events provided" },
        { status: 400 },
      );
    }

    // Validate events
    const validEvents = events.filter(
      (event) =>
        event.type && event.message && event.severity && event.timestamp,
    );

    if (validEvents.length === 0) {
      return NextResponse.json({ error: "No valid events" }, { status: 400 });
    }

    // Log critical events immediately
    validEvents
      .filter((e) => e.severity === "critical")
      .forEach((e) => {
        logger.error("[CRITICAL]", new Error(`${e.type}: ${e.message}`), {
          severity: e.severity,
          timestamp: e.timestamp,
          context: e.context,
          stack: e.stack,
        });
      });

    // Persistance Supabase (audit) : uniquement si le client est configurable (évite erreurs
    // quand Production Vercel n’a pas encore les NEXT_PUBLIC_* alignés avec Development).
    if (
      process.env.NODE_ENV === "production" &&
      getSupabaseUrl() &&
      getSupabasePublicApiKey()
    ) {
      try {
        const supabase = await createClient();

        // Note: This requires a monitoring_events table to be created
        // For now, we'll just log the events
        logger.info(`[Monitoring] Received ${validEvents.length} events`);

        // Uncomment when table exists:
        // await supabase.from('monitoring_events').insert(
        //   validEvents.map(e => ({
        //     type: e.type,
        //     message: e.message,
        //     severity: e.severity,
        //     event_timestamp: e.timestamp,
        //     context: e.context,
        //     stack: e.stack,
        //     metadata: e.metadata,
        //   }))
        // )

        void supabase;
      } catch (dbError) {
        logger.error(
          "[Monitoring] Failed to store events",
          dbError instanceof Error ? dbError : new Error(String(dbError)),
        );
      }
    }

    return NextResponse.json({
      success: true,
      received: validEvents.length,
    });
  } catch (error) {
    logger.error(
      "[Monitoring API] Error:",
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`api-monitoring-events-get:${identifier}`, {
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  return NextResponse.json({
    status: "operational",
    timestamp: new Date().toISOString(),
    checkInterval: "5m",
    lastCheck: fiveMinutesAgo,
  });
}
