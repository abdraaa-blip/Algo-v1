import { describe, it, expect } from "vitest";
import {
  defaultSrcRoot,
  scanSrcForForbiddenUiCopy,
} from "@/lib/copy/forbidden-ui-copy-scan";

describe("forbidden UI copy scan", () => {
  it("aucune formulation interdite dans src (ts/tsx), hors fichiers source de règles", () => {
    const hits = scanSrcForForbiddenUiCopy(defaultSrcRoot());
    if (hits.length > 0) {
      const msg = hits
        .map(
          (h) =>
            `  ${h.file}:${h.lineNumber} [${h.ruleId}] ${h.hint}\n    ${h.excerpt}`,
        )
        .join("\n");
      expect.fail(`Formulations à corriger:\n${msg}`);
    }
    expect(hits).toEqual([]);
  });
});
