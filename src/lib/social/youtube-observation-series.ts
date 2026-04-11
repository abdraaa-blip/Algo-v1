/**
 * Série temporelle construite côté serveur à chaque fetch réussi (pas l’historique interne YouTube).
 * Mémoire process uniquement · redémarrage = perte de courbe (voir doc intégrations pour persistance).
 */

export type YoutubeObservationPoint = {
  at: string;
  views: number;
  likes: number;
  comments: number;
};

const MAX_POINTS = 120;
const DEDUPE_MS = 5 * 60 * 1000;

const store = new Map<string, YoutubeObservationPoint[]>();

export function getYoutubeObservationSeries(
  videoId: string,
): YoutubeObservationPoint[] {
  return [...(store.get(videoId) ?? [])];
}

/**
 * Enregistre un point si les métriques changent ou si le dernier point date de plus de DEDUPE_MS.
 */
export function recordYoutubeObservation(
  videoId: string,
  row: { views: number; likes: number; comments: number },
): YoutubeObservationPoint[] {
  const series = store.get(videoId) ?? [];
  const last = series[series.length - 1];
  const now = Date.now();
  if (last) {
    const lastT = new Date(last.at).getTime();
    const same =
      last.views === row.views &&
      last.likes === row.likes &&
      last.comments === row.comments;
    if (same && Number.isFinite(lastT) && now - lastT < DEDUPE_MS) {
      return [...series];
    }
  }
  const point: YoutubeObservationPoint = {
    at: new Date().toISOString(),
    views: row.views,
    likes: row.likes,
    comments: row.comments,
  };
  const next = [...series, point];
  while (next.length > MAX_POINTS) next.shift();
  store.set(videoId, next);
  return next;
}
