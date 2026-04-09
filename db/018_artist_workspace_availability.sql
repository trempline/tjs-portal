-- ============================================================
-- TJS-18: Artist Workspace Availability
-- Stores artist availability date ranges for performances.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tjs_artist_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NOT NULL,
    note text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CHECK (end_date >= start_date)
);

ALTER TABLE public.tjs_artist_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own workspace availability"
ON public.tjs_artist_availability
FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
