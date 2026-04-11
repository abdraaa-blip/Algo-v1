import { type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  cta?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-16 px-6 gap-4",
        className,
      )}
    >
      {Icon && (
        <div
          aria-hidden
          className="size-12 rounded-2xl bg-white/4 border border-white/7 flex items-center justify-center mb-1"
        >
          <Icon size={22} strokeWidth={1.4} className="text-white/20" />
        </div>
      )}

      <div className="space-y-1.5 max-w-[260px]">
        <p className="text-sm font-semibold text-white/55 leading-snug">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-white/30 leading-relaxed">{subtitle}</p>
        )}
      </div>

      {cta && (
        <Button
          variant="outline"
          size="sm"
          onClick={cta.onClick}
          className="mt-1"
        >
          {cta.label}
        </Button>
      )}
    </div>
  );
}
