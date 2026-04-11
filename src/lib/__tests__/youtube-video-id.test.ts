import { describe, expect, it } from "vitest";
import {
  canonicalYoutubeWatchUrl,
  isLikelyYoutubeVideoId,
  parseYoutubeVideoIdFromUrl,
} from "@/lib/social/youtube-video-id";

describe("youtube-video-id", () => {
  it("isLikelyYoutubeVideoId", () => {
    expect(isLikelyYoutubeVideoId("dQw4w9WgXcQ")).toBe(true);
    expect(isLikelyYoutubeVideoId("short")).toBe(false);
  });

  it("parseYoutubeVideoIdFromUrl watch and short", () => {
    expect(
      parseYoutubeVideoIdFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeVideoIdFromUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(
      parseYoutubeVideoIdFromUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
    expect(
      parseYoutubeVideoIdFromUrl("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("canonicalYoutubeWatchUrl", () => {
    expect(canonicalYoutubeWatchUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });
});
