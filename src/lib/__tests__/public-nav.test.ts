import { describe, expect, it } from "vitest";
import {
  isNavMoreActive,
  NAV_MORE,
  NAV_PRIMARY,
} from "@/lib/navigation/public-nav";

describe("public-nav", () => {
  it("expose un parcours principal court", () => {
    expect(NAV_PRIMARY.length).toBe(4);
    expect(NAV_PRIMARY.map((i) => i.href)).toEqual([
      "/",
      "/trends",
      "/creator-mode",
      "/ai",
    ]);
  });

  it("regroupe les rubriques secondaires dans NAV_MORE", () => {
    expect(NAV_MORE.length).toBeGreaterThanOrEqual(5);
    const hrefs = NAV_MORE.map((i) => i.href);
    expect(hrefs).toContain("/intelligence");
    expect(hrefs).toContain("/videos");
  });

  it("isNavMoreActive reflète le chemin courant", () => {
    expect(isNavMoreActive("/intelligence")).toBe(true);
    expect(isNavMoreActive("/intelligence/ops")).toBe(true);
    expect(isNavMoreActive("/")).toBe(false);
    expect(isNavMoreActive("/trends")).toBe(false);
  });
});
