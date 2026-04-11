import { describe, expect, it } from "vitest";
import {
  activeFlowEdges,
  CONTROL_ROOM_FLOW_EDGES,
  defaultActiveModulesForMode,
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
