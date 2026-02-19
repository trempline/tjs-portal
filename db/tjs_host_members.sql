-- ============================================
-- TJS HOST MEMBERS (Junction Table)
-- Links profiles/users to hosts
-- ============================================
CREATE TABLE IF NOT EXISTS public.tjs_host_members (
    id serial4 NOT NULL,
    host_id int4 NOT NULL REFERENCES public.tjs_hosts(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    created_on timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tjs_host_members_pkey PRIMARY KEY (id),
    CONSTRAINT tjs_host_members_unique UNIQUE (host_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_tjs_host_members_host ON public.tjs_host_members(host_id);
CREATE INDEX IF NOT EXISTS idx_tjs_host_members_profile ON public.tjs_host_members(profile_id);

-- RLS
ALTER TABLE public.tjs_host_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can do everything on host_members"
    ON public.tjs_host_members FOR ALL
    USING (tjs_is_admin(auth.uid()));

CREATE POLICY "Hosts can view their own memberships"
    ON public.tjs_host_members FOR SELECT
    USING (profile_id = auth.uid());
