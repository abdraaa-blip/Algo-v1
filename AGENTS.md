<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Copy & voix ALGO (FR)

- Référence code : `src/lib/copy/algo-voice.ts` (ADN, checklist, couche IA). Humain : `locales/tone-guide.md`.
- Chaînes UI partagées : `src/lib/copy/ui-strings.ts`. Scan copy interdit : `src/lib/copy/forbidden-ui-copy-scan.ts`.
- Tutoiement, radar/signaux, pas d’« Oops », pas de promesses magiques. Clarté > volume.

## IA & transparence

- Assemblage prompt : `src/lib/ai/algo-persona.ts` + `src/lib/ai/algo-directive-synthesis.ts`.
- Ask orchestré (contexte tendances) : `src/lib/ai/algo-ask-orchestrate.ts` → `POST /api/ai/ask`.
- Transparence utilisateur (textes + lignes API) : `src/lib/ai/ai-transparency.ts`.

## Checklist maître → réalité produit

- Tableau **état / preuves / chemins** : `docs/ALGO_CHECKLIST_PROOFS.md` (à tenir à jour).
- **Doctrine** (règles non négociables) : `docs/algo-doctrine.md`.
- **Central Brain (entrée Q&R)** : `src/core/brain.ts` → `centralAsk` → enrichissement + modèle.
- **Fiabilité data (carte)** : `src/lib/data/data-reliability-map.ts`.
