"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  Wand2,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Lightbulb,
  Clock,
  TrendingUp,
  Video,
  ImageIcon,
  Type,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealTimeTrends } from "@/hooks/useRealTimeTrends";
import { ViralScoreRing } from "./ViralScoreRing";
import { LiveIndicator } from "./LivingPulse";

interface GeneratedIdea {
  id: string;
  hook: string;
  concept: string;
  format: string;
  platform: string;
  hashtags: string[];
  estimatedScore: number;
  basedOn: string;
  timing: string;
}

interface IdeaGeneratorProps {
  onSelectIdea?: (idea: GeneratedIdea) => void;
  className?: string;
}

const FORMAT_ICONS = {
  "Short video": Video,
  Carousel: ImageIcon,
  Thread: Type,
  Story: ImageIcon,
  Voiceover: Mic,
  Reaction: Video,
  Tutorial: Video,
};

const PLATFORMS = ["TikTok", "Instagram", "X", "YouTube Shorts"];
const FORMATS = [
  "Short video",
  "Carousel",
  "Thread",
  "Story",
  "Voiceover",
  "Reaction",
  "Tutorial",
];

export function IdeaGenerator({ onSelectIdea, className }: IdeaGeneratorProps) {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");

  const { trends, loading: trendsLoading } = useRealTimeTrends({ limit: 10 });

  // Generate ideas based on current trends
  const generateIdeas = useCallback(async () => {
    setGenerating(true);

    // Simulate AI generation with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newIdeas: GeneratedIdea[] = trends
      .filter((t) => t.score.tier === "S" || t.score.tier === "A")
      .slice(0, 5)
      .flatMap((trend) => {
        const platforms =
          selectedPlatform === "all"
            ? PLATFORMS.slice(0, 2)
            : [selectedPlatform];

        return platforms.map((platform) => ({
          id: `${trend.keyword}-${platform}-${Date.now()}`,
          hook: generateHook(trend.keyword),
          concept: generateConcept(trend.keyword),
          format:
            selectedFormat === "all"
              ? FORMATS[Math.floor(Math.random() * FORMATS.length)]
              : selectedFormat,
          platform,
          hashtags: generateHashtags(trend.keyword),
          estimatedScore: Math.round(
            trend.score.overall * (0.8 + Math.random() * 0.2),
          ),
          basedOn: trend.keyword,
          timing:
            trend.prediction.recommendedAction === "post_now"
              ? "Maintenant"
              : trend.prediction.optimalWindow?.[0] || "2-4h",
        }));
      });

    setIdeas(newIdeas.slice(0, 6));
    setGenerating(false);
  }, [trends, selectedPlatform, selectedFormat]);

  async function copyToClipboard(idea: GeneratedIdea) {
    const text = `${idea.hook}\n\n${idea.concept}\n\n${idea.hashtags.join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30">
            <Wand2 size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Générateur d&apos;idées IA
            </h3>
            <p className="text-[10px] text-white/40">
              Basé sur les dernières tendances
            </p>
          </div>
        </div>
        <LiveIndicator className="scale-90" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
        >
          <option value="all">Toutes les plateformes</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
        >
          <option value="all">Tous les formats</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateIdeas}
        disabled={generating || trendsLoading}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
          "font-bold text-sm transition-all",
          "bg-gradient-to-r from-violet-500 to-pink-500 text-white",
          "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {generating ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            <span>Generation en cours...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Generer des idees</span>
          </>
        )}
      </button>

      {/* Ideas Grid */}
      {ideas.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
            {ideas.length} idees generees
          </p>

          <div className="grid gap-3">
            {ideas.map((idea, i) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                index={i}
                copied={copiedId === idea.id}
                onCopy={() => copyToClipboard(idea)}
                onSelect={() => onSelectIdea?.(idea)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {ideas.length === 0 && !generating && (
        <div className="text-center py-8">
          <Lightbulb size={32} className="mx-auto text-white/20 mb-3" />
          <p className="text-sm text-white/40">
            Cliquez sur &quot;Generer des idees&quot; pour obtenir des
            suggestions basees sur les trends actuels
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Idea Card ─────────────────────────────────────────────────────────────

interface IdeaCardProps {
  idea: GeneratedIdea;
  index: number;
  copied: boolean;
  onCopy: () => void;
  onSelect: () => void;
}

function IdeaCard({ idea, index, copied, onCopy, onSelect }: IdeaCardProps) {
  const FormatIcon =
    FORMAT_ICONS[idea.format as keyof typeof FORMAT_ICONS] || Video;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border border-white/5 bg-white/[0.02]",
        "hover:border-white/10 hover:bg-white/[0.04] transition-all",
        `algo-s${(index % 6) + 1}`,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-violet-500/20 text-violet-400 text-[10px] font-bold">
            {idea.platform}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/40">
            <FormatIcon size={10} />
            {idea.format}
          </span>
        </div>
        <ViralScoreRing value={idea.estimatedScore} size="sm" />
      </div>

      {/* Hook */}
      <p className="text-sm font-bold text-white/90 mb-2 leading-snug">
        {idea.hook}
      </p>

      {/* Concept */}
      <p className="text-xs text-white/50 mb-3 leading-relaxed line-clamp-2">
        {idea.concept}
      </p>

      {/* Hashtags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {idea.hashtags.slice(0, 4).map((tag, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1">
            <TrendingUp size={10} />
            {idea.basedOn}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {idea.timing}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
            aria-label="Copier"
          >
            {copied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
          <button
            onClick={onSelect}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/20 text-violet-400 text-[10px] font-medium hover:bg-violet-500/30 transition-all"
          >
            Utiliser
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Functions ─────────────────────────────────────────────────────

function generateHook(keyword: string): string {
  const hooks = [
    `POV : tu découvres ${keyword} pour la première fois`,
    `Ce que personne ne te dit sur ${keyword}`,
    `${keyword} mais expliqué en 30 secondes`,
    `Pourquoi tout le monde parle de ${keyword}`,
    `J'ai testé ${keyword} et voilà ce qui s'est passé`,
    `La vérité sur ${keyword} (thread)`,
    `${keyword} : ce que tu dois savoir tôt`,
    `Comment ${keyword} va changer les choses`,
  ];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function generateConcept(keyword: string): string {
  const concepts = [
    `Déconstruis le buzz autour de ${keyword} avec des faits et ton point de vue unique. Ajoute une touche d'humour pour maximiser l'engagement.`,
    `Crée un tutoriel rapide sur ${keyword} en montrant les erreurs communes à éviter.`,
    `Fais une réaction authentique à ${keyword} en partageant ta première impression.`,
    `Compare ${keyword} avec les alternatives pour aider ton audience à faire le bon choix.`,
    `Donne 3 conseils pratiques sur ${keyword} que personne ne partage.`,
  ];
  return concepts[Math.floor(Math.random() * concepts.length)];
}

function generateHashtags(keyword: string): string[] {
  const base = keyword.toLowerCase().replace(/\s+/g, "");
  return [
    `#${base}`,
    "#fyp",
    "#viral",
    "#trending",
    `#${base}2024`,
    "#pourtoi",
  ];
}
