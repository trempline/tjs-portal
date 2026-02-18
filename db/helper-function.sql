-- ============================================
-- Get all roles for a user
-- ============================================
CREATE OR REPLACE FUNCTION tjs_get_user_roles(p_user_id UUID)
RETURNS TABLE (
    role_id UUID,
    role_name TEXT,
    description TEXT,
    permissions JSONB
) AS $$ BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.description,
        r.permissions
    FROM tjs_user_roles ur
    JOIN tjs_roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND ur.is_active = TRUE;
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Assign role to user
-- ============================================
CREATE OR REPLACE FUNCTION tjs_assign_role(
    p_user_id UUID,
    p_role_name TEXT,
    p_assigned_by UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$ DECLARE
    v_role_id UUID;
    v_user_role_id UUID;
BEGIN
    -- Get role ID
    SELECT id INTO v_role_id FROM tjs_roles WHERE name = p_role_name;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist', p_role_name;
    END IF;
    
    -- Check permission (Admin or Committee Member for artist roles)
    IF NOT tjs_is_admin(p_assigned_by) THEN
        IF p_role_name IN ('Artist', 'Artist Invited') THEN
            IF NOT tjs_has_role(p_assigned_by, 'Committee Member') THEN
                RAISE EXCEPTION 'Permission denied: Only Admins or Committee Members can assign artist roles';
            END IF;
        ELSE
            RAISE EXCEPTION 'Permission denied: Only Admins can assign this role';
        END IF;
    END IF;
    
    -- Insert or update user role
    INSERT INTO tjs_user_roles (user_id, role_id, assigned_by)
    VALUES (p_user_id, v_role_id, p_assigned_by)
    ON CONFLICT (user_id, role_id)
    DO UPDATE SET 
        is_active = TRUE,
        assigned_by = p_assigned_by
    RETURNING id INTO v_user_role_id;
    
    RETURN v_user_role_id;
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Remove role from user
-- ============================================
CREATE OR REPLACE FUNCTION tjs_remove_role(
    p_user_id UUID,
    p_role_name TEXT
)
RETURNS BOOLEAN AS $$ DECLARE
    v_role_id UUID;
BEGIN
    SELECT id INTO v_role_id FROM tjs_roles WHERE name = p_role_name;
    
    IF v_role_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    UPDATE tjs_user_roles
    SET is_active = FALSE
    WHERE user_id = p_user_id AND role_id = v_role_id;
    
    RETURN TRUE;
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create TJS user with role (for new users)
-- ============================================
CREATE OR REPLACE FUNCTION tjs_create_user_with_role(
    p_email TEXT,
    p_full_name TEXT,
    p_role_name TEXT,
    p_created_by UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$ DECLARE
    v_user_id UUID;
    v_role_id UUID;
BEGIN
    -- Check permission
    IF NOT tjs_is_admin(p_created_by) 
       AND NOT tjs_has_role(p_created_by, 'Committee Member') THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    -- Get role ID
    SELECT id INTO v_role_id FROM tjs_roles WHERE name = p_role_name;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role does not exist';
    END IF;
    
    -- Create profile (auth user should be created via Supabase Auth API)
    -- Generate a UUID for the profile
    v_user_id := gen_random_uuid();
    
    INSERT INTO tjs_profiles (id, email, full_name)
    VALUES (v_user_id, p_email, p_full_name);
    
    -- Assign role
    INSERT INTO tjs_user_roles (user_id, role_id, assigned_by)
    VALUES (v_user_id, v_role_id, p_created_by);
    
    RETURN v_user_id;
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Check if user can perform action
-- ============================================
CREATE OR REPLACE FUNCTION tjs_can(
    p_user_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN AS $$ DECLARE
    v_permissions JSONB;
BEGIN
    -- Get all permissions for user's roles
    SELECT jsonb_agg(r.permissions) INTO v_permissions
    FROM tjs_user_roles ur
    JOIN tjs_roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND ur.is_active = TRUE;
    
    -- Check if any role has "all" permission or the specific permission
    RETURN v_permissions ? 'all' 
        OR v_permissions ? p_permission
        OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(v_permissions) perm
            WHERE perm ? p_permission
        );
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Sync artist from PAG (when PAG artist is also TJS artist)
-- ============================================
CREATE OR REPLACE FUNCTION tjs_sync_from_pag(
    p_pag_artist_id UUID,
    p_profile_id UUID,
    p_artist_name TEXT
)
RETURNS UUID AS $$ DECLARE
    v_artist_id UUID;
BEGIN
    -- Check if artist already exists
    SELECT id INTO v_artist_id 
    FROM tjs_artists 
    WHERE profile_id = p_profile_id;
    
    IF v_artist_id IS NOT NULL THEN
        -- Update existing artist
        UPDATE tjs_artists SET
            is_pag_artist = TRUE,
            pag_artist_id = p_pag_artist_id,
            updated_at = NOW()
        WHERE id = v_artist_id;
    ELSE
        -- Create new artist
        INSERT INTO tjs_artists (
            profile_id, 
            artist_name, 
            is_pag_artist, 
            pag_artist_id,
            is_tjs_artist
        )
        VALUES (
            p_profile_id, 
            p_artist_name, 
            TRUE, 
            p_pag_artist_id,
            TRUE
        )
        RETURNING id INTO v_artist_id;
    END IF;
    
    RETURN v_artist_id;
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;