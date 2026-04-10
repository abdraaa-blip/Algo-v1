// =============================================================================
// ALGO V1 — analyticsService
// Instrumentation des événements clés pour préparer l'analytics futur.
// En V1 : no-op en development. En production : log structuré.
// En V2 : brancher Posthog, Plausible ou Mixpanel ici.
// =============================================================================

import type { TrackEvent } from '@/types'

type TrackProps = Record<string, string | number | boolean | null>

/**
 * Enregistre un événement produit.
 * Typé strictement via TrackEvent pour éviter les chaînes arbitraires.
 */
export function track(event: TrackEvent, props?: TrackProps): void {
  if (typeof window === 'undefined') return

  if (process.env.NODE_ENV === 'production') {
    // V2 : brancher ici
    // posthog.capture(event, props)
    // plausible(event, { props })
    console.info('[ALGO Track]', event, props ?? {})
  }

  // En développement : log discret pour débogage
  if (process.env.NODE_ENV === 'development') {
    console.debug('[ALGO Track]', event, props ?? {})
  }
}

/**
 * Événements à instrumenter dès la V1 :
 *
 * content_viewed       — ouverture d'une fiche contenu
 * trend_followed       — ajout à la Watchlist
 * trend_unfollowed     — retrait de la Watchlist
 * content_liked        — like d'un contenu
 * content_saved        — sauvegarde en favoris
 * creator_mode_opened  — ouverture du Creator Mode
 * early_signal_clicked — clic sur un contenu badge Early
 * insight_viewed       — scroll jusqu'à l'InsightPanel
 * search_performed     — soumission d'une recherche
 * locale_changed       — changement de langue
 * scope_changed        — changement de zone (Global / Pays)
 * geoloc_granted       — consentement géolocalisation accordé
 * geoloc_refused       — consentement géolocalisation refusé
 * onboarding_completed — fin de l'onboarding
 */
