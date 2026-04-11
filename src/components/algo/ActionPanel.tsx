"use client";

import { useState } from "react";
import {
  Zap,
  Clock,
  Target,
  Sparkles,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ActionPanelProps {
  // Core data
  viralScore: number;

  // Timing
  timeRemaining?: string; // "12h restantes"
  postBefore?: string; // "18h"

  // Recommendations
  emotion?: string; // "colere", "surprise", "joie"
  format?: string; // "POV", "face_cam", "reaction"
  idealPlatform?: string[];

  // Action
  hookSuggestion?: string;
  videoDuration?: string; // "15-30s"

  // Confidence
  confidenceLevel?: "faible" | "moyen" | "eleve";

  // Callbacks
  onGenerateIdea?: () => void;
}

const EMOTION_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  colere: { bg: "rgba(255,77,109,0.15)", text: "#ff4d6d", label: "Colere" },
  surprise: { bg: "rgba(255,193,7,0.15)", text: "#ffc107", label: "Surprise" },
  joie: { bg: "rgba(0,209,178,0.15)", text: "#00d1b2", label: "Joie" },
  peur: { bg: "rgba(138,43,226,0.15)", text: "#8a2be2", label: "Peur" },
  tristesse: {
    bg: "rgba(100,149,237,0.15)",
    text: "#6495ed",
    label: "Tristesse",
  },
  indignation: {
    bg: "rgba(255,99,71,0.15)",
    text: "#ff6347",
    label: "Indignation",
  },
};

const CONFIDENCE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  faible: {
    bg: "rgba(255,193,7,0.12)",
    text: "rgba(255,193,7,0.8)",
    label: "Confiance faible",
  },
  moyen: {
    bg: "rgba(0,209,178,0.12)",
    text: "rgba(0,209,178,0.8)",
    label: "Confiance moyenne",
  },
  eleve: {
    bg: "rgba(123,97,255,0.15)",
    text: "#7b61ff",
    label: "Confiance elevee",
  },
};

export function ActionPanel({
  viralScore,
  timeRemaining = "24h restantes",
  postBefore,
  emotion = "surprise",
  format = "face_cam",
  idealPlatform = ["TikTok", "Instagram"],
  hookSuggestion,
  videoDuration = "15-30s",
  confidenceLevel = "moyen",
  onGenerateIdea,
}: ActionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const emotionStyle = EMOTION_COLORS[emotion] || EMOTION_COLORS.surprise;
  const confidenceStyle = CONFIDENCE_STYLES[confidenceLevel];
  const creatorAdoptionPercent = 3 + (viralScore % 12);

  // Determine urgency level
  const isUrgent =
    viralScore >= 80 ||
    (timeRemaining?.includes("h") && parseInt(timeRemaining) <= 6);
  const isCritical =
    viralScore >= 90 ||
    (timeRemaining?.includes("h") && parseInt(timeRemaining) <= 2);

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{
        border: isCritical
          ? "1px solid rgba(255,77,109,0.4)"
          : isUrgent
            ? "1px solid rgba(255,193,7,0.3)"
            : "1px solid rgba(123,97,255,0.25)",
        background: isCritical
          ? "linear-gradient(135deg, rgba(255,77,109,0.08), rgba(123,97,255,0.05))"
          : "linear-gradient(135deg, rgba(123,97,255,0.08), rgba(0,209,255,0.04))",
      }}
    >
      {/* Header with urgency indicator */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(123,97,255,0.2)" }}
            >
              <Zap size={16} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/90">
                Ce que tu dois faire
              </h3>
              <p className="text-[10px] text-white/40">Action recommandee</p>
            </div>
          </div>

          {/* Urgency badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: isCritical
                ? "rgba(255,77,109,0.2)"
                : isUrgent
                  ? "rgba(255,193,7,0.15)"
                  : "rgba(123,97,255,0.15)",
              color: isCritical ? "#ff4d6d" : isUrgent ? "#ffc107" : "#7b61ff",
            }}
          >
            {isCritical && <AlertTriangle size={10} />}
            <Clock size={10} />
            <span>{timeRemaining}</span>
          </div>
        </div>

        {/* Score + Confidence row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-violet-400">
              {viralScore}
            </span>
            <span className="text-[10px] text-white/30">/100</span>
          </div>
          <div
            className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
            style={{
              background: confidenceStyle.bg,
              color: confidenceStyle.text,
            }}
          >
            {confidenceStyle.label}
          </div>
        </div>
      </div>

      {/* Quick info pills */}
      <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-white/[0.06]">
        {/* Emotion */}
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1"
          style={{ background: emotionStyle.bg, color: emotionStyle.text }}
        >
          <span>Emotion:</span>
          <span className="font-bold">{emotionStyle.label}</span>
        </div>

        {/* Format */}
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{
            background: "rgba(0,209,255,0.12)",
            color: "rgba(0,209,255,0.9)",
          }}
        >
          Format: {format}
        </div>

        {/* Platform */}
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {idealPlatform.slice(0, 2).join(" / ")}
        </div>
      </div>

      {/* Main action block */}
      <div className="p-4">
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            background: "rgba(123,97,255,0.08)",
            border: "1px solid rgba(123,97,255,0.15)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "rgba(123,97,255,0.3)" }}
            >
              <Target size={12} className="text-violet-300" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white/80 mb-2">
                Action immediate:
              </p>
              <ul className="space-y-1.5 text-[11px] text-white/60">
                <li className="flex items-start gap-2">
                  <ChevronRight
                    size={12}
                    className="text-violet-400 mt-0.5 flex-shrink-0"
                  />
                  <span>Créer une vidéo courte ({videoDuration})</span>
                </li>
                {hookSuggestion && (
                  <li className="flex items-start gap-2">
                    <ChevronRight
                      size={12}
                      className="text-violet-400 mt-0.5 flex-shrink-0"
                    />
                    <span>
                      Hook:{" "}
                      <em className="text-violet-300">
                        &quot;{hookSuggestion}&quot;
                      </em>
                    </span>
                  </li>
                )}
                {postBefore && (
                  <li className="flex items-start gap-2">
                    <ChevronRight
                      size={12}
                      className="text-amber-400 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-amber-300/80">
                      Poster avant {postBefore}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Psychological pressure text */}
        {viralScore >= 75 && (
          <p
            className="text-[10px] mb-4 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,193,7,0.08)",
              color: "rgba(255,193,7,0.7)",
              border: "1px solid rgba(255,193,7,0.15)",
            }}
          >
            Seulement {creatorAdoptionPercent} % des créateurs ont déjà exploité
            ce signal
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            icon={Sparkles}
            onClick={onGenerateIdea}
          >
            Générer une idée
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Moins" : "Plus"}
          </Button>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                Pourquoi ca marche
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Ce contenu declenche une emotion forte (
                {emotionStyle.label.toLowerCase()}) qui favorise le partage. Le
                format {format} est optimal pour ce type de sujet sur{" "}
                {idealPlatform[0]}.
              </p>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                Potentiel monetisation
              </p>
              <p className="text-[11px] text-white/60">
                {viralScore >= 80
                  ? "Oui - Fort potentiel de revenus publicitaires"
                  : "Moyen - Bon pour la visibilite"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                Duree estimee du buzz
              </p>
              <p className="text-[11px] text-white/60">
                {viralScore >= 85
                  ? "48-72h"
                  : viralScore >= 70
                    ? "24-48h"
                    : "12-24h"}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
