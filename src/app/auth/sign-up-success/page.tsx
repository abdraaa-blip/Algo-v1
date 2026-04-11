"use client";

import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SignUpSuccessPage() {
  return (
    <div className="algo-min-h-viewport-content flex items-center justify-center p-6 text-[var(--color-text-primary)]">
      <div className="w-full max-w-md text-center">
        {/* ALGO Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black tracking-tighter">
              <span className="text-white">AL</span>
              <span className="text-[var(--color-violet)]">GO</span>
            </h1>
          </Link>
        </div>

        {/* Success Card */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-[var(--shadow-algo-sm)]">
          <div className="w-16 h-16 bg-[var(--color-violet-muted)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[var(--color-violet)]" />
          </div>

          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Verifiez votre email
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Un email de confirmation a ete envoye a votre adresse. Cliquez sur
            le lien pour activer votre compte.
          </p>

          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg p-4 mb-6">
            <p className="text-[var(--color-text-secondary)] text-sm">
              Vous n&apos;avez pas recu l&apos;email ? Verifiez votre dossier
              spam ou attendez quelques minutes.
            </p>
          </div>

          <Link href="/auth/login">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={ArrowRight}
              iconPosition="end"
            >
              Aller a la connexion
            </Button>
          </Link>
        </div>

        {/* Back to home */}
        <div className="mt-6">
          <Link
            href="/"
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] text-sm"
          >
            ← Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
