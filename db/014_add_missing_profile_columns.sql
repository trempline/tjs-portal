-- ============================================
-- Fix: Add Missing Columns to tjs_profiles
-- ============================================
-- This migration adds the membership-related columns that are
-- referenced by the application but missing from the database.
-- 
-- Error being fixed:
-- "column tjs_profiles.member_until does not exist"
-- "column tjs_profiles.member_since does not exist"
-- "column tjs_profiles.is_member does not exist"
-- "column tjs_profiles.is_pag_artist does not exist"
-- ============================================

BEGIN;

-- Add missing membership columns to tjs_profiles
ALTER TABLE tjs_profiles 
ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS member_since DATE,
ADD COLUMN IF NOT EXISTS member_until DATE,
ADD COLUMN IF NOT EXISTS is_pag_artist BOOLEAN DEFAULT FALSE;

-- Create indexes for membership queries
CREATE INDEX IF NOT EXISTS idx_tjs_profiles_is_member 
ON tjs_profiles(is_member) 
WHERE is_member = TRUE;

CREATE INDEX IF NOT EXISTS idx_tjs_profiles_member_until 
ON tjs_profiles(member_until) 
WHERE member_until IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN tjs_profiles.is_member IS 'Whether the user is an active paid member';
COMMENT ON COLUMN tjs_profiles.member_since IS 'Date when membership started';
COMMENT ON COLUMN tjs_profiles.member_until IS 'Date when membership expires (yearly fee)';
COMMENT ON COLUMN tjs_profiles.is_pag_artist IS 'Flag indicating if this is a PAG artist (synced with PAG if applicable)';

COMMIT;

-- ============================================
-- Verification Query
-- Run this after applying the migration to verify
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tjs_profiles'
AND column_name IN ('is_member', 'member_since', 'member_until', 'is_pag_artist')
ORDER BY column_name;