"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
}

export function BackButton({
  fallbackHref = "/",
  label = "Retour",
  className,
}: BackButtonProps) {
  const router = useRouter();
  const { trigger } = useHaptic();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    trigger("light");

    // Try to go back, but if it fails or we're at the start, use fallback
    try {
      // Check if we came from an internal page
      const referrer = typeof document !== "undefined" ? document.referrer : "";
      const isInternalReferrer =
        referrer &&
        (referrer.includes(window.location.host) || referrer === "");

      if (isInternalReferrer && window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackHref);
      }
    } catch {
      // Fallback to direct navigation
      router.push(fallbackHref);
    }
  };

  return (
    <Link
      href={fallbackHref}
      onClick={handleBack}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl",
        "text-white/60 hover:text-white hover:bg-white/5",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
        "active:scale-95",
        className,
      )}
    >
      <ArrowLeft size={18} strokeWidth={2} aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
