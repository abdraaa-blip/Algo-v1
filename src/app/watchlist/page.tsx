"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, ArrowLeft, Trash2 } from "lucide-react";
import { LiveCurve } from "@/components/algo/LiveCurve";
import { ViralScoreRing } from "@/components/algo/ViralScoreRing";
import { MomentumPill } from "@/components/algo/MomentumPill";
import { Badge } from "@/components/algo/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useWatchlist } from "@/hooks/useWatchlist";

export default function WatchlistPage() {
  const router = useRouter();
  const { trends, unfollow, isLoaded } = useWatchlist();

  return (
    <main className="min-h-screen pb-20 text-[var(--color-text-primary)]">
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <LiveCurve rate={80} color="violet" opacity={0.08} />
        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs mb-4 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>
          <h1 className="text-2xl md:text-3xl font-black mb-2 text-[var(--color-text-primary)]">
            Ma Watchlist
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Les tendances que tu surveilles
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-6">
        {!isLoaded && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} shape="card" />
            ))}
          </div>
        )}

        {isLoaded && trends.length === 0 && (
          <EmptyState
            icon={Bookmark}
            title="Aucune tendance suivie"
            subtitle="Commence par explorer les tendances et ajouter celles qui t'interessent."
            cta={{
              label: "Explorer les tendances",
              onClick: () => router.push("/trends"),
            }}
          />
        )}

        {isLoaded && trends.length > 0 && (
          <div className="space-y-3">
            {trends.map((trend, i) => (
              <article
                key={trend.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all algo-s${Math.min(i + 1, 6)}`}
                style={{
                  background: trend.isExploding
                    ? "rgba(255,77,109,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: trend.isExploding
                    ? "1px solid rgba(255,77,109,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <ViralScoreRing score={trend.score} size={48} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link
                      href={`/content/${trend.id}`}
                      className="text-sm font-semibold hover:underline truncate"
                      style={{ color: "rgba(240,240,248,0.85)" }}
                    >
                      {trend.name}
                    </Link>
                    {trend.score >= 88 ? (
                      <Badge type="Viral" label="Fort" />
                    ) : null}
                    {trend.isExploding ? (
                      <Badge type="Breaking" label="Explosion" />
                    ) : null}
                  </div>
                  <div
                    className="flex items-center gap-3 text-[10px]"
                    style={{ color: "rgba(240,240,248,0.4)" }}
                  >
                    <span>{trend.platform || "Multi"}</span>
                    <span style={{ color: "rgba(240,240,248,0.2)" }}>|</span>
                    <span>{trend.category || "General"}</span>
                  </div>
                </div>

                {trend.growthRate && (
                  <MomentumPill
                    value={trend.growthRate}
                    trend={trend.growthTrend || "stable"}
                  />
                )}

                <button
                  onClick={() => unfollow(trend.id)}
                  aria-label={`Retirer ${trend.name} de la watchlist`}
                  className="p-2 rounded-lg text-xs font-bold transition-all hover:bg-[rgba(255,77,109,0.2)]"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(240,240,248,0.5)",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}

            <Link
              href="/trends"
              className="inline-flex items-center gap-1.5 text-xs font-semibold mt-4 transition-colors hover:opacity-80"
              style={{ color: "rgba(240,240,248,0.3)" }}
            >
              Decouvrir plus de tendances
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
