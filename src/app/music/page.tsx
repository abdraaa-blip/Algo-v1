import type { Metadata } from "next";
import { Suspense } from "react";
import { MusicClientShell } from "./MusicClientShell";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Classements musique",
  description:
    "Classements et tendances musicales (Last.fm) · découverte et momentum des titres qui montent.",
  path: "/music",
  keywords: ["musique", "charts", "last.fm", "tendances", "ALGO"],
});

export default function MusicPage() {
  return (
    <Suspense fallback={<MusicSkeleton />}>
      <MusicClientShell />
    </Suspense>
  );
}

function MusicSkeleton() {
  return (
    <div className="min-h-0 w-full p-4 space-y-6">
      <div className="h-10 w-48 bg-[var(--color-card)] rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-[var(--color-card)] rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
