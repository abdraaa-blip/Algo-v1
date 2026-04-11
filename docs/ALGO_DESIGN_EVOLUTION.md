# Design ALGO — pont « évolution-friendly »

Ce fichier **ne remplace pas** la charte : il évite une **deuxième constitution** flottante et renvoie vers les **sources canoniques**.

## Sources de vérité (ordre de lecture)

| Sujet | Fichier / entrée |
|--------|------------------|
| Règles UI stables, tokens, animations | `config/algo-system-rules.ts` + `ALGO_DESIGN_SOURCES` |
| Charte UX globale (human-first, fond, motion, a11y) | **`docs/ALGO_UX_CHARTER.md`** |
| Audit cognitif & parcours (protocole par écran, multi-profils heuristique) | **`docs/ALGO_UX_COGNITIVE_AUDIT.md`** |
| Couleurs & thème CSS | `src/app/globals.css` (`@theme`), `src/design-system/tokens.ts` |
| Voix & copy | `src/lib/copy/algo-voice.ts`, `locales/tone-guide.md`, `ui-strings.ts` |
| Control room (métaphore « cerveau ») | **`docs/ALGO_CONTROL_ROOM.md`** — lecture / schéma, pas « pensée du modèle » |
| Évolution produit / technique hors hot path | **`docs/ALGO_OFFLINE_EVOLUTION.md`** |
| Checklist agent | `config/algo-qa-gate.ts` |
| Opérations, déploiement, smoke | **`docs/ALGO_OPERATIONS_PLAYBOOK.md`** |
| Maturité release (rubric qualitative) | **`docs/ALGO_RELEASE_READINESS.md`** |
| GTM / positionnement (brouillon, hors charte design code) | **`docs/ALGO_GTM_NOTES.md`** |
| Index navigation `docs/` | **`docs/README.md`** |

## Principes résumés (alignés repo)

- **Clarté & utilité** avant effet décoratif ; hiérarchie texte via `var(--color-text-*)` ; pour copy / structuration agent → section **Alignement cognitif** dans `docs/ALGO_UX_CHARTER.md`.
- **Pas de palette hex parallèle** : utiliser les **tokens** / variables thème déjà listées dans `algo-system-rules`.
- **ViralScoreRing** : une seule implémentation dans **`src/components/ui/ViralScoreRing.tsx`** (couleurs via `computeViralScore`, `role="meter"`) ; **`src/components/algo/ViralScoreRing.tsx`** réexporte pour les imports historiques ; prop **`size`** = preset `xs` | `sm` | `md` | `lg` **ou** nombre = diamètre extérieur en px (legacy).
- **LiveCurve** : implémentation complète **`src/components/ui/LiveCurve.tsx`** ; **`src/components/algo/LiveCurve.tsx`** est un léger wrapper (`rate` → `growthRate`, sans étoiles / sans ECG) pour les pages qui importent encore `@/components/algo/LiveCurve`.
- **ScopeSelector** : source unique **`src/components/layout/ScopeSelector.tsx`** (global, **régions**, pays, libellés intégrés). L’ancienne variante `ui/ScopeSelector` (non branchée) a été retirée pour éviter une deuxième vérité prod ; une future variante lab repartira d’un besoin explicite + import réel.
- **InsightPanel** : source unique **`src/components/ui/InsightPanel.tsx`** (`labels` + type **`Insight`**). Le **mode créateur** (`src/app/creator-mode/page.tsx`) utilise l’adaptateur **`src/lib/creator-mode/creator-insight-panel.ts`** pour mapper l’insight léger live → `Insight` + **`CREATOR_MODE_INSIGHT_LABELS`**.
- **Mobile-first**, surfaces `algo-surface` / `algo-interactive`, animations dans l’échelle documentée + `prefers-reduced-motion`.
- **Perf / Vercel** : éviter dépendances lourdes pour du simple feedback ; `npm run verify:release` avant d’élargir l’effet « data vivant ».
- **Fond global** : porté par `src/app/globals.css` (`html` / `body`) + `ClientLayout` (`AlgoLivingBackground` en `fixed`, `pointer-events: none`). Pas de `bg-black` parallèle : utiliser **`--color-bg-primary`**. Les pages n’ont pas besoin de répéter le fond sauf cas isolé.

## Comment « faire évoluer » le design (réellement)

- **Pull requests** + revue (humain ou rituel cohérence) + tests / lint — **pas** de réorganisation auto du layout par un agent ou un runtime.
- Toute évolution large : mettre à jour **`config/algo-system-rules.ts`** (ou tokens/globals), pas seulement ce pont.

## Voir aussi

- `docs/ALGO_OPERATIONS_PLAYBOOK.md`
- `docs/ALGO_CONTROL_ROOM.md`
- `docs/ALGO_COHERENCE_RITUAL.md`
