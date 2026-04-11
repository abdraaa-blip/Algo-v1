"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PulsingCardProps {
  children: React.ReactNode;
  updatedAt?: string | number | null;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function PulsingCard({
  children,
  updatedAt,
  className,
  intensity = "medium",
}: PulsingCardProps) {
  const [isRecent, setIsRecent] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);

  useEffect(() => {
    if (!updatedAt) return;

    const checkRecency = () => {
      const updated =
        typeof updatedAt === "string"
          ? new Date(updatedAt).getTime()
          : updatedAt;
      const now = Date.now();
      const minutesAgo = (now - updated) / 60000;

      // Content updated in last 10 minutes pulses
      if (minutesAgo < 10) {
        setIsRecent(true);
        // More recent = more intense pulse
        const intensityValue = Math.max(0, 1 - minutesAgo / 10);
        setPulseIntensity(intensityValue);
      } else {
        setIsRecent(false);
        setPulseIntensity(0);
      }
    };

    checkRecency();
    const interval = setInterval(checkRecency, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [updatedAt]);

  const intensityMap = {
    low: "opacity-30",
    medium: "opacity-50",
    high: "opacity-70",
  };

  return (
    <div className={cn("relative", className)}>
      {isRecent && (
        <>
          {/* Outer glow pulse */}
          <div
            className={cn(
              "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-violet-500/30",
              "animate-pulse blur-sm",
              intensityMap[intensity],
            )}
            style={{
              animationDuration: `${2 - pulseIntensity}s`,
              opacity: pulseIntensity * 0.5,
            }}
          />
          {/* Inner border pulse */}
          <div
            className="absolute inset-0 rounded-2xl border border-violet-500/30 animate-pulse"
            style={{ animationDuration: `${1.5 - pulseIntensity * 0.5}s` }}
          />
        </>
      )}
      {children}
    </div>
  );
}
