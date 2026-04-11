/**
 * Connecteurs legacy — types partagés pour la couche algo (ai-brain, viral-score).
 * Les fetchers vivent plutôt dans `@/lib/datasources`.
 */

export interface ContentItem {
  title: string
  source: string
  tags?: string[]
  type?: 'video' | 'article' | 'repo' | 'stream' | 'track' | 'post'
  viralScore?: number
  url: string
  aiExplanation?: string
  isEarlySignal?: boolean
  category?: string
  /** Horodatage publication (ms). */
  publishedAt?: number
  metrics?: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
    upvotes?: number
  }
  author?: { followers?: number }
}
