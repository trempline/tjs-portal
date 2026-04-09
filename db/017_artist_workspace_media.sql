-- ============================================================
-- TJS-17: Artist Workspace Media
-- Stores artist-managed media entries for videos and CDs.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tjs_artist_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    media_type text NOT NULL CHECK (media_type IN ('video', 'cd')),
    image_url text,
    name text NOT NULL,
    description text,
    urls text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tjs_artist_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own workspace media"
ON public.tjs_artist_media
FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
