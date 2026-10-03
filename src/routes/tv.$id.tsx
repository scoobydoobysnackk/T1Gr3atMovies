import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Layers, Play, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SectionNav } from "@/components/SectionNav";
import { MovieRow } from "@/components/MovieCard";
import { Player } from "@/components/Player";
import { getSeason, getTv, img, type Movie } from "@/lib/tmdb";

const tvQuery = (id: string) => queryOptions({ queryKey: ["tv", id], queryFn: () => getTv(id) });
const seasonQuery = (id: string, s: number) =>
  queryOptions({ queryKey: ["tv", id, "season", s], queryFn: () => getSeason(id, s) });

type TvSearch = { s?: number | undefined; e?: number | undefined; watch?: boolean | undefined };

export const Route = createFileRoute("/tv/$id")({
  validateSearch: (search: Record<string, unknown>): TvSearch => ({
    s: Number(search["s"]) > 0 ? Number(search["s"]) : undefined,
    e: Number(search["e"]) > 0 ? Number(search["e"]) : undefined,
    watch: search["watch"] === true || search["watch"] === "true" ? true : undefined,
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(tvQuery(params.id)),
  head: ({ loaderData }) => {
    const t = loaderData?.name ?? "Series";
    const d = loaderData?.overview?.slice(0, 180) ?? "Stream TV series free on Gr3atMovies.";
    const bg = loaderData?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${loaderData.backdrop_path}` : null;
    return {
      meta: [
        { title: `${t} — Gr3atMovies` },
        { name: "description", content: d },
        { property: "og:title", content: `${t} — Gr3atMovies` },
        { property: "og:description", content: d },
        { property: "og:type", content: "video.tv_show" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(bg ? [{ property: "og:image", content: bg }, { name: "twitter:image", content: bg }] : []),
      ],
    };
  },
  component: TvPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-center text-muted-foreground">
      Couldn't load this series: {error instanceof Error ? error.message : String(error)}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Series not found.</div>,
});

function TvPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: show } = useSuspenseQuery(tvQuery(id));
  const seasons = show.seasons.filter((x) => x.season_number > 0 && x.episode_count > 0);
  const season = search.s ?? seasons[0]?.season_number ?? 1;
  const episode = search.e ?? 1;
  const { data: seasonData, isLoading } = useQuery(seasonQuery(id, season));

  const go = (next: TvSearch) =>
    navigate({ to: "/tv/$id", params: { id }, search: { s: season, e: episode, ...next }, resetScroll: false });

  const backdrop = img(show.backdrop_path, "original");
  const poster = img(show.poster_path, "w500");
  const cast = show.credits?.cast.slice(0, 10) ?? [];
  const recs = (show.recommendations?.results ?? []) as unknown as Movie[];
  const media = { type: "tv" as const, season, episode };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <SectionNav />
      <div className="relative">
        {backdrop && <img src={backdrop} alt="" className="absolute inset-0 h-[520px] w-full object-cover" />}
        <div className="absolute inset-0 h-[520px] bg-gradient-to-b from-background/50 via-background/85 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row">
            {poster && (
              <img src={poster} alt={show.name} className="w-48 shrink-0 rounded-3xl deep-shadow ring-1 ring-border md:w-64" />
            )}
            <div className="flex-1 rise">
              <h1 className="text-3xl font-extrabold sm:text-5xl">{show.name}</h1>
              {show.tagline && <p className="mt-2 text-sm italic text-primary">{show.tagline}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full glass px-2.5 py-1 font-semibold">
                  <Star className="size-3.5 fill-gold text-gold" />
                  {show.vote_average.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full glass px-2.5 py-1">
                  <Layers className="size-3.5" /> {show.number_of_seasons} seasons · {show.number_of_episodes} episodes
                </span>
                <span className="rounded-full glass px-2.5 py-1">{show.first_air_date?.slice(0, 4)}</span>
                {show.genres.map((g) => (
                  <span key={g.id} className="rounded-full glass px-2.5 py-1">{g.name}</span>
                ))}
              </div>
              <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">{show.overview}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => go({ watch: true })}
                  className="inline-flex items-center gap-2 rounded-full tide-fill px-7 py-3.5 text-sm font-bold glow transition-transform hover:scale-[1.03]"
                >
                  <Play className="size-4 fill-current" /> Watch Now! · S{season} E{episode}
                </button>
                {show.created_by[0] && (
                  <span className="text-xs text-muted-foreground">Created by {show.created_by.map((c) => c.name).join(", ")}</span>
                )}
              </div>
            </div>
          </div>

          <section className="mt-14">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="mr-2 text-xl font-bold">Episodes</h2>
              {seasons.map((x) => (
                <button
                  key={x.season_number}
                  onClick={() => go({ s: x.season_number, e: 1 })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    x.season_number === season ? "tide-fill glow" : "glass"
                  }`}
                >
                  Season {x.season_number}
                </button>
              ))}
            </div>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading episodes…</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {seasonData?.episodes.map((ep) => (
                  <button
                    key={ep.episode_number}
                    onClick={() => go({ e: ep.episode_number, watch: true })}
                    className={`flex gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-surface-2 ${
                      ep.episode_number === episode ? "ring-1 ring-primary glass" : "glass"
                    }`}
                  >
                    <div className="aspect-video w-32 shrink-0 overflow-hidden rounded-xl bg-surface">
                      {ep.still_path && (
                        <img src={img(ep.still_path, "w300")!} alt="" loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold">
                        {ep.episode_number}. {ep.name}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{ep.overview}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {cast.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-4 text-xl font-bold">Cast</h2>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                {cast.map((c) => (
                  <div key={c.id} className="w-28 shrink-0 text-center">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
                      {c.profile_path && (
                        <img src={img(c.profile_path, "w185")!} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs font-semibold">{c.name}</p>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">{c.character}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-14 pb-16">
            <MovieRow title="More like this" movies={recs} />
          </div>
        </div>
      </div>

      {search.watch && (
        <Player
          key={`${season}-${episode}`}
          tmdbId={id}
          title={`${show.name} · S${season} E${episode}`}
          posterPath={show.poster_path ?? null}
          media={media}
          onClose={() => go({ watch: undefined })}
        />
      )}
    </div>
  );
}
