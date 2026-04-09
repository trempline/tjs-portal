-- ============================================================
-- TJS-15: Artist Workspace Instruments
-- Artist-managed instruments for the new TJS artist workspace.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tjs_artist_instruments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    instrument_id integer NOT NULL REFERENCES public.sys_instruments(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE (profile_id, instrument_id)
);

ALTER TABLE public.tjs_artist_instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own workspace instruments"
ON public.tjs_artist_instruments
FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
