// =============================================================================
// ALGO V1 — Types stricts centralisés
// Source de vérité absolue. Aucun any. Aucun objet non typé.
// =============================================================================

// ─── Scalaires ───────────────────────────────────────────────────────────────

export type Platform =
  | 'TikTok'
  | 'Instagram'
  | 'YouTube'
  | 'Twitter'
  | 'Snapchat'
  | 'Reddit'
  | 'Other'

export type Category =
  | 'Drôle'
  | 'Insolite'
  | 'Buzz'
  | 'Émotion'
  | 'Drama'
  | 'Lifestyle'
  | 'Culture'
  | 'Actu'
  | 'Autre'

export type BadgeType =
  | 'Viral'
  | 'Early'
  | 'Breaking'
  | 'Trend'
  | 'AlmostViral'

export type GrowthTrend = 'up' | 'stable' | 'down'

export type TimingStatus = 'now' | 'too_early' | 'too_late'

export type PostProbability = 'high' | 'medium' | 'low'

export type ContentFormat =
  | 'face_cam'
  | 'text'
  | 'montage'
  | 'narration'
  | 'duet'
  | 'reaction'

export type UserProfileType = 'creator' | 'spectator'

export type MomentumLevel = 'high' | 'medium' | 'low' | 'exploding' | 'peaked' | 'cooling'

export type PostWindowStatus = 'optimal' | 'saturated' | 'fading'

export type Locale = 'fr' | 'en' | 'es' | 'de' | 'ar'

// ─── Country Scope System ─────────────────────────────────────────────────────
// Couche centrale du produit. Pilote NOW, Trends, Videos, News, Search, Watchlist.
// Pas de routes par pays — filtrage via state global uniquement.

export type AppScope =
  | { type: 'global' }
  | { type: 'region'; code: string; name: string }
  | { type: 'country'; code: string; name: string }

// ─── Country ──────────────────────────────────────────────────────────────────

export interface Country {
  code: string
  name: Record<Locale, string>
  flag: string
}

// ─── Insight Engine ───────────────────────────────────────────────────────────

export interface PostWindow {
  status: PostWindowStatus
}

export interface Insight {
  postNowProbability: PostProbability
  timing: TimingStatus
  bestPlatform: Platform[]
  bestFormat: ContentFormat
  timingLabel: Record<Locale, string>
  postWindow: PostWindow
}

// ─── Signal Source ────────────────────────────────────────────────────────────

export interface SourceSignal {
  platform: Platform
  percentage: number // 0–100
  momentum: MomentumLevel
}

// ─── Asset Pack (Creator Mode) ────────────────────────────────────────────────

export interface AssetPack {
  soundUrl?: string    // lien externe uniquement
  templateUrl?: string // lien externe uniquement
}

// ─── Content ──────────────────────────────────────────────────────────────────

export interface Content {
  id: string
  title: string
  category: Category
  platform: Platform
  country: string        // code ISO — ex: 'FR'
  language: string       // code IETF — ex: 'fr'
  viralScore: number     // 0–100
  badge: BadgeType
  views?: number
  growthRate: number     // % de croissance — peut être négatif
  growthTrend: GrowthTrend
  detectedAt: string     // ISO 8601
  thumbnail?: string
  sourceUrl: string
  explanation: string
  creatorTips: string
  failReason?: string    // présent si badge === 'AlmostViral' ou growthTrend === 'down'
  insight: Insight
  sourceDistribution: SourceSignal[]
  watchersCount: number
  isExploding: boolean
  assetPack?: AssetPack
}

// ─── Trend ────────────────────────────────────────────────────────────────────

export interface Trend {
  id: string
  name: string
  platform: Platform
  category: Category
  growthRate: number
  growthTrend: GrowthTrend
  score: number          // 0–100
  relatedContentIds: string[]
  explanation: string
  recommendedFormat: ContentFormat[]
  associatedSound?: string
  country: string
  language: string
  watchersCount: number
  isExploding: boolean
}

// ─── News ─────────────────────────────────────────────────────────────────────

export interface NewsItem {
  id: string
  title: string
  summary: string
  importanceScore: number // 0–100
  speedScore: number      // 0–100
  tags: string[]
  sourceUrl: string
  detectedAt: string
  country: string
  language: string
  relatedContentIds: string[]
  thumbnail?: string      // image URL from news source
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export interface WatchlistItem {
  id: string
  userId: string
  trendId: string
  addedAt: string
  lastScore: number
  isExploding: boolean
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export interface UserPreferences {
  userId: string
  language: Locale
  country: string
  profileType: UserProfileType
  interests: Category[]
  geolocationAllowed: boolean
  watchlist: string[]
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface FilterOption {
  id: string
  label: string
  value: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type TrackEvent =
  | 'content_viewed'
  | 'trend_followed'
  | 'trend_unfollowed'
  | 'content_liked'
  | 'content_saved'
  | 'creator_mode_opened'
  | 'early_signal_clicked'
  | 'insight_viewed'
  | 'search_performed'
  | 'locale_changed'
  | 'scope_changed'
  | 'geoloc_granted'
  | 'geoloc_refused'
  | 'onboarding_completed'

export interface TrackPayload {
  event: TrackEvent
  props?: Record<string, string | number | boolean>
}

// ─── Viral Score (Logic Layer) ────────────────────────────────────────────────

export interface ViralScoreInput {
  growthRate: number
  views?: number
  watchersCount: number
  isExploding: boolean
  sourceDistributionCount: number
}

export type ScoreGrade = 'elite' | 'high' | 'medium' | 'low'

// ─── Trend Tab ─────────��──────────────────��───────────────────────────────────

export type TrendTab =
  | 'today'
  | 'week'
  | 'month'
  | 'mostViewed'
  | 'mostPlayed'
  | 'mostCopied'
  | 'emerging'

// ─── UX States ────────────────────────────────────────────────────────────────

export type UXState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error'
  | 'offline'
  | 'auth_required'
  | 'geoloc_refused'
