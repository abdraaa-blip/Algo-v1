"use client";

import { LiveCurve as LiveCurveUi } from "@/components/ui/LiveCurve";

interface LiveCurveProps {
  rate?: number;
  color?: "violet" | "blue" | "green";
  opacity?: number;
}

/**
 * Arrière-plan courbe discret : réutilise `ui/LiveCurve` sans étoiles ni trace ECG
 * (proche de l’ancien rendu une seule sinusoïde). Imports `@/components/algo/LiveCurve` inchangés.
 */
export function LiveCurve({
  rate = 60,
  color = "violet",
  opacity = 0.08,
}: LiveCurveProps) {
  return (
    <LiveCurveUi
      growthRate={rate}
      color={color}
      opacity={opacity / 1.5}
      position="background"
      showShootingStars={false}
      showECGLine={false}
    />
  );
}
