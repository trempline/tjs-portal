-- Enable RLS on all tables
ALTER TABLE tjs_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_event_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_request_artists ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Check if user has TJS role
-- ============================================
CREATE OR REPLACE FUNCTION tjs_has_role(
    check_user_id UUID,
    check_role_name TEXT
)
RETURNS BOOLEAN AS $$ BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tjs_user_roles ur
        JOIN tjs_roles r ON ur.role_id = r.id
        WHERE ur.user_id = check_user_id
        AND r.name = check_role_name
        AND ur.is_active = TRUE
    );
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user is Admin
-- ============================================
CREATE OR REPLACE FUNCTION tjs_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$ BEGIN
    RETURN tjs_has_role(check_user_id, 'Admin');
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TJS_USER_ROLES POLICIES
-- ============================================
-- Users can view their own roles
CREATE POLICY "Users view own roles"
    ON tjs_user_roles FOR SELECT
    USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins view all roles"
    ON tjs_user_roles FOR SELECT
    USING (tjs_is_admin(auth.uid()));

-- Admins and Committee Members can insert roles
CREATE POLICY "Admins and Committee assign roles"
    ON tjs_user_roles FOR INSERT
    WITH CHECK (
        tjs_is_admin(auth.uid()) 
        OR tjs_has_role(auth.uid(), 'Committee Member')
    );

-- Admins can update roles
CREATE POLICY "Admins update roles"
    ON tjs_user_roles FOR UPDATE
    USING (tjs_is_admin(auth.uid()));

-- Admins can delete roles
CREATE POLICY "Admins delete roles"
    ON tjs_user_roles FOR DELETE
    USING (tjs_is_admin(auth.uid()));

-- ============================================
-- TJS_PROFILES POLICIES
-- ============================================
-- Users can view own profile
CREATE POLICY "Users view own profile"
    ON tjs_profiles FOR SELECT
    USING (id = auth.uid());

-- Users can update own profile
CREATE POLICY "Users update own profile"
    ON tjs_profiles FOR UPDATE
    USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins view all profiles"
    ON tjs_profiles FOR SELECT
    USING (tjs_is_admin(auth.uid()));

-- Committee Members can view artist profiles
CREATE POLICY "Committee view profiles"
    ON tjs_profiles FOR SELECT
    USING (
        tjs_has_role(auth.uid(), 'Committee Member')
        AND EXISTS (
            SELECT 1 FROM tjs_artists a
            WHERE a.profile_id = tjs_profiles.id
        )
    );

-- Artists can view other artists (for event collaboration)
CREATE POLICY "Artists view artist profiles"
    ON tjs_profiles FOR SELECT
    USING (
        tjs_has_role(auth.uid(), 'Artist')
        AND EXISTS (
            SELECT 1 FROM tjs_artists a
            WHERE a.profile_id = tjs_profiles.id
        )
    );

-- ============================================
-- TJS_ARTISTS POLICIES
-- ============================================
-- Artists can view their own data
CREATE POLICY "Artists view own data"
    ON tjs_artists FOR SELECT
    USING (profile_id = auth.uid());

-- Artists can update own data
CREATE POLICY "Artists update own data"
    ON tjs_artists FOR UPDATE
    USING (profile_id = auth.uid());

-- All TJS users can view active artists
CREATE POLICY "TJS users view artists"
    ON tjs_artists FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tjs_user_roles WHERE user_id = auth.uid()
        )
    );

-- Committee and Admin can create artists
CREATE POLICY "Admin and Committee create artists"
    ON tjs_artists FOR INSERT
    WITH CHECK (
        tjs_is_admin(auth.uid())
        OR tjs_has_role(auth.uid(), 'Committee Member')
    );

-- ============================================
-- TJS_HOSTS POLICIES
-- ============================================
-- Hosts can view/update own data
CREATE POLICY "Hosts manage own data"
    ON tjs_hosts FOR ALL
    USING (profile_id = auth.uid());

-- All TJS users can view hosts (for event selection)
CREATE POLICY "TJS users view hosts"
    ON tjs_hosts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tjs_user_roles WHERE user_id = auth.uid()
        )
    );

-- Admins manage all hosts
CREATE POLICY "Admins manage hosts"
    ON tjs_hosts FOR ALL
    USING (tjs_is_admin(auth.uid()));

-- ============================================
-- TJS_EVENTS POLICIES
-- ============================================
-- Artists can create events
CREATE POLICY "Artists create events"
    ON tjs_events FOR INSERT
    WITH CHECK (tjs_has_role(auth.uid(), 'Artist'));

-- Artists can update their own events
CREATE POLICY "Artists update own events"
    ON tjs_events FOR UPDATE
    USING (created_by = auth.uid());

-- Hosts can update events assigned to them
CREATE POLICY "Hosts update assigned events"
    ON tjs_events FOR UPDATE
    USING (
        host_id IN (
            SELECT id FROM tjs_hosts WHERE profile_id = auth.uid()
        )
    );

-- All TJS users can view events
CREATE POLICY "TJS users view events"
    ON tjs_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tjs_user_roles WHERE user_id = auth.uid()
        )
        OR is_open_to_members = TRUE
    );

-- Admins manage all events
CREATE POLICY "Admins manage events"
    ON tjs_events FOR ALL
    USING (tjs_is_admin(auth.uid()));

-- ============================================
-- TJS_LOCATIONS POLICIES
-- ============================================
-- Public locations visible to all
CREATE POLICY "Public locations visible"
    ON tjs_locations FOR SELECT
    USING (is_public = TRUE)
    OR EXISTS (
        SELECT 1 FROM tjs_user_roles WHERE user_id = auth.uid()
    );

-- Hosts can create locations
CREATE POLICY "Hosts create locations"
    ON tjs_locations FOR INSERT
    WITH CHECK (
        tjs_has_role(auth.uid(), 'Host')
        OR tjs_has_role(auth.uid(), 'Host+')
    );

-- Hosts manage own locations
CREATE POLICY "Hosts manage own locations"
    ON tjs_locations FOR ALL
    USING (
        host_id IN (
            SELECT id FROM tjs_hosts WHERE profile_id = auth.uid()
        )
    );

-- ============================================
-- TJS_BOOKINGS POLICIES
-- ============================================
-- Members can create bookings
CREATE POLICY "Members create bookings"
    ON tjs_bookings FOR INSERT
    WITH CHECK (
        profile_id = auth.uid()
        AND tjs_has_role(auth.uid(), 'Member')
    );

-- Users view own bookings
CREATE POLICY "Users view own bookings"
    ON tjs_bookings FOR SELECT
    USING (profile_id = auth.uid());

-- Hosts can view bookings for their events
CREATE POLICY "Hosts view event bookings"
    ON tjs_bookings FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM tjs_events 
            WHERE host_id IN (
                SELECT id FROM tjs_hosts WHERE profile_id = auth.uid()
            )
        )
    );

-- ============================================
-- TJS_REQUESTS POLICIES
-- ============================================
-- Artists can create requests
CREATE POLICY "Artists create requests"
    ON tjs_requests FOR INSERT
    WITH CHECK (tjs_has_role(auth.uid(), 'Artist'));

-- Artists view own requests
CREATE POLICY "Artists view own requests"
    ON tjs_requests FOR SELECT
    USING (created_by = auth.uid());

-- Hosts can view requests (to select)
CREATE POLICY "Hosts view requests"
    ON tjs_requests FOR SELECT
    USING (
        tjs_has_role(auth.uid(), 'Host')
        OR tjs_has_role(auth.uid(), 'Host+')
    );

-- Hosts can update request status
CREATE POLICY "Hosts update requests"
    ON tjs_requests FOR UPDATE
    USING (
        tjs_has_role(auth.uid(), 'Host')
        OR tjs_has_role(auth.uid(), 'Host+')
    );