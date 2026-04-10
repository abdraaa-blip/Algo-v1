# `POST /api/ai/ask`

Q&R ALGO AI via `centralAsk` (enrichissement tendances optionnel + sortie structurée).

## Requête

`Content-Type: application/json`

| Champ | Type | Obligatoire | Description |
|--------|------|-------------|-------------|
| `question` | string | oui | Question utilisateur. |
| `context` | object | non | `{ currentTrends?: string[]; userCountry?: string }` |
| `conversationHistory` | array | non | Max ~12 tours : `{ role: 'user' \| 'assistant'; content: string }`. |
| `expertiseLevel` | string | non | `novice` \| `intermediate` \| `advanced` |
| `country` | string | non | Code pays ISO2 si absent de `context.userCountry`. |
| `serverEnrich` | boolean | non | `false` pour ne pas fetch les tendances live côté serveur. |

## Réponse (200)

| Champ | Type | Description |
|--------|------|-------------|
| `success` | boolean | `true` si succès. |
| `kind` | string | `algo.ai_ask` |
| `answer` | string | Texte principal (voix ALGO). |
| `structured` | object | **Optionnel** — présent seulement si le modèle remplit le bloc décision. |
| `structured.options` | array | `{ title, upside?, downside? }[]` |
| `structured.recommendedChoice` | object | `{ title, criterion? }` |
| `structured.nextStep` | string | Prochain pas concret. |
| `answeredAt` | string | ISO8601 |
| `contextMeta` | object | `serverEnrichedTrends`, `trendTitlesPassedToModel`, `region` |
| `transparencyLines` | string[] | Provenance / limites (FR). |

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
  "structured": {
    "options": [
      { "title": "Série tutos niche", "upside": "Stock durable", "downside": "Lent au démarrage" }
    ],
    "recommendedChoice": { "title": "…", "criterion": "…" },
    "nextStep": "…"
  },
  "answeredAt": "2026-04-09T12:00:00.000Z",
  "contextMeta": { "serverEnrichedTrends": false, "trendTitlesPassedToModel": 2, "region": "FR" },
  "transparencyLines": ["…"]
}
```

Schéma Zod côté serveur : `src/lib/ai/algo-ask-contract.ts`. Rate limit : **30 req / min** par client (IP + UA tronquée).
