import type { Metadata } from 'next'
import { SignupClientShell } from './SignupClientShell'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Inscription',
  description: 'Crée un compte ALGO pour sauvegarder favoris, watchlist et préférences.',
  path: '/signup',
  noindex: true,
})

export default function SignupPage() {
  const labels = {
    title: 'Inscription',
    email: 'Email',
    password: 'Mot de passe',
    submit: 'Créer un compte',
    google: 'Continuer avec Google',
    hasAccount: 'Deja un compte ?',
    login: 'Se connecter',
    or: 'ou',
  }

  return <SignupClientShell labels={labels} />
}
