-- ============================================================
-- TJS-19: Artist Workspace Notifications
-- Stores notifications sent to artists from internal platform roles.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tjs_artist_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_role_id uuid NOT NULL REFERENCES public.tjs_roles(id) ON DELETE CASCADE,
    sender_profile_id uuid REFERENCES public.tjs_profiles(id) ON DELETE SET NULL,
    sender_role text,
    subject text NOT NULL,
    body text NOT NULL,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tjs_artist_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tjs_artist_notification_reads (
    notification_id uuid NOT NULL REFERENCES public.tjs_artist_notifications(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    read_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (notification_id, profile_id)
);

ALTER TABLE public.tjs_artist_notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists view role notifications"
ON public.tjs_artist_notifications
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.tjs_user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role_id = recipient_role_id
          AND ur.is_active = true
    )
);

CREATE POLICY "Artists read own notification state"
ON public.tjs_artist_notification_reads
FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Artists mark own notification state"
ON public.tjs_artist_notification_reads
FOR INSERT
WITH CHECK (profile_id = auth.uid());
