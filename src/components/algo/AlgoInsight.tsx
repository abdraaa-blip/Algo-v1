"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlgoInsightProps {
  title: string;
  category?: string;
  score?: number;
  compact?: boolean;
  className?: string;
}

// ALGO's signature phrases and personality
const ALGO_PHRASES = {
  intro: [
    "ALGO détecte un signal fort.",
    "Mon analyse indique une opportunité.",
    "Les données convergent vers un pattern intéressant.",
    "Signal viral capté.",
    "Pattern détecté dans les données.",
  ],
  urgency: {
    critical: [
      "Fenêtre critique. Action immédiate requise.",
      "Le pic approche. C'est maintenant ou jamais.",
      "Saturation dans moins de 6 h. Agis maintenant.",
    ],
    high: [
      "Timing optimal dans les prochaines heures.",
      "La vague monte. Positionne-toi avant les autres.",
      "Momentum idéal pour te démarquer.",
    ],
    medium: [
      "Bonne fenêtre d'opportunité.",
      "Le sujet gagne en traction. Prépare ton contenu.",
      "Signal stable. Tu as le temps de bien faire.",
    ],
    low: [
      "Tendance émergente à surveiller.",
      "Signal précoce détecté. Avantage first-mover possible.",
      "À monitorer pour les prochaines heures.",
    ],
  },
  why: [
    "Voici pourquoi ça fonctionne :",
    "L'analyse révèle :",
    "Les patterns montrent :",
    "Ce qui fait la différence :",
  ],
  action: [
    "Ce que tu dois faire maintenant :",
    "Action recommandée :",
    "Pour maximiser ton impact :",
    "Ma recommandation :",
  ],
  confidence: {
    high: "Confiance élevée sur cette prédiction.",
    medium: "Niveau de confiance moyen — plusieurs scénarios possibles.",
    low: "Signal faible — à confirmer avec d'autres indicateurs.",
  },
};

// Get random phrase from array
function getPhrase(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Determine urgency level from score
function getUrgencyLevel(
  score: number,
): "critical" | "high" | "medium" | "low" {
  if (score >= 90) return "critical";
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

// Generate AI insight based on category and score
function generateInsight(
  title: string,
  category?: string,
  score?: number,
): {
  intro: string;
  why: string;
  action: string;
  urgency: string;
  confidence: string;
  tips: string[];
} {
  const urgencyLevel = getUrgencyLevel(score || 50);

  const categoryInsights: Record<
    string,
    { why: string; action: string; tips: string[] }
  > = {
    Tech: {
      why: "Les sujets tech génèrent de l'engagement car ils impactent directement la vie quotidienne. Les gens cherchent à comprendre et anticiper.",
      action:
        "Fais une réaction rapide ou un tutoriel. Le format « Ce que ça change pour toi » fonctionne très bien.",
      tips: [
        "Simplifie le jargon technique",
        "Montre l'impact concret",
        "Donne ton avis personnel",
      ],
    },
    Sport: {
      why: "Le sport crée des émotions fortes et une communauté engagée. Les gens veulent partager leurs réactions.",
      action:
        "Réagis à chaud pendant ou juste après l'événement. L'authenticité prime sur la qualité.",
      tips: [
        "Poste pendant le match",
        "Montre ta vraie réaction",
        "Interagis avec les commentaires",
      ],
    },
    Cinema: {
      why: "Les fans de cinéma sont passionnés et adorent les théories et analyses. Le contenu a une durée de vie plus longue.",
      action:
        "Analyse, théories ou réactions au trailer. Le format « X choses que tu as ratées » marche bien.",
      tips: [
        "Évite les spoilers majeurs",
        "Fais des prédictions audacieuses",
        "Compare avec d'autres œuvres",
      ],
    },
    Politique: {
      why: "Les sujets politiques génèrent des débats passionnés. L'engagement est élevé mais le ton compte.",
      action:
        "Résumé factuel ou analyse des conséquences. Reste informatif plutôt que partisan.",
      tips: [
        "Reste factuel",
        "Évite la polémique gratuite",
        "Apporte de la valeur ajoutée",
      ],
    },
    Divertissement: {
      why: "Le divertissement est viral par nature. Les gens veulent participer et se sentir dans le coup.",
      action:
        "Participe au trend avec ta touche personnelle. La créativité et l'humour priment.",
      tips: [
        "Ajoute ta personnalité",
        "Fais-le rapidement",
        "N'aie pas peur d'être créatif",
      ],
    },
    Finance: {
      why: "Les sujets financiers touchent directement le portefeuille des gens. Ils cherchent des conseils pour se rassurer.",
      action:
        "Explique ce qui se passe et ce que ça signifie. Évite les conseils d'investissement directs.",
      tips: [
        "Simplifie les concepts",
        "Donne du contexte historique",
        "Reste prudent sur les prédictions",
      ],
    },
    default: {
      why: "Ce sujet génère de l'intérêt car il touche à des préoccupations actuelles de l'audience.",
      action:
        "Crée du contenu qui apporte de la valeur — information, divertissement ou inspiration.",
      tips: [
        "Connais ton audience",
        "Apporte ta perspective unique",
        "Sois authentique",
      ],
    },
  };

  const insight =
    categoryInsights[category || "default"] || categoryInsights.default;

  return {
    intro: getPhrase(ALGO_PHRASES.intro),
    why: insight.why,
    action: insight.action,
    urgency: getPhrase(ALGO_PHRASES.urgency[urgencyLevel]),
    confidence:
      score && score >= 80
        ? ALGO_PHRASES.confidence.high
        : score && score >= 60
          ? ALGO_PHRASES.confidence.medium
          : ALGO_PHRASES.confidence.low,
    tips: insight.tips,
  };
}

export function AlgoInsight({
  title,
  category,
  score = 70,
  compact = false,
  className,
}: AlgoInsightProps) {
  const [insight, setInsight] = useState<ReturnType<
    typeof generateInsight
  > | null>(null);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    // Simulate AI "thinking" effect
    setIsTyping(true);
    const timer = setTimeout(() => {
      setInsight(generateInsight(title, category, score));
      setIsTyping(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [title, category, score]);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "bg-gradient-to-r from-violet-500/10 to-cyan-500/5",
          "border border-violet-500/20",
          className,
        )}
      >
        <Brain size={14} className="text-violet-400 shrink-0" />
        <p className="text-[11px] text-white/70 line-clamp-1">
          {isTyping ? "ALGO analyse..." : insight?.urgency}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-[#0d0d1a] via-[#0a0a12] to-[#080810]",
        "border border-violet-500/20",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(123,97,255,0.2), rgba(0,209,255,0.1))",
          }}
        >
          <Brain size={20} className="text-violet-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Analyse ALGO</h3>
            <Sparkles size={12} className="text-violet-400" aria-hidden />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isTyping ? (
          <div className="flex items-center gap-2 text-white/50">
            <div className="flex gap-1">
              <span
                className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-xs">ALGO analyse les signaux...</span>
          </div>
        ) : (
          insight && (
            <>
              {/* Intro */}
              <p className="text-xs text-violet-300 font-medium">
                {insight.intro}
              </p>

              {/* Urgency Alert */}
              <div
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{
                  background:
                    score >= 80
                      ? "rgba(255,77,109,0.1)"
                      : score >= 60
                        ? "rgba(255,193,7,0.1)"
                        : "rgba(0,209,255,0.1)",
                  border: `1px solid ${score >= 80 ? "rgba(255,77,109,0.3)" : score >= 60 ? "rgba(255,193,7,0.3)" : "rgba(0,209,255,0.3)"}`,
                }}
              >
                <Zap
                  size={16}
                  className={
                    score >= 80
                      ? "text-red-400"
                      : score >= 60
                        ? "text-yellow-400"
                        : "text-cyan-400"
                  }
                />
                <p className="text-xs text-white/80">{insight.urgency}</p>
              </div>

              {/* Why it works */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">
                    Pourquoi ca marche
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {insight.why}
                </p>
              </div>

              {/* What to do */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-violet-400" />
                  <span className="text-xs font-bold text-violet-300">
                    Ce que tu dois faire
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {insight.action}
                </p>
              </div>

              {/* Tips */}
              <div className="space-y-1.5">
                {insight.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight
                      size={12}
                      className="text-white/30 mt-0.5 shrink-0"
                    />
                    <span className="text-[11px] text-white/50">{tip}</span>
                  </div>
                ))}
              </div>

              {/* Confidence */}
              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] text-white/30 italic">
                  {insight.confidence}
                </p>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
