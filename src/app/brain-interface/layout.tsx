import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Brain Interface",
  description:
    "Visualisation immersive optionnelle ALGO : wireframe léger et sondes réelles, liée au Control Center.",
  path: "/brain-interface",
  keywords: ["ALGO", "brain", "visualisation", "immersion"],
  noindex: true,
});

export default function BrainInterfaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
