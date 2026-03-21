-- ============================================
-- TJS REFINED DATABASE SCHEMA
-- Multi-Website Event Management Platform
-- ============================================

-- ============================================
-- TJS ROLES TABLE (Enhanced)
-- ============================================
CREATE TABLE tjs_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert TJS roles based on your use case
INSERT INTO tjs_roles (name, description, permissions) VALUES
    ('Admin', 'All rights on TJS website', '{"all": true}'),
    ('Host', 'Can select events created by TJS artists', '{"events": "select", "locations": "manage"}'),
    ('Host+', 'Host with website integration (e.g., PAG)', '{"events": "select", "locations": "manage", "website_integration": true}'),
    ('Committee Member', 'Can invite TJS and Invited artists, access dashboard', '{"artists": "invite", "dashboard": true, "events": "read"}'),
    ('Artist', 'Can update profile and propose events', '{"profile": "write", "events": "create"}'),
    ('Artist Invited', 'Artist invited by TJS artist for events', '{"profile": "read", "events": "view"}'),
    ('Member', 'Paid member, can book events', '{"bookings": "create", "events": "view"}');

-- ============================================
-- TJS USER ROLES (Junction Table)
-- A user can have multiple roles
-- ============================================
CREATE TABLE tjs_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES tjs_roles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by UUID REFERENCES auth.users(id), -- Who assigned this role
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, role_id)
);

-- Index for faster lookups
CREATE INDEX idx_tjs_user_roles_user ON tjs_user_roles(user_id);
CREATE INDEX idx_tjs_user_roles_role ON tjs_user_roles(role_id);

-- ============================================
-- TJS PROFILES (Extends auth.users)
-- ============================================
CREATE TABLE tjs_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    bio TEXT,
    avatar_url TEXT,
    
    -- Member status
    is_member BOOLEAN DEFAULT FALSE,
    member_since DATE,
    member_until DATE,  -- Yearly fee expiration
    
    -- Flags for artist status (synced with PAG if applicable)
    is_pag_artist BOOLEAN DEFAULT FALSE,  -- Also exists in PAG
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TJS ARTISTS (Enhanced)
-- ============================================
CREATE TABLE tjs_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES tjs_profiles(id) ON DELETE CASCADE,
    artist_name TEXT NOT NULL,
    
    -- Artist type flags
    is_tjs_artist BOOLEAN DEFAULT FALSE,
    is_invited_artist BOOLEAN DEFAULT FALSE,
    
    -- Cross-System Integration
    pag_artist_id UUID,  -- References PAG artist table
    external_artist_id UUID, -- For other external systems
    
    -- Availability Management
    availability_calendar JSONB, -- Stores availability slots
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id)
);

-- ============================================
-- TJS HOSTS (Enhanced)
-- ============================================
CREATE TABLE tjs_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES tjs_profiles(id) ON DELETE CASCADE,
    venue_name TEXT NOT NULL,
    venue_address TEXT,
    city TEXT,
    department TEXT,
    
    -- Website integration flag (for Host+)
    has_website_integration BOOLEAN DEFAULT FALSE,
    website_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id)
);

-- ============================================
-- TJS LOCATIONS (Enhanced)
-- ============================================
CREATE TABLE tjs_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    department TEXT,
    country TEXT,
    
    -- Capacity and Features
    capacity INTEGER,
    amenities TEXT[],
    
    -- Website Integration
    website_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HOST LOCATIONS (Many-to-Many Relationship)
-- ============================================
CREATE TABLE tjs_host_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES tjs_hosts(id) ON DELETE CASCADE,
    location_id UUID REFERENCES tjs_locations(id) ON DELETE CASCADE,
    
    -- Location Management
    is_primary BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(host_id, location_id)
);

-- ============================================
-- TJS EVENTS (Unified Request-Event System)
-- ============================================
CREATE TABLE tjs_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    title TEXT NOT NULL,
    description TEXT,
    
    -- Lifecycle Management
    event_type TEXT NOT NULL CHECK (event_type IN ('REQUEST', 'EVENT_INSTANCE')),
    status TEXT NOT NULL CHECK (status IN ('IN_EDITION', 'AVAILABLE', 'SELECTED', 'PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED')),
    
    -- Website Context
    origin_website TEXT NOT NULL CHECK (origin_website IN ('TJS', 'PAG', 'HOST_SITE')),
    visibility_scope TEXT[] DEFAULT ARRAY['TJS'], -- Which websites can see this
    
    -- Relationships
    parent_event_id UUID REFERENCES tjs_events(id), -- NULL for requests, points to request for instances
    created_by UUID REFERENCES auth.users(id),
    
    -- Request Phase Fields (when event_type = 'REQUEST')
    proposed_dates DATE[],
    proposed_location_id UUID REFERENCES tjs_locations(id),
    department TEXT,
    city TEXT,
    
    -- Cross-System Tracking
    source TEXT CHECK (source IN ('TJS', 'PAG', 'HOST_SITE')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_request_fields_null_for_instances 
        CHECK (event_type = 'REQUEST' OR (proposed_dates IS NULL AND proposed_location_id IS NULL AND department IS NULL AND city IS NULL)),
    CONSTRAINT check_instance_requires_parent 
        CHECK (event_type = 'REQUEST' OR parent_event_id IS NOT NULL)
);

-- ============================================
-- EVENT HOSTS (Multi-Host Support)
-- ============================================
CREATE TABLE tjs_event_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES tjs_events(id) ON DELETE CASCADE,
    host_id UUID REFERENCES tjs_hosts(id),
    
    -- Host-Specific Event Details
    selected_dates DATE[], -- Host chooses from proposed_dates
    location_id UUID REFERENCES tjs_locations(id),
    
    -- Host-Specific Status
    host_status TEXT DEFAULT 'PENDING' CHECK (host_status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    
    -- Selection Metadata
    selected_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    CONSTRAINT unique_host_event UNIQUE (event_id, host_id)
);

-- ============================================
-- TJS EVENT ARTISTS (Enhanced)
-- ============================================
CREATE TABLE tjs_event_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES tjs_events(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES tjs_artists(id),
    
    -- Artist Role
    role TEXT DEFAULT 'PRIMARY' CHECK (role IN ('PRIMARY', 'INVITED', 'ACCOMPANIST', 'SUPPORT')),
    
    -- Compensation
    fee_amount DECIMAL(10,2),
    fee_currency TEXT DEFAULT 'EUR',
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'CANCELLED')),
    
    -- Contract Details
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, artist_id, role)
);

-- ============================================
-- TJS BOOKINGS (Enhanced with Membership Integration)
-- ============================================
CREATE TABLE tjs_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES tjs_events(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES tjs_profiles(id),
    
    -- Booking Details
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED')),
    booking_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Membership Validation
    membership_validated BOOLEAN DEFAULT FALSE,
    membership_type_at_booking TEXT,
    
    -- Notes and Communication
    notes TEXT,
    contact_preference TEXT CHECK (contact_preference IN ('EMAIL', 'PHONE', 'SMS')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, profile_id)
);

-- ============================================
-- TJS MEMBERSHIPS (Enhanced)
-- ============================================
CREATE TABLE tjs_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES tjs_profiles(id) ON DELETE CASCADE,
    
    -- Membership Details
    membership_type TEXT NOT NULL CHECK (membership_type IN ('BASIC', 'PREMIUM', 'LIFETIME')),
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Payment Information
    payment_method TEXT,
    payment_reference TEXT,
    
    -- Benefits
    can_book_events BOOLEAN DEFAULT TRUE,
    can_access_premium BOOLEAN DEFAULT FALSE,
    booking_limit INTEGER DEFAULT 10,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id, membership_type, start_date)
);

-- ============================================
-- TJS PERMISSIONS (RBAC + ABAC Hybrid)
-- ============================================
CREATE TABLE tjs_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL, -- 'EVENTS', 'ARTISTS', 'HOSTS', 'MEMBERS', 'ADMIN'
    action TEXT NOT NULL,   -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE'
    resource_pattern TEXT,  -- Regex pattern for resource filtering
    conditions JSONB,       -- Additional conditions (website, status, etc.)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TJS ROLE PERMISSIONS (Enhanced)
-- ============================================
CREATE TABLE tjs_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES tjs_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES tjs_permissions(id) ON DELETE CASCADE,
    
    -- Context Constraints
    website_context TEXT[], -- NULL = all websites, specific websites otherwise
    resource_filter JSONB,  -- Additional filtering rules
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(role_id, permission_id, website_context)
);

-- ============================================
-- TJS HOST MEMBERS (Existing)
-- ============================================
CREATE TABLE tjs_host_members (
    id serial4 NOT NULL,
    host_id int4 NOT NULL REFERENCES public.tjs_hosts(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    created_on timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tjs_host_members_pkey PRIMARY KEY (id),
    CONSTRAINT tjs_host_members_unique UNIQUE (host_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_tjs_host_members_host ON public.tjs_host_members(host_id);
CREATE INDEX IF NOT EXISTS idx_tjs_host_members_profile ON public.tjs_host_members(profile_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Enhanced
-- ============================================
-- Enable RLS on all tables
ALTER TABLE tjs_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_host_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_event_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_event_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tjs_host_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS - Enhanced
-- ============================================

-- Get all roles for a user
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

-- Check if user has TJS role
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

-- Check if user is Admin
CREATE OR REPLACE FUNCTION tjs_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$ BEGIN
    RETURN tjs_has_role(check_user_id, 'Admin');
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can perform action (Enhanced)
CREATE OR REPLACE FUNCTION tjs_can(
    p_user_id UUID,
    p_permission TEXT,
    p_website_context TEXT DEFAULT 'TJS'
)
RETURNS BOOLEAN AS $$ DECLARE
    v_permissions JSONB;
    v_user_roles TEXT[];
BEGIN
    -- Get user roles
    SELECT ARRAY_AGG(r.name) INTO v_user_roles
    FROM tjs_user_roles ur
    JOIN tjs_roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND ur.is_active = TRUE;
    
    -- Check if any role has "all" permission or the specific permission
    SELECT jsonb_agg(rp.resource_filter) INTO v_permissions
    FROM tjs_role_permissions rp
    JOIN tjs_roles r ON rp.role_id = r.id
    WHERE r.name = ANY(v_user_roles)
    AND rp.permission_id IN (
        SELECT id FROM tjs_permissions WHERE name = p_permission
    )
    AND (rp.website_context IS NULL OR p_website_context = ANY(rp.website_context));
    
    RETURN v_permissions ? 'all' 
        OR v_permissions ? p_permission
        OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(v_permissions) perm
            WHERE perm ? p_permission
        )
        OR 'Admin' = ANY(v_user_roles);
END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES - Enhanced
-- ============================================

-- Allow any authenticated user to read the roles catalogue
CREATE POLICY "Authenticated users can view roles"
    ON tjs_roles FOR SELECT
    TO authenticated
    USING (true);

-- Allow anon/service role to read roles
CREATE POLICY "Public read access to roles"
    ON tjs_roles FOR SELECT
    TO anon
    USING (true);

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

-- Hosts can view their own data
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
        id IN (
            SELECT location_id FROM tjs_host_locations 
            WHERE host_id IN (
                SELECT id FROM tjs_hosts WHERE profile_id = auth.uid()
            )
        )
    );

-- Users can view events in their visibility scope
CREATE POLICY "Users view events in scope"
    ON tjs_events FOR SELECT
    USING (
        auth.uid() = created_by
        OR auth.uid() = ANY(
            SELECT profile_id FROM tjs_event_artists ea
            JOIN tjs_artists a ON ea.artist_id = a.id
            WHERE ea.event_id = tjs_events.id
        )
        OR auth.uid() = ANY(
            SELECT profile_id FROM tjs_event_hosts eh
            JOIN tjs_hosts h ON eh.host_id = h.id
            WHERE eh.event_id = tjs_events.id
        )
        OR auth.uid() = ANY(
            SELECT profile_id FROM tjs_bookings 
            WHERE event_id = tjs_events.id
        )
        OR auth.uid() = ANY(
            SELECT profile_id FROM tjs_host_members hm
            WHERE hm.host_id IN (
                SELECT host_id FROM tjs_event_hosts WHERE event_id = tjs_events.id
            )
        )
        OR 'TJS' = ANY(visibility_scope)
        OR 'ALL' = ANY(visibility_scope)
    );

-- Artists can create requests
CREATE POLICY "Artists create requests"
    ON tjs_events FOR INSERT
    WITH CHECK (
        tjs_has_role(auth.uid(), 'Artist')
        AND event_type = 'REQUEST'
    );

-- Artists can update their own requests
CREATE POLICY "Artists update own requests"
    ON tjs_events FOR UPDATE
    USING (
        created_by = auth.uid()
        AND event_type = 'REQUEST'
    );

-- Hosts can create event instances from requests
CREATE POLICY "Hosts create event instances"
    ON tjs_events FOR INSERT
    WITH CHECK (
        tjs_has_role(auth.uid(), 'Host')
        AND event_type = 'EVENT_INSTANCE'
        AND parent_event_id IS NOT NULL
    );

-- Hosts can update their own event instances
CREATE POLICY "Hosts update own event instances"
    ON tjs_events FOR UPDATE
    USING (
        event_type = 'EVENT_INSTANCE'
        AND id IN (
            SELECT event_id FROM tjs_event_hosts 
            WHERE host_id IN (
                SELECT id FROM tjs_hosts WHERE profile_id = auth.uid()
            )
        )
    );

-- Admins manage all events
CREATE POLICY "Admins manage events"
    ON tjs_events FOR ALL
    USING (tjs_is_admin(auth.uid()));

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

-- Members can create bookings
CREATE POLICY "Members create bookings"
    ON tjs_bookings FOR INSERT
    WITH CHECK (
        profile_id = auth.uid()
        AND tjs_has_role(auth.uid(), 'Member')
    );

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert sample permissions
INSERT INTO tjs_permissions (name, description, category, action, resource_pattern, conditions) VALUES
('events:create', 'Create new events/requests', 'EVENTS', 'CREATE', '.*', '{"website_context": ["TJS", "PAG"]}'),
('events:read', 'View events and requests', 'EVENTS', 'READ', '.*', '{"status_filter": ["AVAILABLE", "SELECTED", "PENDING", "APPROVED"]}'),
('events:update', 'Update event details', 'EVENTS', 'UPDATE', '.*', '{"owner_only": true}'),
('events:delete', 'Delete events/requests', 'EVENTS', 'DELETE', '.*', '{"owner_only": true}'),
('events:approve', 'Approve event instances', 'EVENTS', 'APPROVE', '.*', '{"role_context": ["ADMIN", "COMMITTEE"]}'),
('artists:create', 'Create artist profiles', 'ARTISTS', 'CREATE', '.*', '{"role_context": ["ADMIN", "COMMITTEE"]}'),
('artists:read', 'View artist information', 'ARTISTS', 'READ', '.*', '{"visibility_scope": ["PUBLIC", "MEMBER_ONLY"]}'),
('artists:update', 'Update artist profiles', 'ARTISTS', 'UPDATE', '.*', '{"owner_only": true}'),
('hosts:manage', 'Manage host locations and events', 'HOSTS', 'UPDATE', '.*', '{"role_context": ["HOST", "HOST_PLUS"]}'),
('hosts:select', 'Select requests for hosting', 'HOSTS', 'CREATE', '.*', '{"membership_required": true}'),
('members:book', 'Book events', 'MEMBERS', 'CREATE', '.*', '{"membership_validated": true}'),
('members:read', 'View member-only content', 'MEMBERS', 'READ', '.*', '{"membership_type": ["PREMIUM", "LIFETIME"]}'),
('admin:all', 'Full system access', 'ADMIN', 'ALL', '.*', '{"website_context": ["ALL"]}');

-- Insert sample role permissions
INSERT INTO tjs_role_permissions (role_id, permission_id, website_context, resource_filter)
SELECT 
    r.id,
    p.id,
    ARRAY['TJS']::TEXT[],
    '{}'
FROM tjs_roles r
CROSS JOIN tjs_permissions p
WHERE r.name = 'Admin' AND p.category IN ('EVENTS', 'ARTISTS', 'HOSTS', 'MEMBERS', 'ADMIN')
UNION ALL
SELECT 
    r.id,
    p.id,
    ARRAY['TJS']::TEXT[],
    '{}'
FROM tjs_roles r
CROSS JOIN tjs_permissions p
WHERE r.name = 'Committee Member' AND p.category IN ('EVENTS', 'ARTISTS')
UNION ALL
SELECT 
    r.id,
    p.id,
    ARRAY['TJS']::TEXT[],
    '{}'
FROM tjs_roles r
CROSS JOIN tjs_permissions p
WHERE r.name = 'Artist' AND p.category IN ('EVENTS', 'ARTISTS')
UNION ALL
SELECT 
    r.id,
    p.id,
    ARRAY['TJS']::TEXT[],
    '{}'
FROM tjs_roles r
CROSS JOIN tjs_permissions p
WHERE r.name = 'Host' AND p.category IN ('EVENTS', 'HOSTS')
UNION ALL
SELECT 
    r.id,
    p.id,
    ARRAY['TJS']::TEXT[],
    '{}'
FROM tjs_roles r
CROSS JOIN tjs_permissions p
WHERE r.name = 'Member' AND p.category IN ('MEMBERS');

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Event indexes
CREATE INDEX idx_tjs_events_type_status ON tjs_events(event_type, status);
CREATE INDEX idx_tjs_events_origin_website ON tjs_events(origin_website);
CREATE INDEX idx_tjs_events_visibility_scope ON tjs_events USING GIN(visibility_scope);
CREATE INDEX idx_tjs_events_parent ON tjs_events(parent_event_id);
CREATE INDEX idx_tjs_events_created_by ON tjs_events(created_by);

-- Event hosts indexes
CREATE INDEX idx_tjs_event_hosts_event ON tjs_event_hosts(event_id);
CREATE INDEX idx_tjs_event_hosts_host ON tjs_event_hosts(host_id);
CREATE INDEX idx_tjs_event_hosts_status ON tjs_event_hosts(host_status);

-- Artist indexes
CREATE INDEX idx_tjs_artists_profile ON tjs_artists(profile_id);
CREATE INDEX idx_tjs_artists_tjs ON tjs_artists(is_tjs_artist);
CREATE INDEX idx_tjs_artists_invited ON tjs_artists(is_invited_artist);

-- Host indexes
CREATE INDEX idx_tjs_hosts_profile ON tjs_hosts(profile_id);
CREATE INDEX idx_tjs_hosts_website ON tjs_hosts(has_website_integration);

-- Booking indexes
CREATE INDEX idx_tjs_bookings_event ON tjs_bookings(event_id);
CREATE INDEX idx_tjs_bookings_profile ON tjs_bookings(profile_id);
CREATE INDEX idx_tjs_bookings_status ON tjs_bookings(status);

-- Membership indexes
CREATE INDEX idx_tjs_memberships_profile ON tjs_memberships(profile_id);
CREATE INDEX idx_tjs_memberships_type ON tjs_memberships(membership_type);
CREATE INDEX idx_tjs_memberships_active ON tjs_memberships(start_date, end_date);

-- ============================================
-- VIEWS FOR EASY QUERIES
-- ============================================

-- View for committee members
CREATE VIEW committee_members_view AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.bio,
    p.avatar_url,
    p.is_member,
    p.member_since,
    p.member_until,
    p.is_pag_artist,
    p.created_at,
    p.updated_at,
    array_agg(r.name) as roles
FROM tjs_profiles p
JOIN tjs_user_roles ur ON p.id = ur.user_id
JOIN tjs_roles r ON ur.role_id = r.id
WHERE ur.is_active = true
AND r.name IN ('Admin', 'Committee Member')
GROUP BY p.id, p.email, p.full_name, p.phone, p.bio, p.avatar_url, p.is_member, p.member_since, p.member_until, p.is_pag_artist, p.created_at, p.updated_at;

-- View for active committee members only
CREATE VIEW active_committee_members_view AS
SELECT * FROM committee_members_view
WHERE 'Admin' = ANY(roles) OR 'Committee Member' = ANY(roles);

-- View for events with host information
CREATE VIEW events_with_hosts_view AS
SELECT 
    e.*,
    eh.host_id,
    h.venue_name,
    eh.selected_dates,
    eh.location_id,
    eh.host_status,
    eh.selected_at
FROM tjs_events e
LEFT JOIN tjs_event_hosts eh ON e.id = eh.event_id
LEFT JOIN tjs_hosts h ON eh.host_id = h.id;

-- View for artist availability
CREATE VIEW artist_availability_view AS
SELECT 
    a.id,
    a.artist_name,
    a.profile_id,
    a.availability_calendar,
    p.full_name,
    p.email
FROM tjs_artists a
JOIN tjs_profiles p ON a.profile_id = p.id
WHERE a.availability_calendar IS NOT NULL;

-- ============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================

-- Function to check if user can book an event
CREATE OR REPLACE FUNCTION can_book_event(
    user_id UUID,
    event_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    user_membership_type TEXT;
    event_visibility TEXT[];
    event_is_member_only BOOLEAN;
    user_roles TEXT[];
BEGIN
    -- Get user roles
    SELECT ARRAY_AGG(r.name) INTO user_roles
    FROM tjs_user_roles ur
    JOIN tjs_roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id AND ur.is_active = true;
    
    -- Check if user has admin role (can book all events)
    IF 'Admin' = ANY(user_roles) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has committee member role (can book all events)
    IF 'Committee Member' = ANY(user_roles) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has member role
    IF NOT ('Member' = ANY(user_roles)) THEN
        RETURN FALSE;
    END IF;
    
    -- Get user's current membership
    SELECT membership_type INTO user_membership_type
    FROM tjs_memberships
    WHERE profile_id = user_id
    AND start_date <= CURRENT_DATE
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ORDER BY end_date DESC
    LIMIT 1;
    
    IF user_membership_type IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get event details
    SELECT visibility_scope INTO event_visibility
    FROM tjs_events WHERE id = event_id;
    
    -- Check if event requires premium membership
    event_is_member_only := 'MEMBER_ONLY' = ANY(event_visibility);
    
    -- Basic members can book public events
    IF user_membership_type = 'BASIC' AND NOT event_is_member_only THEN
        RETURN TRUE;
    END IF;
    
    -- Premium/Lifetime members can book all member events
    IF user_membership_type IN ('PREMIUM', 'LIFETIME') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get committee members with their roles
CREATE OR REPLACE FUNCTION get_committee_members()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_member BOOLEAN,
    member_since DATE,
    member_until DATE,
    is_pag_artist BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    roles TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.phone,
        p.bio,
        p.avatar_url,
        p.is_member,
        p.member_since,
        p.member_until,
        p.is_pag_artist,
        p.created_at,
        p.updated_at,
        array_agg(r.name) as roles
    FROM tjs_profiles p
    JOIN tjs_user_roles ur ON p.id = ur.user_id
    JOIN tjs_roles r ON ur.role_id = r.id
    WHERE ur.is_active = true
    AND r.name IN ('Admin', 'Committee Member')
    GROUP BY p.id, p.email, p.full_name, p.phone, p.bio, p.avatar_url, p.is_member, p.member_since, p.member_until, p.is_pag_artist, p.created_at, p.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS FOR DATA INTEGRITY
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_tjs_profiles_updated_at 
    BEFORE UPDATE ON tjs_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tjs_artists_updated_at 
    BEFORE UPDATE ON tjs_artists 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tjs_hosts_updated_at 
    BEFORE UPDATE ON tjs_hosts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tjs_events_updated_at 
    BEFORE UPDATE ON tjs_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tjs_bookings_updated_at 
    BEFORE UPDATE ON tjs_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tjs_memberships_updated_at 
    BEFORE UPDATE ON tjs_memberships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE tjs_events IS 'Unified Request-Event system. Requests and Events are the same entity with different lifecycle stages.';
COMMENT ON COLUMN tjs_events.event_type IS 'REQUEST = initial submission, EVENT_INSTANCE = host selection creating independent event';
COMMENT ON COLUMN tjs_events.origin_website IS 'Website where the entity was created (TJS, PAG, HOST_SITE)';
COMMENT ON COLUMN tjs_events.visibility_scope IS 'Array of websites where this entity is visible';
COMMENT ON COLUMN tjs_events.parent_event_id IS 'For EVENT_INSTANCE: points to the original REQUEST. For REQUEST: NULL';

COMMENT ON TABLE tjs_event_hosts IS 'Junction table for multi-host support. Each host selection creates a separate record.';
COMMENT ON COLUMN tjs_event_hosts.selected_dates IS 'Host chooses specific dates from the request''s proposed_dates';
COMMENT ON COLUMN tjs_event_hosts.host_status IS 'Independent status for each host''s event instance';

COMMENT ON TABLE tjs_host_locations IS 'Many-to-many relationship between hosts and locations';
COMMENT ON COLUMN tjs_host_locations.is_primary IS 'Primary location for the host';

COMMENT ON TABLE tjs_memberships IS 'Enhanced membership tracking with tiered benefits';
COMMENT ON COLUMN tjs_memberships.membership_type IS 'BASIC, PREMIUM, or LIFETIME membership';

COMMENT ON FUNCTION can_book_event(UUID, UUID) IS 'Checks if a user can book an event based on membership and permissions';
COMMENT ON FUNCTION get_committee_members() IS 'Returns all committee members with their roles and permissions';

-- ============================================
-- END OF SCHEMA
-- ============================================