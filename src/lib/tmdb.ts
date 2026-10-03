export const TMDB_KEY = "ef0b5dd7ff8bb2ddfdc0e88dabe78686";
const BASE = "https://api.themoviedb.org/3";

export const img = (path: string | null, size = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string | undefined;
  vote_average: number;
  media_type?: "movie" | "tv";
};

type RawItem = Movie & { name?: string; first_air_date?: string; media_type?: string };
const norm = (r: RawItem, fallback: "movie" | "tv"): Movie => ({
  id: r.id,
  title: r.title ?? r.name ?? "Untitled",
  overview: r.overview,
  poster_path: r.poster_path,
  backdrop_path: r.backdrop_path,
  release_date: r.release_date ?? r.first_air_date,
  vote_average: r.vote_average,
  media_type: (r.media_type === "tv" || r.media_type === "movie" ? r.media_type : fallback) as "movie" | "tv",
});

export type MovieDetails = Movie & {
  runtime: number | null;
  tagline: string | null;
  genres: { id: number; name: string }[];
  status: string;
  budget: number;
  revenue: number;
  original_language: string;
  production_companies: { id: number; name: string }[];
  imdb_id: string | null;
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  videos?: { results: { key: string; site: string; type: string; name: string }[] };
  recommendations?: { results: Movie[] };
  release_dates?: {
    results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
  };
};

/** Hide titles with no poster or not yet released (they can't be played). */
export const playable = (m: Movie) => {
  if (!m.poster_path) return false;
  const d = m.release_date;
  if (!d) return false;
  return new Date(d).getTime() <= Date.now();
};
const keep = <P extends { results: Movie[] }>(p: P): P => ({ ...p, results: p.results.filter(playable) });

type Page<T> = { page: number; results: T[]; total_pages: number; total_results: number };

export const listMovies = async (endpoint: string, page = 1) =>
  keep(await get<Page<Movie>>(`/movie/${endpoint}`, { page, region: "US" }));

/** Searches movies AND TV shows together. */
export const searchMovies = async (query: string, page = 1) => {
  const r = await get<Page<RawItem>>("/search/multi", { query, page, include_adult: "false" });
  return keep({
    ...r,
    results: r.results.filter((x) => x.media_type === "movie" || x.media_type === "tv").map((x) => norm(x, "movie")),
  });
};

export const discoverMovies = async (params: Record<string, string | number>, page = 1) => {
  const r = await get<Page<RawItem>>("/discover/movie", { ...params, page, include_adult: "false" });
  return keep({ ...r, results: r.results.map((x) => norm(x, "movie")) });
};

export const discoverTv = async (params: Record<string, string | number>, page = 1) => {
  const r = await get<Page<RawItem>>("/discover/tv", { ...params, page, include_adult: "false" });
  return keep({ ...r, results: r.results.map((x) => norm(x, "tv")) });
};

export const listTv = async (endpoint: string, page = 1) => {
  const r = await get<Page<RawItem>>(`/tv/${endpoint}`, { page });
  return keep({ ...r, results: r.results.map((x) => norm(x, "tv")) });
};

export type TvDetails = {
  id: number;
  name: string;
  overview: string;
  tagline: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average: number;
  status: string;
  original_language: string;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name: string }[];
  created_by: { id: number; name: string }[];
  networks: { id: number; name: string }[];
  seasons: { season_number: number; name: string; episode_count: number; poster_path: string | null }[];
  credits?: MovieDetails["credits"];
  recommendations?: { results: RawItem[] };
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
};

export const getTv = async (id: number | string) => {
  const d = await get<TvDetails>(`/tv/${id}`, { append_to_response: "credits,recommendations,content_ratings" });
  return {
    ...d,
    recommendations: { results: (d.recommendations?.results ?? []).map((x) => norm(x, "tv")).filter(playable) as unknown as RawItem[] },
  };
};

export type Episode = { episode_number: number; name: string; overview: string; still_path: string | null; runtime: number | null; air_date: string | null };
export const getSeason = (id: number | string, season: number) =>
  get<{ episodes: Episode[] }>(`/tv/${id}/season/${season}`);

export const getMovie = async (id: number | string) => {
  const d = await get<MovieDetails>(`/movie/${id}`, {
    append_to_response: "credits,videos,recommendations,release_dates",
  });
  return { ...d, recommendations: { results: (d.recommendations?.results ?? []).map((x) => norm(x, "movie")).filter(playable) } };
};

export const getGenres = () => get<{ genres: { id: number; name: string }[] }>("/genre/movie/list");

export const certificationOf = (d: MovieDetails) =>
  d.release_dates?.results.find((r) => r.iso_3166_1 === "US")?.release_dates.find((x) => x.certification)
    ?.certification ?? null;

export const runtimeLabel = (m: number | null) =>
  m ? `${Math.floor(m / 60)}h ${m % 60}m` : "—";
