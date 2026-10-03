CREATE TABLE public.watch_history (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  media_key text NOT NULL,
  media_type text NOT NULL,
  tmdb_id text NOT NULL,
  title text NOT NULL,
  poster_path text,
  season int,
  episode int,
  source_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, media_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_history TO authenticated;
GRANT ALL ON public.watch_history TO service_role;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own history select" ON public.watch_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own history insert" ON public.watch_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own history update" ON public.watch_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own history delete" ON public.watch_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.chat_threads (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  title text NOT NULL DEFAULT 'New chat',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chats select" ON public.chat_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own chats insert" ON public.chat_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chats update" ON public.chat_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chats delete" ON public.chat_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);