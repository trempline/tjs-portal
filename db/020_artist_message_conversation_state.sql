-- ============================================================
-- TJS-20: Artist Message Conversation State
-- Per-user archive/delete state for conversations grouped by partner + subject.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tjs_internal_message_conversation_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    other_user_id uuid NOT NULL REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    subject text NOT NULL DEFAULT '',
    is_archived boolean NOT NULL DEFAULT false,
    is_deleted boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, other_user_id, subject)
);

ALTER TABLE public.tjs_internal_message_conversation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversation state"
ON public.tjs_internal_message_conversation_state
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
