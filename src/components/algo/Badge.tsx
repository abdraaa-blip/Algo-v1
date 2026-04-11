"use client";

type BadgeType = "Viral" | "Early" | "Breaking" | "Trend" | "AlmostViral";

const BADGE_CONFIG: Record<
  BadgeType,
  { bg: string; tx: string; dot: string | null; labelFr: string }
> = {
  Viral: {
    bg: "rgba(123,97,255,0.22)",
    tx: "#c4b5fd",
    dot: "#7B61FF",
    labelFr: "Viral",
  },
  Early: {
    bg: "rgba(0,255,178,0.16)",
    tx: "#6ee7b7",
    dot: "#00FFB2",
    labelFr: "Signal",
  },
  Breaking: {
    bg: "rgba(255,77,109,0.22)",
    tx: "#fca5a5",
    dot: "#FF4D6D",
    labelFr: "Urgent",
  },
  Trend: {
    bg: "rgba(0,209,255,0.16)",
    tx: "#7dd3fc",
    dot: "#00D1FF",
    labelFr: "Tendance",
  },
  AlmostViral: {
    bg: "rgba(255,255,255,0.08)",
    tx: "rgba(240,240,248,0.38)",
    dot: null,
    labelFr: "Montant",
  },
};

interface BadgeProps {
  type: BadgeType;
  label?: string; // Optional - will use French default if not provided
  useFrench?: boolean; // Force French label
}

export function Badge({ type, label, useFrench = true }: BadgeProps) {
  const c = BADGE_CONFIG[type] ?? BADGE_CONFIG.AlmostViral;

  // Use French label by default, or custom label if provided
  const displayLabel = label || (useFrench ? c.labelFr : type);

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0 whitespace-nowrap"
      style={{ background: c.bg, color: c.tx, letterSpacing: "0.08em" }}
    >
      {c.dot && (
        <span
          className="w-[5px] h-[5px] rounded-full"
          style={{ background: c.dot }}
        />
      )}
      {displayLabel}
    </span>
  );
}
