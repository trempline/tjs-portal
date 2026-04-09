-- ============================================================
-- TJS-14: Artist Workspace Profile
-- New artist-managed profile tables for the artist workspace.
-- All new tables are prefixed with tjs_ as requested.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tjs_artist_profiles (
    profile_id uuid PRIMARY KEY REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    banner_url text,
    first_name text,
    last_name text,
    tagline text,
    short_biography text,
    long_biography text,
    website text,
    city text,
    country text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tjs_artist_profile_performances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.tjs_artist_profiles(profile_id) ON DELETE CASCADE,
    performance_id integer NOT NULL REFERENCES public.sys_artist_performance(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE (profile_id, performance_id)
);

CREATE TABLE IF NOT EXISTS public.tjs_artist_educations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.tjs_artist_profiles(profile_id) ON DELETE CASCADE,
    school_name text NOT NULL,
    course_name text NOT NULL,
    year integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tjs_artist_awards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.tjs_artist_profiles(profile_id) ON DELETE CASCADE,
    award text NOT NULL,
    description text,
    year integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tjs_artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tjs_artist_profile_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tjs_artist_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tjs_artist_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own workspace profile"
ON public.tjs_artist_profiles
FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Artists manage own workspace performances"
ON public.tjs_artist_profile_performances
FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Artists manage own workspace educations"
ON public.tjs_artist_educations
FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Artists manage own workspace awards"
ON public.tjs_artist_awards
FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
