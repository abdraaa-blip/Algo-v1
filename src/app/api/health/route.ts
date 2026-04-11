import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { getAllCircuitStats } from "@/lib/resilience/circuit-breaker";
import {
  getSupabasePublicApiKey,
  getSupabaseSecretApiKey,
  getSupabaseUrl,
} from "@/lib/supabase/env-keys";

/**
 * Health Check Endpoint
 * Returns comprehensive system status for monitoring and load balancers
 *
 * Response codes:
 * - 200: All systems operational
 * - 503: One or more critical systems degraded
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`api-health:${identifier}`, {
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        status: "error",
        error: "Rate limit exceeded",
        retryAfter: rateLimit.retryAfter,
      },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const startTime = Date.now();

  const supabaseUrl = getSupabaseUrl();
  const supabasePublic = getSupabasePublicApiKey();
  const supabaseConfigured = Boolean(supabaseUrl && supabasePublic);

  const checks = {
    server: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      unit: "MB",
    },
    env: process.env.NODE_ENV,
    /** Si Supabase non configuré : true (optionnel). Si configuré : joignable via REST. */
    database: !supabaseConfigured,
    /** Aide au debug Vercel : présence des variables (pas les valeurs). */
    envPresent: {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
      supabasePublicKey: Boolean(supabasePublic),
      supabaseSecretKey: Boolean(getSupabaseSecretApiKey()),
      YOUTUBE_API_KEY: Boolean(process.env.YOUTUBE_API_KEY),
      NEWSAPI_KEY: Boolean(process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY),
      TMDB_API_KEY: Boolean(process.env.TMDB_API_KEY),
    },
    hints: {
      supabaseRestStatus: null as number | null,
      /** Si la clé publique REST échoue mais la clé secrète répond (même URL). */
      supabaseRestSecretStatus: null as number | null,
      /** null = non configuré ou sonde incomplète ; false = REST refusé avec la clé publique ; true = OK côté public. */
      supabasePublicRestOk: null as boolean | null,
      /** Court message opérateur quand seule la clé secrète valide la sonde. */
      supabaseRestNote: null as string | null,
      youtubeApiStatus: null as number | null,
    },
    externalApis: {
      newsapi: false,
      youtube: false,
      tmdb: false,
    },
    cache: true,
    circuitBreakers: getAllCircuitStats(),
  };

  // Supabase REST : GET /rest/v1/ (OpenAPI). Repli apikey seul (publishable) puis clé secrète si la publique est refusée.
  if (supabaseConfigured && supabaseUrl) {
    const drain = async (response: Response) => {
      try {
        await response.body?.cancel();
      } catch {
        /* ignore */
      }
    };

    const restGet = async (key: string, withBearer: boolean) => {
      const headers: Record<string, string> = { apikey: key };
      if (withBearer) headers.Authorization = `Bearer ${key}`;
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(8000),
      });
      const status = response.status;
      const ok = response.ok;
      await drain(response);
      return { ok, status };
    };

    try {
      const publicKey = supabasePublic || "";
      let { ok, status } = await restGet(publicKey, true);
      checks.hints.supabaseRestStatus = status;

      if (!ok && publicKey.startsWith("sb_publishable_")) {
        const second = await restGet(publicKey, false);
        if (second.ok) {
          ok = true;
          status = second.status;
          checks.hints.supabaseRestStatus = status;
        }
      }

      const publicRestOk = ok;
      let usedSecretFallback = false;

      if (!ok) {
        const secret = getSupabaseSecretApiKey();
        if (secret) {
          const sec = await restGet(secret, true);
          checks.hints.supabaseRestSecretStatus = sec.status;
          if (sec.ok) {
            ok = true;
            usedSecretFallback = true;
          }
        }
      }

      checks.database = ok;
      checks.hints.supabasePublicRestOk = publicRestOk;

      if (supabaseConfigured && !publicRestOk && ok && usedSecretFallback) {
        checks.hints.supabaseRestNote =
          "REST refusé avec la clé publique — le navigateur peut échouer. Vérifie anon ou publishable sur le même projet que l’URL (Supabase → Settings → API).";
      }
    } catch {
      checks.database = false;
    }
  }

  const newsKey = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY;
  const ytKey = process.env.YOUTUBE_API_KEY;

  // NewsAPI + YouTube (test réel si clé présente) + TMDB
  const [newsResult, youtubeResult, tmdbResult] = await Promise.allSettled([
    newsKey
      ? fetch(
          "https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=" +
            newsKey,
          { signal: AbortSignal.timeout(5000) },
        ).then((r) => ({ ok: r.ok, status: r.status }))
      : Promise.resolve({ ok: false, status: 0 }),
    ytKey
      ? fetch(
          "https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&regionCode=US&maxResults=1&key=" +
            ytKey,
          { signal: AbortSignal.timeout(8000) },
        ).then((r) => ({ ok: r.ok, status: r.status }))
      : Promise.resolve({ ok: false, status: 0 }),
    process.env.TMDB_API_KEY
      ? fetch(
          "https://api.themoviedb.org/3/configuration?api_key=" +
            process.env.TMDB_API_KEY,
          { signal: AbortSignal.timeout(5000) },
        ).then((r) => r.ok)
      : Promise.resolve(false),
  ]);

  if (newsResult.status === "fulfilled") {
    checks.externalApis.newsapi = newsResult.value.ok;
  }
  if (youtubeResult.status === "fulfilled") {
    checks.externalApis.youtube = youtubeResult.value.ok;
    checks.hints.youtubeApiStatus =
      youtubeResult.value.status > 0 ? youtubeResult.value.status : null;
  }
  if (tmdbResult.status === "fulfilled") {
    checks.externalApis.tmdb = tmdbResult.value;
  }

  const responseTime = Date.now() - startTime;

  // Determine overall health status
  const criticalChecks = [checks.server, checks.database];
  const isHealthy = criticalChecks.every(Boolean);
  const apiHealthy = Object.values(checks.externalApis).some(Boolean);

  /** Clé publique incohérente alors que la base répond encore (souvent via clé secrète côté serveur). */
  const supabasePublicKeyMismatch =
    Boolean(supabaseConfigured) &&
    checks.hints.supabasePublicRestOk === false &&
    checks.database;

  let status: "healthy" | "degraded" | "unhealthy";
  if (isHealthy && apiHealthy && !supabasePublicKeyMismatch) {
    status = "healthy";
  } else if (isHealthy) {
    status = "degraded";
  } else {
    status = "unhealthy";
  }

  return NextResponse.json(
    {
      status,
      checks,
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || "2.0.0",
      buildTime: process.env.BUILD_TIME || "unknown",
    },
    {
      status: status === "unhealthy" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Response-Time": `${responseTime}ms`,
      },
    },
  );
}

/**
 * HEAD request for simple liveness check
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "X-Health": "ok",
    },
  });
}
