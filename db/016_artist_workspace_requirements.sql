-- ============================================================
-- TJS-16: Artist Workspace Requirements
-- Stores artist financial, dietary, and additional requirements.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tjs_artist_requirements (
    profile_id uuid PRIMARY KEY REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    rib_number text,
    guso_number text,
    security_number text,
    allergies text,
    food_restriction text,
    additional_requirements text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tjs_artist_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own workspace requirements"
ON public.tjs_artist_requirements
FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
