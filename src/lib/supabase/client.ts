"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabasePublicApiKey,
  getSupabaseUrl,
} from "@/lib/supabase/env-keys";

export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublicApiKey();
  if (!url || !key) {
    throw new Error(
      "Supabase client: définis NEXT_PUBLIC_SUPABASE_URL et une clé publique (NEXT_PUBLIC_SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }
  return createBrowserClient(url, key);
}
