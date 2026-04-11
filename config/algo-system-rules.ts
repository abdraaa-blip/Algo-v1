/**
 * ALGO · règles design & UI centralisées (mémoire projet pour agents et humains).
 *
 * **Ne pas dupliquer** les palettes complètes ici : la source numérique des couleurs,
 * espacements et durées reste `src/design-system/tokens.ts` et le reflet CSS
 * `src/app/globals.css` (@theme + `data-algo-view`). `src/lib/design-tokens.ts` complète
 * pour spacing / sémantique TS.
 *
 * Rôle de ce fichier : règles **stables**, **chemins canoniques**, **patterns UI**
 * et politiques (animations, layout, cohérence) à appliquer sur tout nouveau code front.
 *
 * Tests Vitest : `src/lib/__tests__/algo-system-rules-config.test.ts`.
 *
 * QA / validation transverse : `config/algo-qa-gate.ts` (checklist + commandes release).
 * Pré-déploiement : `config/algo-deploy-gate.ts`.
 *
 * Pont « évolution-friendly » (éviter une 2ᵉ charte isolée) : `docs/ALGO_DESIGN_EVOLUTION.md`.
 * Charte UX globale (human-first, fond, motion, a11y) : `docs/ALGO_UX_CHARTER.md`.
 * Audit charge cognitive & parcours (protocole par écran) : `docs/ALGO_UX_COGNITIVE_AUDIT.md`.
 * Maturité release (rubric qualitative, liens CI / deploy gate) : `docs/ALGO_RELEASE_READINESS.md`.
 * Positionnement / GTM (brouillon produit, sous doctrine) : `docs/ALGO_GTM_NOTES.md`.
 * Index navigation `docs/` : `docs/README.md`.
 * Opérations & déploiement (point d’entrée unique) : `docs/ALGO_OPERATIONS_PLAYBOOK.md`.
 */

export { tokens } from '../src/design-system/tokens'
export type { Tokens } from '../src/design-system/tokens'

/** Fichiers sources de vérité (à consulter avant d’inventer de nouvelles valeurs). */
export const ALGO_DESIGN_SOURCES = {
  visualTokens: 'src/design-system/tokens.ts',
  globalsTheme: 'src/app/globals.css',
  spacingAndSemanticColors: 'src/lib/design-tokens.ts',
  designSystemLab: 'src/app/design-system/page.tsx',
  copyVoice: 'src/lib/copy/algo-voice.ts',
  uiStrings: 'src/lib/copy/ui-strings.ts',
  toneGuide: 'locales/tone-guide.md',
  forbiddenCopyScan: 'src/lib/copy/forbidden-ui-copy-scan.ts',
  designEvolutionBridge: 'docs/ALGO_DESIGN_EVOLUTION.md',
  uxCharter: 'docs/ALGO_UX_CHARTER.md',
  uxCognitiveAudit: 'docs/ALGO_UX_COGNITIVE_AUDIT.md',
  releaseReadiness: 'docs/ALGO_RELEASE_READINESS.md',
  operationsPlaybook: 'docs/ALGO_OPERATIONS_PLAYBOOK.md',
} as const

/**
 * Règles système persistantes (texte + contraintes) · alignées globals + tokens.
 * Mise à jour : quand une règle change dans le design system, **éditer ce bloc**
 * et, si besoin, les fichiers listés dans `ALGO_DESIGN_SOURCES`.
 */
export const ALGO_SYSTEM_RULES = {
  identity: {
    name: 'ALGO',
    aesthetic: 'Radar sombre, précis, lisible · pas de néon agressif ni de skeuomorphisme lourd.',
  },

  colors: {
    principle:
      'Toujours préférer les **variables CSS** (`var(--color-*)`) dans les composants et pages pour rester branché sur `@theme` et `data-algo-view`.',
    accents:
      'Violet dominant (#7B61FF / --color-violet), cyan / bleu néon pour données vivantes, vert signal pour positif, rouge réservé aux alertes.',
    textHierarchy:
      'Hiérarchie via --color-text-primary → secondary → tertiary → muted ; jamais de gris arbitraire hors tokens.',
  },

  experience: {
    charter: 'Philosophie UX human-first, fond unique, motion, accessibilité : `docs/ALGO_UX_CHARTER.md` (complète ce fichier, ne le duplique pas en long).',
    cognitiveAudit:
      'Protocole revue par page / module (compréhension, fatigue, scroll, intention, lecture multi-profils heuristique) : `docs/ALGO_UX_COGNITIVE_AUDIT.md`.',
    releaseReadiness:
      'Maturité release : rubrique qualitative six axes + preuves (CI, deploy gate) — **pas** de score global 0–100 : `docs/ALGO_RELEASE_READINESS.md`.',
    intent:
      'Fluide, lisible, stable, non intrusive · « wow calme ». Hiérarchie essentiel / secondaire / décoratif minimal ; viser peu de niveaux visuels simultanés sur un écran.',
    accessibility:
      'Focus clavier visible, contrastes via tokens, pas d’info uniquement par la couleur ; `prefers-reduced-motion` (canvas vivant → repli statique, CSS `@media reduce`).',
    cognitiveAlignment:
      'Agents · UI & copy : simplifier, hiérarchiser, résumé → détails → action ; pas de manipulation ni dark patterns — section « Alignement cognitif » dans `docs/ALGO_UX_CHARTER.md` (ne remplace pas `algo-persona` / Q&R).',
  },

  layout: {
    structure:
      'Mobile-first ; largeurs de lecture maîtrisées (`max-w-*` + `mx-auto` + `px-*` cohérents) ; éviter le scroll horizontal involontaire (`overflow-x` + `overscroll-behavior-x` sur `html`/`body`, chaîne **`ClientLayout` → `<main>` → flex** avec `w-full min-w-0 max-w-full overflow-x-clip`, `PageTransition` idem). Encoches : `viewportFit: cover` + `env(safe-area-inset-*)` sur **Navbar** / padding-top du **`<main>`**. Fonds `fixed` (**`AlgoLivingBackground`**, **`AlgoDataPlanet`**) : `max-w-full overflow-hidden` + `pointer-events: none`. Éviter de redéfinir `bg-[var(--color-bg-primary)]` sur chaque page racine sauf besoin isolé.',
    surfaces:
      'Cartes et panneaux : classes utilitaires **`algo-surface`** et **`algo-interactive`** (globals) pour bordure, rayon et transitions unifiées.',
    spacing:
      'Grille 4px implicite ; préférer les échelles Tailwind / `design-tokens` spacing plutôt que des marges magiques en px.',
  },

  animation: {
    policy:
      'Durées harmoniques (≈160–380ms UI, courbes longues 8–12s pour décor data uniquement). Easing : `ease-out` / `cubic-bezier` du thème, pas de bounce.',
    respectMotion:
      'Prévoir `@media (prefers-reduced-motion: reduce)` quand une animation n’est pas décorative pure (voir patterns existants dans globals).',
    noHeavyLibs:
      'Pas d’animation lib lourde pour du micro-feedback ; CSS + transitions suffisent.',
  },

  typography: {
    font: 'Inter, system-ui (voir --font-family-sans).',
    metrics:
      'Chiffres et scores : préférer `tabular-nums` / tokens.font.numeric pour l’alignement visuel.',
  },

  uiCopy: {
    voice: 'Tutoiement FR, radar/signaux, pas d’« Oops », pas de promesses magiques (voir algo-voice + tone-guide).',
    strings: 'Libellés partagés via `ui-strings.ts` ; scan interdits `forbidden-ui-copy-scan.ts`.',
  },

  coherence: {
    checklist: [
      'Nouvelle surface → variables CSS thème + pattern `algo-surface` si applicable.',
      'Nouvelle couleur hardcodée → interdit sauf décision explicite ; étendre tokens + globals.',
      'Nouvelle animation → respecter échelle de durées @theme (`--algo-duration-*`, `--duration-*`) + `prefers-reduced-motion` si ce n’est pas du pur décor.',
      'Nouvelle page → cohérente avec layout existant (header/footer, espacements).',
      'Module stabilisé → vérifier page `/design-system` (dev) si composant catalogue.',
      'Évolution UI notable → PR + revue ; pas de réorganisation auto du layout ; pont `docs/ALGO_DESIGN_EVOLUTION.md` si besoin de cadrage.',
    ],
    productionDesignLab: 'La page `design-system` est `notFound()` en production : banc de test local uniquement.',
  },
} as const

export type AlgoSystemRules = typeof ALGO_SYSTEM_RULES
