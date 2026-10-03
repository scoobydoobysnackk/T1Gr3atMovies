import { Megaphone, X } from "lucide-react";
import { useEffect, useState } from "react";

type Release = { version: string; date: string; title: string; items: { group: string; list: string[] }[] };

/** Newest first. Add a new entry at the top for each update — it will pop up once for everyone. */
export const RELEASES: Release[] = [
  {
    version: "1.02",
    date: "October 2026",
    title: "Accounts are here",
    items: [
      { group: "New: Accounts", list: [
        "Log in or register with email or Google (button next to search)",
        "My account page with your watch history and saved AI chats",
      ] },
      { group: "Watching", list: [
        "Continue watching row on the home page",
        "The player remembers the server you used last for every movie and show",
        "Shows remember the last episode you watched",
      ] },
      { group: "Gr3at AI", list: [
        "Guests get 3 free messages — log in to unlock unlimited chats",
        "Your chats are saved to your account on every device",
        "Swear words in messages are filtered out",
      ] },
      { group: "Safety", list: [
        "Titles with swear words get the Mature badge and a blurred poster until tapped",
      ] },
    ],
  },
  {
    version: "1.01",
    date: "October 2026",
    title: "Gr3at AI has arrived",
    items: [
      { group: "New: Gr3at AI", list: [
        "A personal AI assistant built right into Gr3atMovies",
        "ChatGPT-style chat with a sidebar that saves your conversations",
        "Replies type out letter by letter — longer answers type faster",
        "Stop button while a reply is typing",
        "Formatted answers: lists, headings, tables and code blocks",
        "Copy any reply with one tap",
        "Knows how the site works — servers, captions, fullscreen, sections and more",
        "Movie and show recommendations whenever you ask",
      ] },
    ],
  },
  {
    version: "1.0",
    date: "October 2026",
    title: "Gr3atMovies is here!",
    items: [
      { group: "Look & feel", list: [
        "Oceanic design with deep-sea colors and glassy panels",
        "Checkmark logo and browser tab icon",
      ] },
      { group: "Movies & shows", list: [
        "Info for almost every movie: cast, director, runtime, rating, box office",
        "TV shows with seasons and episodes (like The Mentalist)",
        "Search for movies and shows together",
        "Titles with no poster or not out yet are hidden",
      ] },
      { group: "Watching", list: [
        "Watch Now! button on every movie and episode",
        "Best server picked automatically (highest quality and smoothness)",
        "19 tested servers, plus a 'Next best server' button",
        "Fullscreen button and Reload button",
        "Captions through the CC button inside the player",
      ] },
      { group: "Sections", list: [
        "Horror, Comedy, Drama, 18+ and more, each with its own page",
        "18+ posters are blurred until you tap them",
      ] },
      { group: "Extras", list: [
        "No login or sign-up needed",
        "This update log, which you can reopen from the button next to search",
      ] },
    ],
  },
];

const KEY = "gr3at-last-seen-update";
const OPEN_EVENT = "gr3at-open-updates";
export const openUpdateLog = () => window.dispatchEvent(new Event(OPEN_EVENT));

export function UpdateLog() {
  const [open, setOpen] = useState(false);
  const latest = RELEASES[0]!.version;

  useEffect(() => {
    if (localStorage.getItem(KEY) !== latest) setOpen(true);
    const h = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, h);
    return () => window.removeEventListener(OPEN_EVENT, h);
  }, [latest]);

  if (!open) return null;
  const close = () => {
    localStorage.setItem(KEY, latest);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-abyss/80 p-4 backdrop-blur-md" onClick={close}>
      <div
        role="dialog"
        aria-label="What's new"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl glass deep-shadow ring-1 ring-border"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl tide-fill glow">
              <Megaphone className="size-4" />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold">What's new</p>
              <p className="text-xs text-muted-foreground">Everything that's changed</p>
            </div>
          </div>
          <button onClick={close} aria-label="Close updates" className="rounded-full glass p-2 hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 space-y-8 overflow-y-auto px-5 py-5">
          {RELEASES.map((r, i) => (
            <section key={r.version} className={i > 0 ? "border-t border-border pt-7" : undefined}>
              <div className="flex items-baseline gap-2">
                <span className="rounded-full tide-fill px-2.5 py-0.5 text-xs font-bold">Update {r.version}</span>
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
              <h3 className="mt-2 text-xl font-bold">{r.title}</h3>
              {r.items.map((g) => (
                <div key={g.group} className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{g.group}</p>
                  <ul className="mt-1.5 space-y-1.5 text-sm text-foreground/85">
                    {g.list.map((t) => (
                      <li key={t} className="flex gap-2"><span className="text-primary">•</span>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
        <div className="border-t border-border px-5 py-3">
          <button onClick={close} className="w-full rounded-full tide-fill py-2.5 text-sm font-bold glow">Got it!</button>
        </div>
      </div>
    </div>
  );
}
