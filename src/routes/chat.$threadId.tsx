import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUp,
  Captions,
  Check,
  CircleCheckBig,
  Clapperboard,
  Copy,
  Lightbulb,
  Menu,
  MessageSquare,
  Square,
  SquarePen,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Lock } from "lucide-react";
import {
  GUEST_LIMIT,
  bumpGuest,
  deleteCloudThread,
  guestUsed,
  loadCloudThreads,
  loadThreads,
  newId,
  saveCloudThread,
  saveThreads,
  type ChatMsg,
  type Thread,
} from "@/lib/chats";
import { censor } from "@/lib/profanity";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat — Gr3at AI" },
      { name: "description", content: "A conversation with Gr3at AI, the Gr3atMovies assistant." },
      { property: "og:title", content: "Chat — Gr3at AI" },
      { property: "og:description", content: "A conversation with Gr3at AI, the Gr3atMovies assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  { icon: Clapperboard, text: "Recommend a thriller for family movie night" },
  { icon: Captions, text: "How do I turn on captions?" },
  { icon: Wrench, text: "A video won't load — what should I do?" },
  { icon: Lightbulb, text: "Explain the plot of Inception simply" },
];

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      aria-label="Copy reply"
      className="mt-1 rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-surface-2 hover:text-foreground focus-visible:opacity-100 group-hover/msg:opacity-100"
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function ChatPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [used, setUsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const lastCountRef = useRef(0);
  const threadsRef = useRef<Thread[]>([]);
  threadsRef.current = threads;

  const locked = ready && !user && used >= GUEST_LIMIT;

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setUsed(guestUsed());
    (user ? loadCloudThreads() : Promise.resolve(loadThreads())).then((t) => {
      if (!alive) return;
      setThreads(t);
      setMessages(t.find((x) => x.id === threadId)?.messages ?? []);
    });
    setError(null);
    setSideOpen(false);
    taRef.current?.focus();
    return () => {
      alive = false;
    };
  }, [threadId, ready, user]);

  // Smooth-scroll when a message is added; instant follow while letters stream in.
  useEffect(() => {
    const smooth = messages.length !== lastCountRef.current;
    lastCountRef.current = messages.length;
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  }, [messages]);

  const persist = (msgs: ChatMsg[]) => {
    const firstUser = msgs.find((m) => m.role === "user")?.content ?? "New chat";
    const thread: Thread = { id: threadId, title: firstUser.slice(0, 48), updatedAt: Date.now(), messages: msgs };
    if (user) {
      const next = [thread, ...threadsRef.current.filter((x) => x.id !== threadId)];
      setThreads(next);
      void saveCloudThread(user.id, thread);
    } else {
      const next = [thread, ...loadThreads().filter((x) => x.id !== threadId)];
      saveThreads(next);
      setThreads(next);
    }
  };

  const finish = (history: ChatMsg[], reply: string) => {
    const final = reply ? [...history, { role: "assistant" as const, content: reply }] : history;
    setMessages(final);
    persist(final);
    setBusy(false);
    abortRef.current = null;
    taRef.current?.focus();
  };

  const send = async (text: string) => {
    const content = censor(text.trim());
    if (!content || busy || locked || !ready) return;
    if (!user) {
      bumpGuest();
      setUsed(guestUsed());
    }
    setError(null);
    setInput("");
    const history: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    persist(history);
    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;

    // Typewriter: +20 letters/sec for every 20 words (100 words → 100 letters/sec).
    let reply = "";
    let typed = 0;
    let streamDone = false;
    const timer = window.setInterval(() => {
      const dt = 0.05; // seconds per tick
      const trimmed = reply.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      const rate = Math.max(20, words); // letters per second: +20 per 20 words
      typed = Math.min(reply.length, typed + rate * dt);
      setMessages([...history, { role: "assistant", content: reply.slice(0, Math.floor(typed)) }]);
      if (streamDone && typed >= reply.length) {
        clearInterval(timer);
        finish(history, reply);
      }
    }, 50);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-40) }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || "Something went wrong.");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += dec.decode(value, { stream: true });
      }
      streamDone = true; // the typewriter interval finishes and persists
    } catch (e) {
      clearInterval(timer);
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
      finish(history, reply);
    }
  };

  const remove = (id: string) => {
    const next = threads.filter((x) => x.id !== id);
    if (user) void deleteCloudThread(id);
    else saveThreads(loadThreads().filter((x) => x.id !== id));
    setThreads(next);
    if (id === threadId) navigate({ to: "/chat/$threadId", params: { threadId: newId() } });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-surface transition-transform duration-300 md:static md:translate-x-0 ${
          sideOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 p-3">
          <Link to="/" className="flex items-center gap-2 px-1">
            <span className="grid size-8 place-items-center rounded-lg tide-fill glow">
              <CircleCheckBig className="size-4" strokeWidth={2.5} />
            </span>
            <span className="font-display font-extrabold">
              Gr3at<span className="tide-text">Movies</span>
            </span>
          </Link>
          <button className="rounded-lg p-2 hover:bg-surface-2 md:hidden" onClick={() => setSideOpen(false)} aria-label="Close sidebar">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-3">
          <Link
            to="/chat/$threadId"
            params={{ threadId: newId() }}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold transition hover:bg-surface-2 hover:ring-1 hover:ring-ring/40"
          >
            <SquarePen className="size-4" /> New chat
          </Link>
        </div>
        <p className="px-4 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Chats</p>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {threads.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">No chats yet.</p>}
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center rounded-lg transition ${
                t.id === threadId ? "bg-surface-2 ring-1 ring-ring/30" : "hover:bg-surface-2/60"
              }`}
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-sm"
              >
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{t.title}</span>
              </Link>
              <button
                onClick={() => remove(t.id)}
                aria-label="Delete chat"
                className="mr-1 rounded p-1.5 text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Link to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-surface-2 hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to movies
          </Link>
        </div>
      </aside>
      {sideOpen && <div className="fixed inset-0 z-30 bg-abyss/60 backdrop-blur-sm md:hidden" onClick={() => setSideOpen(false)} />}

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md">
          <button className="rounded-lg p-2 hover:bg-surface-2 md:hidden" onClick={() => setSideOpen(true)} aria-label="Open sidebar">
            <Menu className="size-5" />
          </button>
          <Link
            to="/"
            aria-label="Back to movies"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold transition hover:bg-surface-2"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full tide-fill glow">
              <CircleCheckBig className="size-4" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold leading-tight">Gr3at AI</p>
              <p className="truncate text-[11px] text-muted-foreground leading-tight">Your personal assistant</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 text-center rise">
              <span className="grid size-16 place-items-center rounded-3xl tide-fill glow">
                <CircleCheckBig className="size-8" strokeWidth={2.5} />
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold">
                How can I help <span className="tide-text">you</span> today?
              </h1>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Ask for movie picks, help with the site, or just chat — I'm here for it all.
              </p>
              <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="group flex items-start gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-3.5 text-left text-sm text-foreground/85 transition hover:bg-surface-2 hover:ring-1 hover:ring-ring/40"
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 transition group-hover:tide-fill">
                      <s.icon className="size-4" />
                    </span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-7 px-4 py-8">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="msg-in flex justify-end">
                    <div className="max-w-[80%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-surface-2 px-5 py-2.5 text-[15px]">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="msg-in group/msg flex gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full tide-fill glow">
                      <CircleCheckBig className="size-4" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="chat-md text-[15px] leading-7">
                        {m.content ? (
                          <>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                            {busy && i === messages.length - 1 && <span className="type-cursor" aria-hidden />}
                          </>
                        ) : (
                          <span className="inline-flex gap-1 pt-3" aria-label="Thinking">
                            <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
                            <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                            <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                          </span>
                        )}
                      </div>
                      {!busy && m.content && i === messages.length - 1 && <CopyBtn text={m.content} />}
                    </div>
                  </div>
                ),
              )}
              {error && (
                <p role="alert" className="rounded-xl border border-destructive/50 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          {ready && !user && !locked && (
            <p className="mx-auto mb-2 max-w-3xl text-center text-xs text-muted-foreground">
              {GUEST_LIMIT - used} free message{GUEST_LIMIT - used === 1 ? "" : "s"} left ·{" "}
              <Link to="/auth" className="font-semibold text-primary hover:underline">Log in</Link> for unlimited chats
            </p>
          )}
          {locked ? (
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-3xl border border-border bg-surface px-6 py-6 text-center deep-shadow">
              <span className="grid size-12 place-items-center rounded-2xl tide-fill glow">
                <Lock className="size-5" />
              </span>
              <p className="font-display text-lg font-bold">You've used your {GUEST_LIMIT} free messages</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Log in or create a free account to unlock unlimited Gr3at AI chats, saved to your account on every device.
              </p>
              <Link to="/auth" className="rounded-full tide-fill px-5 py-2.5 text-sm font-bold glow">
                Log in / Register
              </Link>
            </div>
          ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-border bg-surface px-4 py-3 deep-shadow transition focus-within:ring-1 focus-within:ring-ring"
          >
            <textarea
              ref={taRef}
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Message Gr3at AI"
              className="max-h-48 flex-1 resize-none bg-transparent py-1.5 text-[15px] outline-none placeholder:text-muted-foreground [field-sizing:content]"
            />
            {busy ? (
              <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Stop" className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition hover:opacity-80">
                <Square className="size-3.5 fill-current" />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()} aria-label="Send" className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition hover:opacity-80 disabled:opacity-30">
                <ArrowUp className="size-4" />
              </button>
            )}
          </form>
          )}
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Gr3at AI can make mistakes. Check important info.</p>
        </div>
      </main>
    </div>
  );
}
