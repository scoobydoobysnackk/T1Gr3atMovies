import { Link } from "@tanstack/react-router";
import { EyeOff, Star, Tv } from "lucide-react";
import { useState } from "react";
import { img, type Movie } from "@/lib/tmdb";
import { hasProfanity } from "@/lib/profanity";

export function MovieCard({ movie, blur = false }: { movie: Movie; blur?: boolean }) {
  const mature = blur || hasProfanity(movie.title);
  const [revealed, setRevealed] = useState(!mature);
  const poster = img(movie.poster_path, "w342");
  const year = movie.release_date?.slice(0, 4);
  const isTv = movie.media_type === "tv";

  const inner = (
    <>
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-surface deep-shadow ring-1 ring-border transition-all duration-300 group-hover:-translate-y-1.5 group-hover:ring-primary/70 group-hover:glow">
        {poster ? (
          <img
            src={poster}
            alt={movie.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
              revealed ? "" : "scale-110 blur-xl"
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
            {movie.title}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-abyss via-abyss/0 to-transparent opacity-80" />
        {!revealed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <EyeOff className="size-6" />
            <span className="rounded-full glass px-2 py-0.5 text-[11px] font-bold">18+ · tap to reveal</span>
          </div>
        )}
        {isTv && (
          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full glass px-2 py-0.5 text-[10px] font-bold uppercase">
            <Tv className="size-3" /> Series
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full glass px-2 py-0.5 text-[11px] font-semibold">
          <Star className="size-3 fill-gold text-gold" />
          {movie.vote_average ? movie.vote_average.toFixed(1) : "—"}
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="line-clamp-1 text-sm font-semibold">{revealed ? movie.title : "Mature title"}</p>
        <p className="text-xs text-muted-foreground">{year ?? "Unreleased"}</p>
      </div>
    </>
  );

  const cls = "group relative block w-[150px] shrink-0 sm:w-[180px]";
  const onClick = (e: React.MouseEvent) => {
    if (!revealed) {
      e.preventDefault();
      setRevealed(true);
    }
  };

  return isTv ? (
    <Link to="/tv/$id" params={{ id: String(movie.id) }} className={cls} onClick={onClick}>
      {inner}
    </Link>
  ) : (
    <Link to="/movie/$id" params={{ id: String(movie.id) }} className={cls} onClick={onClick}>
      {inner}
    </Link>
  );
}

export function MovieRow({
  title,
  movies,
  blur = false,
  more,
}: {
  title: string;
  movies: Movie[];
  blur?: boolean;
  more?: React.ReactNode;
}) {
  if (!movies.length) return null;
  return (
    <section className="rise">
      <div className="mb-3 flex items-end justify-between px-1">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {more ?? <span className="text-xs text-muted-foreground">{movies.length} titles</span>}
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
        {movies.map((m) => (
          <MovieCard key={`${m.media_type ?? "movie"}-${m.id}`} movie={m} blur={blur} />
        ))}
      </div>
    </section>
  );
}
