import { describe, it, expect } from "vitest";
import {
  runAlgoCoreIntelligence,
  ALGO_CORE_PHILOSOPHY_FR,
} from "@/lib/algo-core-intelligence";
import type { RawContentInput } from "@/lib/algo-engine";

function sampleItem(overrides: Partial<RawContentInput> = {}): RawContentInput {
  return {
    id: "t1",
    title: "Decouverte surprenante sur la tech",
    description: "Pourquoi tout le monde en parle",
    growthRate: 72,
    engagement: 40,
    views: 12000,
    publishedAt: new Date().toISOString(),
    source: "demo",
    category: "tech",
    type: "trend",
    ...overrides,
  };
}

describe("runAlgoCoreIntelligence", () => {
  it("exposes philosophy tagline (sobre)", () => {
    expect(ALGO_CORE_PHILOSOPHY_FR.tagline).toContain("silencieuse");
    expect(ALGO_CORE_PHILOSOPHY_FR.principles.length).toBeGreaterThan(0);
  });

  it("returns stable empty report", () => {
    const r = runAlgoCoreIntelligence([]);
    expect(r.items).toHaveLength(0);
    expect(r.prioritizedIds).toEqual([]);
    expect(r.scenarioSimulations.viralBurst.baselineScore).toBe(0);
  });

  it("ranks a single item and runs three scenario simulations", () => {
    const r = runAlgoCoreIntelligence([sampleItem()]);
    expect(r.items).toHaveLength(1);
    expect(r.prioritizedIds).toEqual(["t1"]);
    expect(
      r.scenarioSimulations.viralBurst.simulatedScore,
    ).toBeGreaterThanOrEqual(0);
    expect(r.scenarioSimulations.stagnation.simulatedScore).toBeDefined();
    expect(r.scenarioSimulations.rejection.simulatedScore).toBeDefined();
    expect(r.crossBatch.sourceCount).toBe(1);
  });

  it("detects duplicate titles and repeated tokens across batch", () => {
    const r = runAlgoCoreIntelligence([
      sampleItem({ id: "a", title: "Breaking news climate summit" }),
      sampleItem({
        id: "b",
        title: "Breaking news climate summit",
        source: "other",
      }),
      sampleItem({ id: "c", title: "Climate summit updates today" }),
    ]);
    expect(r.patterns.duplicateTitles).toBeGreaterThanOrEqual(1);
    expect(
      r.patterns.repeatedTokens.some(
        (t) => t.token === "climate" || t.token === "summit",
      ),
    ).toBe(true);
  });

  it("applies user interest boost on matching category", () => {
    const base = runAlgoCoreIntelligence([sampleItem({ id: "x" })]);
    const boosted = runAlgoCoreIntelligence([sampleItem({ id: "x" })], {
      interestByCategory: { tech: 80 },
    });
    expect(boosted.items[0].priority.userBoost).toBeGreaterThan(
      base.items[0].priority.userBoost,
    );
    expect(boosted.userLayer.applied).toBe(true);
  });
});
