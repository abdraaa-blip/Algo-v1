import { describe, expect, it } from "vitest";
import {
  clampControlRoomIntensity,
  DEFAULT_CONTROL_ROOM_BRAIN_STATE,
} from "@/lib/control-room/brain-state";

describe("clampControlRoomIntensity", () => {
  it("borne 0–100 et arrondit", () => {
    expect(clampControlRoomIntensity(-5)).toBe(0);
    expect(clampControlRoomIntensity(150)).toBe(100);
    expect(clampControlRoomIntensity(44.4)).toBe(44);
  });

  it("rejette non fini", () => {
    expect(clampControlRoomIntensity(Number.NaN)).toBe(0);
    expect(clampControlRoomIntensity(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("DEFAULT_CONTROL_ROOM_BRAIN_STATE", () => {
  it("expose flux et modules pour le HUD", () => {
    expect(DEFAULT_CONTROL_ROOM_BRAIN_STATE.flowSpeed).toBeGreaterThanOrEqual(
      0,
    );
    expect(
      DEFAULT_CONTROL_ROOM_BRAIN_STATE.activeModuleIds.length,
    ).toBeGreaterThan(0);
  });
});
