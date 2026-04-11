import { afterEach, describe, expect, it } from "vitest";
import {
  extractPlatformApiKey,
  platformApiKeysConfigured,
  verifyPlatformApiKey,
} from "@/lib/ecosystem/platform-auth";

describe("ecosystem platform auth", () => {
  const prevSingle = process.env.ALGO_PLATFORM_API_KEY;
  const prevMulti = process.env.ALGO_PLATFORM_API_KEYS;

  afterEach(() => {
    if (prevSingle === undefined) delete process.env.ALGO_PLATFORM_API_KEY;
    else process.env.ALGO_PLATFORM_API_KEY = prevSingle;
    if (prevMulti === undefined) delete process.env.ALGO_PLATFORM_API_KEYS;
    else process.env.ALGO_PLATFORM_API_KEYS = prevMulti;
  });

  it("extracts bearer and header key", () => {
    const r1 = new Request("https://x.test/t", {
      headers: { Authorization: "Bearer secret-one" },
    });
    expect(extractPlatformApiKey(r1)).toBe("secret-one");

    const r2 = new Request("https://x.test/t", {
      headers: { "X-ALGO-Platform-Key": " secret-two " },
    });
    expect(extractPlatformApiKey(r2)).toBe("secret-two");
  });

  it("verifies against ALGO_PLATFORM_API_KEY", () => {
    process.env.ALGO_PLATFORM_API_KEY = "k_test_abc";
    delete process.env.ALGO_PLATFORM_API_KEYS;
    expect(platformApiKeysConfigured()).toBe(true);
    expect(verifyPlatformApiKey("k_test_abc")).toBe(true);
    expect(verifyPlatformApiKey("wrong")).toBe(false);
    expect(verifyPlatformApiKey(null)).toBe(false);
  });

  it("verifies against comma-separated keys", () => {
    delete process.env.ALGO_PLATFORM_API_KEY;
    process.env.ALGO_PLATFORM_API_KEYS = "alpha, beta";
    expect(verifyPlatformApiKey("alpha")).toBe(true);
    expect(verifyPlatformApiKey("beta")).toBe(true);
    expect(verifyPlatformApiKey("gamma")).toBe(false);
  });
});
