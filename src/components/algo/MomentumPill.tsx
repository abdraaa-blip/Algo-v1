"use client";

interface MomentumPillProps {
  value: number;
  trend: "up" | "down" | "stable";
}

export function MomentumPill({ value, trend }: MomentumPillProps) {
  const col =
    trend === "up"
      ? "#00FFB2"
      : trend === "down"
        ? "rgba(240,240,248,0.2)"
        : "#00D1FF";
  const bg =
    trend === "up"
      ? "rgba(0,255,178,0.1)"
      : trend === "down"
        ? "rgba(255,255,255,0.04)"
        : "rgba(0,209,255,0.1)";

  const arrow =
    trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "\u2192";
  const sign = trend !== "down" ? "+" : "";

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
      style={{ background: bg, color: col }}
    >
      {arrow} {sign}
      {value}%
    </span>
  );
}
