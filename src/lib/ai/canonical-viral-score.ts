import {
  BASE_WEIGHTS,
  computeAdaptiveWeights,
  type AdaptiveSignals,
} from "@/lib/ai/adaptive-weighting";

export interface CanonicalScoreInput {
  topic: string;
  keywords: string[];
  hasVideo: boolean;
  hasThumbnail: boolean;
  platform: "youtube" | "tiktok" | "instagram" | "twitter" | "reddit";
  trendSignals: string[];
  adaptiveSignals?: Partial<AdaptiveSignals>;
}

export interface CanonicalScoreOutput {
  overall: number;
  hook: number;
  trend: number;
  format: number;
  emotion: number;
  timing: number;
  weightsUsed: {
    hook: number;
    trend: number;
    format: number;
    emotion: number;
    timing: number;
  };
  adaptiveNotes: string[];
  weightsVersion: string;
  rollbackApplied: boolean;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function keywordOverlapScore(
  topic: string,
  keywords: string[],
  signals: string[],
): number {
  const haystack = `${topic} ${keywords.join(" ")}`.toLowerCase();
  const matched = signals.filter((signal) => {
    const normalized = signal.toLowerCase();
    return normalized.length > 2 && haystack.includes(normalized);
  }).length;
  return clamp(30 + matched * 10);
}

function hookScore(
  topic: string,
  hasThumbnail: boolean,
  hasVideo: boolean,
  keywords: string[],
): number {
  let score = 45;
  if (topic.length >= 12 && topic.length <= 70) score += 12;
  if (/[!?]/.test(topic)) score += 8;
  if (hasThumbnail) score += 15;
  if (hasVideo) score += 10;
  if (keywords.length >= 3 && keywords.length <= 12) score += 10;
  return clamp(score);
}

function formatScore(
  platform: CanonicalScoreInput["platform"],
  hasVideo: boolean,
  hasThumbnail: boolean,
): number {
  let score = 50;
  if ((platform === "youtube" || platform === "tiktok") && hasVideo)
    score += 25;
  if (platform === "instagram" && (hasVideo || hasThumbnail)) score += 20;
  if (platform === "twitter" && hasThumbnail) score += 10;
  return clamp(score);
}

function emotionScore(topic: string): number {
  const text = topic.toLowerCase();
  const emotionalTerms = [
    "incroyable",
    "choquant",
    "viral",
    "secret",
    "urgent",
    "surprise",
    "amazing",
    "shocking",
    "unbelievable",
    "breaking",
    "secret",
  ];
  let score = 40;
  for (const term of emotionalTerms) {
    if (text.includes(term)) score += 8;
  }
  return clamp(score);
}

function timingScore(trendSignals: string[], topic: string): number {
  if (trendSignals.length === 0) return 45;
  const overlap = keywordOverlapScore(topic, [], trendSignals);
  return clamp(overlap);
}

export function computeCanonicalViralScore(
  input: CanonicalScoreInput,
): CanonicalScoreOutput {
  const { weights, notes, rollbackApplied, version } = computeAdaptiveWeights(
    input.adaptiveSignals,
  );
  // Keep model stable by blending adaptive with baseline.
  const blendedWeights = {
    hook: (weights.hook + BASE_WEIGHTS.hook) / 2,
    trend: (weights.trend + BASE_WEIGHTS.trend) / 2,
    format: (weights.format + BASE_WEIGHTS.format) / 2,
    emotion: (weights.emotion + BASE_WEIGHTS.emotion) / 2,
    timing: (weights.timing + BASE_WEIGHTS.timing) / 2,
  };

  const hook = hookScore(
    input.topic,
    input.hasThumbnail,
    input.hasVideo,
    input.keywords,
  );
  const trend = keywordOverlapScore(
    input.topic,
    input.keywords,
    input.trendSignals,
  );
  const format = formatScore(
    input.platform,
    input.hasVideo,
    input.hasThumbnail,
  );
  const emotion = emotionScore(input.topic);
  const timing = timingScore(input.trendSignals, input.topic);

  const overall = Math.round(
    hook * blendedWeights.hook +
      trend * blendedWeights.trend +
      format * blendedWeights.format +
      emotion * blendedWeights.emotion +
      timing * blendedWeights.timing,
  );

  return {
    overall: clamp(overall),
    hook,
    trend,
    format,
    emotion,
    timing,
    weightsUsed: blendedWeights,
    adaptiveNotes: notes,
    weightsVersion: version,
    rollbackApplied,
  };
}
