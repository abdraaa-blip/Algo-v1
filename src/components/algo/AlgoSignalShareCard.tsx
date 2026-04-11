"use client";

import { useCallback, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  headline: string;
  score: number;
  subtitle?: string;
  badgeLabel?: string;
  className?: string;
  /** Largeur logique de la carte capturée (px) · utile en modal étroit. */
  cardWidth?: number;
};

/**
 * Carte visuelle exportable (PNG) + partage natif si disponible.
 * Renforce le positionnement « signal ALGO », pas une copie de réseau social.
 */
export function AlgoSignalShareCard({
  headline,
  score,
  subtitle,
  badgeLabel,
  className,
  cardWidth = 420,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const runCapture = useCallback(async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#07070f",
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;
      const file = new File([blob], "algo-signal.png", { type: "image/png" });
      const line = `${headline}${score > 0 ? ` · ${score}` : ""} · ALGO`;
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "ALGO", text: line });
            return;
          }
        } catch {
          /* fallback download */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "algo-signal.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }, [busy, headline, score]);

  const displayScore = score > 0 ? String(Math.round(score)) : "–";

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void runCapture()}
        className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-400/25 text-violet-200/90 hover:bg-violet-500/25 disabled:opacity-50"
      >
        <Share2 size={12} aria-hidden />
        {busy ? "Export…" : "Exporter / partager le signal"}
      </button>

      {/* Zone capturée telle quelle par html2canvas */}
      <div className="rounded-xl border border-[var(--color-border)] overflow-x-auto bg-[var(--color-bg-primary)] max-w-full">
        <div
          ref={cardRef}
          className="p-5 flex flex-col gap-3 mx-auto"
          style={{
            width: cardWidth,
            maxWidth: "100%",
            minHeight: 220,
            background:
              "linear-gradient(145deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 45%, var(--color-bg-elevated) 100%)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-black tracking-tight text-white">
              ALGO
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">
              Signal
            </span>
          </div>
          {badgeLabel ? (
            <span className="text-[10px] w-fit px-2 py-0.5 rounded-full bg-violet-500/25 text-violet-200 font-bold border border-violet-400/30">
              {badgeLabel}
            </span>
          ) : null}
          <p className="text-base font-bold text-white/95 leading-snug line-clamp-3">
            {headline}
          </p>
          <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-[var(--color-border)]">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold">
                Score radar
              </p>
              <p className="text-3xl font-black tabular-nums text-cyan-300">
                {displayScore}
              </p>
            </div>
            <p className="text-[10px] text-right text-[var(--color-text-secondary)] max-w-[55%] leading-snug">
              {subtitle ??
                "L'algorithme des algorithmes · meta-radar culturel."}
            </p>
          </div>
          <p className="text-[9px] text-[var(--color-text-muted)]">
            {new Date().toLocaleDateString("fr-FR", { dateStyle: "medium" })}
          </p>
        </div>
      </div>
    </div>
  );
}
