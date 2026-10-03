import { Link } from "@tanstack/react-router";
import { SECTIONS } from "@/lib/sections";

export function SectionNav() {
  return (
    <nav className="border-b border-border bg-background/60 backdrop-blur">
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
        {SECTIONS.map((s) => (
          <Link
            key={s.slug}
            to="/section/$slug"
            params={{ slug: s.slug }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              s.mature ? "border border-destructive/50 text-destructive" : "glass text-foreground/80"
            } hover:text-foreground`}
            activeProps={{ className: "tide-fill glow !text-primary-foreground" }}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
