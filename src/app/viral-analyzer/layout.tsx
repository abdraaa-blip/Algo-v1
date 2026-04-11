import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Analyseur viral",
  description:
    "Score viral, hooks et timing : analyse un lien ou un texte pour optimiser portée et engagement sur les réseaux.",
  path: "/viral-analyzer",
  keywords: ["viral", "analyse", "hooks", "tiktok", "youtube", "ALGO"],
});

export default function ViralAnalyzerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
