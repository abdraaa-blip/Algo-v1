'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UserPlus, Eye, EyeOff, Check } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres')
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erreur lors de l&apos;inscription')
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = password.length >= 8 ? 'Fort' : password.length >= 6 ? 'Moyen' : 'Faible'
  const passwordColor = password.length >= 8 ? 'text-green-400' : password.length >= 6 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-6 text-[var(--color-text-primary)]">
      <div className="w-full max-w-md">
        {/* ALGO Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black tracking-tighter">
              <span className="text-white">AL</span>
              <span className="text-[var(--color-violet)]">GO</span>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">Trend Intelligence</p>
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-[var(--shadow-algo-sm)]">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Creer un compte</h2>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Rejoignez ALGO pour suivre les tendances
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[var(--color-text-secondary)]">Nom d&apos;affichage</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Votre pseudo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-violet)] focus:ring-[var(--color-violet-muted)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--color-text-secondary)]">Email</Label>
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
              {password && (
                <p className={`text-xs ${passwordColor}`}>
                  Force du mot de passe: {passwordStrength}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[var(--color-text-secondary)]">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-violet)] focus:ring-[var(--color-violet-muted)] pr-10"
                />
                {confirmPassword && password === confirmPassword && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" size={18} />
                )}
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
              icon={UserPlus}
            >
              {isLoading ? 'Creation du compte...' : 'Creer mon compte'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--color-text-secondary)] text-sm">
              Deja un compte ?{' '}
              <Link href="/auth/login" className="text-[var(--color-violet)] hover:underline">
                Se connecter
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
