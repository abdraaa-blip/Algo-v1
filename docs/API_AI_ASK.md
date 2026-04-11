# `POST /api/ai/ask`

Q&R ALGO AI via la façade **`processAlgoAiRequest`** (`src/core/system.ts`) : route heuristique (`src/core/router.ts`), indices par intention (`src/core/system-data.ts`), puis **`centralAsk`** → enrichissement tendances optionnel, modèle, enveloppe stable et contrôle qualité léger.

Le pipeline d’exécution modèle reste **`orchestrateAskAlgo`** → **`askAlgo`** (`algo-brain.ts`).

## Requête

`Content-Type: application/json`

| Champ | Type | Obligatoire | Description |
|--------|------|-------------|-------------|
| `question` | string | oui | Question utilisateur. |
| `context` | object | non | `{ currentTrends?: string[]; userCountry?: string }` |
| `conversationHistory` | array | non | Max ~12 tours : `{ role: 'user' \| 'assistant'; content: string }`. |
| `expertiseLevel` | string | non | `novice` \| `intermediate` \| `advanced` |
| `country` | string | non | Code pays ISO2 si absent de `context.userCountry`. |
| `serverEnrich` | boolean | non | `false` pour ne pas fetch les tendances live côté serveur. Si absent et route **TENDANCES** sans titres dans `context`, le système peut activer l’enrichissement serveur automatiquement. |

## Réponse (200)

| Champ | Type | Description |
|--------|------|-------------|
| `success` | boolean | `true` si succès (y compris repli dégradé avec texte utile). |
| `kind` | string | `algo.ai_ask` |
| `answer` | string | Texte principal (voix ALGO). |
| `standard` | object | **Toujours présent** · `{ comprehension, reponse, action }` (clés FR · dérivées du texte + contrat). |
| `quality` | object | `{ isClear, isUseful, isCoherent }` · heuristiques internes, pas un jugement humain. |
| `systemRoute` | string | `TRENDS` \| `VIRAL` \| `STRATEGY` \| `GENERAL` · détection mots-clés (transparence). |
| `systemConfidence` | number | Entre ~0,66 et 0,93 · **indicateur interne**, pas une probabilité garantie. |
| `degraded` | boolean | **Optionnel** · `true` si repli (rate limit, corps illisible, question absente, exception pipeline). |
| `structured` | object | **Optionnel** · présent seulement si le modèle remplit le bloc décision. |
| `structured.options` | array | `{ title, upside?, downside? }[]` |
| `structured.recommendedChoice` | object | `{ title, criterion? }` |
| `structured.nextStep` | string | Prochain pas concret. |
| `answeredAt` | string | ISO8601 |
| `contextMeta` | object | `serverEnrichedTrends`, `trendTitlesPassedToModel`, `region` |
| `transparencyLines` | string[] | Provenance / limites / route / confiance système (FR). |

## Exemple minimal

```http
POST /api/ai/ask
```

```json
{
  "question": "Par quoi commencer cette semaine sur ma chaîne ?",
  "context": { "userCountry": "FR", "currentTrends": ["IA créative", "formats courts"] },
  "expertiseLevel": "intermediate"
}
```

```json
{
  "success": true,
  "kind": "algo.ai_ask",
  "answer": "…",
  "standard": {
    "comprehension": "Lecture de ta demande : « … ».",
    "reponse": "…",
    "action": "…"
  },
  "quality": { "isClear": true, "isUseful": true, "isCoherent": true },
  "systemRoute": "GENERAL",
  "systemConfidence": 0.88,
  "structured": {
    "options": [
      { "title": "Série tutos niche", "upside": "Stock durable", "downside": "Lent au démarrage" }
    ],
    "recommendedChoice": { "title": "…", "criterion": "…" },
    "nextStep": "…"
  },
  "answeredAt": "2026-04-09T12:00:00.000Z",
  "contextMeta": { "serverEnrichedTrends": false, "trendTitlesPassedToModel": 2, "region": "FR" },
  "transparencyLines": ["…", "Route système : GENERAL (heuristique mots-clés).", "Confiance système (indicateur interne, pas une garantie) : 0.88."]
}
```

Schéma Zod côté serveur : `src/lib/ai/algo-ask-contract.ts`. Rate limit : **30 req / min** par client (IP + UA tronquée).
