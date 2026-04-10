/**
 * Résolution des clés Supabase : JWT legacy (anon / service_role) ou clés plateforme (sb_publishable / sb_secret).
 * @see https://supabase.com/docs/guides/api/api-keys
 */

export function getSupabaseUrl(): string | undefined {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  return u || undefined
}

/** Clé publique (navigateur, RLS anon) : `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. */
export function getSupabasePublicApiKey(): string | undefined {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (anon) return anon
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || undefined
}

/** Clé secrète serveur (bypass RLS) : `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEY` (sb_secret_…). */
export function getSupabaseSecretApiKey(): string | undefined {
  const role = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (role) return role
  return process.env.SUPABASE_SECRET_KEY?.trim() || undefined
}
