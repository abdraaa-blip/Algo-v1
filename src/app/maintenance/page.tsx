import { Wrench, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Maintenance Page
 * Shown when the app is undergoing scheduled maintenance
 */
export default function MaintenancePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-[var(--color-bg-primary)]">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Wrench size={40} className="text-amber-400 animate-pulse" />
          </div>
          {/* Orbiting clock */}
          <div className="absolute top-0 right-1/4 w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center animate-bounce">
            <Clock size={14} className="text-violet-400" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-white">
            Maintenance en cours
          </h1>
          <p className="text-white/50 leading-relaxed">
            ALGO est actuellement en maintenance pour vous offrir une experience
            encore meilleure. Nous serons de retour tres bientot.
          </p>
        </div>

        {/* Estimated time */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <Clock size={16} className="text-white/40" />
          <span className="text-sm text-white/60">
            Temps estime: <strong className="text-white">~30 minutes</strong>
          </span>
        </div>

        {/* Status updates */}
        <div className="space-y-2 text-left p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">
            Statut
          </p>
          <div className="space-y-1.5">
            <StatusItem status="done" label="Sauvegarde des données" />
            <StatusItem status="progress" label="Mise à jour des serveurs" />
            <StatusItem status="pending" label="Tests de performance" />
            <StatusItem status="pending" label="Remise en ligne" />
          </div>
        </div>

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour a l&apos;accueil
        </Link>
      </div>
    </main>
  );
}

function StatusItem({
  status,
  label,
}: {
  status: "done" | "progress" | "pending";
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          status === "done"
            ? "bg-emerald-400"
            : status === "progress"
              ? "bg-amber-400 animate-pulse"
              : "bg-white/20"
        }`}
      />
      <span
        className={`text-sm ${
          status === "done"
            ? "text-white/60 line-through"
            : status === "progress"
              ? "text-white/80"
              : "text-white/40"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
