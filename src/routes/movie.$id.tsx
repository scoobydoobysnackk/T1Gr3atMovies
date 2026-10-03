import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Captions, Clock, Play, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MovieRow } from "@/components/MovieCard";
import { Player } from "@/components/Player";
import { certificationOf, getMovie, img, runtimeLabel } from "@/lib/tmdb";
import { bestSource } from "@/lib/sources";

const movieQuery = (id: string) =>
  queryOptions({ queryKey: ["movie", id], queryFn: () => getMovie(id) });

export const Route = createFileRoute("/movie/$id")({
  validateSearch: (search: Record<string, unknown>): { watch?: boolean | undefined } => ({
    watch: search["watch"] === true || search["watch"] === "true" ? true : undefined,
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(movieQuery(params.id)),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — Gr3atMovies` : "Movie — Gr3atMovies" },
      {
        name: "description",
        content: loaderData?.overview?.slice(0, 180) ?? "Watch movies free on Gr3atMovies.",
      },
      { property: "og:title", content: `${loaderData?.title ?? "Movie"} — Gr3atMovies` },
      {
        property: "og:description",
        content: loaderData?.overview?.slice(0, 180) ?? "Watch movies free on Gr3atMovies.",
      },
      { property: "og:type", content: "video.movie" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(loaderData?.backdrop_path
        ? [
            {
              property: "og:image",
              content: `https://image.tmdb.org/t/p/w1280${loaderData.backdrop_path}`,
            },
            {
              name: "twitter:image",
              content: `https://image.tmdb.org/t/p/w1280${loaderData.backdrop_path}`,
            },
          ]
        : []),
    ],
  }),
  component: MoviePage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-center text-muted-foreground">
      Couldn't load this movie: {error instanceof Error ? error.message : String(error)}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Movie not found.</div>,
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl glass px-4 py-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

function MoviePage() {
  const { id } = Route.useParams();
  const { watch } = Route.useSearch();
  const navigate = useNavigate();
  const { data: movie } = useSuspenseQuery(movieQuery(id));

  const backdrop = img(movie.backdrop_path, "original");
  const poster = img(movie.poster_path, "w500");
  const director = movie.credits?.crew.find((c) => c.job === "Director");
  const cast = movie.credits?.cast.slice(0, 10) ?? [];
  const best = bestSource();

  const openWatch = () => navigate({ to: "/movie/$id", params: { id }, search: { watch: true } });
  const closeWatch = () => navigate({ to: "/movie/$id", params: { id }, search: {} });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="relative">
        {backdrop && (
          <img src={backdrop} alt="" className="absolute inset-0 h-[520px] w-full object-cover" />
        )}
        <div className="absolute inset-0 h-[520px] bg-gradient-to-b from-background/50 via-background/85 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row">
            {poster && (
              <img
                src={poster}
                alt={movie.title}
                className="w-48 shrink-0 rounded-3xl deep-shadow ring-1 ring-border md:w-64"
              />
            )}
            <div className="flex-1 rise">
              <h1 className="text-3xl font-extrabold sm:text-5xl">{movie.title}</h1>
              {movie.tagline && (
                <p className="mt-2 text-sm italic text-primary">{movie.tagline}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full glass px-2.5 py-1 font-semibold">
                  <Star className="size-3.5 fill-gold text-gold" />
                  {movie.vote_average.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full glass px-2.5 py-1">
                  <Clock className="size-3.5" /> {runtimeLabel(movie.runtime)}
                </span>
                {certificationOf(movie) && (
                  <span className="rounded-full glass px-2.5 py-1">{certificationOf(movie)}</span>
                )}
                <span className="rounded-full glass px-2.5 py-1">
                  {movie.release_date?.slice(0, 4)}
                </span>
                {movie.genres.map((g) => (
                  <span key={g.id} className="rounded-full glass px-2.5 py-1">
                    {g.name}
                  </span>
                ))}
              </div>

              <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">
                {movie.overview}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={openWatch}
                  className="inline-flex items-center gap-2 rounded-full tide-fill px-7 py-3.5 text-sm font-bold glow transition-transform hover:scale-[1.03]"
                >
                  <Play className="size-4 fill-current" /> Watch Now!
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Captions className="size-4 text-primary" />
                  Best server auto-picked ({best.name} · {best.maxQuality}{" "}
                  {best.fps}fps)
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Director" value={director?.name ?? "—"} />
                <Stat label="Status" value={movie.status} />
                <Stat label="Language" value={movie.original_language.toUpperCase()} />
                <Stat
                  label="Box office"
                  value={movie.revenue ? `$${(movie.revenue / 1_000_000).toFixed(0)}M` : "—"}
                />
              </div>
            </div>
          </div>

          {cast.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-4 text-xl font-bold">Cast</h2>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                {cast.map((c) => (
                  <div key={c.id} className="w-28 shrink-0 text-center">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
                      {img(c.profile_path, "w185") ? (
                        <img
                          src={img(c.profile_path, "w185")!}
                          alt={c.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs font-semibold">{c.name}</p>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">{c.character}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-14 pb-16">
            <MovieRow title="More like this" movies={movie.recommendations.results} />
          </div>
        </div>
      </div>

      {watch && <Player tmdbId={id} title={movie.title} posterPath={movie.poster_path ?? null} media={{ type: "movie" }} onClose={closeWatch} />}
    </div>
  );
}
