import { describe, expect, it } from "vitest";
import { mapUserFacingApiError } from "@/lib/copy/api-error-fr";

describe("mapUserFacingApiError", () => {
  it("maps known API boilerplate to French", () => {
    expect(mapUserFacingApiError("Unknown error")).toMatch(/Réessaie/);
    expect(mapUserFacingApiError("Failed to fetch trends")).toContain(
      "tendances",
    );
    expect(mapUserFacingApiError("Rate limit exceeded")).toMatch(/requêtes/);
    expect(mapUserFacingApiError("Not authenticated")).toContain(
      "Connecte-toi",
    );
    expect(mapUserFacingApiError("Invalid login credentials")).toContain(
      "Identifiants",
    );
  });

  it("handles Failed to fetch prefix", () => {
    expect(mapUserFacingApiError("Failed to fetch something weird")).toContain(
      "données",
    );
  });

  it("returns French message for empty input", () => {
    expect(mapUserFacingApiError(null)).toContain("Signal");
    expect(mapUserFacingApiError("   ")).toContain("Signal");
  });

  it("passes through unknown messages", () => {
    expect(mapUserFacingApiError("Email déjà utilisé")).toBe(
      "Email déjà utilisé",
    );
  });

  it("maps HTTP status codes to French", () => {
    expect(mapUserFacingApiError("HTTP 401")).toContain("Connecte-toi");
    expect(mapUserFacingApiError("HTTP 403")).toContain("refusé");
    expect(mapUserFacingApiError("HTTP 404")).toContain("introuvable");
    expect(mapUserFacingApiError("HTTP 502")).toContain("indisponible");
    expect(mapUserFacingApiError("HTTP 418")).toContain("données");
  });

  it("maps Fetch failed", () => {
    expect(mapUserFacingApiError("Fetch failed")).toContain("données");
  });

  it("maps session / JWT expiry hints", () => {
    expect(mapUserFacingApiError("JWT expired")).toContain("Session");
    expect(mapUserFacingApiError("invalid jwt")).toContain("Session");
  });

  it("maps Search failed", () => {
    expect(mapUserFacingApiError("Search failed")).toContain("recherche");
  });
});
