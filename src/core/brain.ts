/**
 * ALGO · Central Brain (socle d’orchestration).
 *
 * Objectif : un **point d’entrée nommé** pour le futur routeur à priorités.
 * Aujourd’hui : le pipeline Q&R passe par ici (`centralAsk` → enrichissement data → modèle).
 * Pour route + enveloppe + QC avant HTTP : `src/core/system.ts` (`processAlgoAiRequest` · `runAlgoAskSystem` si bypass route).
 * Les routes HTTP peuvent importer ce module au lieu d’appeler directement les sous-couches.
 *
 * Ne pas confondre avec `AlgoOrchestrator` (fetch data temps réel) : complémentaire.
 */

import { orchestrateAskAlgo } from "@/lib/ai/algo-ask-orchestrate";
import type { AskOrchestrationMeta } from "@/lib/ai/algo-ask-orchestrate";
import { buildAlgoAskFallbackResponse } from "@/lib/ai/algo-ask-fallback";
import type { AlgoAskStructured } from "@/lib/ai/algo-ask-contract";
import type { AlgoExpertiseLevel } from "@/lib/ai/algo-persona";
import { validators } from "@/lib/security";
import type { AlgoAskRoute } from "@/core/router";

/** Registre lisible par humains / agents · chemins relatifs à la racine du dépôt. */
export const BRAIN_MODULE_REGISTRY = {
  centralBrain: "src/core/brain.ts",
  systemLayer: "src/core/system.ts",
  askRouter: "src/core/router.ts",
  systemRouteData: "src/core/system-data.ts",
  masterDirectiveDoc: "docs/ALGO_MASTER_SYSTEM_DIRECTIVE.md",
  persona: "src/lib/ai/algo-persona.ts",
  directive: "src/lib/ai/algo-directive-synthesis.ts",
  voice: "src/lib/copy/algo-voice.ts",
  askOrchestrate: "src/lib/ai/algo-ask-orchestrate.ts",
  askContract: "src/lib/ai/algo-ask-contract.ts",
  aiBrain: "src/lib/ai/algo-brain.ts",
  aiTransparency: "src/lib/ai/ai-transparency.ts",
  dataOrchestrator: "src/services/AlgoOrchestrator.ts",
  coherenceGuard: "src/services/AlgoCoherenceGuard.ts",
  dataReliabilityMap: "src/lib/data/data-reliability-map.ts",
  designSystemRules: "config/algo-system-rules.ts",
  qaGate: "config/algo-qa-gate.ts",
  deployGate: "config/algo-deploy-gate.ts",
  offlineEvolution: "docs/ALGO_OFFLINE_EVOLUTION.md",
  controlRoom: "docs/ALGO_CONTROL_ROOM.md",
  operationsPlaybook: "docs/ALGO_OPERATIONS_PLAYBOOK.md",
  observability: "src/core/observability/",
  autonomyKnowledgeMemory: "src/lib/autonomy/knowledge-memory.ts",
  autonomyLearningHistory: "src/lib/autonomy/learning-history.ts",
} as const;

export type CentralAskInput = {
  question: string;
  clientContext?: { currentTrends?: string[]; userCountry?: string };
  countryHint?: string | null;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  expertiseLevel?: AlgoExpertiseLevel;
  serverEnrich?: boolean;
  /** Renseigné par `processAlgoAiRequest` · transparence + cadrage modèle. */
  algoAskRoute?: AlgoAskRoute;
  /** Indices route injectés dans le bloc contexte (sans modifier la question affichée). */
  routeHintLines?: string[];
};

export type CentralAskResult = {
  answer: string;
  structured?: AlgoAskStructured;
  meta: AskOrchestrationMeta;
};

function brainNormalizeCountry(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const c = raw.trim().toUpperCase();
  return validators.countryCode(c) ? c : null;
}

/**
 * Pipeline : **entrée utilisateur → enrichissement tendances (si besoin) → modèle**.
 * C’est l’implémentation actuelle du « branché sur le réel » pour le mode Q&R.
 * En cas d’exception sur toute la chaîne : réponse synthèse (jamais message d’échec technique côté texte).
 */
export async function centralAsk(
  input: CentralAskInput,
): Promise<CentralAskResult> {
  try {
    return await orchestrateAskAlgo(input);
  } catch (e) {
    console.error("[centralAsk] repli automatique", e);
    const cc =
      input.clientContext?.currentTrends?.filter(
        (t) => typeof t === "string" && t.trim(),
      ) ?? [];
    const region =
      brainNormalizeCountry(input.clientContext?.userCountry) ??
      brainNormalizeCountry(input.countryHint) ??
      "ALL";
    return {
      answer: buildAlgoAskFallbackResponse(input.question, {
        userCountry:
          input.clientContext?.userCountry ?? input.countryHint ?? undefined,
        firstTrendTitle: cc[0],
      }),
      meta: {
        serverEnrichedTrends: false,
        trendTitlesPassedToModel: cc.length,
        region,
      },
    };
  }
}

/**
 * Intentions futures pour un vrai routeur (priorités, modules multiples).
 * Non branché sur le runtime · sert de contrat pour étendre sans casser `centralAsk`.
 */
export type BrainIntent =
  | "ask_open"
  | "analyze_content"
  | "predict_viral"
  | "daily_briefing";

export const BRAIN_INTENT_PRIORITY: Record<BrainIntent, number> = {
  ask_open: 10,
  analyze_content: 20,
  predict_viral: 20,
  daily_briefing: 15,
};
