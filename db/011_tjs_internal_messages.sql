-- ============================================
-- TJS INTERNAL MESSAGES
-- Messaging system for Host Managers to communicate with their Hosts
-- ============================================

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tjs_internal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    subject TEXT,
    body TEXT NOT NULL,
    related_host_id INTEGER REFERENCES public.tjs_hosts(id) ON DELETE SET NULL,
    related_request_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tjs_internal_messages_sender ON public.tjs_internal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_tjs_internal_messages_recipient ON public.tjs_internal_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_tjs_internal_messages_host ON public.tjs_internal_messages(related_host_id);
CREATE INDEX IF NOT EXISTS idx_tjs_internal_messages_request ON public.tjs_internal_messages(related_request_id);
CREATE INDEX IF NOT EXISTS idx_tjs_internal_messages_created ON public.tjs_internal_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tjs_internal_messages_is_read ON public.tjs_internal_messages(is_read);

-- Enable Row Level Security
ALTER TABLE public.tjs_internal_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can do everything
CREATE POLICY "Admins can do everything on internal_messages"
    ON public.tjs_internal_messages
    FOR ALL
    USING (tjs_is_admin(auth.uid()))
    WITH CHECK (tjs_is_admin(auth.uid()));

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
    ON public.tjs_internal_messages
    FOR SELECT
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can send messages
CREATE POLICY "Users can send messages"
    ON public.tjs_internal_messages
    FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- Users can update their own messages (e.g., mark as read)
CREATE POLICY "Users can update their own messages"
    ON public.tjs_internal_messages
    FOR UPDATE
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- Host Managers can send messages to their assigned hosts
-- (Additional validation should be done in application layer)

-- Function to mark message as read
CREATE OR REPLACE FUNCTION tjs_mark_message_as_read(p_message_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.tjs_internal_messages
    SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
    WHERE id = p_message_id AND recipient_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation with a specific host
CREATE OR REPLACE FUNCTION tjs_get_conversation_with_host(p_host_id INTEGER)
RETURNS SETOF public.tjs_internal_messages AS $$
BEGIN
    RETURN QUERY
    SELECT m.*
    FROM public.tjs_internal_messages m
    JOIN public.tjs_host_managers hm ON hm.host_id = p_host_id
    WHERE (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
      AND (m.sender_id = hm.manager_id OR m.recipient_id = hm.manager_id)
      AND hm.is_active = TRUE
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.tjs_internal_messages IS 'Internal messaging system for Host Managers to communicate with their assigned Hosts. Messages can be related to specific hosts or requests.';
COMMENT ON COLUMN public.tjs_internal_messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN public.tjs_internal_messages.recipient_id IS 'User who receives the message';
COMMENT ON COLUMN public.tjs_internal_messages.related_host_id IS 'Optional reference to host if message is about a specific host';
COMMENT ON COLUMN public.tjs_internal_messages.related_request_id IS 'Optional reference to request if message is about a specific request';
