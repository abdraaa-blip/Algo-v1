import { NextRequest, NextResponse } from "next/server";
import { parseOptionalListLimit } from "@/lib/api/query-limit";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`api-live-series:${identifier}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded",
        retryAfter: rateLimit.retryAfter,
      },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const listLimit = parseOptionalListLimit(
    new URL(request.url).searchParams.get("limit"),
  );

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/tv/day?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`,
      { next: { revalidate: 300 } },
    );
    const data = await res.json();
    const raw = Array.isArray(data.results) ? data.results : [];
    const dataOut = listLimit !== undefined ? raw.slice(0, listLimit) : raw;
    return NextResponse.json({
      success: true,
      data: dataOut,
      count: dataOut.length,
      meta: {
        revalidateSeconds: 300,
        appliedLimit: listLimit ?? null,
      },
    });
  } catch (error) {
    console.error("[API] live-series error:", error);
    return NextResponse.json(
      { success: false, data: [], error: "Failed to fetch series" },
      { status: 500 },
    );
  }
}
