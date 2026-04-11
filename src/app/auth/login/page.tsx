'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-[var(--color-text-primary)]">
      <div className="w-full max-w-md">
        {/* ALGO Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black tracking-tighter">
              <span className="text-white">AL</span>
              <span className="text-[var(--color-violet)]">GO</span>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">Veille tendances</p>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-[var(--shadow-algo-sm)]">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Connexion</h2>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Connecte-toi pour accéder à ton compte
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--color-text-secondary)]">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-violet)] focus:ring-[var(--color-violet-muted)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--color-text-secondary)]">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-violet)] focus:ring-[var(--color-violet-muted)] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
              loading={isLoading}
              icon={LogIn}
            >
              {isLoading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--color-text-secondary)] text-sm">
              Pas encore de compte ?{' '}
              <Link href="/auth/sign-up" className="text-[var(--color-violet)] hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] text-sm">
            ← Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
