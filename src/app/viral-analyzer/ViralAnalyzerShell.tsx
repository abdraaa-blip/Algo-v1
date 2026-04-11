"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Link2,
  FileText,
  Target,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Share2,
  Zap,
  TrendingUp,
  Play,
  Camera,
  AtSign,
  Video,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { ViralScoreRing } from "@/components/ui/ViralScoreRing";
import { LivingPulse } from "@/components/ui/LivingPulse";
import { DataQualityChip } from "@/components/ui/DataQualityChip";
import { cn } from "@/lib/utils";
import { mapUserFacingApiError } from "@/lib/copy/api-error-fr";

// Platform icons (lucide-react doesn't include brand icons)
const YoutubeIcon = Play;
const InstagramIcon = Camera;
const TwitterIcon = AtSign;

interface ViralAnalyzerShellProps {
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    uploadTitle: string;
    uploadSubtitle: string;
    urlPlaceholder: string;
    descriptionPlaceholder: string;
    analyzeButton: string;
    analyzing: string;
    results: string;
    tryAnother: string;
    shareScore: string;
    goToCreator: string;
  };
}

type Platform = "youtube" | "tiktok" | "instagram" | "twitter";

interface AnalysisResult {
  viralScore: number;
  breakdown: {
    hook: number;
    emotion: number;
    timing: number;
    format: number;
    trend: number;
  };
  recommendations: string[];
  bestPlatform: Platform;
  estimatedReach: string;
  optimalPostTime: string;
  scoreInsights: Array<{ label: string; value: number; explanation: string }>;
  modelTelemetry?: {
    weightsVersion: string;
    rollbackApplied: boolean;
    adaptiveNotes: string[];
  };
  globalContext?: {
    topCategory: string;
    predictiveViralityScore: number;
  };
}

const PLATFORMS: { id: Platform; label: string; icon: typeof Play }[] = [
  { id: "youtube", label: "YouTube", icon: YoutubeIcon },
  { id: "tiktok", label: "TikTok", icon: Video },
  { id: "instagram", label: "Instagram", icon: InstagramIcon },
  { id: "twitter", label: "Twitter/X", icon: TwitterIcon },
];

export function ViralAnalyzerShell({
  locale,
  labels,
}: ViralAnalyzerShellProps) {
  const [mode, setMode] = useState<"url" | "upload" | "describe">("url");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("tiktok");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisMeta, setAnalysisMeta] = useState<{
    source: string;
    freshness: string;
    confidence: "high" | "medium" | "low";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getExplanation = (label: string, value: number) => {
    if (value >= 80)
      return `${label} : fort signal détecté, levier prioritaire.`;
    if (value >= 60) return `${label} : bon niveau, optimisation recommandée.`;
    return `${label} : signal faible, retravaille cet axe en priorité.`;
  };

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("mode", mode === "describe" ? "description" : mode);
      form.set("platform", selectedPlatform);
      form.set("locale", locale || "fr");
      if (url) form.set("url", url);
      if (description) form.set("description", description);
      if (mode === "upload" && uploadedFile) {
        form.set("video", uploadedFile);
      }

      const analysisRes = await fetch("/api/viral-analyzer", {
        method: "POST",
        body: form,
      });
      if (!analysisRes.ok) throw new Error("Analyse indisponible");
      const data = await analysisRes.json();

      const [predictiveRes] = await Promise.all([
        fetch("/api/intelligence/predictive?region=FR&locale=fr", {
          cache: "no-store",
        }),
      ]);
      const predictiveJson = predictiveRes.ok
        ? await predictiveRes.json()
        : null;
      const predictiveScore = Number(
        predictiveJson?.data?.predictedViralityScore || 0,
      );
      const topCategory = String(
        predictiveJson?.data?.drivers?.topCategory || "general",
      );

      const mapped: AnalysisResult = {
        viralScore: Number(data?.overallScore || 0),
        breakdown: {
          hook: Number(data?.hookScore || 0),
          emotion: Number(data?.emotionScore || 0),
          timing: Number(data?.timingScore || 0),
          format: Number(data?.formatScore || 0),
          trend: Number(data?.trendScore || 0),
        },
        recommendations: [
          data?.recommendations?.hook,
          data?.recommendations?.format,
          data?.recommendations?.timing,
          data?.recommendations?.benchmark,
        ].filter((v): v is string => Boolean(v)),
        bestPlatform: (data?.bestPlatform || selectedPlatform) as Platform,
        estimatedReach: `${Number(data?.estimatedReach?.low || 0).toLocaleString()} - ${Number(data?.estimatedReach?.high || 0).toLocaleString()}`,
        optimalPostTime: String(data?.bestTimeToPost || "n/a"),
        scoreInsights: [
          {
            label: "Hook",
            value: Number(data?.hookScore || 0),
            explanation: getExplanation("Hook", Number(data?.hookScore || 0)),
          },
          {
            label: "Trend",
            value: Number(data?.trendScore || 0),
            explanation: getExplanation("Trend", Number(data?.trendScore || 0)),
          },
          {
            label: "Format",
            value: Number(data?.formatScore || 0),
            explanation: getExplanation(
              "Format",
              Number(data?.formatScore || 0),
            ),
          },
          {
            label: "Emotion",
            value: Number(data?.emotionScore || 0),
            explanation: getExplanation(
              "Emotion",
              Number(data?.emotionScore || 0),
            ),
          },
          {
            label: "Timing",
            value: Number(data?.timingScore || 0),
            explanation: getExplanation(
              "Timing",
              Number(data?.timingScore || 0),
            ),
          },
        ],
        modelTelemetry: data?.modelTelemetry
          ? {
              weightsVersion: String(data.modelTelemetry.weightsVersion),
              rollbackApplied: Boolean(data.modelTelemetry.rollbackApplied),
              adaptiveNotes: Array.isArray(data.modelTelemetry.adaptiveNotes)
                ? (data.modelTelemetry.adaptiveNotes as string[])
                : [],
            }
          : undefined,
        globalContext: {
          topCategory,
          predictiveViralityScore: predictiveScore,
        },
      };
      setResult(mapped);
      setAnalysisMeta({
        source: "viral-analyzer + intelligence/predictive",
        freshness: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        confidence:
          mapped.viralScore >= 75
            ? "high"
            : mapped.viralScore >= 55
              ? "medium"
              : "low",
      });
    } catch (e) {
      setError(
        mapUserFacingApiError(
          e instanceof Error ? e.message : "Analyse indisponible",
        ),
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [description, locale, mode, selectedPlatform, uploadedFile, url]);

  const handleReset = () => {
    setResult(null);
    setUrl("");
    setDescription("");
    setUploadedFile(null);
    setAnalysisMeta(null);
    setError(null);
  };

  const canAnalyze =
    mode === "url"
      ? url.length > 5
      : mode === "upload"
        ? Boolean(uploadedFile)
        : description.length > 20;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <BackButton fallbackHref="/" />

        {/* Header */}
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Target className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {labels.title}
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">
            {labels.subtitle}
          </p>
          <LivingPulse intensity={45} showStats={false} compact />
          <div className="flex justify-center">
            <DataQualityChip
              source={analysisMeta?.source || "awaiting-analysis"}
              freshness={analysisMeta?.freshness || "pending"}
              confidence={analysisMeta?.confidence || "medium"}
            />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Mode Selector */}
              <div className="flex gap-2 p-1 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                {[
                  { id: "url" as const, label: "URL", icon: Link2 },
                  { id: "upload" as const, label: "Upload", icon: Upload },
                  { id: "describe" as const, label: "Decrire", icon: FileText },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMode(id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                      mode === id
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)]",
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-4">
                {mode === "url" && (
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={labels.urlPlaceholder}
                    className="w-full algo-input-field"
                  />
                )}

                {mode === "upload" && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--color-border-strong)] rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/50 transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      {labels.uploadTitle}
                    </p>
                    <p className="text-[var(--color-text-muted)] text-xs mt-1">
                      {labels.uploadSubtitle}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*,image/*"
                      onChange={(e) =>
                        setUploadedFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </div>
                )}

                {mode === "describe" && (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={labels.descriptionPlaceholder}
                    rows={4}
                    className="w-full algo-input-field resize-none min-h-[6rem]"
                  />
                )}

                {/* Platform Selector */}
                <div className="flex gap-2 flex-wrap">
                  {PLATFORMS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setSelectedPlatform(id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                        selectedPlatform === id
                          ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                          : "bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]",
                      )}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-all",
                  canAnalyze && !isAnalyzing
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
                    : "bg-[var(--color-card-hover)] text-[var(--color-text-muted)] cursor-not-allowed",
                )}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    {labels.analyzing}
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    {labels.analyzeButton}
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score Card */}
              <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {labels.results}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Potentiel viral analyse
                    </p>
                  </div>
                  <ViralScoreRing score={result.viralScore} size="lg" />
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(result.breakdown).map(([key, value]) => (
                    <div
                      key={key}
                      className="text-center p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]"
                    >
                      <div className="text-lg font-bold text-[var(--color-text-primary)]">
                        {value}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                        {key}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                    <Eye size={16} className="text-violet-400" />
                    <div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">
                        Portee estimee
                      </div>
                      <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {result.estimatedReach}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                    <Clock size={16} className="text-sky-400" />
                    <div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">
                        Meilleur moment
                      </div>
                      <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {result.optimalPostTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                    <Zap size={16} className="text-amber-400" />
                    <div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">
                        Plateforme
                      </div>
                      <div className="text-sm font-semibold text-[var(--color-text-primary)] capitalize">
                        {result.bestPlatform}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {result.globalContext ? (
                <div className="rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] p-3 text-xs text-[var(--color-text-secondary)]">
                  Contexte global live: categorie dominante{" "}
                  <span className="font-semibold">
                    {result.globalContext.topCategory}
                  </span>{" "}
                  · score viralite global{" "}
                  {result.globalContext.predictiveViralityScore}.
                </div>
              ) : null}

              {/* Recommendations */}
              <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-400" />
                  Recommandations pour ameliorer le score
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
                    >
                      <CheckCircle2
                        size={16}
                        className="text-green-400 shrink-0 mt-0.5"
                      />
                      {rec}
                    </li>
                  ))}
                </ul>
                {result.modelTelemetry && (
                  <div className="pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                    Modele: {result.modelTelemetry.weightsVersion}
                    {result.modelTelemetry.rollbackApplied
                      ? " · rollback applique"
                      : " · mode adaptatif actif"}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-3">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Explications detaillees du score
                </h3>
                <div className="space-y-2">
                  {result.scoreInsights.map((item) => (
                    <div
                      key={item.label}
                      className="p-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-violet-300">
                          {item.value}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] transition-colors text-sm font-medium"
                >
                  <RefreshCw size={16} />
                  {labels.tryAnother}
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-colors text-sm font-medium">
                  <Share2 size={16} />
                  {labels.shareScore}
                </button>
                <a
                  href="/creator-mode"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition-colors text-sm font-medium"
                >
                  {labels.goToCreator}
                  <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
