import { describe, expect, it } from "vitest";
import {
  activeFlowEdges,
  CONTROL_ROOM_FLOW_EDGES,
  CONTROL_ROOM_MODULE_LAYOUT,
  CONTROL_ROOM_MODULE_ROUTES,
  defaultActiveModulesForMode,
  type ControlRoomModuleId,
} from "@/lib/control-room/module-graph";

describe("activeFlowEdges", () => {
  it("filtre les arêtes dont les deux extrémités sont actives", () => {
    const edges = activeFlowEdges(["probe", "health", "pipeline"]);
    expect(edges).toEqual([
      { from: "probe", to: "health" },
      { from: "health", to: "pipeline" },
    ]);
    expect(edges.some((e) => e.from === "pipeline" && e.to === "radar")).toBe(
      false,
    );
  });

  it("accepte un Set", () => {
    expect(activeFlowEdges(new Set(["probe", "health"]))).toHaveLength(1);
  });
});

describe("defaultActiveModulesForMode", () => {
  it("couvre les modes utilisés par la Control Room", () => {
    expect(CONTROL_ROOM_FLOW_EDGES.length).toBe(4);
    expect(defaultActiveModulesForMode({ mode: "analyzing" })).toEqual([
      "probe",
      "health",
    ]);
    expect(defaultActiveModulesForMode({ mode: "alert" })).toEqual([
      "probe",
      "health",
    ]);
  });
});

describe("CONTROL_ROOM_MODULE_ROUTES", () => {
  it("définit un lien et un descriptif pour chaque module du schéma", () => {
    const ids = Object.keys(
      CONTROL_ROOM_MODULE_LAYOUT,
    ) as ControlRoomModuleId[];
    for (const id of ids) {
      const row = CONTROL_ROOM_MODULE_ROUTES[id];
      expect(row).toBeDefined();
      expect(row.href.startsWith("/")).toBe(true);
      expect(row.blurb.length).toBeGreaterThan(8);
    }
  });
});
