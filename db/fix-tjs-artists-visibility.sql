-- ============================================
-- Fix: Set is_tjs_artist flag for existing TJS artists
-- ============================================
-- Run this in Supabase SQL Editor to fix the visibility issue
-- where TJS artists don't appear in the Admin workspace
-- ============================================

-- STEP 1: Check current state of artists
SELECT 
  id,
  artist_name,
  is_tjs_artist,
  is_invited_artist,
  activation_status,
  created_at
FROM tjs_artists
ORDER BY created_at DESC;

-- STEP 2: Update artists to set is_tjs_artist = true
-- Option A: Set ALL existing artists as TJS artists
-- Uncomment the following line if all current artists should be TJS artists:
-- UPDATE tjs_artists SET is_tjs_artist = true WHERE is_tjs_artist = false;

-- Option B: Set artists as TJS artists based on some criteria
-- For example, if you have a way to identify TJS artists (e.g., by created_by or profile_id):
-- UPDATE tjs_artists SET is_tjs_artist = true WHERE <your_condition>;

-- Option C: Set specific artists as TJS artists by name:
-- UPDATE tjs_artists SET is_tjs_artist = true WHERE artist_name IN ('Artist Name 1', 'Artist Name 2');

-- ============================================
-- RECOMMENDED: Set all existing artists as TJS artists
-- This assumes all current artists in tjs_artists table are TJS artists
-- ============================================
UPDATE tjs_artists 
SET is_tjs_artist = true,
    updated_at = NOW()
WHERE is_tjs_artist = false OR is_tjs_artist IS NULL;

-- STEP 3: Verify the fix
SELECT 
  COUNT(*) as total_artists,
  COUNT(*) FILTER (WHERE is_tjs_artist = true) as tjs_artists,
  COUNT(*) FILTER (WHERE is_invited_artist = true) as invited_artists,
  COUNT(*) FILTER (WHERE is_tjs_artist = false AND is_invited_artist = false) as no_flag_artists
FROM tjs_artists;

-- STEP 4: Check the updated artists
SELECT 
  a.id,
  a.artist_name,
  a.is_tjs_artist,
  a.is_invited_artist,
  a.activation_status,
  p.email as profile_email,
  p.full_name as profile_name,
  a.created_at
FROM tjs_artists a
LEFT JOIN tjs_profiles p ON p.id = a.profile_id
ORDER BY a.created_at DESC;