"use client";

import Link from "next/link";
import { ConsentManageLink } from "@/components/growth/ConsentBanner";
import { SITE_TRANSPARENCY_AI_CALIBRATION_HREF } from "@/lib/seo/site";

/**
 * Liens transverses : légal, découverte (RSS), consentement · discret pour ne pas polluer l’UI.
 */
export function SiteFooter() {
  return (
    <footer
      className="relative z-10 algo-footer-chrome py-5 px-4 sm:px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-5 gap-y-2.5 text-[11px] sm:text-xs text-[var(--color-text-tertiary)]">
        <Link
          href="/transparency"
          className="hover:text-[var(--color-text-secondary)] transition-colors duration-200"
        >
          Transparence
        </Link>
        <Link
          href={SITE_TRANSPARENCY_AI_CALIBRATION_HREF}
          className="hover:text-[var(--color-text-secondary)] transition-colors duration-200"
        >
          Calibrage IA
        </Link>
        <Link
          href="/legal"
          className="hover:text-[var(--color-text-secondary)] transition-colors duration-200"
        >
          Mentions légales
        </Link>
        <Link
          href="/privacy"
          className="hover:text-[var(--color-text-secondary)] transition-colors duration-200"
        >
          Confidentialité
        </Link>
        <Link
          href="/about"
          className="hover:text-[var(--color-text-secondary)] transition-colors duration-200"
        >
          À propos
        </Link>
        <a
          href="/api/feed/rss"
          className="hover:text-[var(--color-text-secondary)] transition-colors duration-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          Flux RSS
        </a>
        <ConsentManageLink className="hover:text-[var(--color-text-secondary)] transition-colors duration-200 underline-offset-2 hover:underline" />
      </div>
    </footer>
  );
}
