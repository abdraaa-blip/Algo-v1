import { describe, it, expect } from "vitest";
import {
  adaptCreatorPageInsightToFull,
  stringToContentFormat,
  stringToPlatform,
} from "../creator-mode/creator-insight-panel";

describe("creator-insight-panel", () => {
  it("mappe les formats texte vers ContentFormat", () => {
    expect(stringToContentFormat("reaction")).toBe("reaction");
    expect(stringToContentFormat("face cam")).toBe("face_cam");
    expect(stringToContentFormat(undefined)).toBe("face_cam");
    expect(stringToContentFormat("unknown")).toBe("face_cam");
  });

  it("normalise les noms de plateforme", () => {
    expect(stringToPlatform("TikTok")).toBe("TikTok");
    expect(stringToPlatform("instagram reels")).toBe("Instagram");
    expect(stringToPlatform("YouTube Shorts")).toBe("YouTube Shorts");
    expect(stringToPlatform("xyz-unknown")).toBe("Other");
  });

  it("produit un Insight complet pour le panneau UI", () => {
    const insight = adaptCreatorPageInsightToFull({
      postNowProbability: "high",
      timing: "now",
      postWindow: { status: "optimal" },
      bestPlatform: ["TikTok", "Instagram Reels"],
      bestFormat: "reaction",
    });
    expect(insight.bestPlatform).toEqual(["TikTok", "Instagram"]);
    expect(insight.bestFormat).toBe("reaction");
    expect(insight.postWindow.status).toBe("optimal");
    expect(insight.timingLabel.fr.length).toBeGreaterThan(0);
    expect(insight.timingLabel.en.length).toBeGreaterThan(0);
  });

  it("applique des défauts si champs absents", () => {
    const insight = adaptCreatorPageInsightToFull({
      postNowProbability: "medium",
      timing: "too_early",
    });
    expect(insight.bestPlatform.length).toBeGreaterThanOrEqual(1);
    expect(insight.postWindow.status).toBe("optimal");
    expect(insight.bestFormat).toBe("face_cam");
  });
});
