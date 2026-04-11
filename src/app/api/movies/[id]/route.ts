import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { fetchMovieDetails, fetchTVDetails } from "@/lib/api/tmdb-service";

export const dynamic = "force-dynamic";

// Content ideas generator based on movie/show data
function generateContentIdeas(
  title: string,
  genres: string[],
  rating: number,
  type: "movie" | "series",
): string[] {
  const ideas: string[] = [];

  // Universal ideas
  ideas.push(`Mon avis HONNETE sur "${title}" (sans spoiler)`);
  ideas.push(`Pourquoi tout le monde parle de "${title}"`);

  // Genre-specific ideas
  if (genres.includes("Horror") || genres.includes("Thriller")) {
    ideas.push(`Les scenes les plus FLIPPANTES de "${title}"`);
    ideas.push(`J'ai regarde "${title}" seul(e) la nuit...`);
  }
  if (genres.includes("Action") || genres.includes("Adventure")) {
    ideas.push(`Le top des meilleures scenes d'action de "${title}"`);
  }
  if (genres.includes("Comedy")) {
    ideas.push(`Les moments les plus droles de "${title}"`);
  }
  if (genres.includes("Drama")) {
    ideas.push(`Ce que "${title}" dit sur notre societe`);
    ideas.push(`La scene qui m'a fait pleurer dans "${title}"`);
  }
  if (genres.includes("Romance")) {
    ideas.push(`Le couple de "${title}" : red flags ou goals?`);
  }
  if (genres.includes("Sci-Fi") || genres.includes("Fantasy")) {
    ideas.push(`Les theories de fans sur "${title}" qui changent TOUT`);
  }

  // Rating-based ideas
  if (rating >= 8) {
    ideas.push(`Pourquoi "${title}" merite un Oscar`);
  } else if (rating < 6) {
    ideas.push(`"${title}" : chef-d'oeuvre incompris ou navet?`);
  }

  // Type-specific
  if (type === "series") {
    ideas.push(`Faut-il regarder "${title}" jusqu'au bout?`);
    ideas.push(`"${title}" saison par saison : ca vaut le coup?`);
  }

  return ideas.slice(0, 6); // Return max 6 ideas
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`api-movies-id:${identifier}`, {
    limit: 90,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing movie ID" },
      { status: 400 },
    );
  }

  try {
    // Parse ID format: tmdb_movie_123 or tmdb_tv_123
    const parts = id.split("_");
    const type = parts[1]; // 'movie' or 'tv'
    const tmdbId = parseInt(parts[2] || parts[1], 10);

    if (isNaN(tmdbId)) {
      return NextResponse.json(
        { success: false, error: "Invalid movie ID format" },
        { status: 400 },
      );
    }

    let details = null;
    let contentIdeas: string[] = [];

    if (type === "tv") {
      const tvDetails = await fetchTVDetails(tmdbId);
      if (tvDetails) {
        contentIdeas = generateContentIdeas(
          tvDetails.title,
          tvDetails.genres,
          tvDetails.rating,
          "series",
        );
        details = {
          ...tvDetails,
          type: "series" as const,
          contentIdeas,
        };
      }
    } else {
      const movieDetails = await fetchMovieDetails(tmdbId);
      if (movieDetails) {
        contentIdeas = generateContentIdeas(
          movieDetails.title,
          movieDetails.genres,
          movieDetails.rating,
          "movie",
        );
        details = {
          ...movieDetails,
          type: "movie" as const,
          contentIdeas,
        };
      }
    }

    if (!details) {
      return NextResponse.json(
        {
          success: false,
          error: "Movie not found",
          fallback: true,
          message: "Contenu indisponible pour le moment. Veuillez reessayer.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: details,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ALGO API] Movie details fetch failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch movie details",
        fallback: true,
        message: "Contenu indisponible pour le moment. Veuillez reessayer.",
      },
      { status: 500 },
    );
  }
}
