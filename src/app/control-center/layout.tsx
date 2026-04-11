import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Control Center",
  description:
    "Tableau de bord opérationnel ALGO : sondes santé, modules, build, audits manuels — données minimales utiles.",
  path: "/control-center",
  keywords: ["ALGO", "control center", "santé", "déploiement"],
  noindex: true,
});

export default function ControlCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
