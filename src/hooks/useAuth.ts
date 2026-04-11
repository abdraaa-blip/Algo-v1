'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

interface MinimalUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  preferred_country: string
  preferred_language: string
  email_notifications: boolean
  push_notifications: boolean
  /** free | pro — colonnes optionnelles selon migration billing. */
  billing_plan?: string | null
  billing_current_period_end?: string | null
}

export interface UseAuthReturn {
  user: MinimalUser | null
  profile: Profile | null
  isAuthenticated: boolean
  loading: boolean
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>
}

async function getSupabaseClient() {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    return createClient()
  } catch {
    return null
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<MinimalUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let unsubscribe: (() => void) | undefined

    void (async () => {
      try {
        const supabase = await getSupabaseClient()

        if (supabase) {
          const { data: { user: currentUser } } = await supabase.auth.getUser()

          if (mounted && currentUser) {
            setUser(currentUser as MinimalUser)

            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single()

            if (mounted && profileData) {
              setProfile(profileData as Profile)
            }
          }

          if (mounted) setLoading(false)

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
              if (mounted) {
                const newUser = session?.user as MinimalUser | null ?? null
                setUser(newUser)

                if (newUser) {
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', newUser.id)
                    .single()

                  if (mounted) setProfile(profileData as Profile | null)
                } else {
                  setProfile(null)
                }
              }
            }
          )

          unsubscribe = () => subscription.unsubscribe()
        }
      } catch {
        console.warn('[useAuth] Supabase not available')
      }

      if (mounted) setLoading(false)
    })()

    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const supabase = await getSupabaseClient()
      if (supabase) {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        window.location.href = '/'
      }
    } catch (e) {
      console.error('[useAuth] Sign out error:', e)
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' }
    
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) return { error: 'Supabase not available' }
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) return { error: error.message }
      
      setProfile(data as Profile)
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Unknown error' }
    }
  }, [user])

  return useMemo(() => ({
    user,
    profile,
    isAuthenticated: !!user,
    loading,
    signOut,
    updateProfile,
  }), [user, profile, loading, signOut, updateProfile])
}
