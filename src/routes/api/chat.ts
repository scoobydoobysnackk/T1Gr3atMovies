import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { censor } from "@/lib/profanity";

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20000) }))
    .min(1)
    .max(60),
});

const SYSTEM = `You are Gr3at AI, the personal assistant built into Gr3atMovies, a free movie and TV streaming site.
Be polite, clear and professional, like ChatGPT. Use Markdown (headings, lists, bold, code blocks) when it helps.
You can chat about anything, recommend movies and shows, and explain how to use the site:
- Search bar at the top finds movies and TV shows.
- Section strip (Horror, Comedy, Drama, 18+ and more) opens browse pages; 18+ posters are blurred until tapped.
- "Watch Now!" opens the player; the best server is picked automatically. If it doesn't load, tap "Next best server" or pick another server. Fullscreen and Reload buttons are at the top/bottom of the player. Captions: tap CC inside the player.
- TV shows: pick a season, then an episode.
- The "Update" button next to search shows what's new.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const key = process.env["GROQ_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          signal: request.signal,
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            stream: true,
            reasoning_effort: "low",
            messages: [
              { role: "system", content: SYSTEM },
              ...parsed.data.messages.map((m) => (m.role === "user" ? { ...m, content: censor(m.content) } : m)),
            ],
          }),
        });
        if (!upstream.ok || !upstream.body) {
          const msg =
            upstream.status === 429
              ? "Too many messages right now — please wait a moment and try again."
              : `The AI service returned an error (${upstream.status}).`;
          return new Response(msg, { status: upstream.status === 429 ? 429 : 502 });
        }

        // Convert OpenAI-style SSE into a plain text stream.
        const dec = new TextDecoder();
        const enc = new TextEncoder();
        let buf = "";
        const stream = upstream.body.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, ctrl) {
              buf += dec.decode(chunk, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";
              for (const line of lines) {
                const t = line.trim();
                if (!t.startsWith("data:")) continue;
                const data = t.slice(5).trim();
                if (data === "[DONE]") continue;
                try {
                  const delta = JSON.parse(data).choices?.[0]?.delta?.content;
                  if (delta) ctrl.enqueue(enc.encode(delta));
                } catch {
                  /* ignore partial */
                }
              }
            },
          }),
        );
        return new Response(stream, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
