import { supabase } from "@/integrations/supabase/client";

export type ChatMsg = { role: "user" | "assistant"; content: string };
export type Thread = { id: string; title: string; updatedAt: number; messages: ChatMsg[] };

const KEY = "gr3at-ai-threads";
const GUEST_KEY = "gr3at-ai-guest-used";
/** Free messages a visitor can send before logging in. */
export const GUEST_LIMIT = 3;

export function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const t = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Thread[];
    return Array.isArray(t) ? t.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function saveThreads(t: Thread[]) {
  localStorage.setItem(KEY, JSON.stringify(t));
}

export const guestUsed = () => Number(localStorage.getItem(GUEST_KEY) ?? "0") || 0;
export const bumpGuest = () => localStorage.setItem(GUEST_KEY, String(guestUsed() + 1));

// ---- Signed-in: chats live in the cloud ----
export async function loadCloudThreads(): Promise<Thread[]> {
  const { data } = await supabase
    .from("chat_threads")
    .select("id,title,messages,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    messages: (r.messages as ChatMsg[]) ?? [],
    updatedAt: new Date(r.updated_at).getTime(),
  }));
}

export async function saveCloudThread(userId: string, t: Thread) {
  await supabase.from("chat_threads").upsert({
    user_id: userId,
    id: t.id,
    title: t.title,
    messages: t.messages,
    updated_at: new Date(t.updatedAt).toISOString(),
  });
}

export async function deleteCloudThread(id: string) {
  await supabase.from("chat_threads").delete().eq("id", id);
}

export const newId = () => Math.random().toString(36).slice(2, 10);
