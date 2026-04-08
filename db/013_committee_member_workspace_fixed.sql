-- ============================================
-- TJS-10: Committee Member Workspace Migration (Fixed)
-- ============================================
-- This migration adds:
-- 1. committee_member_id column to tjs_artists for assignment
-- 2. is_featured flag to tjs_artists for visibility toggle
-- 3. activation_status to tjs_artists for tracking artist status
-- 4. RLS policies for Committee Member scoped access
-- ============================================

-- 1. Add committee_member_id, is_featured, and activation_status to tjs_artists
ALTER TABLE tjs_artists 
ADD COLUMN IF NOT EXISTS committee_member_id UUID REFERENCES auth.users(id);

ALTER TABLE tjs_artists 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

ALTER TABLE tjs_artists 
ADD COLUMN IF NOT EXISTS activation_status TEXT DEFAULT 'pending' 
  CHECK (activation_status IN ('pending', 'active', 'inactive'));

-- Index for faster lookups by committee_member
CREATE INDEX IF NOT EXISTS idx_tjs_artists_committee_member 
ON tjs_artists(committee_member_id) 
WHERE committee_member_id IS NOT NULL;

-- Index for featured artists
CREATE INDEX IF NOT EXISTS idx_tjs_artists_featured 
ON tjs_artists(is_featured) 
WHERE is_featured = TRUE;

-- 2. Enable RLS on tjs_artists (if not already enabled)
ALTER TABLE tjs_artists ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for tjs_artists

-- Admin can do everything
DROP POLICY IF EXISTS "tjs_artists_admin_full_access" ON tjs_artists;
CREATE POLICY "tjs_artists_admin_full_access" ON tjs_artists
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'Admin' 
    AND ur.is_active = true
  )
);

-- Committee Members can SELECT only artists assigned to them
DROP POLICY IF EXISTS "tjs_artists_committee_member_select_own" ON tjs_artists;
CREATE POLICY "tjs_artists_committee_member_select_own" ON tjs_artists
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'Committee Member' 
    AND ur.is_active = true
  )
  AND (
    committee_member_id = auth.uid() 
    OR created_by = auth.uid()
  )
);

-- Committee Members can UPDATE only artists assigned to them (for is_featured toggle)
DROP POLICY IF EXISTS "tjs_artists_committee_member_update_own" ON tjs_artists;
CREATE POLICY "tjs_artists_committee_member_update_own" ON tjs_artists
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'Committee Member' 
    AND ur.is_active = true
  )
  AND committee_member_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'Committee Member' 
    AND ur.is_active = true
  )
  AND committee_member_id = auth.uid()
);

-- Artists can SELECT their own artist record
DROP POLICY IF EXISTS "tjs_artists_artist_select_own" ON tjs_artists;
CREATE POLICY "tjs_artists_artist_select_own" ON tjs_artists
FOR SELECT
USING (
  profile_id = auth.uid()
);

-- Artists can UPDATE their own profile
DROP POLICY IF EXISTS "tjs_artists_artist_update_own" ON tjs_artists;
CREATE POLICY "tjs_artists_artist_update_own" ON tjs_artists
FOR UPDATE
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- 4. RLS Policies for tjs_events (read-only for Committee Members)

-- Committee Members can SELECT all events (read-only access to platform activity)
DROP POLICY IF EXISTS "tjs_events_committee_member_select_all" ON tjs_events;
CREATE POLICY "tjs_events_committee_member_select_all" ON tjs_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'Committee Member' 
    AND ur.is_active = true
  )
);

-- 5. RLS Policies for tjs_requests (read-only for Committee Members)

-- Committee Members can SELECT all event requests (to monitor pipeline)
DROP POLICY IF EXISTS "tjs_requests_committee_member_select_all" ON tjs_requests;
CREATE POLICY "tjs_requests_committee_member_select_all" ON tjs_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tjs_user_roles ur
    JOIN tjs_roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'Committee Member' 
    AND ur.is_active = true
  )
);

-- 6. Create a view for Committee Members to easily query their assigned artists
DROP VIEW IF EXISTS tjs_committee_member_artists;
CREATE OR REPLACE VIEW tjs_committee_member_artists AS
SELECT 
  a.*,
  p.email as profile_email,
  p.full_name as profile_name,
  p.avatar_url,
  cm.email as committee_member_email,
  cm.full_name as committee_member_name
FROM tjs_artists a
LEFT JOIN tjs_profiles p ON p.id = a.profile_id
LEFT JOIN tjs_profiles cm ON cm.id = a.committee_member_id
WHERE a.committee_member_id IS NOT NULL;

-- 7. Create a function to get Committee Member's assigned artist IDs
-- This is useful for filtering related events and requests
DROP FUNCTION IF EXISTS tjs_fn_committee_member_artist_ids;
CREATE OR REPLACE FUNCTION tjs_fn_committee_member_artist_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT a.id
  FROM tjs_artists a
  WHERE a.committee_member_id = auth.uid()
     OR a.created_by = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant usage on the function to authenticated users
GRANT EXECUTE ON FUNCTION tjs_fn_committee_member_artist_ids() TO authenticated;