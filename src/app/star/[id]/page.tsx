import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Script from 'next/script'
import { ArrowLeft, ExternalLink, Globe } from 'lucide-react'
import { ShareStrip } from '@/components/growth/ShareStrip'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { extractTitleKeywords } from '@/lib/seo/keywords-from-title'
import { personProfileJsonLd } from '@/lib/seo/json-ld'
import { absoluteUrl } from '@/lib/seo/site'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { Badge } from '@/components/ui/Badge'

// =============================================================================
// ALGO V1 — Star/Celebrity Profile Page
// Shows full profile for actors, directors, and other celebrities from TMDB
// =============================================================================

interface StarData {
  id: string
  name: string
  bio: string | null
  photo: string | null
  knownFor: string
  birthday: string | null
  deathday: string | null
  birthplace: string | null
  popularity: number
  imdbId: string | null
  instagramId: string | null
  topFilms: Array<{
    id: string
    title: string
    poster: string | null
    year: string | null
    character: string | null
    rating: number | null
    mediaType: 'movie' | 'tv'
  }>
}

async function fetchStarData(personId: string): Promise<StarData | null> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return null

  try {
    const [personRes, creditsRes] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/person/${personId}?api_key=${apiKey}&language=fr-FR&append_to_response=external_ids`,
        { next: { revalidate: 86400 } } // Cache for 24h
      ),
      fetch(
        `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${apiKey}&language=fr-FR`,
        { next: { revalidate: 86400 } }
      ),
    ])

    if (!personRes.ok) return null

    const person = await personRes.json()
    const credits = await creditsRes.json()

    // Sort films by popularity and take top 12
    const topFilms = (credits.cast || [])
      .sort((a: { popularity: number }, b: { popularity: number }) => b.popularity - a.popularity)
      .slice(0, 12)
      .map((m: { 
        id: number
        title?: string
        name?: string
        poster_path: string | null
        release_date?: string
        first_air_date?: string
        character?: string
        vote_average: number
        media_type: 'movie' | 'tv'
      }) => ({
        id: `tmdb-${m.id}`,
        title: m.title || m.name || '',
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : null,
        year: (m.release_date || m.first_air_date)?.slice(0, 4) || null,
        character: m.character || null,
        rating: m.vote_average || null,
        mediaType: m.media_type,
      }))

    return {
      id: personId,
      name: person.name,
      bio: person.biography || null,
      photo: person.profile_path
        ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
        : null,
      knownFor: person.known_for_department || 'Acting',
      birthday: person.birthday || null,
      deathday: person.deathday || null,
      birthplace: person.place_of_birth || null,
      popularity: person.popularity || 0,
      imdbId: person.external_ids?.imdb_id || null,
      instagramId: person.external_ids?.instagram_id || null,
      topFilms,
    }
  } catch {
    return null
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const personId = id.replace('star-', '')
  const star = await fetchStarData(personId)

  if (!star) {
    return buildPageMetadata({
      title: 'Profil introuvable',
      description: 'Cette personnalité n’est pas disponible sur ALGO.',
      path: `/star/${id}`,
      noindex: true,
    })
  }

  const desc =
    star.bio?.slice(0, 160) ||
    `Profil de ${star.name} : films, séries et films en tendance sur ALGO.`

  return buildPageMetadata({
    title: star.name,
    description: desc,
    path: `/star/${id}`,
    keywords: [...extractTitleKeywords(star.name, 6), star.knownFor, 'cinéma', 'TMDB'],
    ogType: 'profile',
    ogImage: star.photo,
  })
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function StarPage({ params }: Props) {
  const { id } = await params
  const personId = id.replace('star-', '')
  const star = await fetchStarData(personId)

  if (!star) notFound()

  const sameAs: string[] = []
  if (star.imdbId) sameAs.push(`https://www.imdb.com/name/${star.imdbId}`)
  if (star.instagramId) sameAs.push(`https://www.instagram.com/${star.instagramId}`)

  const shareUrl = absoluteUrl(`/star/${id}`)
  const shareSnippet = `${star.name} — profil & œuvres en tendance (ALGO)`

  const knownForLabel = {
    Acting: 'Acteur/Actrice',
    Directing: 'Realisateur/Realisatrice',
    Writing: 'Scenariste',
    Production: 'Producteur/Productrice',
  }[star.knownFor] || star.knownFor

  return (
    <>
      <Script
        id={`person-ld-${star.id}`}
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(
          personProfileJsonLd({
            name: star.name,
            description: star.bio?.slice(0, 500) ?? null,
            urlPath: `/star/${id}`,
            image: star.photo,
            sameAs: sameAs.length ? sameAs : undefined,
          })
        )}
      </Script>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Back button */}
      <Link
        href="javascript:history.back()"
        className="inline-flex items-center gap-2 text-white/50 text-sm font-semibold hover:text-white/70 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Retour
      </Link>

      {/* Profile header */}
      <div className="flex gap-5 items-start mb-8">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden flex-shrink-0 border-[3px] border-violet-500/40 bg-[var(--color-card)]">
          {star.photo ? (
            <ImageWithFallback
              src={star.photo}
              alt={star.name}
              width={112}
              height={112}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1.5">
            {star.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/45 font-semibold mb-3">
            <span>{knownForLabel}</span>
            {star.birthday && (
              <>
                <span className="text-white/20">·</span>
                <span>
                  {star.deathday 
                    ? `${new Date(star.birthday).getFullYear()} - ${new Date(star.deathday).getFullYear()}`
                    : `Ne(e) le ${new Date(star.birthday).toLocaleDateString('fr-FR')}`
                  }
                </span>
              </>
            )}
          </div>
          {star.birthplace && (
            <p className="text-[11px] text-white/30 mb-3">📍 {star.birthplace}</p>
          )}
          
          {/* External links */}
          <div className="flex gap-2 flex-wrap">
            {star.imdbId && (
              <a
                href={`https://imdb.com/name/${star.imdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors"
              >
                <ExternalLink size={10} />
                IMDb
              </a>
            )}
            {star.instagramId && (
              <a
                href={`https://instagram.com/${star.instagramId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/25 hover:bg-pink-500/25 transition-colors"
              >
                <Globe size={10} />
                Social
              </a>
            )}
            {star.popularity > 50 && (
              <Badge type="Trend" label={`Popularite: ${Math.floor(star.popularity)}`} size="sm" />
            )}
          </div>
        </div>
      </div>

      <ShareStrip className="mb-6" url={shareUrl} title={star.name} snippet={shareSnippet} />

      {/* Biography */}
      {star.bio && (
        <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">
            Biographie
          </h2>
          <p className="text-[13px] text-white/60 leading-relaxed">
            {star.bio.length > 600 ? `${star.bio.slice(0, 600)}...` : star.bio}
          </p>
        </section>
      )}

      {/* Filmography */}
      {star.topFilms.length > 0 && (
        <section>
          <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>🎬</span>
            Filmographie
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {star.topFilms.map((film) => (
              <Link
                key={film.id}
                href={`/content/${film.id}`}
                className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] hover:border-violet-400/30 hover:bg-[var(--color-card-hover)] transition-all group"
              >
                <div className="aspect-[2/3] bg-[var(--color-card)] overflow-hidden relative">
                  {film.poster ? (
                    <ImageWithFallback
                      src={film.poster}
                      alt={film.title}
                      width={120}
                      height={180}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-white/20">
                      {film.mediaType === 'tv' ? '📺' : '🎬'}
                    </div>
                  )}
                  {film.mediaType === 'tv' && (
                    <div className="absolute top-1 right-1">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/80 text-white">
                        Serie
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-bold text-white/75 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                    {film.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-white/35">
                    {film.year && <span>{film.year}</span>}
                    {film.rating && film.rating > 0 && (
                      <>
                        {film.year && <span>·</span>}
                        <span className="text-amber-400/70">⭐ {film.rating.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                  {film.character && (
                    <p className="text-[9px] text-white/30 mt-0.5 line-clamp-1">
                      {film.character}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  )
}
