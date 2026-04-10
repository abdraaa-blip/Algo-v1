import Link from 'next/link'
import { ALGO_UI_ERROR } from '@/lib/copy/ui-strings'

export default function AuthErrorPage() {
  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/22 flex items-center justify-center">
          <span className="text-3xl">!</span>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-white font-black text-2xl tracking-tight">
            Erreur d&apos;authentification
          </h1>
          <p className="text-white/45 text-sm">{ALGO_UI_ERROR.message}</p>
        </div>

        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl bg-violet-500 text-white font-bold text-sm hover:bg-violet-400 transition-colors"
        >
          Retour a la connexion
        </Link>
      </div>
    </div>
  )
}
