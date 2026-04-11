"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

// =============================================================================
// TYPES
// =============================================================================

export interface RealtimeTrendUpdate {
  id: string;
  topic: string;
  score: number;
  momentum: "exploding" | "rising" | "stable" | "declining";
  platform: string;
  detected_at: string;
  updated_at: string;
}

export interface RealtimeContentUpdate {
  id: string;
  title: string;
  viral_score: number;
  view_count: number;
  platform: string;
  thumbnail_url?: string;
  content_url: string;
  detected_at: string;
}

export interface RealtimeAlertUpdate {
  id: string;
  type: "viral_spike" | "new_trend" | "breaking_news" | "price_change";
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  created_at: string;
  read: boolean;
}

export interface RealtimeStats {
  connected: boolean;
  lastUpdate: string | null;
  updateCount: number;
  latency: number | null;
}

// =============================================================================
// REALTIME TRENDS HOOK
// =============================================================================

export function useRealtimeTrends(options?: {
  platform?: string;
  minScore?: number;
  limit?: number;
}) {
  const [trends, setTrends] = useState<RealtimeTrendUpdate[]>([]);
  const [stats, setStats] = useState<RealtimeStats>({
    connected: false,
    lastUpdate: null,
    updateCount: 0,
    latency: null,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchTrends = async () => {
      let query = supabase
        .from("detected_trends")
        .select("*")
        .order("score", { ascending: false })
        .limit(options?.limit || 50);

      if (options?.platform) {
        query = query.eq("platform", options.platform);
      }
      if (options?.minScore) {
        query = query.gte("score", options.minScore);
      }

      const { data, error } = await query;

      if (!error && data) {
        setTrends(data as RealtimeTrendUpdate[]);
      }
    };

    fetchTrends();

    // Subscribe to realtime updates
    channelRef.current = supabase
      .channel("trends-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "detected_trends",
        },
        (payload: RealtimePostgresChangesPayload<RealtimeTrendUpdate>) => {
          const startTime = Date.now();

          if (payload.eventType === "INSERT") {
            setTrends((prev) => {
              const newTrend = payload.new as RealtimeTrendUpdate;
              // Filter based on options
              if (options?.platform && newTrend.platform !== options.platform) {
                return prev;
              }
              if (options?.minScore && newTrend.score < options.minScore) {
                return prev;
              }
              // Add to beginning and keep sorted
              const updated = [newTrend, ...prev]
                .sort((a, b) => b.score - a.score)
                .slice(0, options?.limit || 50);
              return updated;
            });
          } else if (payload.eventType === "UPDATE") {
            setTrends((prev) =>
              prev
                .map((t) =>
                  t.id === (payload.new as RealtimeTrendUpdate).id
                    ? (payload.new as RealtimeTrendUpdate)
                    : t,
                )
                .sort((a, b) => b.score - a.score),
            );
          } else if (payload.eventType === "DELETE") {
            setTrends((prev) =>
              prev.filter((t) => t.id !== (payload.old as { id: string }).id),
            );
          }

          setStats((prev) => ({
            ...prev,
            lastUpdate: new Date().toISOString(),
            updateCount: prev.updateCount + 1,
            latency: Date.now() - startTime,
          }));
        },
      )
      .subscribe((status) => {
        setStats((prev) => ({
          ...prev,
          connected: status === "SUBSCRIBED",
        }));
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [options?.platform, options?.minScore, options?.limit, supabase]);

  return { trends, stats };
}

// =============================================================================
// REALTIME CONTENT HOOK
// =============================================================================

export function useRealtimeContent(options?: {
  platform?: string;
  minViralScore?: number;
  limit?: number;
}) {
  const [content, setContent] = useState<RealtimeContentUpdate[]>([]);
  const [stats, setStats] = useState<RealtimeStats>({
    connected: false,
    lastUpdate: null,
    updateCount: 0,
    latency: null,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchContent = async () => {
      let query = supabase
        .from("viral_content")
        .select("*")
        .order("viral_score", { ascending: false })
        .limit(options?.limit || 50);

      if (options?.platform) {
        query = query.eq("platform", options.platform);
      }
      if (options?.minViralScore) {
        query = query.gte("viral_score", options.minViralScore);
      }

      const { data, error } = await query;

      if (!error && data) {
        setContent(data as RealtimeContentUpdate[]);
      }
    };

    fetchContent();

    // Subscribe to realtime updates
    channelRef.current = supabase
      .channel("content-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "viral_content",
        },
        (payload: RealtimePostgresChangesPayload<RealtimeContentUpdate>) => {
          const startTime = Date.now();

          if (payload.eventType === "INSERT") {
            setContent((prev) => {
              const newContent = payload.new as RealtimeContentUpdate;
              if (
                options?.platform &&
                newContent.platform !== options.platform
              ) {
                return prev;
              }
              if (
                options?.minViralScore &&
                newContent.viral_score < options.minViralScore
              ) {
                return prev;
              }
              const updated = [newContent, ...prev]
                .sort((a, b) => b.viral_score - a.viral_score)
                .slice(0, options?.limit || 50);
              return updated;
            });
          } else if (payload.eventType === "UPDATE") {
            setContent((prev) =>
              prev
                .map((c) =>
                  c.id === (payload.new as RealtimeContentUpdate).id
                    ? (payload.new as RealtimeContentUpdate)
                    : c,
                )
                .sort((a, b) => b.viral_score - a.viral_score),
            );
          } else if (payload.eventType === "DELETE") {
            setContent((prev) =>
              prev.filter((c) => c.id !== (payload.old as { id: string }).id),
            );
          }

          setStats((prev) => ({
            ...prev,
            lastUpdate: new Date().toISOString(),
            updateCount: prev.updateCount + 1,
            latency: Date.now() - startTime,
          }));
        },
      )
      .subscribe((status) => {
        setStats((prev) => ({
          ...prev,
          connected: status === "SUBSCRIBED",
        }));
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [options?.platform, options?.minViralScore, options?.limit, supabase]);

  return { content, stats };
}

// =============================================================================
// REALTIME ALERTS HOOK
// =============================================================================

export function useRealtimeAlerts(options?: {
  severities?: Array<"low" | "medium" | "high" | "critical">;
  unreadOnly?: boolean;
  limit?: number;
}) {
  const [alerts, setAlerts] = useState<RealtimeAlertUpdate[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<RealtimeStats>({
    connected: false,
    lastUpdate: null,
    updateCount: 0,
    latency: null,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const markAsRead = useCallback(
    async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ read: true })
        .eq("id", alertId);

      if (!error) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [supabase],
  );

  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase
      .from("alerts")
      .update({ read: true })
      .eq("read", false);

    if (!error) {
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      setUnreadCount(0);
    }
  }, [supabase]);

  useEffect(() => {
    const fetchAlerts = async () => {
      let query = supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(options?.limit || 50);

      if (options?.severities?.length) {
        query = query.in("severity", options.severities);
      }
      if (options?.unreadOnly) {
        query = query.eq("read", false);
      }

      const { data, error } = await query;

      if (!error && data) {
        setAlerts(data as RealtimeAlertUpdate[]);
        setUnreadCount(data.filter((a) => !a.read).length);
      }
    };

    fetchAlerts();

    channelRef.current = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        (payload: RealtimePostgresChangesPayload<RealtimeAlertUpdate>) => {
          const startTime = Date.now();
          const newAlert = payload.new as RealtimeAlertUpdate;

          if (
            options?.severities?.length &&
            !options.severities.includes(newAlert.severity)
          ) {
            return;
          }

          setAlerts((prev) =>
            [newAlert, ...prev].slice(0, options?.limit || 50),
          );
          if (!newAlert.read) {
            setUnreadCount((prev) => prev + 1);
          }

          setStats((prev) => ({
            ...prev,
            lastUpdate: new Date().toISOString(),
            updateCount: prev.updateCount + 1,
            latency: Date.now() - startTime,
          }));

          // Browser notification for high/critical alerts
          if (
            typeof window !== "undefined" &&
            Notification.permission === "granted" &&
            (newAlert.severity === "high" || newAlert.severity === "critical")
          ) {
            new Notification(`ALGO Alert: ${newAlert.title}`, {
              body: newAlert.message,
              icon: "/favicon.ico",
            });
          }
        },
      )
      .subscribe((status) => {
        setStats((prev) => ({
          ...prev,
          connected: status === "SUBSCRIBED",
        }));
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [options?.severities, options?.unreadOnly, options?.limit, supabase]);

  return { alerts, unreadCount, stats, markAsRead, markAllAsRead };
}

// =============================================================================
// REALTIME PRESENCE HOOK (for live user count)
// =============================================================================

export function useRealtimePresence(roomId: string = "algo-live") {
  const [onlineCount, setOnlineCount] = useState(0);
  const [users, setUsers] = useState<Array<{ id: string; online_at: string }>>(
    [],
  );
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const userId = `user-${Math.random().toString(36).substring(7)}`;

    channelRef.current = supabase.channel(roomId, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current
      .on("presence", { event: "sync" }, () => {
        const state = channelRef.current?.presenceState() || {};
        const allUsers = Object.values(state).flat() as unknown as Array<{
          id: string;
          online_at: string;
        }>;
        setUsers(allUsers);
        setOnlineCount(allUsers.length);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setOnlineCount((prev) => prev + newPresences.length);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setOnlineCount((prev) => Math.max(0, prev - leftPresences.length));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channelRef.current?.track({
            id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, supabase]);

  return { onlineCount, users };
}

// =============================================================================
// BROADCAST HOOK (for real-time notifications across clients)
// =============================================================================

export interface BroadcastMessage {
  type: "viral_alert" | "trend_update" | "system_message";
  payload: Record<string, unknown>;
  timestamp: string;
}

export function useRealtimeBroadcast(channelName: string = "algo-broadcast") {
  const [lastMessage, setLastMessage] = useState<BroadcastMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<BroadcastMessage[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const broadcast = useCallback(
    (message: Omit<BroadcastMessage, "timestamp">) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "message",
          payload: {
            ...message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    },
    [],
  );

  useEffect(() => {
    channelRef.current = supabase
      .channel(channelName)
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const message = payload as BroadcastMessage;
        setLastMessage(message);
        setMessageHistory((prev) => [message, ...prev].slice(0, 100));
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelName, supabase]);

  return { lastMessage, messageHistory, broadcast };
}
