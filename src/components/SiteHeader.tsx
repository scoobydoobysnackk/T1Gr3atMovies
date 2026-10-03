import { Link, useNavigate } from "@tanstack/react-router";
import { Bot, CircleCheckBig, CircleUser, LogIn, Megaphone, Search } from "lucide-react";
import { RELEASES, UpdateLog, openUpdateLog } from "@/components/UpdateLog";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function SiteHeader({ initialQuery = "" }: { initialQuery?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQuery);
  const { user, ready } = useAuth();

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border glass">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl tide-fill glow">
            <CircleCheckBig className="size-5" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Gr3at<span className="tide-text">Movies</span>
          </span>
        </Link>

        <Link
          to="/chat"
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full tide-fill px-3 py-2 text-xs font-bold glow"
        >
          <Bot className="size-4" />
          <span className="hidden sm:inline">Gr3at AI</span>
        </Link>
        {ready && (
          <Link
            to={user ? "/account" : "/auth"}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full glass px-3 py-2 text-xs font-bold hover:bg-surface-2"
          >
            {user ? <CircleUser className="size-4 text-primary" /> : <LogIn className="size-4 text-primary" />}
            <span className="hidden sm:inline">{user ? "My account" : "Log in"}</span>
          </Link>
        )}
        <button
          type="button"
          onClick={openUpdateLog}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full glass px-3 py-2 text-xs font-bold hover:bg-surface-2"
        >
          <Megaphone className="size-4 text-primary" />
          <span className="hidden sm:inline">Update {RELEASES[0]!.version}</span>
        </button>
        <form
          className="flex w-full max-w-md items-center gap-2 rounded-full border border-input bg-surface/70 px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            const next = q.trim();
            navigate({ to: "/", search: next ? { q: next } : {} });
          }}
        >
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search every movie ever made…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>
      </div>
    </header>
    <UpdateLog />
    </>
  );
}
