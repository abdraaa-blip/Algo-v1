"use client";

import type { Locale } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "de", label: "DE" },
  { code: "ar", label: "AR" },
];

/**
 * Sélecteur discret de langue (même source que la nav : `algo_locale`).
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, changeLocale } = useTranslation();

  return (
    <label
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]",
        className,
      )}
    >
      <span className="sr-only">Langue de l&apos;interface</span>
      <select
        value={locale}
        onChange={(e) => changeLocale(e.target.value as Locale)}
        className={cn(
          "rounded-md border border-[var(--color-border)] bg-[var(--color-card)]",
          "px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]",
          "cursor-pointer hover:border-[color-mix(in_srgb,var(--color-violet)_30%,var(--color-border))]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-border-focus)]",
        )}
      >
        {OPTIONS.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
