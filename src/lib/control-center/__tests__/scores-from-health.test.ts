import { describe, it, expect } from "vitest";
import {
  scoresFromFullHealth,
  scoresFromV1Probe,
} from "@/lib/control-center/scores-from-health";

describe("scores-from-health", () => {
  it("scoresFromV1Probe : clés absentes abaisse la stabilité", () => {
    const a = scoresFromV1Probe(true, true);
    const b = scoresFromV1Probe(true, false);
    expect(a.stability).toBeGreaterThan(b.stability);
    expect(a.global).toBeGreaterThanOrEqual(0);
    expect(a.global).toBeLessThanOrEqual(100);
  });

  it("scoresFromFullHealth : healthy + DB + serveur → stabilité max", () => {
    const s = scoresFromFullHealth({
      status: "healthy",
      responseTime: "120ms",
      checks: {
        server: true,
        database: true,
        externalApis: { youtube: true, newsapi: false, tmdb: false },
      },
    });
    expect(s.stability).toBe(100);
    expect(s.global).toBeGreaterThanOrEqual(70);
    expect(s.global).toBeLessThanOrEqual(100);
  });

  it("scoresFromFullHealth : unhealthy → stabilité basse", () => {
    const s = scoresFromFullHealth({
      status: "unhealthy",
      checks: { server: true, database: false },
    });
    expect(s.stability).toBeLessThanOrEqual(50);
  });
});
