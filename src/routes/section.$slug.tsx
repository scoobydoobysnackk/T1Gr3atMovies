import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SectionNav } from "@/components/SectionNav";
import { MovieCard } from "@/components/MovieCard";
import { discoverMovies, discoverTv } from "@/lib/tmdb";
import { sectionBySlug } from "@/lib/sections";

const sectionQuery = (slug: string, page: number) =>
  queryOptions({
    queryKey: ["section", slug, page],
    queryFn: async () => {
      const s = sectionBySlug(slug)!;
      const params = { sort_by: "popularity.desc", ...s.params };
      const r = s.kind === "tv" ? await discoverTv(params, page) : await discoverMovies(params, page);
      return { results: r.results, totalPages: Math.min(r.total_pages, 500) };
    },
  });

export const Route = createFileRoute("/section/$slug")({
  validateSearch: (search: Record<string, unknown>): { page?: number | undefined } => {
    const p = Number(search["page"]);
    return { page: p > 1 ? Math.floor(p) : undefined };
  },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ context, params, deps }) => {
    const s = sectionBySlug(params.slug);
    if (!s) throw notFound();
    return context.queryClient
      .ensureQueryData(sectionQuery(params.slug, deps.page))
      .then(() => ({ label: s.label }));
  },
  head: ({ loaderData }) => {
    const label = loaderData?.label ?? "Browse";
    return {
      meta: [
        { title: `${label} — Gr3atMovies` },
        { name: "description", content: `Browse and stream ${label} titles free on Gr3atMovies.` },
        { property: "og:title", content: `${label} — Gr3atMovies` },
        { property: "og:description", content: `Every ${label} title, ready to stream.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SectionPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-center text-muted-foreground">
      Couldn't load this section: {error instanceof Error ? error.message : String(error)}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Section not found.</div>,
});

function SectionPage() {
  const { slug } = Route.useParams();
  const { page = 1 } = Route.useSearch();
  const s = sectionBySlug(slug)!;
  const { data } = useSuspenseQuery(sectionQuery(slug, page));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <SectionNav />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold">
          <span className="tide-text">{s.label}</span>
        </h1>
        {s.mature && (
          <p className="mt-2 text-sm text-muted-foreground">
            Mature, R and NC-17 rated titles. Posters stay blurred until you tap them.
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-5">
          {data.results.map((m) => (
            <MovieCard key={m.id} movie={m} blur={!!s.mature} />
          ))}
        </div>
        <div className="mt-10 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link
              to="/section/$slug"
              params={{ slug }}
              search={{ page: page - 1 > 1 ? page - 1 : undefined }}
              className="inline-flex items-center gap-1 rounded-full glass px-4 py-2 font-semibold"
            >
              <ChevronLeft className="size-4" /> Previous
            </Link>
          )}
          <span className="text-muted-foreground">
            Page {page} of {data.totalPages}
          </span>
          {page < data.totalPages && (
            <Link
              to="/section/$slug"
              params={{ slug }}
              search={{ page: page + 1 }}
              className="inline-flex items-center gap-1 rounded-full tide-fill px-4 py-2 font-semibold"
            >
              Next <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
