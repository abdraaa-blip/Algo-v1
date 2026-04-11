"use client";

/**
 * ALGO Algorithm Transparency Page
 * Shows exactly how the viral score is calculated
 */

import Link from "next/link";
import { motion } from "framer-motion";

import {
  Activity,
  TrendingUp,
  Share2,
  Search,
  MessageCircle,
  Clock,
  BarChart3,
  Zap,
  Brain,
  Target,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveCurve } from "@/components/ui/LiveCurve";
import { SCORE_THRESHOLDS, getAlgorithmDetails } from "@/lib/algo/viral-score";

const algorithmDetails = getAlgorithmDetails();

const signalIcons = {
  "View Velocity": Activity,
  "Engagement Rate": TrendingUp,
  "Cross-Platform Spread": Share2,
  "Search Interest": Search,
  "Comment Sentiment": MessageCircle,
  "Recency Bonus": Clock,
};

export default function AlgorithmPage() {
  return (
    <div className="min-h-0 w-full text-[var(--color-text-primary)]">
      {/* Background */}
      <LiveCurve growthRate={10} className="fixed inset-0 opacity-40" />

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-16 space-y-16">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
            <Shield size={14} />
            <span>Transparence Algorithmique</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Comment ALGO calcule le{" "}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Score Viral
            </span>
          </h1>

          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Nous documentons la logique du score « radar » présentée sur cette
            page. D’autres écrans (analyseur viral, intelligence) peuvent
            utiliser des pondérations différentes · voir{" "}
            <Link
              href="/transparency"
              className="text-cyan-400/90 hover:underline"
            >
              transparence
            </Link>
            . Rien ici ne garantit une audience ou une viralité réelle : ce sont
            des indicateurs.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/40">
            <span>Version {algorithmDetails.version}</span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
            <span>Mis a jour le {algorithmDetails.lastUpdated}</span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
            <Link
              href="/intelligence#algo-core"
              className="text-violet-400/90 hover:underline"
            >
              Couche Core Intelligence
            </Link>
          </div>
        </motion.header>

        {/* Signal Weights */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-violet-400" size={24} />
            Les 6 Signaux du Score Viral
          </h2>

          <div className="grid gap-4">
            {algorithmDetails.signals.map((signal, index) => {
              const Icon =
                signalIcons[signal.name as keyof typeof signalIcons] ||
                Activity;
              const weightPercent = parseInt(signal.weight) || 0;

              return (
                <motion.div
                  key={signal.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-violet-500/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400">
                      <Icon size={20} />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">
                          {signal.name}
                        </h3>
                        <span className="text-lg font-black text-violet-400">
                          {signal.weight}
                        </span>
                      </div>

                      <p className="text-sm text-white/50 leading-relaxed">
                        {signal.description}
                      </p>

                      {/* Weight bar */}
                      <div className="h-2 rounded-full bg-[var(--color-card)] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${weightPercent}%` }}
                          transition={{
                            delay: 0.5 + index * 0.1,
                            duration: 0.8,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Score Thresholds */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="text-orange-400" size={24} />
            Seuils de Score
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                name: "Signal Precoce",
                score: SCORE_THRESHOLDS.earlySignal,
                color: "cyan",
                emoji: "🌱",
              },
              {
                name: "Trending",
                score: SCORE_THRESHOLDS.trending,
                color: "green",
                emoji: "📈",
              },
              {
                name: "Viral",
                score: SCORE_THRESHOLDS.viral,
                color: "orange",
                emoji: "🔥",
              },
              {
                name: "Explosif",
                score: SCORE_THRESHOLDS.explosive,
                color: "red",
                emoji: "💥",
              },
            ].map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl text-center space-y-2",
                  "bg-[var(--color-card)] border border-[var(--color-border)]",
                  `hover:border-${tier.color}-500/30 transition-colors`,
                )}
              >
                <div className="text-3xl">{tier.emoji}</div>
                <div className="text-2xl font-black">{tier.score}+</div>
                <div className="text-sm text-white/50">{tier.name}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Formula */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="text-pink-400" size={24} />
            La Formule
          </h2>

          <div className="p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] font-mono text-sm overflow-x-auto">
            <pre className="text-white/70">
              {`Score Viral = 
  (View Velocity × 0.25) +
  (Engagement Rate × 0.20) +
  (Cross-Platform Spread × 0.20) +
  (Search Interest × 0.15) +
  (Comment Sentiment × 0.10) +
  (Recency Bonus × 0.10)

Momentum = d²(Score) / dt²  // Seconde derivee

Decay = Score × (1 - 0.02)^heures_apres_6h`}
            </pre>
          </div>
        </section>

        {/* AI Enhancement */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="text-yellow-400" size={24} />
            Intelligence Artificielle
          </h2>

          <div className="p-6 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
            <p className="text-white/70 leading-relaxed mb-4">
              Lorsque les clés et modules sont activés, des modèles peuvent
              produire textes et suggestions à partir des mêmes signaux ·
              toujours à valider humainement :
            </p>

            <ul className="space-y-3">
              {[
                "Pistes d’explication sur pourquoi un sujet prend de l’ampleur",
                "Idées créateur pour tester un format (pas une recette de succès garanti)",
                "Lecture du risque (fenêtre / saturation possible)",
                "Contexte culturel plausible, à croiser avec vos sources",
                "Hypothèses d’audience et de format · à expérimenter",
                "Indicateurs de fenêtre temporelle, pas une date de pic certaine",
              ].map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-white/60"
                >
                  <span className="text-violet-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Live Status */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-green-400" size={24} />
            Sources connectées (rythmes variables)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: "YouTube", status: "live", refresh: "10min" },
              { name: "Reddit", status: "live", refresh: "10min" },
              { name: "Hacker News", status: "live", refresh: "10min" },
              { name: "GitHub", status: "live", refresh: "10min" },
              { name: "News RSS", status: "live", refresh: "10min" },
              { name: "Google Trends", status: "soon", refresh: "bientot" },
            ].map((source) => (
              <div
                key={source.name}
                className="p-3 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] flex items-center gap-3"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    source.status === "live"
                      ? "bg-green-400 animate-pulse"
                      : "bg-yellow-400",
                  )}
                />
                <div>
                  <div className="text-sm font-medium">{source.name}</div>
                  <div className="text-xs text-white/40">{source.refresh}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-[var(--color-text-muted)] pt-8 border-t border-[var(--color-border)]">
          <p>
            Transparence : le détail des pondérations ci-dessus reflète une
            couche du produit · le dépôt source fait foi.
          </p>
          <p className="mt-2">
            Contact : utiliser l’adresse configurée pour votre déploiement (
            <code className="text-[10px] text-white/40">
              NEXT_PUBLIC_CONTACT_EMAIL
            </code>
            ), ou les{" "}
            <Link href="/legal" className="text-cyan-500/80 hover:underline">
              mentions légales
            </Link>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
