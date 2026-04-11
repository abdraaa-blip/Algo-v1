/**
 * Normalisation des réponses `/api/*` pour le cron `/api/cron/ingest`.
 * Centralisé ici pour tests de contrat + éviter divergences.
 */

/** Les routes `/api/*` ne renvoient pas toutes `{ data: [] }`. */
export function normalizeIngestPayload(
  json: unknown,
  sourceName: string,
): unknown[] {
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data;

  if (sourceName === "Music") {
    const tracks = o.tracks;
    const artists = o.artists;
    return [
      ...(Array.isArray(tracks) ? tracks : []),
      ...(Array.isArray(artists) ? artists : []),
    ];
  }

  if (sourceName === "Movies") {
    return [
      ...(Array.isArray(o.movies) ? o.movies : []),
      ...(Array.isArray(o.tvShows) ? o.tvShows : []),
      ...(Array.isArray(o.celebrities) ? o.celebrities : []),
    ];
  }

  return [];
}

/**
 * HTTP 200 mais échec métier (ex. Spotify dégradé avec `success: false` + fallback `data`).
 */
export function businessLevelErrorFromJson(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const o = json as Record<string, unknown>;
  if (o.success === false) {
    if (typeof o.error === "string" && o.error.length > 0) return o.error;
    return "success:false";
  }
  return undefined;
}
