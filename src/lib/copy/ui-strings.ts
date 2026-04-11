/**
 * Chaînes UI partagées (alignées tone-guide / algo-voice).
 * Radar / signaux, tutoiement, pas de « Chargement… » générique ni « Oops ».
 */

export const ALGO_UI_LOADING = {
  root: 'Lecture des signaux…',
  about: 'Lecture des signaux…',
  videos: 'Lecture des flux vidéo…',
  news: "Lecture de l'actualité…",
  music: 'Lecture des charts…',
  movies: 'Lecture des sorties…',
  trends: 'Lecture des tendances…',
  trending: 'Lecture des tendances…',
  stars: 'Lecture des profils…',
  risingStars: 'Lecture des rising stars…',
  watchlist: 'Lecture de ta watchlist…',
  favorites: 'Lecture des favoris…',
  profile: 'Synchronisation du profil…',
  settings: 'Synchronisation des réglages…',
  search: 'Recherche dans le radar…',
  monitor: 'Synchronisation du monitor…',
  content: 'Lecture du contenu…',
  creator: 'Lecture du mode créateur…',
  viral: 'Analyse virale en cours…',
  algorithm: 'Lecture de la méthode…',
  failLab: 'Lecture des cas…',
  designSystem: 'Lecture des signaux…',
  onboarding: 'Préparation de ton espace…',
  status: 'Vérification du statut…',
  aiSending: 'ALGO AI croise tendances, ton contexte et les modules…',
  homeSignals: 'Lecture des signaux du jour…',
  trendsPage: 'Lecture des tendances…',
  creatorTrending: 'Lecture des contenus en traction…',
  viralPage: 'Lecture des signaux viraux…',
  failLabPage: 'Lecture des échecs analysables…',
  coreIntelligence: 'Lecture du noyau d\'analyse…',
  contentIdeas: 'Lecture des idées de contenu…',
  nowNews: 'Lecture des actualités…',
} as const

/** CTA erreurs / états vides (orthographe unique : « Réessayer » avec deux « e »). */
export const ALGO_UI_RETRY = { label: 'Réessayer' } as const

export const ALGO_UI_ERROR = {
  title: 'Signal perdu',
  message: 'Impossible de charger pour l\'instant. Réessaie dans un moment.',
  pageTitle: 'Signal perdu sur cette page',
} as const

export const ALGO_UI_EMPTY = {
  title: 'Rien à afficher ici',
  message: 'Le radar ne capte rien pour le moment. Élargis ta recherche ou reviens plus tard.',
} as const

export const ALGO_UI_OFFLINE = {
  title: 'Connexion instable',
  message: 'Vérifie le réseau puis réessaie : les données peuvent être en retard.',
  banner: 'Hors ligne : les données affichées peuvent être obsolètes',
} as const

/** Panneau transparence : carte fiabilité des sources (API + UI intelligence). */
export const ALGO_DATA_RELIABILITY_PANEL = {
  summary: 'Carte fiabilité des sources (baseline, fallbacks, limites)',
  note: 'Les scores affichés sont des ordres de grandeur produit, pas des métriques mesurées en temps réel sur chaque requête.',
  apiPath: '/api/meta/data-reliability',
  loading: 'Lecture de la carte…',
  errorShort: 'Carte indisponible pour le moment. Réessaie plus tard.',
  linkTransparency: 'Page transparence',
} as const

/** Radar « opportunités produit » : signaux dérivés des tendances, pas de commerce sur ALGO. */
/** Monétisation : valeur (temps, décisions, avance) — pas de promesses de résultats. */
export const ALGO_BILLING = {
  sectionTitle: 'ALGO Pro',
  valuePitch:
    'L\'idée : te faire gagner du temps, des décisions plus claires et un peu d\'avance sur le signal — pas empiler des boutons inutiles.',
  freeLabel: 'Offre actuelle : accès gratuit',
  proPitch:
    'Pro regroupera analyse plus poussée, historiques utiles et IA moins bridée quand le paiement sera relié à ton compte (Stripe + statut serveur).',
  checkoutCta: 'Voir le paiement Stripe',
  checkoutUnavailable: 'Paiement : en attente de configuration côté serveur (clés Stripe + prix).',
  checkoutRequiresLogin: 'Connecte-toi (compte ALGO) pour ouvrir le paiement Stripe.',
  checkoutError: 'Impossible d\'ouvrir le paiement pour l\'instant. Réessaie plus tard.',
  planLabelFree: 'Plan actuel : gratuit',
  planLabelPro: 'Plan actuel : Pro (Stripe)',
  proCheckoutDone: 'Ton abonnement est actif côté profil. Renouvellement et factures : portail Stripe (lien e-mail ou dashboard Stripe).',
  portalCta: 'Gérer l\'abonnement (Stripe)',
  portalError: 'Impossible d\'ouvrir le portail pour l\'instant. Réessaie plus tard.',
  successNote: 'Paiement initié ou réussi côté Stripe : le passage en Pro dans l\'app suivra la connexion webhook (à brancher).',
  cancelNote: 'Paiement annulé. Tu restes sur l\'offre gratuite.',
} as const

export const ALGO_PRODUCT_RADAR = {
  cardTitle: 'Radar produit',
  cardIntro:
    'Angles marché détectés à partir du corpus tendances / opportunités. Indicateurs seulement, pas de catalogue ni de vente ici.',
  disclaimer:
    'Pas une boutique : tu restes responsable de fournisseurs, légalité, marge et conformité. Ce radar ne remplace pas ta propre veille.',
  ctaTrends: 'Voir les tendances',
  empty: 'Aucun angle produit mis en avant pour ce corpus. Reviens après le prochain rafraîchissement.',
} as const
