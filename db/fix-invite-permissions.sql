-- ============================================
-- FIX INVITE PERMISSIONS FOR ADMIN USERS
-- ============================================

-- The "User not allowed" error when inviting users is typically due to
-- missing permissions for the auth schema or RLS policies blocking admin operations.
-- This script adds the necessary permissions for admin users to invite new users.

-- ============================================
-- ENABLE RLS ON AUTH SCHEMA TABLES (if not already enabled)
-- ============================================
-- Note: These tables are typically managed by Supabase, but we need to ensure
-- admin users can perform invite operations

-- Allow authenticated users to read auth.users (needed for admin operations)
CREATE POLICY "Admins can read auth users"
    ON auth.users FOR SELECT
    TO authenticated
    USING (true);

-- Allow service_role to manage auth.users (required for admin invite operations)
CREATE POLICY "Service role can manage auth users"
    ON auth.users FOR ALL
    TO service_role
    USING (true);

-- ============================================
-- ADD ADMIN PERMISSIONS FOR USER INVITES
-- ============================================

-- Allow admin users to invite new users by ensuring they can access the auth schema
-- This is typically handled by Supabase, but we add explicit permissions

-- Grant necessary permissions to authenticated role for auth operations
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO authenticated;

-- Grant necessary permissions to service_role for admin operations
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO service_role;

-- ============================================
-- ADD HELPER FUNCTION FOR INVITE PERMISSIONS
-- ============================================

-- Function to check if user can invite new users
CREATE OR REPLACE FUNCTION can_invite_users(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only admins and committee members can invite users
    RETURN EXISTS (
        SELECT 1 FROM tjs_user_roles ur
        JOIN tjs_roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_id
        AND ur.is_active = TRUE
        AND r.name IN ('Admin', 'Committee Member')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADD POLICY FOR INVITE OPERATIONS
-- ============================================

-- Allow admin and committee members to perform invite operations
-- This is handled at the application level, but we ensure the database
-- permissions are correct for the adminSupabase client

-- Verify that the service_role key has the necessary permissions
-- This should be set in your Supabase dashboard under:
-- Settings > Database > Service roles

-- ============================================
-- TEST INVITE FUNCTION
-- ============================================

-- Function to test if invite operation would succeed
CREATE OR REPLACE FUNCTION test_invite_permission(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Check if user exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RETURN 'User already exists';
    END IF;
    
    -- Check if current user can invite
    IF NOT can_invite_users(auth.uid()) THEN
        RETURN 'User not allowed to invite';
    END IF;
    
    RETURN 'Can invite';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION can_invite_users(UUID) IS 'Check if user has permission to invite new users (Admin or Committee Member)';
COMMENT ON FUNCTION test_invite_permission(TEXT) IS 'Test if current user can invite a specific email address';

-- ============================================
-- USAGE NOTES
-- ============================================

/*
To fix the "User not allowed" error when inviting users:

1. Run this SQL script in your Supabase SQL editor
2. Ensure your service-role key is properly configured in environment.ts
3. Verify that the admin user has the 'Admin' or 'Committee Member' role
4. Test the invite functionality again

The issue is typically caused by:
- Missing permissions for the service-role key
- RLS policies blocking auth schema access
- Incorrect role assignments for the admin user

After running this script, admin users should be able to invite new committee members.
*/