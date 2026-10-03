import { Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listHistory, type HistoryItem } from "@/lib/history";
import { SOURCES } from "@/lib/sources";
import { img } from "@/lib/tmdb";

export function ContinueWatching() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!user) return setItems([]);
    listHistory().then(setItems);
  }, [user]);

  if (!user || !items.length) return null;
  return (
    <section className="rise">
      <div className="mb-3 flex items-end justify-between px-1">
        <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <History className="size-5 text-primary" /> Continue watching
        </h2>
        <Link to="/account" className="text-xs font-semibold text-primary hover:underline">My account</Link>
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
        {items.map((h) => {
          const server = SOURCES.find((s) => s.id === h.source_id)?.name;
          const poster = img(h.poster_path, "w342");
          const body = (
            <>
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition group-hover:-translate-y-1.5 group-hover:ring-primary/70">
                {poster && <img src={poster} alt={h.title} loading="lazy" className="h-full w-full object-cover" />}
                {server && (
                  <span className="absolute bottom-2 left-2 rounded-full glass px-2 py-0.5 text-[10px] font-bold">{server}</span>
                )}
              </div>
              <p className="mt-2 line-clamp-1 px-0.5 text-sm font-semibold">{h.title}</p>
              {h.media_type === "tv" && (
                <p className="px-0.5 text-xs text-muted-foreground">S{h.season} · E{h.episode}</p>
              )}
            </>
          );
          const cls = "group block w-[150px] shrink-0 sm:w-[180px]";
          return h.media_type === "tv" ? (
            <Link key={h.media_key} to="/tv/$id" params={{ id: h.tmdb_id }} className={cls}>{body}</Link>
          ) : (
            <Link key={h.media_key} to="/movie/$id" params={{ id: h.tmdb_id }} className={cls}>{body}</Link>
          );
        })}
      </div>
    </section>
  );
}
