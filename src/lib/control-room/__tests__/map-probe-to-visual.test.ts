import { describe, expect, it } from "vitest";
import { mapHealthProbeResultToBrainState } from "@/lib/control-room/map-probe-to-visual";

describe("mapHealthProbeResultToBrainState", () => {
  it("idle quand HTTP OK et json ok avec clés plateforme", () => {
    const s = mapHealthProbeResultToBrainState({
      resOk: true,
      json: { ok: true, platformKeysConfigured: true },
    });
    expect(s.mode).toBe("idle");
    expect(s.intensity).toBeGreaterThan(40);
    expect(s.activeModuleIds).toContain("radar");
  });

  it("syncing quand ok mais sans clés plateforme", () => {
    const s = mapHealthProbeResultToBrainState({
      resOk: true,
      json: { ok: true, platformKeysConfigured: false },
    });
    expect(s.mode).toBe("syncing");
    expect(s.activeModuleIds).not.toContain("radar");
    expect(s.activeModuleIds).toContain("pipeline");
  });

  it("alert quand HTTP KO", () => {
    const s = mapHealthProbeResultToBrainState({
      resOk: false,
      json: { ok: true, platformKeysConfigured: true },
    });
    expect(s.mode).toBe("alert");
    expect(s.activeModuleIds).toEqual(["probe", "health"]);
  });

  it("alert quand json absent ou ok false", () => {
    expect(
      mapHealthProbeResultToBrainState({ resOk: true, json: null }).mode,
    ).toBe("alert");
    expect(
      mapHealthProbeResultToBrainState({ resOk: true, json: { ok: false } })
        .mode,
    ).toBe("alert");
  });
});
