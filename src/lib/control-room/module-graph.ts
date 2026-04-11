/**
 * Schéma statique pour la Control Room (décoration + lecture humaine).
 * Ce n’est pas une topologie runtime réelle des serveurs.
 */

export type ControlRoomModuleId =
  | "probe"
  | "health"
  | "pipeline"
  | "radar"
  | "trends";

export type ControlRoomFlowEdge = {
  from: ControlRoomModuleId;
  to: ControlRoomModuleId;
};

/** Nœuds : positions fixes dans le viewBox (déterministes). */
export const CONTROL_ROOM_MODULE_LAYOUT: Record<
  ControlRoomModuleId,
  { label: string; cx: number; cy: number }
> = {
  probe: { label: "Probe", cx: 48, cy: 56 },
  health: { label: "/api/v1/health", cx: 132, cy: 56 },
  pipeline: { label: "Q&R · système", cx: 216, cy: 56 },
  radar: { label: "Radar intel", cx: 300, cy: 32 },
  trends: { label: "Signaux tendances", cx: 300, cy: 80 },
};

export const CONTROL_ROOM_FLOW_EDGES: readonly ControlRoomFlowEdge[] = [
  { from: "probe", to: "health" },
  { from: "health", to: "pipeline" },
  { from: "pipeline", to: "radar" },
  { from: "pipeline", to: "trends" },
] as const;

/** Arêtes considérées « actives » selon les modules allumés (sous-graphe déterministe). */
export function activeFlowEdges(
  active: ReadonlySet<ControlRoomModuleId> | ReadonlyArray<ControlRoomModuleId>,
): ControlRoomFlowEdge[] {
  const set = active instanceof Set ? active : new Set(active);
  return CONTROL_ROOM_FLOW_EDGES.filter(
    (e) => set.has(e.from) && set.has(e.to),
  );
}

export function defaultActiveModulesForMode(params: {
  mode: "idle" | "analyzing" | "predicting" | "syncing" | "alert";
}): ControlRoomModuleId[] {
  switch (params.mode) {
    case "analyzing":
      return ["probe", "health"];
    case "alert":
      return ["probe", "health"];
    case "syncing":
      return ["probe", "health", "pipeline"];
    case "predicting":
      return ["probe", "health", "pipeline", "radar", "trends"];
    case "idle":
    default:
      return ["probe", "health", "pipeline", "radar", "trends"];
  }
}
