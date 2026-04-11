"use client";
// CACHE_BUST: 2026-04-05T10:30

import { cn } from "@/lib/utils";
import type { FilterOption } from "@/types";

interface FilterBarProps {
  filters: FilterOption[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function FilterBar({
  filters,
  active,
  onChange,
  className,
  ariaLabel,
}: FilterBarProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel ?? "Filtres"}
      className={cn(
        "flex items-center gap-2",
        "overflow-x-auto pb-px",
        // Masquer la scrollbar sur tous les navigateurs
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        className,
      )}
    >
      {filters.map((f, index) => {
        const isActive = f.value === active;
        return (
          <button
            key={f.id || f.value || `filter-${index}`}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(f.value)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold",
              "whitespace-nowrap transition-all duration-150",
              "outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#07070f]",
              isActive
                ? "bg-[rgba(123,97,255,0.18)] text-violet-300 border border-[rgba(123,97,255,0.30)]"
                : [
                    "bg-white/4 text-white/40 border border-white/7",
                    "hover:bg-white/8 hover:text-white/65 hover:border-white/12",
                  ].join(" "),
            )}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
