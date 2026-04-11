import { describe, it, expect } from "vitest";
import { buildRouteContextData } from "@/core/system-data";

describe("buildRouteContextData", () => {
  it("TRENDS demande enrichissement si pas de titres client", () => {
    const a = buildRouteContextData("TRENDS", { hasClientTrends: false });
    expect(a.preferTrendServerEnrich).toBe(true);
    expect(a.hintLines.length).toBeGreaterThan(0);
  });

  it("TRENDS ne force pas enrichissement si titres déjà fournis", () => {
    const b = buildRouteContextData("TRENDS", { hasClientTrends: true });
    expect(b.preferTrendServerEnrich).toBe(false);
  });

  it("VIRAL et STRATEGY fournissent des indications", () => {
    expect(buildRouteContextData("VIRAL").hintLines[0]).toMatch(/VIRAL|viral/i);
    expect(buildRouteContextData("STRATEGY").hintLines[0]).toMatch(
      /STRAT|strat/i,
    );
  });

  it("GENERAL reste léger", () => {
    expect(buildRouteContextData("GENERAL")).toEqual({ hintLines: [] });
  });
});
