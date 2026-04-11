import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseSecretApiKey,
  getSupabaseUrl,
} from "@/lib/supabase/env-keys";

/**
 * Client Supabase **service role** · réservé aux routes serveur (jamais exposé au navigateur).
 * Requis pour tables avec RLS « deny by default » (snapshots écosystème).
 * Accepte `SUPABASE_SERVICE_ROLE_KEY` (JWT) ou `SUPABASE_SECRET_KEY` (sb_secret_…).
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseSecretApiKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseServiceRoleConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseSecretApiKey());
}
