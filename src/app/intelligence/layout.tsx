import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Radar intelligence",
  description:
    "Veille multi-sources, anomalies et opportunités en temps réel. ALGO lit le signal culturel et algorithmique pour une longueur d’avance.",
  path: "/intelligence",
  keywords: ["intelligence", "veille", "tendances", "signaux", "ALGO", "radar"],
});

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
