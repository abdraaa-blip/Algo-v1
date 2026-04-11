"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { LiveCurve } from "@/components/algo/LiveCurve";
import { ViralScoreRing } from "@/components/algo/ViralScoreRing";
import { AlgoLoader } from "@/components/algo/AlgoLoader";
import { ALGO_UI_LOADING } from "@/lib/copy/ui-strings";
import { mapUserFacingApiError } from "@/lib/copy/api-error-fr";
import { AlgoSignalShareCard } from "@/components/algo/AlgoSignalShareCard";
import { ShareStrip } from "@/components/growth/ShareStrip";

type ApiPlatform = "youtube" | "tiktok" | "instagram" | "twitter" | "reddit";

interface ViralApiRecommendations {
  thumbnail: string;
  hook: string;
  audio: string;
  hashtags: string[];
  format: string;
  timing: string;
  benchmark: string;
}

interface ViralApiResponse {
  overallScore: number;
  hookScore: number;
  trendScore: number;
  formatScore: number;
  timingScore: number;
  bestPlatform: string;
  bestTimeToPost: string;
  recommendations: ViralApiRecommendations;
  trendingTopics?: string[];
  competitorInsights?: string[];
  error?: string;
}

interface AnalysisResult {
  viralScore: number;
  hookScore: number;
  trendAlignment: number;
  formatScore: number;
  timingScore: number;
  bestPlatform: string[];
  bestTime: string;
  tips: string[];
}

const PLATFORM_OPTIONS: { id: ApiPlatform; label: string }[] = [
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter / X" },
  { id: "reddit", label: "Reddit" },
];

function detectPlatformFromUrl(urlStr: string): ApiPlatform {
  const u = urlStr.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("reddit.com")) return "reddit";
  return "youtube";
}

function formatPlatformLabel(id: string): string {
  return PLATFORM_OPTIONS.find((p) => p.id === id)?.label || id;
}

function mapApiToResult(data: ViralApiResponse): AnalysisResult {
  const r = data.recommendations;
  const hashtagLine =
    r.hashtags?.length > 0
      ? `Hashtags suggérés : ${r.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`
      : null;

  const trendTips = (data.trendingTopics || [])
    .slice(0, 3)
    .map((t) => `Signal tendance : ${t}`);

  const tips = [
    ...trendTips,
    r.thumbnail,
    r.hook,
    r.audio,
    r.format,
    r.timing,
    r.benchmark,
    hashtagLine,
    ...(data.competitorInsights || []).slice(0, 3),
  ].filter((x): x is string => Boolean(x && x.trim()));

  const primary = formatPlatformLabel(data.bestPlatform);

  return {
    viralScore: Math.round(data.overallScore),
    hookScore: Math.round(data.hookScore),
    trendAlignment: Math.round(data.trendScore),
    formatScore: Math.round(data.formatScore),
    timingScore: Math.round(data.timingScore),
    bestPlatform: [primary],
    bestTime: data.bestTimeToPost,
    tips,
  };
}

function runScoreAnimation(
  target: number,
  setAnimatingScore: (n: number) => void,
) {
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    setAnimatingScore(current);
  }, 24);
}

export default function ViralAnalyzerPage() {
  const [inputType, setInputType] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionPlatform, setDescriptionPlatform] =
    useState<ApiPlatform>("youtube");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [animatingScore, setAnimatingScore] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const sharePageUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://algo.app/viral-analyzer";
    return `${window.location.origin}/viral-analyzer`;
  }, []);

  const inferredUrlPlatform = useMemo(() => detectPlatformFromUrl(url), [url]);

  const analyzeContent = useCallback(async () => {
    if (
      (inputType === "url" && !url.trim()) ||
      (inputType === "text" && !description.trim())
    )
      return;

    setAnalyzing(true);
    setResult(null);
    setAnalysisError(null);

    const fd = new FormData();
    fd.append("locale", "fr");
    if (inputType === "url") {
      fd.append("mode", "url");
      fd.append("platform", inferredUrlPlatform);
      fd.append("url", url.trim());
    } else {
      fd.append("mode", "description");
      fd.append("platform", descriptionPlatform);
      fd.append("description", description.trim());
    }

    try {
      const res = await fetch("/api/viral-analyzer", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as ViralApiResponse & { error?: string };

      if (!res.ok || data.error) {
        setAnalysisError(
          data.error
            ? mapUserFacingApiError(data.error)
            : `Erreur serveur (${res.status})`,
        );
        return;
      }

      if (!data.recommendations || typeof data.overallScore !== "number") {
        setAnalysisError("Réponse API incomplète.");
        return;
      }

      const mapped = mapApiToResult(data);
      setResult(mapped);
      setAnimatingScore(0);
      runScoreAnimation(mapped.viralScore, setAnimatingScore);
    } catch {
      setAnalysisError("Réseau indisponible ou réponse invalide.");
    } finally {
      setAnalyzing(false);
    }
  }, [inputType, url, description, inferredUrlPlatform, descriptionPlatform]);

  return (
    <main className="min-h-screen pb-20">
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <LiveCurve rate={100} color="violet" opacity={0.1} />
        <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-6">
          <Link
            href="/creator-mode"
            className="inline-flex items-center gap-2 text-xs mb-4 transition-colors hover:text-white"
            style={{ color: "rgba(240,240,248,0.4)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Mode Createur
          </Link>
          <h1
            className="text-2xl md:text-3xl font-black mb-2"
            style={{ color: "#f0f0f8" }}
          >
            Viral Analyzer
          </h1>
          <p
            className="text-sm max-w-lg"
            style={{ color: "rgba(240,240,248,0.5)" }}
          >
            Analyse le potentiel avant publication · score ALGO exportable pour
            tes stories et posts.
          </p>
          <div
            className="mt-4 max-w-2xl rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-100/90"
            role="note"
          >
            <strong className="font-semibold text-emerald-200">
              Transparence :
            </strong>{" "}
            les scores viennent du moteur{" "}
            <code className="text-emerald-200/80">
              POST /api/viral-analyzer
            </code>{" "}
            (poids ALGO + signaux tendance en cache). Ce sont des{" "}
            <strong>estimations</strong>, pas une prévision de performance
            réelle.
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setInputType("url")}
            className={`algo-interactive px-4 py-2 rounded-xl text-sm font-semibold transition-[color,background-color,transform] duration-200 ${
              inputType === "url"
                ? "bg-[var(--color-violet)] text-white shadow-[0_0_18px_color-mix(in_srgb,var(--color-violet)_20%,transparent)]"
                : "bg-[var(--color-card)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-card-hover)]"
            }`}
          >
            URL
          </button>
          <button
            onClick={() => setInputType("text")}
            className={`algo-interactive px-4 py-2 rounded-xl text-sm font-semibold transition-[color,background-color,transform] duration-200 ${
              inputType === "text"
                ? "bg-[var(--color-violet)] text-white shadow-[0_0_18px_color-mix(in_srgb,var(--color-violet)_20%,transparent)]"
                : "bg-[var(--color-card)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-card-hover)]"
            }`}
          >
            Description
          </button>
        </div>

        <div className="mb-6 space-y-3">
          {inputType === "url" ? (
            <>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Colle l'URL YouTube, TikTok ou Instagram..."
                className="algo-input-field focus:ring-0"
              />
              {url.trim() ? (
                <p
                  className="text-[11px]"
                  style={{ color: "rgba(240,240,248,0.45)" }}
                >
                  Plateforme détectée :{" "}
                  <span className="font-semibold text-[#a78bfa]">
                    {formatPlatformLabel(inferredUrlPlatform)}
                  </span>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décris ton idée de contenu…"
                rows={4}
                className="algo-input-field resize-none focus:ring-0"
              />
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "rgba(240,240,248,0.45)" }}
                >
                  Plateforme cible
                </label>
                <select
                  value={descriptionPlatform}
                  onChange={(e) =>
                    setDescriptionPlatform(e.target.value as ApiPlatform)
                  }
                  className="algo-input-field focus:ring-0"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <button
          onClick={analyzeContent}
          disabled={analyzing || (inputType === "url" ? !url : !description)}
          className="algo-interactive w-full px-6 py-4 rounded-xl text-sm font-bold text-white transition-[transform,box-shadow,opacity] duration-200 disabled:opacity-50 active:scale-[0.99]"
          style={{
            background:
              "linear-gradient(135deg, var(--color-violet), var(--color-blue-neon))",
            boxShadow:
              "0 0 28px color-mix(in srgb, var(--color-violet) 26%, transparent)",
          }}
        >
          {analyzing ? "Analyse en cours..." : "Analyser le potentiel viral"}
        </button>

        {analysisError ? (
          <p
            className="mt-4 text-sm rounded-xl px-4 py-3 border border-red-400/30 bg-red-500/10 text-red-200/90"
            role="alert"
          >
            {analysisError}
          </p>
        ) : null}

        {analyzing && (
          <div className="mt-8">
            <AlgoLoader message={ALGO_UI_LOADING.viralPage} />
          </div>
        )}

        {result && !analyzing && (
          <div className="mt-8 space-y-6">
            <div
              className="p-8 rounded-2xl text-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(123,97,255,0.15), rgba(0,209,255,0.1))",
                border: "1px solid rgba(123,97,255,0.2)",
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wider mb-4"
                style={{ color: "rgba(240,240,248,0.5)" }}
              >
                Potentiel Viral
              </p>
              <div className="flex justify-center mb-4">
                <ViralScoreRing score={animatingScore} size={120} />
              </div>
              <p className="text-lg font-bold" style={{ color: "#f0f0f8" }}>
                {result.viralScore >= 80
                  ? "Excellent potentiel!"
                  : result.viralScore >= 60
                    ? "Bon potentiel"
                    : "A ameliorer"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Hook", score: result.hookScore, color: "#FF4D6D" },
                {
                  label: "Tendances",
                  score: result.trendAlignment,
                  color: "#00FFB2",
                },
                {
                  label: "Format",
                  score: result.formatScore,
                  color: "#00D1FF",
                },
                {
                  label: "Timing",
                  score: result.timingScore,
                  color: "#FFD166",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs"
                      style={{ color: "rgba(240,240,248,0.5)" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: item.color }}
                    >
                      {item.score}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${item.score}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: "rgba(240,240,248,0.5)" }}
              >
                Recommandations
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {result.bestPlatform.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: "rgba(123,97,255,0.15)",
                      color: "#a78bfa",
                    }}
                  >
                    {p}
                  </span>
                ))}
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: "rgba(0,255,178,0.15)",
                    color: "#00FFB2",
                  }}
                >
                  {result.bestTime}
                </span>
              </div>
              <ul className="space-y-2">
                {result.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "rgba(240,240,248,0.6)" }}
                  >
                    <span className="text-[var(--color-violet)]">
                      {"\u2022"}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(123,97,255,0.06)",
                border: "1px solid rgba(123,97,255,0.2)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "rgba(240,240,248,0.45)" }}
              >
                Partager l’analyse
              </p>
              <AlgoSignalShareCard
                headline={
                  inputType === "url"
                    ? url.length > 72
                      ? `${url.slice(0, 72)}…`
                      : url
                    : description.length > 90
                      ? `${description.slice(0, 90)}…`
                      : description || "Analyse virale ALGO"
                }
                score={result.viralScore}
                badgeLabel={
                  result.viralScore >= 80
                    ? "Fort potentiel"
                    : result.viralScore >= 60
                      ? "Bon potentiel"
                      : "À booster"
                }
                subtitle={`Plateformes : ${result.bestPlatform.join(", ")} · ${result.bestTime}`}
              />
            </div>

            <ShareStrip
              className="pt-2"
              url={sharePageUrl}
              title="Analyseur viral ALGO"
              snippet={`Score viral ${result.viralScore}/100 · analyse avant publication sur ALGO.`}
            />
          </div>
        )}
      </div>
    </main>
  );
}
