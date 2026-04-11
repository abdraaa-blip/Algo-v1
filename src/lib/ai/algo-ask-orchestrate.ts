/**
 * Point d’entrée orchestré pour `/api/ai/ask` : fusionne contexte client + signaux serveur
 * avant l’appel au modèle · sans routeur lourd ni modules multiples.
 */

import { askAlgo } from '@/lib/ai/algo-brain'
import { buildAlgoAskFallbackResponse } from '@/lib/ai/algo-ask-fallback'
import type { AlgoAskStructured } from '@/lib/ai/algo-ask-contract'
import type { AlgoExpertiseLevel } from '@/lib/ai/algo-persona'
import type { AlgoAskRoute } from '@/core/router'
import { buildLiveTrendsPayload } from '@/lib/api/live-trends-query'
import { validators } from '@/lib/security'

export type AskOrchestrationMeta = {
  /** Tendances injectées côté serveur (client n’en a pas fourni). */
  serverEnrichedTrends: boolean
  trendTitlesPassedToModel: number
  region: string
}

function normalizeCountry(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const c = raw.trim().toUpperCase()
  return validators.countryCode(c) ? c : null
}

/** True si on doit lire les tendances live (évite un appel quand le client a déjà fourni des titres). */
export function shouldServerEnrichTrends(
  clientTrends: string[] | undefined,
  opts?: { serverEnrich?: boolean }
): boolean {
  if (opts?.serverEnrich === false) return false
  const list = clientTrends?.filter((t) => typeof t === 'string' && t.trim()) ?? []
  return list.length === 0
}

/**
 * Assemble le contexte final pour `askAlgo` : tendances client + complément serveur si besoin.
 */
export async function orchestrateAskAlgo(input: {
  question: string
  clientContext?: { currentTrends?: string[]; userCountry?: string }
  /** Code pays optionnel (body API) si absent du contexte client. */
  countryHint?: string | null
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  expertiseLevel?: AlgoExpertiseLevel
  serverEnrich?: boolean
  algoAskRoute?: AlgoAskRoute
  routeHintLines?: string[]
}): Promise<{ answer: string; structured?: AlgoAskStructured; meta: AskOrchestrationMeta }> {
  const clientTrends =
    input.clientContext?.currentTrends?.filter((t) => typeof t === 'string' && t.trim()) ?? []

  const country =
    normalizeCountry(input.clientContext?.userCountry) ??
    normalizeCountry(input.countryHint) ??
    null

  let trends = [...clientTrends]
  let serverEnriched = false

  if (shouldServerEnrichTrends(input.clientContext?.currentTrends, { serverEnrich: input.serverEnrich })) {
    try {
      const payload = await buildLiveTrendsPayload(country)
      const titles = payload.data
        .slice(0, 18)
        .map((t) => t.title)
        .filter((t) => typeof t === 'string' && t.trim())
      if (titles.length) {
        trends = titles
        serverEnriched = true
      }
    } catch (e) {
      console.warn('[algo-ask-orchestrate] enrichissement tendances indisponible:', e)
    }
  }

  const userCountryLabel = country || input.clientContext?.userCountry?.trim() || 'global'

  let answer: string
  let structured: AlgoAskStructured | undefined
  try {
    const out = await askAlgo(
      input.question,
      {
        currentTrends: trends,
        userCountry: userCountryLabel,
        algoAskRoute: input.algoAskRoute,
        routeHintLines: input.routeHintLines,
      },
      {
        conversationHistory: input.conversationHistory,
        expertiseLevel: input.expertiseLevel,
      }
    )
    answer = out.answer
    structured = out.structured
  } catch (err) {
    console.warn('[algo-ask-orchestrate] askAlgo exception · repli synthèse', err)
    answer = buildAlgoAskFallbackResponse(input.question, {
      userCountry: userCountryLabel,
      firstTrendTitle: trends[0],
    })
    structured = undefined
  }

  return {
    answer,
    structured,
    meta: {
      serverEnrichedTrends: serverEnriched,
      trendTitlesPassedToModel: trends.length,
      region: country || 'ALL',
    },
  }
}
