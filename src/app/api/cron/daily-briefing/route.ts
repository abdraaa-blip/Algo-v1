import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateDailyBriefing } from "@/lib/ai/algo-brain";
import { getAutonomyCounters } from "@/lib/autonomy/telemetry";
import {
  getSupabaseSecretApiKey,
  getSupabaseUrl,
} from "@/lib/supabase/env-keys";

/**
 * Daily AI Briefing Generator
 * Runs every day at 8am via Vercel Cron
 *
 * Generates personalized daily briefings for all users
 */

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseSecretApiKey();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et clé secrète (SERVICE_ROLE ou SUPABASE_SECRET_KEY) requis",
    );
  }
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  console.log("[ALGO Cron] Starting daily briefing generation...");

  try {
    const supabase = getSupabaseClient();
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    // Fetch today's top content
    const [trendsRes, newsRes, videosRes] = await Promise.all([
      fetch(`${baseUrl}/api/live-trends?limit=20`, { next: { revalidate: 0 } }),
      fetch(`${baseUrl}/api/live-news?limit=20`, { next: { revalidate: 0 } }),
      fetch(`${baseUrl}/api/live-videos?limit=20`, { next: { revalidate: 0 } }),
    ]);

    const [trendsData, newsData, videosData] = await Promise.all([
      trendsRes.json(),
      newsRes.json(),
      videosRes.json(),
    ]);

    const topContent = [
      ...(trendsData.data || []).map(
        (t: { title: string; viralScore?: number }) => ({
          title: t.title,
          category: "Tendances",
          viralScore: t.viralScore || 70,
          platform: "Google Trends",
        }),
      ),
      ...(newsData.data || []).map(
        (n: { title: string; viralScore?: number; source?: string }) => ({
          title: n.title,
          category: "Actualites",
          viralScore: n.viralScore || 60,
          platform: n.source || "News",
        }),
      ),
      ...(videosData.data || []).map(
        (v: { title: string; viralScore?: number }) => ({
          title: v.title,
          category: "Videos",
          viralScore: v.viralScore || 65,
          platform: "YouTube",
        }),
      ),
    ]
      .sort((a, b) => b.viralScore - a.viralScore)
      .slice(0, 30);
    const autonomyCounters = getAutonomyCounters();

    // Get all users with profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, categories, preferred_locale, preferred_scope");

    if (!profiles || profiles.length === 0) {
      // Generate a global briefing if no users
      const globalBriefing = await generateDailyBriefing({
        userInterests: ["tech", "entertainment", "news"],
        userCountry: "FR",
        topContent,
      });

      // Store global briefing
      await supabase.from("daily_briefings").insert({
        user_id: null,
        briefing_date: new Date().toISOString().split("T")[0],
        briefing: {
          ...globalBriefing,
          autonomy: autonomyCounters,
        },
        is_global: true,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        briefingsGenerated: 1,
        executionTimeMs: Date.now() - startTime,
        message: "Generated global briefing (no users found)",
      });
    }

    // Generate briefings for each user (batch to avoid rate limits)
    let generated = 0;
    const batchSize = 5;

    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (profile) => {
          try {
            const briefing = await generateDailyBriefing({
              userInterests: profile.categories || ["general"],
              userCountry: profile.preferred_scope || "FR",
              topContent,
            });

            await supabase.from("daily_briefings").upsert(
              {
                user_id: profile.id,
                briefing_date: new Date().toISOString().split("T")[0],
                briefing: {
                  ...briefing,
                  autonomy: autonomyCounters,
                },
                is_global: false,
                created_at: new Date().toISOString(),
              },
              { onConflict: "user_id,briefing_date" },
            );

            generated++;
          } catch (error) {
            console.error(
              `[ALGO Cron] Failed to generate briefing for user ${profile.id}:`,
              error,
            );
          }
        }),
      );

      // Small delay between batches
      if (i + batchSize < profiles.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(
      `[ALGO Cron] Daily briefings completed in ${executionTime}ms. Generated: ${generated}`,
    );

    return NextResponse.json({
      success: true,
      briefingsGenerated: generated,
      executionTimeMs: executionTime,
    });
  } catch (error) {
    console.error("[ALGO Cron] Daily briefing failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
