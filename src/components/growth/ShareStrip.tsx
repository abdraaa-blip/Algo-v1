"use client";

import { Link2, MessageCircle, Share2 } from "lucide-react";

type Props = {
  url: string;
  title: string;
  /** Texte court suggéré pour les réseaux (hook) */
  snippet?: string;
  className?: string;
};

function enc(s: string) {
  return encodeURIComponent(s);
}

/**
 * Partage rapide : Web Share API + X, WhatsApp, copier le lien.
 * TikTok / Instagram n’exposent pas d’URL web de partage universel ; le snippet sert de copier-coller.
 */
export function ShareStrip({ url, title, snippet, className }: Props) {
  const text = snippet || `${title} · ${url}`;
  const onNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* dismissed */
      }
    }
    void copy(url);
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={className}>
      <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 flex items-center gap-2">
        <Share2 size={12} className="text-cyan-400/80" />
        Partager
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onNativeShare()}
          className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border-strong)] hover:bg-[var(--color-card)] transition-colors"
        >
          <Share2 size={12} />
          Partager…
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${enc(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border-strong)] hover:bg-[var(--color-card)] transition-colors"
        >
          X
        </a>
        <a
          href={`https://wa.me/?text=${enc(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/25 hover:bg-emerald-500/25"
        >
          <MessageCircle size={12} />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void copy(snippet ? `${snippet}\n${url}` : url)}
          className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors"
        >
          <Link2 size={12} />
          Copier
        </button>
      </div>
      {snippet ? (
        <p className="mt-2 text-[11px] text-[var(--color-text-secondary)] leading-snug rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] p-2">
          <span className="text-[var(--color-text-muted)]">Hook : </span>
          {snippet}
        </p>
      ) : null}
      <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
        Pour TikTok / Reels : colle le lien ou le texte dans l’app après capture
        d’écran.
      </p>
    </div>
  );
}
