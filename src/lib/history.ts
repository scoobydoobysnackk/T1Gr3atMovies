import { supabase } from "@/integrations/supabase/client";
import type { Media } from "@/lib/sources";

export type HistoryItem = {
  media_key: string;
  media_type: string;
  tmdb_id: string;
  title: string;
  poster_path: string | null;
  season: number | null;
  episode: number | null;
  source_id: string;
  updated_at: string;
};

/** One saved source per movie / per show (TV remembers the last episode watched). */
export const mediaKey = (tmdbId: string, media: Media) => `${media.type}:${tmdbId}`;

async function userId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function getSavedSource(tmdbId: string, media: Media): Promise<string | null> {
  if (!(await userId())) return null;
  const { data } = await supabase
    .from("watch_history")
    .select("source_id")
    .eq("media_key", mediaKey(tmdbId, media))
    .maybeSingle();
  return data?.source_id ?? null;
}

export async function saveWatch(args: {
  tmdbId: string;
  media: Media;
  title: string;
  posterPath?: string | null;
  sourceId: string;
}) {
  const uid = await userId();
  if (!uid) return;
  await supabase.from("watch_history").upsert({
    user_id: uid,
    media_key: mediaKey(args.tmdbId, args.media),
    media_type: args.media.type,
    tmdb_id: args.tmdbId,
    title: args.title,
    poster_path: args.posterPath ?? null,
    season: args.media.type === "tv" ? args.media.season : null,
    episode: args.media.type === "tv" ? args.media.episode : null,
    source_id: args.sourceId,
    updated_at: new Date().toISOString(),
  });
}

export async function listHistory(): Promise<HistoryItem[]> {
  if (!(await userId())) return [];
  const { data } = await supabase
    .from("watch_history")
    .select("media_key,media_type,tmdb_id,title,poster_path,season,episode,source_id,updated_at")
    .order("updated_at", { ascending: false })
    .limit(60);
  return (data as HistoryItem[]) ?? [];
}

export async function removeHistory(key: string) {
  await supabase.from("watch_history").delete().eq("media_key", key);
}
