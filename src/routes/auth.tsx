import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CircleCheckBig, History, Lock, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log in or register — Gr3atMovies" },
      { name: "description", content: "Create a free Gr3atMovies account to unlock Gr3at AI and save your watch history." },
      { property: "og:title", content: "Log in or register — Gr3atMovies" },
      { property: "og:description", content: "Unlock Gr3at AI and save your watch history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ kind: "error", text: error.message });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setMsg({ kind: "error", text: error.message });
      else if (!data.session) setMsg({ kind: "ok", text: "Almost there! Check your email and tap the link to confirm your account." });
    }
    setBusy(false);
  };

  const google = async () => {
    setMsg(null);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg({ kind: "error", text: r.error.message ?? "Google sign-in failed." });
  };

  const perks = [
    { icon: Sparkles, text: "Unlimited Gr3at AI chats" },
    { icon: MessageSquare, text: "AI chat history on every device" },
    { icon: History, text: "Watch history that remembers your server" },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-40 -top-40 size-[34rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[30rem] rounded-full bg-accent/20 blur-3xl" />
      <Link to="/" className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full glass px-3 py-2 text-sm font-semibold">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] glass deep-shadow md:grid-cols-2 rise">
        <div className="hidden flex-col justify-between bg-surface/60 p-10 md:flex">
          <div className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-xl tide-fill glow">
              <CircleCheckBig className="size-5" strokeWidth={2.5} />
            </span>
            <span className="font-display text-xl font-extrabold">Gr3at<span className="tide-text">Movies</span></span>
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight">Dive deeper with a <span className="tide-text">free account</span>.</h2>
            <ul className="mt-6 space-y-3">
              {perks.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-sm">
                  <span className="grid size-8 place-items-center rounded-lg bg-surface-2"><p.icon className="size-4 text-primary" /></span>
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">Free forever. No card needed.</p>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-6 flex rounded-full bg-surface p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setMsg(null); }}
                className={`flex-1 rounded-full py-2 text-sm font-bold transition ${mode === m ? "tide-fill glow" : "text-muted-foreground"}`}
              >
                {m === "login" ? "Log in" : "Register"}
              </button>
            ))}
          </div>
          <h1 className="font-display text-2xl font-extrabold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Pick up right where you left off." : "Takes ten seconds."}
          </p>

          <button onClick={google} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-semibold transition hover:bg-surface-2">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.96S8.78 6.56 12 6.56c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.7 4.03 14.56 3 12 3 6.98 3 2.9 7.03 2.9 12s4.08 9 9.1 9c5.25 0 8.73-3.69 8.73-8.89 0-.6-.06-1.05-.15-1.51Z" /></svg>
            Continue with Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-xl border border-input bg-surface px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)"
              className="w-full rounded-xl border border-input bg-surface px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl tide-fill py-2.5 text-sm font-bold glow disabled:opacity-60">
              <Lock className="size-4" /> {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
          {msg && (
            <p role="alert" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${msg.kind === "error" ? "border-destructive/50 text-destructive" : "border-primary/50 text-primary"}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
