"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export type AlgoExperienceView = "calm" | "dynamic" | "focus";

/**
 * Synchronise l’attribut `data-algo-view` sur <html> pour adapter l’ambiance
 * (couleurs, grain, arrière-plan) sans surcharger le CPU : logique purement CSS.
 */
function resolveView(pathname: string): AlgoExperienceView {
  const p = pathname || "/";
  if (
    /\/(legal|privacy|transparency|algorithm|onboarding)(\/|$)/.test(p) ||
    p.startsWith("/docs")
  ) {
    return "calm";
  }
  if (
    /\/(trends|viral-analyzer|creator-mode|intelligence|ai)(\/|$)/.test(p) ||
    p.includes("/live") ||
    p.startsWith("/news")
  ) {
    return "dynamic";
  }
  return "focus";
}

export function AlgoExperienceAttributes() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-algo-view",
      resolveView(pathname),
    );
  }, [pathname]);

  return null;
}
