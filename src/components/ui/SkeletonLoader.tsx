import { cn } from "@/lib/utils";

type Shape = "card" | "text" | "circle" | "rect" | "row";
type Variant = "card" | "row" | "text";

interface SkeletonLoaderProps {
  shape?: Shape;
  variant?: Variant;
  lines?: number;
  count?: number;
  className?: string;
}

function Bone({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-lg bg-white/5",
        // Use opacity pulse instead of translate to prevent CLS
        "animate-pulse",
        className,
      )}
    />
  );
}

export function SkeletonLoader({
  shape = "card",
  variant,
  lines = 3,
  count = 1,
  className,
}: SkeletonLoaderProps) {
  // Support variant as alias for shape
  const effectiveShape = variant || shape;

  // Render multiple skeletons if count > 1
  if (count > 1) {
    return (
      <div className={cn("space-y-3", className)} aria-hidden>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonLoader key={i} shape={effectiveShape} lines={lines} />
        ))}
      </div>
    );
  }

  if (effectiveShape === "card") {
    return (
      <div
        aria-hidden
        className={cn(
          "rounded-[16px] border border-white/5 overflow-hidden h-[220px]",
          className,
        )}
      >
        <Bone className="w-full h-[120px] rounded-none" />
        <div className="p-3 space-y-2">
          <Bone className="h-3.5 w-11/12 rounded-md" />
          <Bone className="h-3 w-7/12 rounded-md" />
          <div className="flex items-center gap-2 pt-1">
            <Bone className="size-9 rounded-full" />
            <Bone className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (effectiveShape === "text") {
    return (
      <div aria-hidden className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <Bone
            key={i}
            className={cn(
              "h-3 rounded-md",
              i === lines - 1 ? "w-2/3" : "w-full",
            )}
          />
        ))}
      </div>
    );
  }

  if (effectiveShape === "circle") {
    return (
      <Bone className={cn("rounded-full size-10", className)} aria-hidden />
    );
  }

  if (effectiveShape === "row") {
    return (
      <div
        aria-hidden
        className={cn(
          "flex items-center gap-3 p-4 rounded-2xl border border-white/5",
          className,
        )}
      >
        <Bone className="size-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Bone className="h-3 w-3/4 rounded-md" />
          <Bone className="h-2.5 w-1/2 rounded-md" />
        </div>
        <Bone className="h-6 w-12 rounded-full shrink-0" />
      </div>
    );
  }

  // rect · fallback
  return <Bone className={cn("h-20 rounded-xl", className)} aria-hidden />;
}
