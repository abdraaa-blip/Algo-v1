import { describe, it, expect } from "vitest";
import {
  algoAskResponseSchema,
  toPublicStructured,
} from "@/lib/ai/algo-ask-contract";

describe("algo-ask-contract", () => {
  it("valide une sortie minimale (answer seul)", () => {
    const parsed = algoAskResponseSchema.parse({ answer: "Réponse courte." });
    expect(toPublicStructured(parsed)).toBeUndefined();
  });

  it("expose le bloc public quand options ou reco ou nextStep", () => {
    const parsed = algoAskResponseSchema.parse({
      answer: "Synthèse.",
      options: [{ title: "Piste A", upside: "Rapide", downside: "Risqué" }],
      recommendedChoice: { title: "Piste A", criterion: "time-to-ship" },
      nextStep: "Publier un test A/B demain.",
    });
    const s = toPublicStructured(parsed);
    expect(s?.options).toHaveLength(1);
    expect(s?.recommendedChoice?.title).toBe("Piste A");
    expect(s?.nextStep).toMatch(/A\/B/);
  });

  it("rejette answer vide", () => {
    expect(() => algoAskResponseSchema.parse({ answer: "" })).toThrow();
  });
});
