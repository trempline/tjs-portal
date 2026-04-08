-- ============================================
-- Diagnostic and Fix Script for Artists Visibility Issue
-- Run this in Supabase SQL Editor to diagnose and fix the issue
-- ============================================

-- STEP 1: Check if the required columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tjs_artists' 
  AND column_name IN ('is_tjs_artist', 'is_invited_artist', 'committee_member_id', 'is_featured', 'activation_status', 'external_artist_id', 'availability_calendar')
ORDER BY ordinal_position;

-- STEP 2: Check how many artists exist and their flag status
SELECT 
  COUNT(*) as total_artists,
  COUNT(*) FILTER (WHERE is_tjs_artist = true) as tjs_artists,
  COUNT(*) FILTER (WHERE is_invited_artist = true) as invited_artists,
  COUNT(*) FILTER (WHERE is_tjs_artist = false AND is_invited_artist = false) as no_flag_artists
FROM tjs_artists;

-- STEP 3: View all artists with their details
SELECT 
  a.id,
  a.artist_name,
  a.is_tjs_artist,
  a.is_invited_artist,
  a.is_featured,
  a.activation_status,
  a.committee_member_id,
  p.email as profile_email,
  p.full_name as profile_name,
  a.created_at
FROM tjs_artists a
LEFT JOIN tjs_profiles p ON p.id = a.profile_id
ORDER BY a.created_at DESC;

-- ============================================
-- FIX: If columns are missing, run the migration
-- ============================================
-- Uncomment and run this block if the columns are missing:

/*
BEGIN;

-- Add missing columns to tjs_artists
ALTER TABLE tjs_artists 
ADD COLUMN IF NOT EXISTS committee_member_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS activation_status TEXT DEFAULT 'pending' 
  CHECK (activation_status IN ('pending', 'active', 'inactive'));

-- Add external_artist_id and availability_calendar if missing
ALTER TABLE tjs_artists 
ADD COLUMN IF NOT EXISTS external_artist_id UUID,
ADD COLUMN IF NOT EXISTS availability_calendar JSONB;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tjs_artists_committee_member 
ON tjs_artists(committee_member_id) 
WHERE committee_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tjs_artists_featured 
ON tjs_artists(is_featured) 
WHERE is_featured = TRUE;

COMMIT;
*/

-- ============================================
-- FIX: If artists exist but don't have flags set
-- ============================================
-- Uncomment and run this block to set flags on existing artists:

/*
-- Example: Mark all existing artists as TJS artists
-- UPDATE tjs_artists 
-- SET is_tjs_artist = true 
-- WHERE is_tjs_artist IS NULL OR is_tjs_artist = false;

-- Example: Mark specific artists as invited artists
-- UPDATE tjs_artists 
-- SET is_invited_artist = true 
-- WHERE artist_name IN ('Artist Name 1', 'Artist Name 2');
*/

-- ============================================
-- FIX: Ensure RLS policies allow admin to see all artists
-- ============================================
-- This policy should already exist from the migration, but let's verify:

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

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tjs_artists' 
ORDER BY policyname;