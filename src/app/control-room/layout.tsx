import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Control room",
  description:
    "Vue perception ALGO : visualisation légère et probes réseau, sans analyse LLM supplémentaire sur le chemin critique.",
  path: "/control-room",
  keywords: ["ALGO", "control room", "visualisation", "observabilité"],
  noindex: true,
});

export default function ControlRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
