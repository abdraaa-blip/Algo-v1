import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabasePublicApiKey,
  getSupabaseUrl,
} from "@/lib/supabase/env-keys";

export interface UserEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
}

export const MAX_ANALYTICS_EVENTS = 10000;

/** Mémoire process · partagé entre routes analytics et `/api/v1/ingest`. */
export const analyticsEventStore: UserEvent[] = [];

function getSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const anon = getSupabasePublicApiKey();
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export function hashIpForAnalytics(ip: string | null): string | null {
  if (!ip) return null;
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

function processContentInteraction(event: UserEvent) {
  const { contentId, contentType, action } = event.data as {
    contentId?: string;
    contentType?: string;
    action?: string;
  };
  if (process.env.NODE_ENV === "development") {
    console.log("[ALGO Interaction]", {
      contentId,
      contentType,
      action,
      sessionId: event.sessionId,
    });
  }
}

function processErrorEvent(event: UserEvent) {
  const { message, stack } = event.data as { message?: string; stack?: string };
  console.error("[ALGO Client Error]", {
    message,
    stack,
    sessionId: event.sessionId,
  });
}

export type IngestEventsContext = {
  ipHash: string | null;
  userAgent: string | null;
  source?: string;
};

/**
 * Valide et enregistre des événements (analytics internes + écosystème).
 */
export async function appendAnalyticsEvents(
  rawEvents: unknown,
  ctx: IngestEventsContext,
): Promise<{ ok: true; processed: number } | { ok: false; error: string }> {
  if (!Array.isArray(rawEvents)) {
    return { ok: false, error: "Events must be an array" };
  }

  const supabase = getSupabaseClient();
  const validEvents: UserEvent[] = [];

  for (const event of rawEvents) {
    if (!event || typeof event !== "object") continue;
    const e = event as Partial<UserEvent>;
    if (!e.type || !e.timestamp || !e.sessionId) continue;
    const ue: UserEvent = {
      type: String(e.type).slice(0, 120),
      data:
        typeof e.data === "object" && e.data !== null
          ? (e.data as Record<string, unknown>)
          : {},
      timestamp: Number(e.timestamp),
      sessionId: String(e.sessionId).slice(0, 200),
    };
    validEvents.push(ue);

    switch (ue.type) {
      case "content_interaction":
        processContentInteraction(ue);
        break;
      case "error":
        processErrorEvent(ue);
        break;
      default:
        break;
    }
  }

  for (const event of validEvents) {
    analyticsEventStore.push(event);
  }

  if (supabase && validEvents.length > 0) {
    const payload = validEvents.map((event) => ({
      event_type: event.type,
      event_name: event.type,
      session_id: event.sessionId,
      page_path: (event.data.pagePath as string | undefined) || null,
      user_agent: ctx.userAgent,
      ip_hash: ctx.ipHash,
      properties: {
        ...event.data,
        ...(ctx.source ? { ingestSource: ctx.source } : {}),
      },
    }));
    try {
      await supabase.from("analytics_events").insert(payload);
    } catch (err) {
      console.error("[ALGO Analytics] Supabase insert failed", err);
    }
  }

  if (analyticsEventStore.length > MAX_ANALYTICS_EVENTS) {
    analyticsEventStore.splice(
      0,
      analyticsEventStore.length - MAX_ANALYTICS_EVENTS,
    );
  }

  return { ok: true, processed: validEvents.length };
}
