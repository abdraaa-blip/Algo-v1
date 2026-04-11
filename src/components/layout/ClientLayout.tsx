"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ScopeProvider } from "@/contexts/ScopeContext";
import { LoadingProgressBar } from "@/components/ui/LoadingProgressBar";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { PageTransition } from "@/components/ui/PageTransition";
import { GeolocationPrompt } from "@/components/algo/GeolocationPrompt";
import { initMonitoring } from "@/lib/monitoring";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { AchievementToastManager } from "@/components/gamification/AchievementUnlock";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AlgoExperienceAttributes } from "@/components/experience/AlgoExperienceAttributes";

const AlgoLivingBackground = dynamic(
  () =>
    import("@/components/ui/AlgoLivingBackground").then(
      (m) => m.AlgoLivingBackground,
    ),
  { ssr: false },
);
const AlgoDataPlanet = dynamic(
  () => import("@/components/ui/AlgoDataPlanet").then((m) => m.AlgoDataPlanet),
  { ssr: false },
);

/**
 * Client-side layout wrapper that renders only after hydration
 * This prevents hydration mismatches from dynamic components
 */
export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initialize monitoring (web vitals are initialized by WebVitalsReporter)
    initMonitoring();
  }, []);

  // ScopeProvider wraps both branches so useScopeContext works during SSR/prerender;
  // chrome stays gated on mounted to limit hydration mismatch risk.
  return (
    <ScopeProvider>
      {!mounted ? (
        <>
          {/* Hauteur alignée sur Navbar (2 rangées < sm) pour éviter saut + trou noir */}
          <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,0px)] bg-[var(--color-bg-primary)]/95 border-b border-[var(--color-border)]">
            <div className="h-[var(--algo-nav-chrome-h)] min-w-0" aria-hidden />
          </header>
          <main
            id="main-content"
            className="relative z-10 w-full min-w-0 max-w-full overflow-x-clip pt-[var(--algo-nav-stack)] pb-[var(--algo-mobile-bottom-safe)] md:pb-0 min-h-dvh flex flex-col"
            role="main"
            aria-label="Contenu principal"
          >
            <div className="flex-1 min-h-0 w-full min-w-0 max-w-full overflow-x-clip">
              {children}
            </div>
            <SiteFooter />
          </main>
        </>
      ) : (
        <>
          <AlgoExperienceAttributes />
          <AlgoLivingBackground />
          <AlgoDataPlanet />
          <Suspense fallback={null}>
            <LoadingProgressBar />
          </Suspense>
          <WebVitalsReporter />
          <OfflineBanner />
          <GeolocationPrompt />
          <AchievementToastManager />
          <Navbar />
          <main
            id="main-content"
            className="relative z-10 w-full min-w-0 max-w-full overflow-x-clip pt-[var(--algo-nav-stack)] pb-[var(--algo-mobile-bottom-safe)] md:pb-0 min-h-dvh flex flex-col"
            role="main"
            aria-label="Contenu principal"
          >
            <div className="flex-1 min-h-0 w-full min-w-0 max-w-full overflow-x-clip">
              <PageTransition>{children}</PageTransition>
            </div>
            <SiteFooter />
          </main>
          <BottomNav />
        </>
      )}
    </ScopeProvider>
  );
}
