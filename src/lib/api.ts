/**
 * Pont client → couche système (`POST /api/algo` → `processAlgoAiRequest`).
 * Pour la Q&R complète (historique, structured, etc.) : `POST /api/ai/ask`.
 */

export type FetchAlgoContext = {
  currentTrends?: string[];
  userCountry?: string;
};

export type FetchAlgoResponse = {
  success?: boolean;
  text?: string;
  standard?: { comprehension: string; reponse: string; action: string };
  systemRoute?: string;
  systemConfidence?: number;
};

export async function fetchAlgo(
  input: string,
  opts?: { context?: FetchAlgoContext; country?: string | null },
): Promise<FetchAlgoResponse> {
  const res = await fetch("/api/algo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input,
      context: opts?.context,
      country: opts?.country ?? undefined,
    }),
  });
  const json = (await res.json()) as FetchAlgoResponse & { error?: string };
  if (!res.ok) {
    return {
      success: false,
      text:
        typeof json.error === "string"
          ? `Lecture impossible pour l’instant (${json.error}). Réessaie ou ouvre /intelligence/viral-control.`
          : "Lecture impossible pour l’instant. Réessaie dans un moment.",
    };
  }
  return json;
}
