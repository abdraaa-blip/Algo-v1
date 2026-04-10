import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicApiKey, getSupabaseUrl } from '@/lib/supabase/env-keys'

export async function createClient() {
  const cookieStore = await cookies()
  const url = getSupabaseUrl()
  const key = getSupabasePublicApiKey()
  if (!url || !key) {
    throw new Error(
      'Supabase server client: NEXT_PUBLIC_SUPABASE_URL + clé publique (ANON ou PUBLISHABLE) requis.'
    )
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
