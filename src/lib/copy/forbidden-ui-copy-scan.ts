/**
 * Scan statique des formulations UI à éviter (aligné `algo-voice.ts` / tone-guide).
 * Les motifs sensibles sont construits par concaténation pour que ce fichier
 * ne se déclenche pas lui-même au scan littéral.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { globSync } from "glob";

export type ForbiddenUiCopyHit = {
  file: string;
  lineNumber: number;
  ruleId: string;
  hint: string;
  excerpt: string;
};

/** Relatif à `src/` · fichiers où les interdits sont cités à des fins documentaires. */
const SKIP_REL_TO_SRC = new Set([
  "lib/copy/algo-voice.ts",
  "lib/copy/ui-strings.ts",
  "lib/copy/forbidden-ui-copy-scan.ts",
]);

function buildRules(): ReadonlyArray<{
  id: string;
  hint: string;
  matchLine: (line: string) => boolean;
}> {
  const oops = ["O", "o", "p", "s"].join("");
  const oups = ["O", "u", "p", "s"].join("");
  const chargementDots = ["Chargement", "..."].join("");
  const chargementEllipsis = ["Chargement", "\u2026"].join("");
  const loadingDots = ["Loading", "..."].join("");
  const loadingEllipsis = ["Loading", "\u2026"].join("");
  const somethingWrong = ["Something", " went wrong"].join("");
  const frGenericErr = ["Une erreur est ", "survenue"].join("");
  const frLoadErr = ["Erreur de ", "chargement"].join("");

  return [
    {
      id: "oops-en",
      hint: "Remplacer par la voix ALGO (pas d’« Oops »).",
      matchLine: (line) => line.toLowerCase().includes(oops.toLowerCase()),
    },
    {
      id: "oups-fr",
      hint: "Remplacer par la voix ALGO (pas d’« Oups »).",
      matchLine: (line) => line.includes(oups),
    },
    {
      id: "chargement-ascii",
      hint: "Utiliser ALGO_UI_LOADING ou une clé i18n radar.",
      matchLine: (line) => line.includes(chargementDots),
    },
    {
      id: "chargement-ellipsis",
      hint: "Utiliser ALGO_UI_LOADING ou une clé i18n radar.",
      matchLine: (line) => line.includes(chargementEllipsis),
    },
    {
      id: "loading-ascii",
      hint: "Utiliser une chaîne radar / i18n, pas « Loading... » générique.",
      matchLine: (line) => line.includes(loadingDots),
    },
    {
      id: "loading-ellipsis",
      hint: "Utiliser une chaîne radar / i18n, pas « Loading… » générique.",
      matchLine: (line) => line.includes(loadingEllipsis),
    },
    {
      id: "something-went-wrong",
      hint: "Message générique anglais · aligner sur ALGO_UI_ERROR ou i18n.",
      matchLine: (line) =>
        line.toLowerCase().includes(somethingWrong.toLowerCase()),
    },
    {
      id: "une-erreur-est-survenue",
      hint: "Utiliser state.error.generic i18n ou ALGO_UI_ERROR.message.",
      matchLine: (line) => line.includes(frGenericErr),
    },
    {
      id: "erreur-de-chargement",
      hint: "Utiliser ALGO_UI_ERROR.title / message ou i18n radar.",
      matchLine: (line) => line.includes(frLoadErr),
    },
  ];
}

const RULES = buildRules();

function trimExcerpt(s: string, max = 120): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/**
 * Parcourt les fichiers .ts et .tsx sous `src` (hors .d.ts et fichiers documentaires listés).
 * `srcRoot` = chemin absolu du dossier `src`.
 */
export function scanSrcForForbiddenUiCopy(
  srcRoot: string,
): ForbiddenUiCopyHit[] {
  const hits: ForbiddenUiCopyHit[] = [];
  const files = globSync("**/*.{ts,tsx}", {
    cwd: srcRoot,
    nodir: true,
    ignore: ["**/*.d.ts", "**/*.test.ts", "**/*.test.tsx"],
  }).sort();

  for (const rel of files) {
    const norm = rel.replace(/\\/g, "/");
    if (SKIP_REL_TO_SRC.has(norm)) continue;

    const abs = path.join(srcRoot, rel);
    let content: string;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const rule of RULES) {
        if (rule.matchLine(line)) {
          hits.push({
            file: norm,
            lineNumber: idx + 1,
            ruleId: rule.id,
            hint: rule.hint,
            excerpt: trimExcerpt(line),
          });
        }
      }
    });
  }

  return hits;
}

/** Racine `src/` du dépôt (cwd Vitest = racine projet). */
export function defaultSrcRoot(): string {
  return path.resolve(process.cwd(), "src");
}
