// FORCE_REBUILD_V3: 2026-04-05T09:30 - Cache invalidation
/**
 * ALGO Realtime - Real-Time Sync Layer
 * Uses channel().subscribe() - NOT realtime.onOpen()
 */

import { createClient } from "@/lib/supabase/client";
import { AlgoEventBus } from "./AlgoEventBus";
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeMetrics {
  messagesReceived: number;
  connectionDrops: number;
  lastMessageAt: string | null;
}

class AlgoRealtimeClass {
  private supabase: SupabaseClient | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private isConnected = false;
  private metrics: RealtimeMetrics = {
    messagesReceived: 0,
    connectionDrops: 0,
    lastMessageAt: null,
  };

  /**
   * Initialize with Supabase client
   */
  initialize(): void {
    if (typeof window === "undefined") return;

    try {
      this.supabase = createClient();
      console.log("[ALGO Realtime] Initialized");
    } catch (error) {
      console.error("[ALGO Realtime] Failed to initialize:", error);
    }
  }

  /**
   * Connect to Supabase Realtime using channel subscription
   */
  async connect(): Promise<void> {
    // Initialize if not done
    if (!this.supabase) {
      this.initialize();
    }

    // Still no client? Bail out silently
    if (!this.supabase || this.isConnected) return;

    try {
      // Create a status channel to track connection
      const statusChannel = this.supabase.channel("algo-status");

      statusChannel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[ALGO Realtime] Connected");
          this.isConnected = true;
          AlgoEventBus.publish("system:online", {
            timestamp: new Date().toISOString(),
          });
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.log("[ALGO Realtime] Disconnected");
          this.isConnected = false;
          this.metrics.connectionDrops++;
          AlgoEventBus.publish("system:offline", {
            timestamp: new Date().toISOString(),
          });
        }
      });

      this.channels.set("algo-status", statusChannel);
    } catch (error) {
      console.error("[ALGO Realtime] Connection failed:", error);
    }
  }

  /**
   * Disconnect from all channels
   */
  disconnect(): void {
    if (this.supabase) {
      for (const [, channel] of this.channels) {
        this.supabase.removeChannel(channel);
      }
      this.channels.clear();
    }
    this.isConnected = false;
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; metrics: RealtimeMetrics } {
    return {
      connected: this.isConnected,
      metrics: this.metrics,
    };
  }
}

export const AlgoRealtime = new AlgoRealtimeClass();
