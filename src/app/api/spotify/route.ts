import { NextRequest, NextResponse } from "next/server";
import { parseDefaultedListLimit } from "@/lib/api/query-limit";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
} from "@/lib/api/rate-limiter";

/**
 * Spotify Web API — charts / nouveautés (route optionnelle).
 * La page **`/music`** consomme **`/api/live-music`** (Last.fm), pas cette route.
 */

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  popularity: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

// Cache for access token
let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getSpotifyToken(): Promise<string | null> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("[ALGO Spotify] Missing API credentials, using fallback data");
    return null;
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
    return accessToken;
  } catch (error) {
    console.error("[ALGO Spotify] Failed to get access token:", error);
    return null;
  }
}

// Country code to Spotify market mapping
const COUNTRY_TO_MARKET: Record<string, string> = {
  FR: "FR",
  US: "US",
  GB: "GB",
  DE: "DE",
  ES: "ES",
  IT: "IT",
  BR: "BR",
  JP: "JP",
  KR: "KR",
  AU: "AU",
  CA: "CA",
  MX: "MX",
  AR: "AR",
  IN: "IN",
  NL: "NL",
};

// Featured playlists that represent charts
const CHART_PLAYLISTS: Record<string, string> = {
  global: "37i9dQZEVXbMDoHDwVN2tF", // Global Top 50
  viral: "37i9dQZEVXbLiRSasKsNU9", // Viral 50 Global
  FR: "37i9dQZEVXbIPWwFssbupI", // Top 50 France
  US: "37i9dQZEVXbLRQDuF5jeBp", // Top 50 USA
  GB: "37i9dQZEVXbLnolsZ8PSNw", // Top 50 UK
};

async function fetchPlaylistTracks(
  token: string,
  playlistId: string,
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&fields=items(track(id,name,artists,album,popularity,preview_url,external_urls))`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 }, // 1 hour cache for charts
    },
  );

  if (!response.ok) return [];
  const data = await response.json();
  return (
    data.items
      ?.map((item: { track: SpotifyTrack }) => item.track)
      .filter(Boolean) || []
  );
}

async function fetchNewReleases(
  token: string,
  country: string,
): Promise<SpotifyTrack[]> {
  const market = COUNTRY_TO_MARKET[country] || "US";

  const response = await fetch(
    `https://api.spotify.com/v1/browse/new-releases?country=${market}&limit=20`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) return [];
  const data = await response.json();

  // New releases returns albums, we need to fetch tracks
  return (
    data.albums?.items?.map(
      (album: {
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        images: Array<{ url: string }>;
      }) => ({
        id: album.id,
        name: album.name,
        artists: album.artists,
        album: { ...album, images: album.images },
        popularity: 70, // Estimate for new releases
        external_urls: {
          spotify: `https://open.spotify.com/album/${album.id}`,
        },
      }),
    ) || []
  );
}

// Fallback trending tracks
function mapFallbackToClientPayload(limit: number) {
  const n = Math.min(limit, FALLBACK_TRACKS.length);
  return FALLBACK_TRACKS.slice(0, n).map((t, i) => ({
    id: `spotify_${t.id}`,
    rank: i + 1,
    title: t.name,
    artist: t.artist,
    popularity: t.popularity,
    viralScore: t.viralScore,
    platform: "spotify" as const,
    type: "track" as const,
    thumbnail: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=1DB954&color=fff&size=300`,
  }));
}

const FALLBACK_TRACKS = [
  {
    id: "1",
    name: "Die With A Smile",
    artist: "Lady Gaga, Bruno Mars",
    popularity: 98,
    viralScore: 95,
  },
  {
    id: "2",
    name: "APT.",
    artist: "ROSE & Bruno Mars",
    popularity: 96,
    viralScore: 92,
  },
  {
    id: "3",
    name: "Birds of a Feather",
    artist: "Billie Eilish",
    popularity: 94,
    viralScore: 88,
  },
  {
    id: "4",
    name: "Espresso",
    artist: "Sabrina Carpenter",
    popularity: 93,
    viralScore: 87,
  },
  {
    id: "5",
    name: "Good Luck, Babe!",
    artist: "Chappell Roan",
    popularity: 91,
    viralScore: 85,
  },
  {
    id: "6",
    name: "A Bar Song (Tipsy)",
    artist: "Shaboozey",
    popularity: 90,
    viralScore: 84,
  },
  {
    id: "7",
    name: "Taste",
    artist: "Sabrina Carpenter",
    popularity: 89,
    viralScore: 82,
  },
  {
    id: "8",
    name: "I Can Do It With a Broken Heart",
    artist: "Taylor Swift",
    popularity: 88,
    viralScore: 80,
  },
];

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const rateLimit = checkRateLimit(identifier, { limit: 30, windowMs: 60000 });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "global";
  const type = searchParams.get("type") || "charts"; // charts, viral, new
  const limit = parseDefaultedListLimit(searchParams.get("limit"), 20, 50);

  const token = await getSpotifyToken();

  // Use fallback if no token
  if (!token) {
    const data = mapFallbackToClientPayload(limit);
    return NextResponse.json(
      {
        success: true,
        data,
        fetchedAt: new Date().toISOString(),
        source: "fallback",
        count: data.length,
        meta: {
          canonicalMusicPage: "/music",
          dataSource:
            "last.fm sur /music ; cette route = Spotify Web API si credentials.",
        },
      },
      { headers: createRateLimitHeaders(rateLimit) },
    );
  }

  try {
    let tracks: SpotifyTrack[] = [];

    if (type === "new") {
      tracks = await fetchNewReleases(token, country.toUpperCase());
    } else {
      // Get chart playlist
      const playlistId =
        type === "viral"
          ? CHART_PLAYLISTS["viral"]
          : CHART_PLAYLISTS[country.toUpperCase()] || CHART_PLAYLISTS["global"];

      tracks = await fetchPlaylistTracks(token, playlistId);
    }

    const data = tracks.slice(0, limit).map((track, i) => ({
      id: `spotify_${track.id}`,
      rank: i + 1,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album?.name,
      popularity: track.popularity,
      viralScore: Math.round(track.popularity * 0.9 + (50 - i) * 0.2), // Boost by chart position
      thumbnail: track.album?.images?.[0]?.url || null,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls?.spotify,
      platform: "spotify",
      type: "track",
    }));

    return NextResponse.json(
      {
        success: true,
        data,
        fetchedAt: new Date().toISOString(),
        source: "live",
        count: data.length,
        country: country.toUpperCase(),
        chartType: type,
        meta: { chartType: type, country: country.toUpperCase() },
      },
      { headers: createRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    console.error("[ALGO Spotify] API error:", error);
    const data = mapFallbackToClientPayload(limit);
    // HTTP 200 : le cron `/api/cron/ingest` n’accepte que `response.ok` ; on expose quand même `success: false`.
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Spotify data",
        data,
        source: "fallback",
        count: data.length,
        fetchedAt: new Date().toISOString(),
        meta: { degraded: true, sameShapeAsSuccess: true },
      },
      { status: 200, headers: createRateLimitHeaders(rateLimit) },
    );
  }
}
