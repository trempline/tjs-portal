-- ============================================
-- TJS REQUEST SUGGESTIONS
-- Tracks suggestions from Host Managers to Hosts for artist requests
-- ============================================

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tjs_request_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.tjs_requests(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.tjs_hosts(id) ON DELETE CASCADE,
    suggested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    suggested_at TIMESTAMPTZ DEFAULT NOW(),
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'declined', 'expired')),
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    host_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tjs_request_suggestions_request ON public.tjs_request_suggestions(request_id);
CREATE INDEX IF NOT EXISTS idx_tjs_request_suggestions_host ON public.tjs_request_suggestions(host_id);
CREATE INDEX IF NOT EXISTS idx_tjs_request_suggestions_suggested_by ON public.tjs_request_suggestions(suggested_by);
CREATE INDEX IF NOT EXISTS idx_tjs_request_suggestions_status ON public.tjs_request_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_tjs_request_suggestions_created ON public.tjs_request_suggestions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.tjs_request_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can do everything
CREATE POLICY "Admins can do everything on request_suggestions"
    ON public.tjs_request_suggestions
    FOR ALL
    USING (tjs_is_admin(auth.uid()))
    WITH CHECK (tjs_is_admin(auth.uid()));

-- Host Managers can view suggestions they made
CREATE POLICY "Host Managers can view their own suggestions"
    ON public.tjs_request_suggestions
    FOR SELECT
    USING (suggested_by = auth.uid());

-- Host Managers can create suggestions (for hosts they manage)
CREATE POLICY "Host Managers can create suggestions"
    ON public.tjs_request_suggestions
    FOR INSERT
    WITH CHECK (
        suggested_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.tjs_host_managers hm
            WHERE hm.host_id = host_id 
            AND hm.manager_id = auth.uid()
            AND hm.is_active = TRUE
        )
    );

-- Hosts can view suggestions made to them
CREATE POLICY "Hosts can view suggestions for their hosts"
    ON public.tjs_request_suggestions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tjs_host_members hm
            WHERE hm.host_id = host_id 
            AND hm.profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.tjs_hosts h
            WHERE h.id = host_id 
            AND h.profile_id = auth.uid()
        )
    );

-- Hosts can update their response to suggestions
CREATE POLICY "Hosts can respond to suggestions"
    ON public.tjs_request_suggestions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tjs_host_members hm
            WHERE hm.host_id = host_id 
            AND hm.profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.tjs_hosts h
            WHERE h.id = host_id 
            AND h.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tjs_host_members hm
            WHERE hm.host_id = host_id 
            AND hm.profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.tjs_hosts h
            WHERE h.id = host_id 
            AND h.profile_id = auth.uid()
        )
    );

-- Function to create a suggestion
CREATE OR REPLACE FUNCTION tjs_create_request_suggestion(
    p_request_id UUID,
    p_host_id UUID,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_suggestion_id UUID;
BEGIN
    -- Verify the manager has permission to suggest to this host
    IF NOT EXISTS (
        SELECT 1 FROM public.tjs_host_managers hm
        WHERE hm.host_id = p_host_id 
        AND hm.manager_id = auth.uid()
        AND hm.is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'You do not have permission to suggest requests to this host';
    END IF;

    -- Create the suggestion
    INSERT INTO public.tjs_request_suggestions (request_id, host_id, suggested_by, message)
    VALUES (p_request_id, p_host_id, auth.uid(), p_message)
    RETURNING id INTO v_suggestion_id;

    RETURN v_suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to a suggestion
CREATE OR REPLACE FUNCTION tjs_respond_to_suggestion(
    p_suggestion_id UUID,
    p_status TEXT,
    p_response TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Verify the user has permission to respond for this host
    IF NOT EXISTS (
        SELECT 1 FROM public.tjs_request_suggestions rs
        JOIN public.tjs_host_members hm ON hm.host_id = rs.host_id
        WHERE rs.id = p_suggestion_id AND hm.profile_id = auth.uid()
    ) AND NOT EXISTS (
        SELECT 1 FROM public.tjs_request_suggestions rs
        JOIN public.tjs_hosts h ON h.id = rs.host_id
        WHERE rs.id = p_suggestion_id AND h.profile_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have permission to respond to this suggestion';
    END IF;

    -- Update the suggestion
    UPDATE public.tjs_request_suggestions
    SET 
        status = p_status,
        host_response = p_response,
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.tjs_request_suggestions IS 'Tracks suggestions from Host Managers to Hosts recommending they book specific artists from pending requests.';
COMMENT ON COLUMN public.tjs_request_suggestions.request_id IS 'The artist request being suggested';
COMMENT ON COLUMN public.tjs_request_suggestions.host_id IS 'The host receiving the suggestion';
COMMENT ON COLUMN public.tjs_request_suggestions.suggested_by IS 'The Host Manager making the suggestion';
COMMENT ON COLUMN public.tjs_request_suggestions.message IS 'Optional message from the Host Manager explaining the suggestion';
COMMENT ON COLUMN public.tjs_request_suggestions.status IS 'Status of the suggestion: pending, viewed, accepted, declined, expired';