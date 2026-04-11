import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  trailing?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  trailing,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-1 min-w-0">
        <h2 className="algo-type-page-title truncate">{title}</h2>
        {subtitle && (
          <p className="text-sm leading-relaxed text-[var(--color-text-tertiary)] max-w-prose">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {trailing}

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              "shrink-0 inline-flex items-center gap-1 text-sm text-[var(--color-text-tertiary)] font-semibold",
              "hover:text-[var(--color-text-secondary)] transition-colors duration-200 ease-out",
              "active:text-[var(--color-text-primary)] rounded-lg px-1 -mx-1 py-1",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]",
            )}
          >
            {action.label}
            <ChevronRight size={14} strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
