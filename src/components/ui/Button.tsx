import { type LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variantCls: Record<Variant, string> = {
  primary: [
    "bg-violet-500 text-white",
    "hover:bg-violet-400",
    "active:brightness-[0.94]",
    "shadow-[0_0_20px_rgba(123,97,255,0.28)]",
    "disabled:bg-violet-500/30 disabled:text-white/30 disabled:shadow-none disabled:active:brightness-100",
    "focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]",
  ].join(" "),
  ghost: [
    "bg-white/5 text-[var(--color-text-secondary)]",
    "hover:bg-white/10 hover:text-[var(--color-text-primary)]",
    "active:bg-white/[0.12]",
    "disabled:bg-white/3 disabled:text-[var(--color-text-muted)] disabled:active:bg-white/3",
    "focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]",
  ].join(" "),
  outline: [
    "bg-transparent border border-[var(--color-border-strong)] text-[var(--color-text-secondary)]",
    "hover:border-violet-500/50 hover:text-[var(--color-text-primary)] hover:bg-violet-500/5",
    "active:bg-violet-500/10",
    "disabled:border-[var(--color-border)] disabled:text-[var(--color-text-muted)] disabled:active:bg-transparent",
    "focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]",
  ].join(" "),
};

const sizeCls: Record<Size, string> = {
  sm: "min-h-10 px-3.5 py-2 text-xs gap-1.5 rounded-lg",
  md: "min-h-11 px-5 py-2.5 text-sm gap-2 rounded-lg",
  lg: "min-h-12 px-6 py-3 text-sm gap-2.5 rounded-xl",
};

const iconSize: Record<Size, number> = { sm: 12, md: 14, lg: 16 };

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "start" | "end";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  iconPosition = "start",
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sz = iconSize[size];

  return (
    <button
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center font-semibold",
        "transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200 ease-out",
        "cursor-pointer select-none outline-none",
        variantCls[variant],
        sizeCls[size],
        isDisabled && "cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2
          size={sz}
          strokeWidth={2}
          className="animate-spin shrink-0"
          aria-hidden
        />
      ) : Icon && iconPosition === "start" ? (
        <Icon size={sz} strokeWidth={1.8} className="shrink-0" aria-hidden />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === "end" && (
        <Icon size={sz} strokeWidth={1.8} className="shrink-0" aria-hidden />
      )}
    </button>
  );
}
