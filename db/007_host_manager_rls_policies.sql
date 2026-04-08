-- ============================================================
-- Migration: 007_host_manager_rls_policies.sql
-- Purpose: Add Row Level Security policies for Host Manager system
-- ============================================================

BEGIN;

-- ============================================================
-- tjs_host_managers RLS Policies
-- ============================================================

-- Enable RLS on tjs_host_managers
ALTER TABLE tjs_host_managers ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do anything with host manager assignments
CREATE POLICY "Admins can manage host manager assignments"
ON tjs_host_managers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Admin'
    AND ur.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Admin'
    AND ur.is_active = true
  )
);

-- Policy: Host Managers can view their own assignments
CREATE POLICY "Host Managers can view own assignments"
ON tjs_host_managers
FOR SELECT
USING (manager_id = auth.uid());

-- ============================================================
-- tjs_request_suggestions RLS Policies
-- ============================================================

-- Enable RLS on tjs_request_suggestions
ALTER TABLE tjs_request_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do anything with suggestions
CREATE POLICY "Admins can manage suggestions"
ON tjs_request_suggestions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Admin'
    AND ur.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Admin'
    AND ur.is_active = true
  )
);

-- Policy: Host Managers can create suggestions
CREATE POLICY "Host Managers can create suggestions"
ON tjs_request_suggestions
FOR INSERT
WITH CHECK (
  suggested_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Host Manager'
    AND ur.is_active = true
  )
);

-- Policy: Host Managers can view their own suggestions
CREATE POLICY "Host Managers can view own suggestions"
ON tjs_request_suggestions
FOR SELECT
USING (suggested_by = auth.uid());

-- Policy: Hosts can view suggestions they received
CREATE POLICY "Hosts can view received suggestions"
ON tjs_request_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tjs_hosts h
    WHERE h.id = tjs_request_suggestions.host_id
    AND h.profile_id = auth.uid()
  )
);

-- Policy: Hosts can update their received suggestions (respond)
CREATE POLICY "Hosts can respond to suggestions"
ON tjs_request_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tjs_hosts h
    WHERE h.id = tjs_request_suggestions.host_id
    AND h.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tjs_hosts h
    WHERE h.id = tjs_request_suggestions.host_id
    AND h.profile_id = auth.uid()
  )
);

-- ============================================================
-- tjs_internal_messages RLS Policies
-- ============================================================

-- Enable RLS on tjs_internal_messages
ALTER TABLE tjs_internal_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do anything with messages
CREATE POLICY "Admins can manage messages"
ON tjs_internal_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Admin'
    AND ur.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Admin'
    AND ur.is_active = true
  )
);

-- Policy: Users can send messages (insert)
CREATE POLICY "Users can send messages"
ON tjs_internal_messages
FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- Policy: Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
ON tjs_internal_messages
FOR SELECT
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Policy: Users can update their own messages (mark as read)
CREATE POLICY "Users can update own messages"
ON tjs_internal_messages
FOR UPDATE
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

COMMIT;