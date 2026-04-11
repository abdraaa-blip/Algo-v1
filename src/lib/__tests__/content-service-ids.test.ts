import { describe, expect, it } from "vitest";
import {
  getContentTypeFromId,
  isRealApiContentId,
} from "@/services/contentService";

describe("contentService · IDs flux viral / APIs", () => {
  it("marque les préfixes externes comme hors mock", () => {
    expect(isRealApiContentId("yt-dQw4w9WgXcQ")).toBe(true);
    expect(isRealApiContentId("youtube-dQw4w9WgXcQ")).toBe(true);
    expect(isRealApiContentId("reddit-abc123")).toBe(true);
    expect(isRealApiContentId("reddit_xyz")).toBe(true);
    expect(isRealApiContentId("hn-424242")).toBe(true);
    expect(isRealApiContentId("hn_424242")).toBe(true);
    expect(isRealApiContentId("tmdb_movie_550")).toBe(true);
    expect(isRealApiContentId("tmdb_tv_94997")).toBe(true);
    expect(isRealApiContentId("news-fr-1")).toBe(true);
  });

  it("classe le type pour fetchRealContent / UI", () => {
    expect(getContentTypeFromId("yt-abc123def45")).toBe("video");
    expect(getContentTypeFromId("tmdb_movie_99")).toBe("film");
    expect(getContentTypeFromId("tmdb_tv_100")).toBe("film");
    expect(getContentTypeFromId("reddit-xyz")).toBe("trend");
    expect(getContentTypeFromId("hn-1")).toBe("trend");
  });
});
