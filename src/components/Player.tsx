import { useEffect, useMemo, useRef, useState } from "react";
import { Captions, Expand, Gauge, History, RefreshCw, ShieldCheck, Sparkles, X } from "lucide-react";
import { SOURCES, bestSource, type Media, type Source } from "@/lib/sources";
import { getSavedSource, saveWatch } from "@/lib/history";

function scoreLabel(s: Source) {
  return `${s.maxQuality} · ${s.fps}fps`;
}

export function Player({
  tmdbId,
  title,
  posterPath = null,
  media = { type: "movie" },
  onClose,
}: {
  tmdbId: string;
  title: string;
  posterPath?: string | null;
  media?: Media;
  onClose: () => void;
}) {
  const ranked = useMemo(() => [...SOURCES].sort((a, b) => b.tier - a.tier), []);
  const [source, setSourceState] = useState<Source>(() => bestSource());
  const [resumed, setResumed] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Auto-pick the server this person used last time for this title.
  useEffect(() => {
    let alive = true;
    getSavedSource(tmdbId, media).then((id) => {
      const s = id && SOURCES.find((x) => x.id === id);
      if (alive && s) {
        setSourceState(s);
        setResumed(true);
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tmdbId]);

  // Remember what's playing (and on which server) for signed-in users.
  useEffect(() => {
    saveWatch({ tmdbId, media, title, posterPath, sourceId: source.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.id, tmdbId]);

  const setSource = (s: Source) => {
    setResumed(false);
    setSourceState(s);
  };
  const frameBox = useRef<HTMLDivElement>(null);
  const goFullscreen = () => {
    const el = frameBox.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => window.open(src, "_blank"));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else window.open(src, "_blank");
  };

  const src = useMemo(() => {
    const base = source.url(tmdbId, media);
    return nonce ? `${base}${base.includes("?") ? "&" : "?"}_r=${nonce}` : base;
  }, [source, tmdbId, media, nonce]);

  const index = ranked.findIndex((s) => s.id === source.id);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-abyss/95 backdrop-blur-xl">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">{title}</p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {resumed ? <History className="size-3 text-primary" /> : <Sparkles className="size-3 text-primary" />}
            {resumed ? "Your last server:" : "Auto-selected best stream:"}{" "}
            <span className="text-primary">{source.name}</span> · {scoreLabel(source)}
          </p>
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={goFullscreen}
          className="inline-flex items-center gap-1.5 rounded-full tide-fill px-3 py-2 text-xs font-bold glow"
        >
          <Expand className="size-4" /> Fullscreen
        </button>
        <button
          onClick={onClose}
          aria-label="Close player"
          className="rounded-full glass p-2 transition-colors hover:bg-surface-2"
        >
          <X className="size-5" />
        </button>
        </div>
      </header>

      <div ref={frameBox} className="relative flex-1 bg-abyss">
        <iframe
          key={src}
          src={src}
          title={`${title} player`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="origin"
          {...{ webkitallowfullscreen: "true", mozallowfullscreen: "true" }}
          className="h-full w-full border-0"
        />
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-widest text-foreground/70">
            Select source server
          </span>
          <span className="rounded-full glass px-2 py-0.5">{ranked.length} servers</span>
          <span className="inline-flex items-center gap-1 rounded-full glass px-2.5 py-0.5">
            <Captions className="size-3.5" /> Captions: tap CC inside the player
          </span>
          <button
            onClick={() => setNonce((n) => n + 1)}
            className="inline-flex items-center gap-1 rounded-full glass px-2.5 py-0.5 font-semibold"
          >
            <RefreshCw className="size-3.5" /> Reload
          </button>
          {index < ranked.length - 1 && (
            <button
              onClick={() => setSource(ranked[index + 1]!)}
              className="inline-flex items-center gap-1 rounded-full glass px-2.5 py-0.5 font-semibold"
            >
              <Gauge className="size-3.5" /> Not loading? Next best server
            </button>
          )}
        </div>

        <div className="no-scrollbar flex max-h-28 flex-wrap gap-2 overflow-y-auto">
          {ranked.map((s) => {
            const active = s.id === source.id;
            return (
              <button
                key={s.id}
                onClick={() => setSource(s)}
                title={`${scoreLabel(s)}${s.adFree ? " · ad-free" : ""}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "tide-fill glow"
                    : "glass text-foreground/80 hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {s.adFree && <ShieldCheck className="size-3.5" />}
                {s.name}
                {s.adFree && !active && (
                  <span className="text-[10px] font-medium opacity-70">(No Ads)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
