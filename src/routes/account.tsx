import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { History, LogOut, MessageSquare, Play, Server, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { listHistory, removeHistory, type HistoryItem } from "@/lib/history";
import { loadCloudThreads, type Thread } from "@/lib/chats";
import { SOURCES } from "@/lib/sources";
import { img } from "@/lib/tmdb";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — Gr3atMovies" },
      { name: "description", content: "Your Gr3atMovies watch history and Gr3at AI chats." },
      { property: "og:title", content: "My account — Gr3atMovies" },
      { property: "og:description", content: "Your watch history and AI chats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

function AccountPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [chats, setChats] = useState<Thread[]>([]);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
    if (user) {
      listHistory().then(setHistory);
      loadCloudThreads().then(setChats);
    }
  }, [ready, user, navigate]);

  if (!user) return <div className="min-h-screen" />;
  const name = user.email?.split("@")[0] ?? "friend";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <section className="relative overflow-hidden rounded-[2rem] glass p-8 deep-shadow rise">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            <span className="grid size-16 place-items-center rounded-2xl tide-fill font-display text-2xl font-extrabold uppercase glow">
              {name[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Signed in</p>
              <h1 className="truncate font-display text-3xl font-extrabold">Hey, <span className="tide-text">{name}</span></h1>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <Stat label="Watched" value={history?.length ?? 0} />
              <Stat label="AI chats" value={chats.length} />
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }}
              className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-sm font-semibold hover:bg-surface-2"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </section>

        <h2 className="mt-12 flex items-center gap-2 font-display text-2xl font-bold"><History className="size-5 text-primary" /> Continue watching</h2>
        {history === null ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : history.length === 0 ? (
          <p className="mt-4 rounded-2xl glass p-6 text-sm text-muted-foreground">Nothing yet — press "Watch Now!" on any movie and it'll show up here.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {history.map((h) => {
              const src = SOURCES.find((s) => s.id === h.source_id);
              const poster = img(h.poster_path, "w342");
              const isTv = h.media_type === "tv";
              return (
                <div key={h.media_key} className="group relative">
                  <Link
                    to={isTv ? "/tv/$id" : "/movie/$id"}
                    params={{ id: h.tmdb_id }}
                    search={(isTv ? { watch: true, season: h.season ?? 1, episode: h.episode ?? 1 } : { watch: true }) as never}
                    className="block"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition group-hover:-translate-y-1 group-hover:ring-primary/70">
                      {poster && <img src={poster} alt={h.title} loading="lazy" className="h-full w-full object-cover" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/10 to-transparent" />
                      <span className="absolute inset-0 m-auto grid size-12 place-items-center rounded-full tide-fill opacity-0 glow transition group-hover:opacity-100">
                        <Play className="size-5 fill-current" />
                      </span>
                      <div className="absolute inset-x-2 bottom-2 space-y-1">
                        {isTv && <p className="text-[11px] font-bold">S{h.season} · E{h.episode}</p>}
                        <p className="inline-flex items-center gap-1 rounded-full glass px-2 py-0.5 text-[10px] font-semibold">
                          <Server className="size-3" /> {src?.name ?? h.source_id}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{ago(h.updated_at)}</p>
                  </Link>
                  <button
                    onClick={async () => { await removeHistory(h.media_key); setHistory((x) => x?.filter((i) => i.media_key !== h.media_key) ?? null); }}
                    aria-label={`Remove ${h.title}`}
                    className="absolute right-2 top-2 rounded-full glass p-1.5 opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <h2 className="mt-12 flex items-center gap-2 font-display text-2xl font-bold"><MessageSquare className="size-5 text-primary" /> Gr3at AI chats</h2>
        <div className="mt-5 grid gap-3 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {chats.length === 0 && <p className="rounded-2xl glass p-6 text-sm text-muted-foreground">No chats yet.</p>}
          {chats.slice(0, 12).map((c) => (
            <Link key={c.id} to="/chat/$threadId" params={{ threadId: c.id }} className="rounded-2xl glass p-4 transition hover:bg-surface-2">
              <p className="truncate font-semibold">{c.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.messages.length} messages</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-surface/70 px-4 py-2 text-center">
      <p className="font-display text-xl font-extrabold">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
