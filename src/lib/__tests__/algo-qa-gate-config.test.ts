import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  ALGO_QA_CHECKLIST,
  ALGO_QA_COMMIT_CLASSIFICATION,
  ALGO_QA_PHILOSOPHY,
  ALGO_QA_RELEASE_COMMANDS,
  ALGO_QA_SOURCES,
} from "../../../config/algo-qa-gate";

describe("config/algo-qa-gate", () => {
  it("docs/README définit un ordre de lecture des vérités (sans second wiki)", () => {
    const readme = readFileSync(
      path.join(process.cwd(), "docs", "README.md"),
      "utf8",
    );
    expect(readme).toMatch(/Ordre de lecture des vérités/i);
    expect(readme).toContain("ALGO_SYSTEM_V1_CORES.md");
    expect(readme).toMatch(/algo-doctrine\.md/);
    expect(readme).toMatch(/pas de dossier parallèle|docs\/system/i);
    expect(readme).toContain("ALGO_RELEASE_READINESS.md");
    expect(readme).toMatch(/score unique/i);
  });

  it("référence le fichier design system", () => {
    expect(ALGO_QA_SOURCES.designAndUiRules).toBe(
      "config/algo-system-rules.ts",
    );
    expect(ALGO_QA_SOURCES.systemV1Cores).toBe(
      "docs/ALGO_SYSTEM_V1_CORES.md",
    );
    expect(ALGO_QA_SOURCES.deployGate).toBe("config/algo-deploy-gate.ts");
    expect(ALGO_QA_SOURCES.coherenceRitual).toBe(
      "docs/ALGO_COHERENCE_RITUAL.md",
    );
    expect(ALGO_QA_SOURCES.coherenceCursorRule).toContain(
      "algo-coherence-review",
    );
    expect(ALGO_QA_SOURCES.offlineEvolution).toBe(
      "docs/ALGO_OFFLINE_EVOLUTION.md",
    );
    expect(ALGO_QA_SOURCES.productionBoundaries).toBe(
      "docs/ALGO_PRODUCTION_BOUNDARIES.md",
    );
    expect(ALGO_QA_SOURCES.controlRoom).toBe("docs/ALGO_CONTROL_ROOM.md");
    expect(ALGO_QA_SOURCES.designEvolution).toBe(
      "docs/ALGO_DESIGN_EVOLUTION.md",
    );
    expect(ALGO_QA_SOURCES.uxCharter).toBe("docs/ALGO_UX_CHARTER.md");
    expect(ALGO_QA_SOURCES.uxCognitiveAudit).toBe(
      "docs/ALGO_UX_COGNITIVE_AUDIT.md",
    );
    expect(ALGO_QA_SOURCES.releaseReadiness).toBe(
      "docs/ALGO_RELEASE_READINESS.md",
    );
    expect(ALGO_QA_SOURCES.gtmNotes).toBe("docs/ALGO_GTM_NOTES.md");
    expect(ALGO_QA_SOURCES.docsIndex).toBe("docs/README.md");
    expect(ALGO_QA_SOURCES.productMasterOverview).toBe(
      "docs/product/master-overview.md",
    );
    expect(ALGO_QA_SOURCES.operationsPlaybook).toBe(
      "docs/ALGO_OPERATIONS_PLAYBOOK.md",
    );
    expect(ALGO_QA_SOURCES.gitCommitProtocol).toBe(
      "docs/ALGO_GIT_COMMIT_PROTOCOL.md",
    );
    expect(ALGO_QA_SOURCES.cicdPipeline).toBe("docs/ALGO_CICD_PIPELINE.md");
  });

  it("référence le pipeline CI/CD (GitHub, Vercel, verify)", () => {
    const cicdPath = path.join(process.cwd(), ALGO_QA_SOURCES.cicdPipeline);
    const text = readFileSync(cicdPath, "utf8");
    expect(text).toContain("ci.yml");
    expect(text).toContain("verify:release");
    expect(text).toMatch(/Vercel/i);
    expect(text).toContain("Husky");
    expect(text).toMatch(/rollback|git revert/i);
    expect(text).toMatch(/algo-ci|une seule gate|ci\.yml/i);
  });

  it("référence le protocole Git et les niveaux SAFE / RISKY / CRITICAL", () => {
    const protocolPath = path.join(
      process.cwd(),
      ALGO_QA_SOURCES.gitCommitProtocol,
    );
    const text = readFileSync(protocolPath, "utf8");
    expect(text).toMatch(/SAFE/i);
    expect(text).toMatch(/RISKY/i);
    expect(text).toMatch(/CRITICAL/i);
    expect(ALGO_QA_COMMIT_CLASSIFICATION.levels).toEqual([
      "SAFE",
      "RISKY",
      "CRITICAL",
    ]);
    expect(ALGO_QA_COMMIT_CLASSIFICATION.riskyMinimumGate).toContain(
      "verify:release",
    );
  });

  it("expose une checklist couvrante", () => {
    expect(ALGO_QA_CHECKLIST.technique.length).toBeGreaterThanOrEqual(3);
    expect(
      ALGO_QA_CHECKLIST.technique.some((s) =>
        s.includes("ALGO_GIT_COMMIT_PROTOCOL"),
      ),
    ).toBe(true);
    expect(
      ALGO_QA_CHECKLIST.uiUx.some((s) => s.includes("algo-system-rules")),
    ).toBe(true);
    expect(ALGO_QA_CHECKLIST.logicSystem.length).toBeGreaterThanOrEqual(2);
    expect(ALGO_QA_CHECKLIST.performance.length).toBeGreaterThanOrEqual(1);
  });

  it("définit la commande verify:release", () => {
    expect(ALGO_QA_RELEASE_COMMANDS.fullGate).toContain("verify:release");
    expect(ALGO_QA_RELEASE_COMMANDS.steps).toContain(
      "npm run verify:api-guards",
    );
    expect(ALGO_QA_RELEASE_COMMANDS.steps).toContain("npm audit");
    expect(ALGO_QA_RELEASE_COMMANDS.steps).toContain("npm run typecheck");
    expect(ALGO_QA_RELEASE_COMMANDS.steps).toContain("npm run lint:strict");
    expect(ALGO_QA_RELEASE_COMMANDS.steps).toContain("npm run build");
    expect(ALGO_QA_RELEASE_COMMANDS.optionalDeeper).toContain(
      "npm run typecheck",
    );
  });

  it("philosophie anti-fragmentation", () => {
    expect(ALGO_QA_PHILOSOPHY.tagline).toMatch(/fragment/i);
    expect(ALGO_QA_PHILOSOPHY.neverValidate.length).toBeGreaterThanOrEqual(2);
  });

  it("playbook ops : section blueprints et ancrage src/app (anti-pack générique)", () => {
    const playbookPath = path.join(
      process.cwd(),
      ALGO_QA_SOURCES.operationsPlaybook,
    );
    const text = readFileSync(playbookPath, "utf8");
    expect(text).toMatch(/Blueprints.*externes/i);
    expect(text).toContain("src/app/");
    expect(text).toContain("verify:release");
    expect(text).toContain("Arbitrage");
    expect(text).toContain("MCG");
    expect(text).toContain("Global Orchestrator");
    expect(text).toContain("Launch Kit");
    expect(text).toContain("/brain");
    expect(text).toContain("Human Cognitive");
  });
});
