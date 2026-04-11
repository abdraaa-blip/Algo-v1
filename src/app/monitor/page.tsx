import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MonitorDashboard } from "./MonitorDashboard";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Monitor système",
  description: "Tableau de bord technique ALGO (dev uniquement).",
  path: "/monitor",
  noindex: true,
});

export default function MonitorPage() {
  // Only accessible in development
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  return <MonitorDashboard />;
}
