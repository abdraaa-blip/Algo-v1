/**
 * TMDB (The Movie Database) API Service
 * Real-time data for movies, TV series, and celebrities
 * API Docs: https://developer.themoviedb.org/docs
 */

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Cache duration: 15 minutes
const CACHE_DURATION_MS = 15 * 60 * 1000;

interface CachedData<T> {
  data: T;
  fetchedAt: string;
  expiresAt: string;
  source: "live" | "cache" | "fallback";
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
}

export interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for: (TMDBMovie | TMDBTVShow)[];
}

export interface TMDBTrending {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  poster_path: string | null;
  profile_path: string | null;
  backdrop_path: string | null;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity: number;
}

// Normalized types for our app
export interface RealMovie {
  id: string;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  rating: number;
  voteCount: number;
  popularity: number;
  genres: string[];
  language: string;
  type: "movie";
  fetchedAt: string;
}

export interface RealTVShow {
  id: string;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  firstAirDate: string;
  rating: number;
  voteCount: number;
  popularity: number;
  genres: string[];
  countries: string[];
  type: "tv";
  fetchedAt: string;
}

export interface RealCelebrity {
  id: string;
  name: string;
  profileUrl: string;
  department: string;
  popularity: number;
  knownFor: string[];
  type: "person";
  fetchedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GENRE MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

const MOVIE_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

// ═══════════════════════════════════════════════════════════════════════════
// CACHES
// ═══════════════════════════════════════════════════════════════════════════

const trendingMoviesCache: Map<string, CachedData<RealMovie[]>> = new Map();
const trendingTVCache: Map<string, CachedData<RealTVShow[]>> = new Map();
const trendingPeopleCache: Map<string, CachedData<RealCelebrity[]>> = new Map();
const nowPlayingCache: Map<string, CachedData<RealMovie[]>> = new Map();
const upcomingCache: Map<string, CachedData<RealMovie[]>> = new Map();

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getImageUrl(
  path: string | null,
  size: "w200" | "w300" | "w500" | "w780" | "original" = "w500",
): string {
  if (!path)
    return "https://ui-avatars.com/api/?name=No+Image&background=1a1a2e&color=fff&size=500";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function mapGenres(
  ids: number[] | undefined | null,
  isTV: boolean = false,
): string[] {
  if (!ids || !Array.isArray(ids)) return [];
  const genreMap = isTV ? TV_GENRES : MOVIE_GENRES;
  return ids
    .map((id) => genreMap[id] || "Unknown")
    .filter((g) => g !== "Unknown");
}

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch trending movies from TMDB
 */
export async function fetchTrendingMovies(
  timeWindow: "day" | "week" = "week",
  region: string = "FR",
): Promise<CachedData<RealMovie[]>> {
  const cacheKey = `movies_${timeWindow}_${region}`;
  const cached = trendingMoviesCache.get(cacheKey);

  if (cached && new Date(cached.expiresAt) > new Date()) {
    return { ...cached, source: "cache" };
  }

  if (!TMDB_API_KEY) {
    console.error("[TMDB] No API key configured");
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  try {
    const url = `${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}&language=fr-FR&region=${region}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`TMDB API returned ${response.status}`);
    }

    const data = await response.json();
    const now = new Date();

    const movies: RealMovie[] = data.results.map((movie: TMDBMovie) => ({
      id: `tmdb_movie_${movie.id}`,
      title: movie.title,
      overview: movie.overview || "No description available",
      posterUrl: getImageUrl(movie.poster_path),
      backdropUrl: getImageUrl(movie.backdrop_path, "w780"),
      releaseDate: movie.release_date || "",
      rating: Math.round(movie.vote_average * 10) / 10,
      voteCount: movie.vote_count,
      popularity: movie.popularity,
      genres: mapGenres(movie.genre_ids),
      language: movie.original_language,
      type: "movie" as const,
      fetchedAt: now.toISOString(),
    }));

    const result: CachedData<RealMovie[]> = {
      data: movies,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: "live",
    };

    trendingMoviesCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("[TMDB] Trending movies fetch failed:", error);
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

/**
 * Fetch trending TV shows from TMDB
 */
export async function fetchTrendingTV(
  timeWindow: "day" | "week" = "week",
  region: string = "FR",
): Promise<CachedData<RealTVShow[]>> {
  const cacheKey = `tv_${timeWindow}_${region}`;
  const cached = trendingTVCache.get(cacheKey);

  if (cached && new Date(cached.expiresAt) > new Date()) {
    return { ...cached, source: "cache" };
  }

  if (!TMDB_API_KEY) {
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  try {
    const url = `${TMDB_BASE_URL}/trending/tv/${timeWindow}?api_key=${TMDB_API_KEY}&language=fr-FR&region=${region}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`TMDB API returned ${response.status}`);
    }

    const data = await response.json();
    const now = new Date();

    const shows: RealTVShow[] = data.results.map((show: TMDBTVShow) => ({
      id: `tmdb_tv_${show.id}`,
      title: show.name,
      overview: show.overview || "No description available",
      posterUrl: getImageUrl(show.poster_path),
      backdropUrl: getImageUrl(show.backdrop_path, "w780"),
      firstAirDate: show.first_air_date || "",
      rating: Math.round(show.vote_average * 10) / 10,
      voteCount: show.vote_count,
      popularity: show.popularity,
      genres: mapGenres(show.genre_ids, true),
      countries: show.origin_country,
      type: "tv" as const,
      fetchedAt: now.toISOString(),
    }));

    const result: CachedData<RealTVShow[]> = {
      data: shows,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: "live",
    };

    trendingTVCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("[TMDB] Trending TV fetch failed:", error);
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

/**
 * Fetch trending celebrities from TMDB
 */
export async function fetchTrendingPeople(
  timeWindow: "day" | "week" = "week",
): Promise<CachedData<RealCelebrity[]>> {
  const cacheKey = `people_${timeWindow}`;
  const cached = trendingPeopleCache.get(cacheKey);

  if (cached && new Date(cached.expiresAt) > new Date()) {
    return { ...cached, source: "cache" };
  }

  if (!TMDB_API_KEY) {
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  try {
    const url = `${TMDB_BASE_URL}/trending/person/${timeWindow}?api_key=${TMDB_API_KEY}&language=fr-FR`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`TMDB API returned ${response.status}`);
    }

    const data = await response.json();
    const now = new Date();

    const people: RealCelebrity[] = data.results.map((person: TMDBPerson) => ({
      id: `tmdb_person_${person.id}`,
      name: person.name,
      profileUrl: getImageUrl(person.profile_path, "w300"),
      department: person.known_for_department || "Entertainment",
      popularity: person.popularity,
      knownFor:
        person.known_for
          ?.slice(0, 3)
          .map((item) => ("title" in item ? item.title : item.name))
          .filter(Boolean) || [],
      type: "person" as const,
      fetchedAt: now.toISOString(),
    }));

    const result: CachedData<RealCelebrity[]> = {
      data: people,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: "live",
    };

    trendingPeopleCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("[TMDB] Trending people fetch failed:", error);
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

/**
 * Fetch now playing movies in theaters
 */
export async function fetchNowPlaying(
  region: string = "FR",
): Promise<CachedData<RealMovie[]>> {
  const cacheKey = `now_playing_${region}`;
  const cached = nowPlayingCache.get(cacheKey);

  if (cached && new Date(cached.expiresAt) > new Date()) {
    return { ...cached, source: "cache" };
  }

  if (!TMDB_API_KEY) {
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=fr-FR&region=${region}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`TMDB API returned ${response.status}`);
    }

    const data = await response.json();
    const now = new Date();

    const movies: RealMovie[] = data.results.map((movie: TMDBMovie) => ({
      id: `tmdb_movie_${movie.id}`,
      title: movie.title,
      overview: movie.overview || "No description available",
      posterUrl: getImageUrl(movie.poster_path),
      backdropUrl: getImageUrl(movie.backdrop_path, "w780"),
      releaseDate: movie.release_date || "",
      rating: Math.round(movie.vote_average * 10) / 10,
      voteCount: movie.vote_count,
      popularity: movie.popularity,
      genres: mapGenres(movie.genre_ids),
      language: movie.original_language,
      type: "movie" as const,
      fetchedAt: now.toISOString(),
    }));

    const result: CachedData<RealMovie[]> = {
      data: movies,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: "live",
    };

    nowPlayingCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("[TMDB] Now playing fetch failed:", error);
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

/**
 * Fetch upcoming movies
 */
export async function fetchUpcoming(
  region: string = "FR",
): Promise<CachedData<RealMovie[]>> {
  const cacheKey = `upcoming_${region}`;
  const cached = upcomingCache.get(cacheKey);

  if (cached && new Date(cached.expiresAt) > new Date()) {
    return { ...cached, source: "cache" };
  }

  if (!TMDB_API_KEY) {
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=fr-FR&region=${region}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`TMDB API returned ${response.status}`);
    }

    const data = await response.json();
    const now = new Date();

    const movies: RealMovie[] = data.results.map((movie: TMDBMovie) => ({
      id: `tmdb_movie_${movie.id}`,
      title: movie.title,
      overview: movie.overview || "No description available",
      posterUrl: getImageUrl(movie.poster_path),
      backdropUrl: getImageUrl(movie.backdrop_path, "w780"),
      releaseDate: movie.release_date || "",
      rating: Math.round(movie.vote_average * 10) / 10,
      voteCount: movie.vote_count,
      popularity: movie.popularity,
      genres: mapGenres(movie.genre_ids),
      language: movie.original_language,
      type: "movie" as const,
      fetchedAt: now.toISOString(),
    }));

    const result: CachedData<RealMovie[]> = {
      data: movies,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: "live",
    };

    upcomingCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("[TMDB] Upcoming fetch failed:", error);
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOVIE/TV DETAILS (trailers, cast, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export interface MovieDetails {
  id: string;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  runtime?: number;
  rating: number;
  voteCount: number;
  popularity: number;
  genres: string[];
  tagline?: string;
  director?: string;
  cast: Array<{ name: string; character: string; photo: string }>;
  trailerKey?: string; // YouTube video ID
  trailerUrl?: string; // Full YouTube URL
  platforms: Array<{ name: string; url: string; type: string }>;
  budget?: number;
  revenue?: number;
}

export interface TVDetails {
  id: string;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  firstAirDate: string;
  seasons: number;
  episodes: number;
  rating: number;
  voteCount: number;
  popularity: number;
  genres: string[];
  tagline?: string;
  creator?: string;
  cast: Array<{ name: string; character: string; photo: string }>;
  trailerKey?: string;
  trailerUrl?: string;
  platforms: Array<{ name: string; url: string; type: string }>;
  status?: string;
  networks: string[];
}

const movieDetailsCache: Map<string, { data: MovieDetails; expiresAt: Date }> =
  new Map();
const tvDetailsCache: Map<string, { data: TVDetails; expiresAt: Date }> =
  new Map();

/**
 * Fetch detailed movie info including trailers and cast
 */
export async function fetchMovieDetails(
  tmdbId: number,
): Promise<MovieDetails | null> {
  const cacheKey = `movie_${tmdbId}`;
  const cached = movieDetailsCache.get(cacheKey);

  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }

  if (!TMDB_API_KEY) {
    return null;
  }

  try {
    // Fetch movie details, credits, and videos in parallel
    // Also fetch English videos as fallback since most trailers are in English
    const [detailsRes, creditsRes, videosFrRes, videosEnRes] =
      await Promise.all([
        fetch(
          `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=fr-FR`,
          {
            signal: AbortSignal.timeout(8000),
          },
        ),
        fetch(
          `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=fr-FR`,
          {
            signal: AbortSignal.timeout(8000),
          },
        ),
        fetch(
          `${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=fr-FR`,
          {
            signal: AbortSignal.timeout(8000),
          },
        ),
        fetch(
          `${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`,
          {
            signal: AbortSignal.timeout(8000),
          },
        ),
      ]);

    if (!detailsRes.ok) throw new Error("Failed to fetch movie details");

    const details = await detailsRes.json();
    const credits = creditsRes.ok
      ? await creditsRes.json()
      : { cast: [], crew: [] };
    const videosFr = videosFrRes.ok
      ? await videosFrRes.json()
      : { results: [] };
    const videosEn = videosEnRes.ok
      ? await videosEnRes.json()
      : { results: [] };

    // Combine French and English videos, prefer French
    const allVideos = [
      ...(videosFr.results || []),
      ...(videosEn.results || []),
    ];

    console.log("[TMDB] Videos found:", {
      frenchCount: videosFr.results?.length || 0,
      englishCount: videosEn.results?.length || 0,
      totalCount: allVideos.length,
    });

    // Find trailer (prefer official trailer, then teaser, then any YouTube video)
    interface VideoResult {
      type: string;
      site: string;
      key: string;
      official?: boolean;
    }
    const trailer =
      allVideos.find(
        (v: VideoResult) => v.type === "Trailer" && v.site === "YouTube",
      ) ||
      allVideos.find(
        (v: VideoResult) => v.type === "Teaser" && v.site === "YouTube",
      ) ||
      allVideos.find((v: VideoResult) => v.site === "YouTube");

    console.log("[TMDB] Selected trailer:", trailer?.key || "None found");

    // Get director from crew
    interface CrewMember {
      job: string;
      name: string;
    }
    const director = credits.crew?.find(
      (c: CrewMember) => c.job === "Director",
    )?.name;

    // Get top 8 cast members
    interface CastMember {
      name: string;
      character: string;
      profile_path: string | null;
    }
    const cast = (credits.cast || []).slice(0, 8).map((c: CastMember) => ({
      name: c.name,
      character: c.character,
      photo: getImageUrl(c.profile_path, "w200"),
    }));

    const movieDetails: MovieDetails = {
      id: `tmdb_movie_${tmdbId}`,
      title: details.title,
      overview: details.overview || "Aucune description disponible",
      posterUrl: getImageUrl(details.poster_path),
      backdropUrl: getImageUrl(details.backdrop_path, "w780"),
      releaseDate: details.release_date || "",
      runtime: details.runtime,
      rating: Math.round(details.vote_average * 10) / 10,
      voteCount: details.vote_count,
      popularity: details.popularity,
      genres: details.genres?.map((g: { name: string }) => g.name) || [],
      tagline: details.tagline,
      director,
      cast,
      trailerKey: trailer?.key,
      trailerUrl: trailer?.key
        ? `https://www.youtube.com/watch?v=${trailer.key}`
        : undefined,
      platforms: [{ name: "Cinema", url: "#", type: "cinema" }],
      budget: details.budget,
      revenue: details.revenue,
    };

    // Cache for 30 minutes
    movieDetailsCache.set(cacheKey, {
      data: movieDetails,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    return movieDetails;
  } catch (error) {
    console.error("[TMDB] Movie details fetch failed:", error);
    return null;
  }
}

/**
 * Fetch detailed TV show info including trailers and cast
 */
export async function fetchTVDetails(
  tmdbId: number,
): Promise<TVDetails | null> {
  const cacheKey = `tv_${tmdbId}`;
  const cached = tvDetailsCache.get(cacheKey);

  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }

  if (!TMDB_API_KEY) {
    return null;
  }

  try {
    // Fetch TV details, credits, and videos (French + English fallback)
    const [detailsRes, creditsRes, videosFrRes, videosEnRes] =
      await Promise.all([
        fetch(
          `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=fr-FR`,
          {
            signal: AbortSignal.timeout(8000),
          },
        ),
        fetch(
          `${TMDB_BASE_URL}/tv/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=fr-FR`,
          {
            signal: AbortSignal.timeout(8000),
          },
        ),
        fetch(
          `${TMDB_BASE_URL}/tv/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=fr-FR`,
          {
            signal: AbortSignal.timeout(8000),
          },
        ),
        fetch(
          `${TMDB_BASE_URL}/tv/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`,
          {
            signal: AbortSignal.timeout(8000),
          },
        ),
      ]);

    if (!detailsRes.ok) throw new Error("Failed to fetch TV details");

    const details = await detailsRes.json();
    const credits = creditsRes.ok
      ? await creditsRes.json()
      : { cast: [], crew: [] };
    const videosFr = videosFrRes.ok
      ? await videosFrRes.json()
      : { results: [] };
    const videosEn = videosEnRes.ok
      ? await videosEnRes.json()
      : { results: [] };

    // Combine French and English videos
    const allVideos = [
      ...(videosFr.results || []),
      ...(videosEn.results || []),
    ];

    interface VideoResult {
      type: string;
      site: string;
      key: string;
    }
    const trailer =
      allVideos.find(
        (v: VideoResult) => v.type === "Trailer" && v.site === "YouTube",
      ) ||
      allVideos.find(
        (v: VideoResult) => v.type === "Teaser" && v.site === "YouTube",
      ) ||
      allVideos.find((v: VideoResult) => v.site === "YouTube");

    console.log(
      "[TMDB] TV Videos found:",
      allVideos.length,
      "Trailer:",
      trailer?.key || "None",
    );

    interface CreatedBy {
      name: string;
    }
    const creator =
      details.created_by?.[0]?.name ||
      details.created_by?.map((c: CreatedBy) => c.name).join(", ");

    interface CastMember {
      name: string;
      character: string;
      profile_path: string | null;
    }
    const cast = (credits.cast || []).slice(0, 8).map((c: CastMember) => ({
      name: c.name,
      character: c.character,
      photo: getImageUrl(c.profile_path, "w200"),
    }));

    const tvDetails: TVDetails = {
      id: `tmdb_tv_${tmdbId}`,
      title: details.name,
      overview: details.overview || "Aucune description disponible",
      posterUrl: getImageUrl(details.poster_path),
      backdropUrl: getImageUrl(details.backdrop_path, "w780"),
      firstAirDate: details.first_air_date || "",
      seasons: details.number_of_seasons || 0,
      episodes: details.number_of_episodes || 0,
      rating: Math.round(details.vote_average * 10) / 10,
      voteCount: details.vote_count,
      popularity: details.popularity,
      genres: details.genres?.map((g: { name: string }) => g.name) || [],
      tagline: details.tagline,
      creator,
      cast,
      trailerKey: trailer?.key,
      trailerUrl: trailer?.key
        ? `https://www.youtube.com/watch?v=${trailer.key}`
        : undefined,
      platforms: [{ name: "Streaming", url: "#", type: "streaming" }],
      status: details.status,
      networks: details.networks?.map((n: { name: string }) => n.name) || [],
    };

    tvDetailsCache.set(cacheKey, {
      data: tvDetails,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    return tvDetails;
  } catch (error) {
    console.error("[TMDB] TV details fetch failed:", error);
    return null;
  }
}

/**
 * Fetch all trending content (movies, TV, people)
 */
export async function fetchAllTrending(): Promise<{
  movies: RealMovie[];
  tvShows: RealTVShow[];
  celebrities: RealCelebrity[];
  fetchedAt: string;
  source: "live" | "cache" | "fallback" | "mixed";
}> {
  const [moviesResult, tvResult, peopleResult] = await Promise.all([
    fetchTrendingMovies("week"),
    fetchTrendingTV("week"),
    fetchTrendingPeople("week"),
  ]);

  const sources = new Set([
    moviesResult.source,
    tvResult.source,
    peopleResult.source,
  ]);
  const source = sources.size === 1 ? moviesResult.source : "mixed";

  return {
    movies: moviesResult.data,
    tvShows: tvResult.data,
    celebrities: peopleResult.data,
    fetchedAt: new Date().toISOString(),
    source,
  };
}
