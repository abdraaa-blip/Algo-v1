import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Observabilité ALGO",
  robots: { index: false, follow: false },
};

export default function ObservabilityLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
