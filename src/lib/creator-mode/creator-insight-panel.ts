/**
 * Adapte l’insight « mode créateur » (mock / live léger) vers le contrat `Insight` + labels du panneau UI.
 */

import type { ContentFormat, Insight, Platform, TimingStatus } from "@/types";
import { fillLocaleStrings } from "@/types";
import type { InsightLabels } from "@/components/ui/InsightPanel";

const VALID_FORMAT = new Set<ContentFormat>([
  "face_cam",
  "text",
  "montage",
  "narration",
  "duet",
  "reaction",
  "news",
  "screen record",
]);

const PLATFORM_CANON: readonly Platform[] = [
  "TikTok",
  "Instagram",
  "YouTube",
  "YouTube Shorts",
  "Twitter",
  "Snapchat",
  "Reddit",
  "News",
  "TMDB",
  "GitHub",
  "HackerNews",
  "Other",
] as const;

export function stringToContentFormat(raw: string | undefined): ContentFormat {
  if (!raw) return "face_cam";
  const key = raw.trim().replace(/\s+/g, "_").toLowerCase() as ContentFormat;
  return VALID_FORMAT.has(key) ? key : "face_cam";
}

export function stringToPlatform(raw: string): Platform {
  const s = raw.trim();
  const hit = PLATFORM_CANON.find((p) => p.toLowerCase() === s.toLowerCase());
  if (hit) return hit;
  if (/reel/i.test(s) || /^instagram/i.test(s)) return "Instagram";
  if (/short/i.test(s) && /youtube/i.test(s)) return "YouTube Shorts";
  if (/twitter|^x$/i.test(s)) return "Twitter";
  return "Other";
}

export type CreatorPageInsightInput = {
  postNowProbability: "high" | "medium" | "low";
  timing: TimingStatus;
  postWindow?: { status: "optimal" | "saturated" | "fading" };
  bestPlatform?: string[];
  bestFormat?: string;
};

function timingLabelFor(timing: TimingStatus) {
  if (timing === "now")
    return fillLocaleStrings({ fr: "Publier maintenant", en: "Post now" });
  if (timing === "too_late")
    return fillLocaleStrings({ fr: "Fenêtre passée", en: "Too late" });
  return fillLocaleStrings({ fr: "Trop tôt", en: "Too early" });
}

export function adaptCreatorPageInsightToFull(
  input: CreatorPageInsightInput,
): Insight {
  const platforms = (
    input.bestPlatform?.length ? input.bestPlatform : ["TikTok"]
  ).map(stringToPlatform);
  return {
    postNowProbability: input.postNowProbability,
    timing: input.timing,
    bestPlatform: platforms,
    bestFormat: stringToContentFormat(input.bestFormat),
    timingLabel: timingLabelFor(input.timing),
    postWindow: { status: input.postWindow?.status ?? "optimal" },
  };
}

/** Libellés FR alignés sur l’ancien panneau créateur + format déjà utilisé sur `/content/[id]`. */
export const CREATOR_MODE_INSIGHT_LABELS: InsightLabels = {
  title: "Insight Engine",
  postNow: {
    high: "Fort potentiel",
    medium: "Risque",
    low: "Trop tard",
  },
  timing: {
    now: "Poste maintenant",
    too_late: "Trop tard",
    too_early: "Trop tôt",
  },
  bestPlatform: "Plateforme idéale",
  bestFormat: "Format",
  watchers: "{count} observateurs",
  postWindow: {
    optimal: "Fenêtre ouverte — moment idéal",
    saturated: "Tendance saturée — visibilité réduite",
    fading: "Le signal s’éteint — trop tard",
  },
  formatLabels: {
    face_cam: "Face cam",
    text: "Texte",
    montage: "Montage",
    narration: "Narration",
    duet: "Duo",
    reaction: "Réaction",
    news: "News",
    "screen record": "Screen record",
  },
};
