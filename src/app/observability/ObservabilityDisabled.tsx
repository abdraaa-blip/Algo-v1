import Link from "next/link";
import { Activity } from "lucide-react";
import { ALGO_UI_OBSERVABILITY_DISABLED } from "@/lib/copy/ui-strings";

export function ObservabilityDisabled() {
  const t = ALGO_UI_OBSERVABILITY_DISABLED;
  return (
    <main className="min-h-0 w-full text-[var(--color-text-primary)] px-4 py-12 sm:py-16">
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <Activity
            className="text-[var(--color-text-tertiary)]"
            size={26}
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {t.body}
          </p>
        </div>
        <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed text-left sm:text-center">
          {t.operatorNote}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Link
            href="/status"
            className="inline-flex items-center justify-center rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400 transition-colors duration-200"
          >
            {t.ctaStatus}
          </Link>
          <Link
            href="/control-room"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)] transition-colors duration-200"
          >
            {t.ctaControlRoom}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
          >
            {t.ctaHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
