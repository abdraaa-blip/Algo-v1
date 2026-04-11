import { describe, it, expect } from "vitest";
import { deriveRadarDeltaHint } from "@/lib/intelligence/radar-series-hint";

describe("deriveRadarDeltaHint", () => {
  it("renvoie null si moins de 2 points", () => {
    expect(deriveRadarDeltaHint([])).toBeNull();
    expect(
      deriveRadarDeltaHint([
        {
          at: "2026-01-01T00:00:00Z",
          viralityScore: 50,
          confidence: 0.5,
          anomalyCount: 0,
        },
      ]),
    ).toBeNull();
  });

  it("renvoie null si score précédent ~0", () => {
    expect(
      deriveRadarDeltaHint([
        {
          at: "2026-01-01T08:00:00Z",
          viralityScore: 0,
          confidence: 0.5,
          anomalyCount: 0,
        },
        {
          at: "2026-01-01T10:00:00Z",
          viralityScore: 10,
          confidence: 0.5,
          anomalyCount: 0,
        },
      ]),
    ).toBeNull();
  });

  it("détecte une hausse marquée", () => {
    const h = deriveRadarDeltaHint([
      {
        at: "2026-01-01T08:00:00Z",
        viralityScore: 50,
        confidence: 0.5,
        anomalyCount: 0,
      },
      {
        at: "2026-01-01T10:00:00Z",
        viralityScore: 70,
        confidence: 0.5,
        anomalyCount: 0,
      },
    ]);
    expect(h?.kind).toBe("score_spike");
    expect(h?.deltaPercent).toBe(40);
    expect(h?.noteFr).toContain("40");
  });

  it("détecte une baisse marquée", () => {
    const h = deriveRadarDeltaHint([
      {
        at: "2026-01-01T08:00:00Z",
        viralityScore: 50,
        confidence: 0.5,
        anomalyCount: 0,
      },
      {
        at: "2026-01-01T10:00:00Z",
        viralityScore: 30,
        confidence: 0.5,
        anomalyCount: 0,
      },
    ]);
    expect(h?.kind).toBe("score_drop");
    expect(h?.deltaPercent).toBe(-40);
  });

  it("renvoie null si variation modérée", () => {
    expect(
      deriveRadarDeltaHint([
        {
          at: "2026-01-01T08:00:00Z",
          viralityScore: 50,
          confidence: 0.5,
          anomalyCount: 0,
        },
        {
          at: "2026-01-01T10:00:00Z",
          viralityScore: 55,
          confidence: 0.5,
          anomalyCount: 0,
        },
      ]),
    ).toBeNull();
  });
});
