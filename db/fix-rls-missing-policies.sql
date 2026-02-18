-- ============================================================
-- FIX: Missing RLS SELECT policy on tjs_roles
-- ============================================================
-- The tjs_roles table has RLS enabled but no SELECT policy.
-- PostgreSQL default-deny means no rows are ever returned,
-- so getUserRoles() always comes back empty and isAdmin = false.
--
-- Run this script in your Supabase SQL editor (once).
-- ============================================================

-- Allow any authenticated user to read the roles catalogue.
-- Role names / descriptions are not sensitive.
CREATE POLICY "Authenticated users can view roles"
    ON tjs_roles FOR SELECT
    TO authenticated
    USING (true);

-- Also allow anon/service role to read roles (needed for admin client joins).
CREATE POLICY "Public read access to roles"
    ON tjs_roles FOR SELECT
    TO anon
    USING (true);
