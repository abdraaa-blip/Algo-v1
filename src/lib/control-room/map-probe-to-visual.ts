import type { AlgoControlRoomBrainState } from "@/lib/control-room/brain-state";
import { clampControlRoomIntensity } from "@/lib/control-room/brain-state";
import { defaultActiveModulesForMode } from "@/lib/control-room/module-graph";

export type HealthProbeJson = {
  ok?: boolean;
  platformKeysConfigured?: boolean;
};

/**
 * Cartographie honnête : uniquement le résultat HTTP + JSON de la probe légère.
 * Pas de score vidéo ni d’heuristique « neural » opaque.
 */
export function mapHealthProbeResultToBrainState(params: {
  resOk: boolean;
  json: HealthProbeJson | null;
}): Omit<AlgoControlRoomBrainState, "mode"> & {
  mode: "idle" | "syncing" | "alert";
} {
  const jsonOk = params.json?.ok === true;
  const keys = params.json?.platformKeysConfigured === true;

  if (!params.resOk || params.json == null || !jsonOk) {
    return {
      mode: "alert",
      intensity: clampControlRoomIntensity(68),
      flowSpeed: clampControlRoomIntensity(78),
      activeModuleIds: defaultActiveModulesForMode({ mode: "alert" }),
    };
  }

  if (!keys) {
    return {
      mode: "syncing",
      intensity: clampControlRoomIntensity(44),
      flowSpeed: clampControlRoomIntensity(34),
      activeModuleIds: defaultActiveModulesForMode({ mode: "syncing" }),
    };
  }

  return {
    mode: "idle",
    intensity: clampControlRoomIntensity(58),
    flowSpeed: clampControlRoomIntensity(42),
    activeModuleIds: defaultActiveModulesForMode({ mode: "idle" }),
  };
}
