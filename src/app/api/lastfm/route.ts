import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";

interface LastFMTrack {
  name?: string;
  listeners?: string;
  url?: string;
  artist?: { name?: string };
  image?: Array<{ "#text"?: string }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  FR: "France",
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  MA: "Morocco",
  SN: "Senegal",
  BE: "Belgium",
  NG: "Nigeria",
  CA: "Canada",
  BR: "Brazil",
  KR: "South Korea",
};

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`api-lastfm:${identifier}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "FR";
  const countryName = COUNTRY_NAMES[country.toUpperCase()] || "France";

  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country=${encodeURIComponent(countryName)}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=20`,
      { next: { revalidate: 7200 } },
    );

    if (!res.ok) throw new Error("LastFM error");
    const data = await res.json();
    const tracks = data?.tracks?.track || [];

    const contents = (tracks as LastFMTrack[])
      .slice(0, 10)
      .map((track, i: number) => {
        const listeners = parseInt(track.listeners || "0");
        const growthRate = Math.min(Math.floor(listeners / 10000), 400);

        return {
          id: `lastfm-${i}`,
          title: `${track.name} · ${track.artist?.name || "Artiste"}`,
          category: "Culture",
          platform: "YouTube",
          country,
          language: "fr",
          viralScore: Math.min(60 + Math.floor(growthRate / 8), 99),
          badge: i < 3 ? "Viral" : i < 7 ? "Trend" : "Early",
          views: listeners,
          growthRate,
          growthTrend: "up",
          detectedAt: new Date().toISOString(),
          thumbnail: track.image?.[3]?.["#text"] || "",
          sourceUrl: track.url || "",
          explanation: `Top ${i + 1} en ${countryName} · ${listeners.toLocaleString("fr-FR")} auditeurs actifs.`,
          creatorTips:
            "Utilise ce son dans ton prochain contenu pour booster ta portée organique.",
          insight: {
            postNowProbability: i < 5 ? "high" : "medium",
            timing: "now",
            bestPlatform: ["TikTok", "Instagram"],
            bestFormat: "montage",
            timingLabel: {
              fr: "Son populaire maintenant",
              en: "Popular sound now",
            },
            postWindow: { status: "optimal" },
          },
          sourceDistribution: [
            { platform: "TikTok", percentage: 60, momentum: "high" },
            { platform: "YouTube", percentage: 40, momentum: "medium" },
          ],
          watchersCount: Math.floor(listeners / 100),
          isExploding: i < 3,
          assetPack: { soundUrl: track.url },
        };
      });

    return NextResponse.json(contents);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
