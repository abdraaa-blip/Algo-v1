import { describe, it, expect } from "vitest";
import {
  buildViralAnalyzerFormDataDescription,
  buildViralAnalyzerFormDataUrl,
} from "@/lib/home/viral-quick-scan-request";

describe("Home quick scan → viral-analyzer FormData", () => {
  it("description mode (suggestion chip) sends fields the API reads", () => {
    const fd = buildViralAnalyzerFormDataDescription("  hook test  ", "tiktok");
    expect(fd.get("locale")).toBe("fr");
    expect(fd.get("mode")).toBe("description");
    expect(fd.get("description")).toBe("hook test");
    expect(fd.get("platform")).toBe("tiktok");
  });

  it("url mode sends fields the API reads", () => {
    const fd = buildViralAnalyzerFormDataUrl(
      "  https://youtu.be/abc  ",
      "youtube",
    );
    expect(fd.get("locale")).toBe("fr");
    expect(fd.get("mode")).toBe("url");
    expect(fd.get("url")).toBe("https://youtu.be/abc");
    expect(fd.get("platform")).toBe("youtube");
  });
});
