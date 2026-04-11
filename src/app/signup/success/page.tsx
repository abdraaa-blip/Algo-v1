import { Mail } from "lucide-react";
import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(0,209,255,0.12)] border border-[rgba(0,209,255,0.22)] flex items-center justify-center">
          <Mail className="text-[#00D1FF]" size={28} strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-white font-black text-2xl tracking-tight">
            Verifie ton email
          </h1>
          <p className="text-white/45 text-sm leading-relaxed">
            Un lien de confirmation a ete envoye a ton adresse email. Clique
            dessus pour activer ton compte ALGO.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <p className="text-white/28 text-xs">
            Tu n&apos;as pas recu l&apos;email ?
          </p>
          <Link
            href="/login"
            className="inline-block text-violet-400 hover:text-violet-300 font-semibold text-sm transition-colors"
          >
            Retour a la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
