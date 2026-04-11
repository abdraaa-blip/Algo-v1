"use client";

import { useEffect, useState } from "react";
import { Activity, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalCounterProps {
  className?: string;
}

export function SignalCounter({ className }: SignalCounterProps) {
  const [signals, setSignals] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Simulate real-time signal detection
    const updateSignals = () => {
      const newSignals = Math.floor(Math.random() * 50) + 100;
      setSignals((prev) => {
        if (newSignals > prev) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 500);
        }
        return newSignals;
      });

      // Simulate viewer count (would be real WebSocket data)
      setViewers(Math.floor(Math.random() * 500) + 1000);
    };

    updateSignals();
    const interval = setInterval(updateSignals, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Signals detected */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20",
            isAnimating && "animate-pulse",
          )}
        >
          <Activity className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Signals
          </span>
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              isAnimating ? "text-violet-400" : "text-zinc-200",
            )}
          >
            {signals.toLocaleString()}
            <span className="text-emerald-400 text-xs ml-1">/h</span>
          </span>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="h-8 w-px bg-zinc-800" />

      {/* Live viewers */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Users className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Watching
          </span>
          <span className="text-sm font-bold text-zinc-200 tabular-nums">
            {viewers.toLocaleString()}
            <span className="relative ml-1">
              <span className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="relative w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
