import { z } from "zod";

/** Une option de décision (comparaison courte). */
export const algoAskOptionSchema = z.object({
  title: z.string().min(1).max(220),
  upside: z.string().max(420).optional(),
  downside: z.string().max(420).optional(),
});

/** Recommandation principale quand plusieurs pistes existent. */
export const algoAskRecommendedSchema = z.object({
  title: z.string().min(1).max(220),
  criterion: z.string().max(420).optional(),
});

/**
 * Contrat sortie modèle pour `askAlgo` / `POST /api/ai/ask`.
 * `answer` = texte principal ; les autres champs sont optionnels (omit si inutiles).
 */
export const algoAskResponseSchema = z.object({
  answer: z
    .string()
    .min(1)
    .max(12_000)
    .describe(
      "Réponse principale ALGO AI en français (markdown léger possible).",
    ),
  options: z
    .array(algoAskOptionSchema)
    .max(4)
    .optional()
    .describe(
      "2–4 options comparées si la question appelle un choix ; sinon omettre le champ.",
    ),
  recommendedChoice: algoAskRecommendedSchema
    .optional()
    .describe("Piste préférée + critère court si pertinent ; sinon omettre."),
  nextStep: z
    .string()
    .max(500)
    .optional()
    .describe("Un prochain pas concret (une phrase) ; optionnel."),
});

export type AlgoAskModelOutput = z.infer<typeof algoAskResponseSchema>;

/** Sous-ensemble exposé aux clients HTTP (sans dupliquer `answer`). */
export type AlgoAskStructured = {
  options?: Array<{ title: string; upside?: string; downside?: string }>;
  recommendedChoice?: { title: string; criterion?: string };
  nextStep?: string;
};

export function toPublicStructured(
  output: AlgoAskModelOutput,
): AlgoAskStructured | undefined {
  const structured: AlgoAskStructured = {};
  if (output.options && output.options.length > 0) {
    structured.options = output.options;
  }
  if (output.recommendedChoice) {
    structured.recommendedChoice = output.recommendedChoice;
  }
  const step = output.nextStep?.trim();
  if (step) {
    structured.nextStep = step;
  }
  if (
    !structured.options &&
    !structured.recommendedChoice &&
    !structured.nextStep
  ) {
    return undefined;
  }
  return structured;
}
