'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type AuthResult = {
  error?: string
  success?: boolean
}

async function getSupabaseClient() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    return await createClient()
  } catch {
    return null
  }
}

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await getSupabaseClient()
  
  if (!supabase) {
    return { error: 'Service indisponible' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email et mot de passe requis' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await getSupabaseClient()
  
  if (!supabase) {
    return { error: 'Service indisponible' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string
  const profileType = formData.get('profileType') as string
  const preferredScope = formData.get('preferredScope') as string

  if (!email || !password) {
    return { error: 'Email et mot de passe requis' }
  }

  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caracteres' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`,
      data: {
        display_name: displayName || email.split('@')[0],
        profile_type: profileType || 'consumer',
        preferred_scope: preferredScope || 'global',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function logout(): Promise<void> {
  const supabase = await getSupabaseClient()
  
  if (supabase) {
    await supabase.auth.signOut()
  }
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getUser() {
  const supabase = await getSupabaseClient()
  
  if (!supabase) {
    return null
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile() {
  const supabase = await getSupabaseClient()
  
  if (!supabase) {
    return null
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
