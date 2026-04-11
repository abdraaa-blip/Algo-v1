import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Hors ligne",
  description: "Tu es hors connexion. Reviens en ligne pour synchroniser ALGO.",
  path: "/offline",
  noindex: true,
});

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <WifiOff
          className="w-10 h-10"
          style={{ color: "rgba(240,240,248,0.35)" }}
        />
      </div>
      <h1
        className="text-xl font-bold mb-2"
        style={{ color: "#f0f0f8", letterSpacing: "-0.02em" }}
      >
        Connexion perdue
      </h1>
      <p
        style={{ color: "rgba(240,240,248,0.45)", fontSize: 14, maxWidth: 280 }}
      >
        Le radar a besoin d&apos;une connexion pour scanner les signaux.
        Reconnecte-toi pour voir ce qui explose.
      </p>
    </div>
  );
}
