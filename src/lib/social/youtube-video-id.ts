/**
 * Extraction d’ID vidéo YouTube depuis une URL (watch, youtu.be, shorts, embed).
 */

const ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function isLikelyYoutubeVideoId(id: string): boolean {
  return ID_RE.test(id.trim());
}

/**
 * Retourne l’ID vidéo ou null si non reconnu.
 */
export function parseYoutubeVideoIdFromUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (isLikelyYoutubeVideoId(s)) return s;

  try {
    const u = s.startsWith("http") ? new URL(s) : new URL(`https://${s}`);

    if (u.hostname === "youtu.be" || u.hostname === "www.youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && isLikelyYoutubeVideoId(id) ? id : null;
    }

    if (
      /youtube\.com$/i.test(u.hostname) ||
      /(^|\.)youtube\.com$/i.test(u.hostname)
    ) {
      const v = u.searchParams.get("v");
      if (v && isLikelyYoutubeVideoId(v)) return v;
      const shorts = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shorts?.[1]) return shorts[1];
      const embed = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed?.[1]) return embed[1];
      const live = u.pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/);
      if (live?.[1]) return live[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function canonicalYoutubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}
