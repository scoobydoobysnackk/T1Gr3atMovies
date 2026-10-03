import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Play, Star, Info } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SectionNav } from "@/components/SectionNav";
import { MovieRow, MovieCard } from "@/components/MovieCard";
import { ContinueWatching } from "@/components/ContinueWatching";
import { img, listMovies, listTv, searchMovies, discoverMovies, type Movie } from "@/lib/tmdb";

type HomeSearch = { q?: string | undefined };

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [popular, topRated, nowPlaying, upcoming, action, animation, horror, scifi, comedy, drama, tv, mature] =
      await Promise.all([
        listMovies("popular"),
        listMovies("top_rated"),
        listMovies("now_playing"),
        listMovies("upcoming"),
        discoverMovies({ with_genres: 28, sort_by: "popularity.desc" }),
        discoverMovies({ with_genres: 16, sort_by: "popularity.desc" }),
        discoverMovies({ with_genres: 27, sort_by: "popularity.desc" }),
        discoverMovies({ with_genres: 878, sort_by: "popularity.desc" }),
        discoverMovies({ with_genres: 35, sort_by: "popularity.desc" }),
        discoverMovies({ with_genres: 18, sort_by: "popularity.desc" }),
        listTv("popular"),
        discoverMovies({ sort_by: "popularity.desc", certification_country: "US", certification: "R|NC-17", "vote_count.gte": 200 }),
      ]);
    return {
      popular: popular.results,
      topRated: topRated.results,
      nowPlaying: nowPlaying.results,
      upcoming: upcoming.results,
      action: action.results,
      animation: animation.results,
      horror: horror.results,
      scifi: scifi.results,
      comedy: comedy.results,
      drama: drama.results,
      tv: tv.results,
      mature: mature.results,
    };
  },
});

const searchQuery = (q: string) =>
  queryOptions({
    queryKey: ["search", q],
    queryFn: () => searchMovies(q).then((r) => r.results),
  });

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(homeQuery);
    if (deps.q) context.queryClient.ensureQueryData(searchQuery(deps.q));
  },
  head: () => ({
    meta: [
      { title: "Gr3atMovies — Free Movie Streaming for the Family" },
      {
        name: "description",
        content:
          "Browse every movie on earth and stream instantly with auto-selected best-quality servers and English captions. No accounts, just movies.",
      },
      { property: "og:title", content: "Gr3atMovies — Free Movie Streaming" },
      {
        property: "og:description",
        content:
          "Every movie, instant playback, auto-picked highest quality source and perfectly timed captions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-center text-muted-foreground">
      Couldn't load movies: {error instanceof Error ? error.message : String(error)}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Nothing here.</div>,
});

function Hero({ movie }: { movie: Movie }) {
  const backdrop = img(movie.backdrop_path, "original");
  return (
    <section className="relative h-[70vh] min-h-[460px] w-full overflow-hidden">
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover caustics"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end gap-4 px-4 pb-14 sm:px-6">
        <span className="w-fit rounded-full glass px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Surfacing now
        </span>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-6xl">
          {movie.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Star className="size-4 fill-gold text-gold" />
            {movie.vote_average.toFixed(1)}
          </span>
          <span>{movie.release_date?.slice(0, 4)}</span>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {movie.overview}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            to="/movie/$id"
            params={{ id: String(movie.id) }}
            search={{ watch: true }}
            className="inline-flex items-center gap-2 rounded-full tide-fill px-6 py-3 text-sm font-bold glow transition-transform hover:scale-[1.03]"
          >
            <Play className="size-4 fill-current" /> Watch Now!
          </Link>
          <Link
            to="/movie/$id"
            params={{ id: String(movie.id) }}
            className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-semibold transition-colors hover:bg-surface-2"
          >
            <Info className="size-4" /> Details
          </Link>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { q } = Route.useSearch();
  const { data } = useSuspenseQuery(homeQuery);
  const hero = data.popular[0];

  return (
    <div className="min-h-screen">
      <SiteHeader initialQuery={q ?? ""} />
      <SectionNav />
      {q ? <SearchResults q={q} /> : hero && <Hero movie={hero} />}
      <main className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6">
        {!q && (
          <>
            <ContinueWatching />
            <MovieRow title="Riding the wave" movies={data.popular} />
            <MovieRow title="Binge-worthy series" movies={data.tv} more={<SeeAll slug="tv-shows" />} />
            <MovieRow title="Comedy" movies={data.comedy} more={<SeeAll slug="comedy" />} />
            <MovieRow title="Drama" movies={data.drama} more={<SeeAll slug="drama" />} />
            <MovieRow title="In theaters now" movies={data.nowPlaying} />
            <MovieRow title="Deep classics" movies={data.topRated} />
            <MovieRow title="Action currents" movies={data.action} />
            <MovieRow title="Family & animation" movies={data.animation} />
            <MovieRow title="Sci-fi depths" movies={data.scifi} />
            <MovieRow title="Horror · From the dark trench" movies={data.horror} more={<SeeAll slug="horror" />} />
            <MovieRow title="18+ After dark" movies={data.mature} blur more={<SeeAll slug="18-plus" />} />
            <MovieRow title="Washing ashore soon" movies={data.upcoming} />
          </>
        )}
      </main>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Gr3atMovies · Movie data by TMDB · Built for family movie nights
      </footer>
    </div>
  );
}

function SeeAll({ slug }: { slug: string }) {
  return (
    <Link to="/section/$slug" params={{ slug }} className="text-xs font-semibold text-primary hover:underline">
      See all →
    </Link>
  );
}

function SearchResults({ q }: { q: string }) {
  const { data } = useSuspenseQuery(searchQuery(q));
  return (
    <main className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">
        Results for <span className="tide-text">{q}</span>
      </h1>
      {data.length === 0 ? (
        <p className="text-muted-foreground">Nothing surfaced. Try another title.</p>
      ) : (
        <div className="flex flex-wrap gap-5">
          {data.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </main>
  );
}
