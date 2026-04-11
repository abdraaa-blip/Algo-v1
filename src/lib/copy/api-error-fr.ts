/**
 * Traduction légère des messages d\'erreur techniques (EN) affichés côté UI FR.
 * Les messages déjà en français ou spécifiques (ex. Supabase) passent tels quels
 * si aucune règle ne correspond.
 */

const RATE_LIMIT_FR = 'Trop de requêtes pour l\'instant. Réessaie dans un moment.'
const FAILED_FETCH_FR = 'Impossible de charger les données. Réessaie.'

const EXACT: Record<string, string> = {
  'Unknown error': 'Erreur inconnue. Réessaie.',
  'Failed to fetch trends': 'Impossible de charger les tendances. Réessaie.',
  'Failed to fetch': FAILED_FETCH_FR,
  'Not authenticated': 'Connecte-toi pour continuer.',
  'Supabase not available': 'Service momentanément indisponible.',
  'Video not found': 'Vidéo introuvable.',
  'Request timeout': 'Délai dépassé. Réessaie.',
  'Rate limit exceeded': RATE_LIMIT_FR,
  'Failed to fetch music data': 'Impossible de charger la musique. Réessaie.',
  'Failed to fetch news': 'Impossible de charger l\'actualité. Réessaie.',
  'Failed to fetch stars': 'Impossible de charger les profils. Réessaie.',
  'Failed to fetch rising stars': 'Impossible de charger les rising stars. Réessaie.',
  'Failed to fetch content': 'Impossible de charger le contenu. Réessaie.',
  'Failed to fetch Twitch data': 'Impossible de charger Twitch. Réessaie.',
  'Failed to fetch Spotify data': 'Impossible de charger Spotify. Réessaie.',
  'Failed to fetch Reddit data': 'Impossible de charger Reddit. Réessaie.',
  'Failed to fetch GitHub data': 'Impossible de charger GitHub. Réessaie.',
  'Failed to build intelligence snapshot': 'Impossible de construire le snapshot intelligence. Réessaie.',
  'Failed to store feedback': 'Impossible d\'enregistrer le retour. Réessaie.',
  'Failed to store memory': 'Impossible d\'enregistrer la mémoire. Réessaie.',
  'Failed to run simulation': 'Impossible de lancer la simulation. Réessaie.',
  'Failed to generate briefing': 'Impossible de générer le briefing. Réessaie.',
  'Failed to process events': 'Impossible de traiter les événements. Réessaie.',
  'Failed to post comment': 'Impossible de publier le commentaire. Réessaie.',
  'Failed to submit report': 'Impossible d\'envoyer le signalement. Réessaie.',
  'Entry not found in active memory window': 'Entrée introuvable dans la fenêtre mémoire active.',
  'Item not found': 'Élément introuvable.',
  'Invalid login credentials': 'Identifiants invalides.',
  'Invalid email or password': 'Email ou mot de passe invalide.',
  'Email not confirmed': 'Email non confirmé. Vérifie ta boîte de réception.',
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Update failed': 'Mise à jour impossible. Réessaie.',
  'Fetch failed': 'Impossible de charger les données. Réessaie.',
}

export function mapUserFacingApiError(message: string | null | undefined): string {
  if (message == null || message.trim() === '') {
    return 'Signal indisponible pour l\'instant. Réessaie.'
  }
  const raw = message.trim()
  if (EXACT[raw]) return EXACT[raw]
  const lower = raw.toLowerCase()
  if (EXACT[lower]) return EXACT[lower]

  if (lower.includes('rate limit exceeded')) {
    return RATE_LIMIT_FR
  }
  if (/^failed to fetch\b/i.test(raw)) {
    return FAILED_FETCH_FR
  }
  if (lower === 'failed to fetch' || lower.includes('networkerror when attempting to fetch')) {
    return 'Impossible de joindre le serveur. Vérifie la connexion.'
  }

  const httpMatch = /^http\s+(\d{3})$/i.exec(raw)
  if (httpMatch) {
    const code = Number(httpMatch[1])
    if (code === 401) return 'Connecte-toi pour continuer.'
    if (code === 403) return 'Accès refusé pour cette ressource.'
    if (code === 404) return 'Ressource introuvable.'
    if (code >= 500) return 'Service momentanément indisponible.'
    return 'Impossible de charger les données. Réessaie.'
  }

  return raw
}
