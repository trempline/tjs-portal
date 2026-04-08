-- ============================================================
-- TJS-7: Artist Featured Flag Management System
-- Adds is_featured column to tjs_artists and audit trail table
-- ============================================================
-- is_featured = true  → artist is HIDDEN from public-facing pages
-- is_featured = false → artist is VISIBLE publicly (if also is_tjs_artist or is_invited_artist)
-- ============================================================

-- 1. Add is_featured column to tjs_artists
ALTER TABLE public.tjs_artists
    ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tjs_artists_featured ON public.tjs_artists(is_featured);

COMMENT ON COLUMN public.tjs_artists.is_featured IS
    'When true, the artist is hidden from all public-facing directories and search results.
     Public visibility requires: (is_tjs_artist = true OR is_invited_artist = true) AND is_featured = false.';

-- 2. Create audit trail table for artist featured flag changes
CREATE TABLE IF NOT EXISTS public.tjs_artist_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.tjs_artists(id) ON DELETE CASCADE,
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    previous_featured boolean NOT NULL,
    new_featured boolean NOT NULL,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_tjs_artist_audit_artist ON public.tjs_artist_audit_log(artist_id);
CREATE INDEX IF NOT EXISTS idx_tjs_artist_audit_performer ON public.tjs_artist_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_tjs_artist_audit_date ON public.tjs_artist_audit_log(performed_at DESC);

COMMENT ON TABLE public.tjs_artist_audit_log IS
    'Audit trail for artist featured flag changes. Captures who changed the flag, previous/new state, and timestamp.';

-- 3. Enable RLS on audit log
ALTER TABLE public.tjs_artist_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins and Committee Members can view audit logs
CREATE POLICY "Admins and Committee can view audit logs"
    ON public.tjs_artist_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tjs_user_roles ur
            JOIN public.tjs_roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.name IN ('Admin', 'Committee Member')
        )
    );

-- Admins and Committee Members can insert audit logs (triggered by app)
CREATE POLICY "Admins and Committee can insert audit logs"
    ON public.tjs_artist_audit_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tjs_user_roles ur
            JOIN public.tjs_roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.name IN ('Admin', 'Committee Member')
        )
    );

-- 4. Update tjs_artists RLS policies for is_featured management
-- Admins can update any artist's is_featured flag
CREATE POLICY "Admins can update artist featured flag"
    ON public.tjs_artists FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tjs_user_roles ur
            JOIN public.tjs_roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.name = 'Admin'
        )
    );

-- Committee Members can update is_featured for artists they have access to
-- (simplified: Committee Members can update any artist — scope restriction can be added later)
CREATE POLICY "Committee can update artist featured flag"
    ON public.tjs_artists FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tjs_user_roles ur
            JOIN public.tjs_roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.name = 'Committee Member'
        )
    );

-- 5. Helper function: toggle artist featured flag with audit logging
CREATE OR REPLACE FUNCTION public.tjs_toggle_artist_featured(
    p_artist_id UUID,
    p_is_featured boolean,
    p_performed_by UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (success boolean, error_message TEXT) AS $$
DECLARE
    v_current_featured boolean;
    v_performer_is_admin boolean;
    v_performer_is_committee boolean;
BEGIN
    -- Check performer permissions
    SELECT EXISTS (
        SELECT 1 FROM public.tjs_user_roles ur
        JOIN public.tjs_roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_performed_by
        AND ur.is_active = true
        AND r.name = 'Admin'
    ) INTO v_performer_is_admin;

    SELECT EXISTS (
        SELECT 1 FROM public.tjs_user_roles ur
        JOIN public.tjs_roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_performed_by
        AND ur.is_active = true
        AND r.name = 'Committee Member'
    ) INTO v_performer_is_committee;

    IF NOT v_performer_is_admin AND NOT v_performer_is_committee THEN
        RETURN QUERY SELECT false, 'Insufficient permissions. Only Admin or Committee Member can toggle featured flag.';
        RETURN;
    END IF;

    -- Get current featured status
    SELECT is_featured INTO v_current_featured
    FROM public.tjs_artists
    WHERE id = p_artist_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Artist not found.';
        RETURN;
    END IF;

    -- Update the artist
    UPDATE public.tjs_artists
    SET is_featured = p_is_featured,
        updated_at = NOW()
    WHERE id = p_artist_id;

    -- Log the change
    INSERT INTO public.tjs_artist_audit_log (artist_id, performed_by, previous_featured, new_featured, reason)
    VALUES (p_artist_id, p_performed_by, v_current_featured, p_is_featured, p_reason);

    RETURN QUERY SELECT true, ''::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.tjs_toggle_artist_featured IS
    'Toggles the is_featured flag on an artist and logs the change to the audit trail.
     Only Admin and Committee Member roles can execute this function.';
