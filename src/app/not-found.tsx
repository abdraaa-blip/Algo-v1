// CACHE_BUST: 2026-04-05T08:48 - Force Turbopack rebuild v2
import Link from 'next/link'
import { Radar } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">

        {/* Icon */}
        <div className="size-16 rounded-3xl bg-violet-500/12 border border-violet-500/20 flex items-center justify-center mx-auto">
          <Radar size={28} strokeWidth={1.4} className="text-violet-400" aria-hidden />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <p
            className="font-black text-white/8"
            style={{ fontSize: 'clamp(64px, 15vw, 96px)', letterSpacing: '-0.04em', lineHeight: 1 }}
            aria-hidden
          >
            404
          </p>
          <h1 className="text-white font-bold text-lg tracking-tight">
            Signal introuvable
          </h1>
          <p className="text-white/38 text-sm leading-relaxed">
            Ce contenu a disparu des radars ou n&apos;a jamais existe.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-400 transition-colors duration-150 shadow-[0_0_20px_rgba(123,97,255,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Retour a NOW
        </Link>
      </div>
    </div>
  )
}
