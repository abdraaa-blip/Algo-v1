'use client'

import { useState, useEffect, useCallback } from 'react'
import { mapUserFacingApiError } from '@/lib/copy/api-error-fr'
import Link from 'next/link'
import { 
  MessageCircle, Heart, Flag, MoreHorizontal, Send, 
  ChevronDown, ChevronUp, Shield, BadgeCheck, Loader2,
  Reply, Pin, LogIn
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { AvatarWithFallback } from '@/components/ui/ImageWithFallback'

interface Comment {
  id: string
  content_id: string
  user_id: string
  user_name: string
  user_avatar: string
  user_verified: boolean
  body: string
  created_at: string
  likes_count: number
  replies_count: number
  is_liked: boolean
  is_pinned: boolean
  sentiment: 'positive' | 'neutral' | 'negative'
  parent_id: string | null
  replies?: Comment[]
}

interface CommentSectionProps {
  contentId: string
  className?: string
}

export function CommentSection({ contentId, className }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'top' | 'controversial'>('newest')
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/comments?content_id=${contentId}&sort=${sortBy}`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch {
      setError('Impossible de charger les commentaires.')
    } finally {
      setLoading(false)
    }
  }, [contentId, sortBy])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated) return

    try {
      setPosting(true)
      setError(null)

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_id: contentId,
          body: newComment,
          parent_id: parentId || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Impossible de publier le commentaire.')
      }

      // Add new comment to list
      if (parentId) {
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), data.comment],
              replies_count: c.replies_count + 1,
            }
          }
          return c
        }))
      } else {
        setComments(prev => [data.comment, ...prev])
      }

      setNewComment('')
      setReplyingTo(null)
    } catch (err) {
      setError(
        mapUserFacingApiError(
          err instanceof Error ? err.message : 'Impossible de publier le commentaire.'
        )
      )
    } finally {
      setPosting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    if (!isAuthenticated) return

    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          is_liked: !c.is_liked,
          likes_count: c.is_liked ? c.likes_count - 1 : c.likes_count + 1,
        }
      }
      return c
    }))
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'maintenant'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-violet-400" />
          <h3 className="text-[var(--color-text-primary)] font-bold text-sm">
            Commentaires
            <span className="text-[var(--color-text-tertiary)] font-normal ms-1.5">({comments.length})</span>
          </h3>
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-violet-400/50"
        >
          <option value="newest">Plus récents</option>
          <option value="top">Plus aimés</option>
          <option value="controversial">Plus discutés</option>
        </select>
      </div>

      {/* New comment form */}
      {isAuthenticated ? (
        <form onSubmit={(e) => handleSubmit(e)} className="relative">
          <div className="flex gap-3">
            <AvatarWithFallback
              src={
                typeof user?.user_metadata?.avatar_url === 'string'
                  ? user.user_metadata.avatar_url
                  : undefined
              }
              name={user?.email || 'Toi'}
              size={32}
              className="shrink-0"
            />
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Partage ton avis..."
                maxLength={1000}
                rows={2}
                className={cn(
                  'w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text-primary)]',
                  'placeholder:text-[var(--color-text-muted)] resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-transparent',
                )}
              />
              <div className="absolute bottom-2 end-2 flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)]">{newComment.length}/1000</span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || posting}
                  className={cn(
                    'p-1.5 rounded-lg transition-all duration-150',
                    newComment.trim()
                      ? 'bg-violet-500 text-white hover:bg-violet-600'
                      : 'bg-[var(--color-card)] text-[var(--color-text-muted)] cursor-not-allowed',
                  )}
                >
                  {posting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-[var(--color-text-secondary)] text-sm mb-3">Connecte-toi pour commenter</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <LogIn size={16} />
            Se connecter
          </Link>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs flex items-center gap-2">
          <Shield size={14} />
          {error}
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="size-8 rounded-full bg-[var(--color-card)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[var(--color-card)] rounded w-24" />
                <div className="h-4 bg-[var(--color-card)] rounded w-full" />
                <div className="h-4 bg-[var(--color-card)] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle size={32} className="mx-auto text-[var(--color-text-muted)] mb-2" />
          <p className="text-[var(--color-text-tertiary)] text-sm">Sois le premier a commenter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={handleLike}
              onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
              replyingTo={replyingTo}
              onSubmitReply={(e, parentId) => handleSubmit(e, parentId)}
              newComment={newComment}
              setNewComment={setNewComment}
              posting={posting}
              formatTime={formatTime}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  onLike: (id: string) => void
  onReply: (id: string) => void
  replyingTo: string | null
  onSubmitReply: (e: React.FormEvent, parentId: string) => void
  newComment: string
  setNewComment: (value: string) => void
  posting: boolean
  formatTime: (date: string) => string
  isAuthenticated: boolean
  isReply?: boolean
}

function CommentItem({
  comment,
  onLike,
  onReply,
  replyingTo,
  onSubmitReply,
  newComment,
  setNewComment,
  posting,
  formatTime,
  isAuthenticated,
  isReply = false,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const sentimentColors = {
    positive: 'border-s-emerald-500/50',
    neutral: 'border-s-[var(--color-border)]',
    negative: 'border-s-orange-500/50',
  }

  return (
    <div className={cn('group', isReply && 'ms-11')}>
      <div className={cn(
        'flex gap-3 p-3 rounded-xl bg-[var(--color-card)] border-s-2 transition-all duration-150',
        'hover:bg-[var(--color-card-hover)]',
        sentimentColors[comment.sentiment],
        comment.is_pinned && 'bg-violet-500/5 border-s-violet-500/50',
      )}>
        {/* Avatar */}
        <AvatarWithFallback
          src={comment.user_avatar}
          name={comment.user_name}
          size={32}
          className="shrink-0"
        />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--color-text-primary)] font-semibold text-sm truncate">
              {comment.user_name}
            </span>
            {comment.user_verified && (
              <BadgeCheck size={12} className="text-violet-400 shrink-0" />
            )}
            {comment.is_pinned && (
              <span className="flex items-center gap-0.5 text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">
                <Pin size={8} />
                Epingle
              </span>
            )}
            <span className="text-[var(--color-text-muted)] text-xs">{formatTime(comment.created_at)}</span>
          </div>

          {/* Body */}
          <p className="text-[var(--color-text-secondary)] text-sm mt-1 whitespace-pre-wrap break-words">
            {comment.body}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(comment.id)}
              disabled={!isAuthenticated}
              className={cn(
                'flex items-center gap-1 text-xs transition-all duration-150',
                comment.is_liked
                  ? 'text-red-400'
                  : 'text-[var(--color-text-tertiary)] hover:text-red-400',
                !isAuthenticated && 'cursor-not-allowed opacity-50',
              )}
            >
              <Heart size={14} fill={comment.is_liked ? 'currentColor' : 'none'} />
              <span>{comment.likes_count}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => onReply(comment.id)}
                disabled={!isAuthenticated}
                className={cn(
                  'flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors',
                  !isAuthenticated && 'cursor-not-allowed opacity-50',
                )}
              >
                <Reply size={14} />
                <span>Repondre</span>
              </button>
            )}

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={14} />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute end-0 mt-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-xl z-10 overflow-hidden">
                <button className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] w-full">
                  <Flag size={12} />
                  Signaler
                </button>
              </div>
            )}
          </div>

          {/* Reply form */}
          {replyingTo === comment.id && isAuthenticated && (
            <form onSubmit={(e) => onSubmitReply(e, comment.id)} className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Repondre a ${comment.user_name}...`}
                  className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || posting}
                  className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50"
                >
                  {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </form>
          )}

          {/* Replies toggle */}
          {!isReply && comment.replies_count > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showReplies ? 'Masquer' : `Voir ${comment.replies_count} reponse${comment.replies_count > 1 ? 's' : ''}`}
            </button>
          )}

          {/* Replies list */}
          {showReplies && comment.replies && (
            <div className="mt-3 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onLike={onLike}
                  onReply={onReply}
                  replyingTo={replyingTo}
                  onSubmitReply={onSubmitReply}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  posting={posting}
                  formatTime={formatTime}
                  isAuthenticated={isAuthenticated}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommentSection
