'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SignupLabels {
  title:      string
  email:      string
  password:   string
  submit:     string
  google:     string
  hasAccount: string
  login:      string
  or:         string
}

// Dynamic Supabase import to avoid build errors when package is not installed
async function getSupabaseClient() {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    return createClient()
  } catch {
    return null
  }
}

export function SignupClientShell({ labels }: { labels: SignupLabels }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Email et mot de passe requis')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    startTransition(async () => {
      const supabase = await getSupabaseClient()
      
      if (!supabase) {
        setError('Service indisponible')
        return
      }
      
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: email.split('@')[0],
            profile_type: 'consumer',
            preferred_scope: 'global',
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // Redirect to success page
      router.push('/signup/success')
    })
  }

  async function handleGoogleSignup() {
    const supabase = await getSupabaseClient()
    
    if (!supabase) {
      setError('Service indisponible')
      return
    }
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold text-white/22 tracking-[0.20em] uppercase">ALGO</p>
          <h1 className="text-white font-black text-2xl tracking-tight">{labels.title}</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <AuthField 
            id="email" 
            label={labels.email} 
            type="email" 
            autoComplete="email" 
            placeholder="toi@example.com" 
            disabled={isPending} 
          />
          <AuthField 
            id="password" 
            label={labels.password} 
            type="password" 
            autoComplete="new-password" 
            placeholder="********" 
            disabled={isPending} 
          />

          <button 
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-violet-500 text-white font-bold text-sm hover:bg-violet-400 transition-colors duration-150 shadow-[0_0_20px_rgba(123,97,255,0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {labels.submit}
          </button>
        </form>

        {/* Separateur */}
        <div className="flex items-center gap-3" aria-hidden>
          <div className="flex-1 h-px bg-white/7" />
          <span className="text-white/22 text-xs">{labels.or}</span>
          <div className="flex-1 h-px bg-white/7" />
        </div>

        {/* Google */}
        <button 
          type="button"
          onClick={handleGoogleSignup}
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/62 font-bold text-sm hover:bg-white/10 hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {labels.google}
        </button>

        {/* Lien connexion */}
        <p className="text-center text-xs text-white/28">
          {labels.hasAccount}{' '}
          <Link 
            href="/login" 
            className="text-violet-400 hover:text-violet-300 font-semibold transition-colors focus-visible:outline-none focus-visible:underline"
          >
            {labels.login}
          </Link>
        </p>
      </div>
    </div>
  )
}

function AuthField({
  id, label, type, autoComplete, placeholder, disabled,
}: {
  id:           string
  label:        string
  type:         string
  autoComplete: string
  placeholder:  string
  disabled?:    boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-white/45">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 rounded-xl text-sm',
          'bg-white/5 border border-white/10',
          'text-white/78 placeholder:text-white/20',
          'outline-none transition-all duration-150',
          'focus:border-[rgba(123,97,255,0.50)] focus:bg-white/7',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      />
    </div>
  )
}
