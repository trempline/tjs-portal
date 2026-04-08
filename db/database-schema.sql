-- ============================================
-- TJS ROLES TABLE
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
    ('Host Manager', 'Can manage all hosts assigned by an admin', '{"hosts": "manage_assigned", "dashboard": true}'),
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
-- TJS ARTISTS
-- ============================================
CREATE TABLE tjs_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES tjs_profiles(id) ON DELETE CASCADE,
    artist_name TEXT NOT NULL,
    
    -- Artist type flags
    is_tjs_artist BOOLEAN DEFAULT FALSE,
    is_invited_artist BOOLEAN DEFAULT FALSE,
    
    -- Reference to PAG artist if exists (for sync)
    pag_artist_id UUID,  -- References your existing PAG artist table
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id)
);

-- ============================================
-- TJS HOSTS
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
-- TJS EVENTS
-- ============================================
CREATE TABLE tjs_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    
    -- Request tracking
    request_id UUID,  -- Reference to original request if created from one
    
    -- Relationships
    created_by UUID REFERENCES auth.users(id),
    host_id UUID REFERENCES tjs_hosts(id),
    
    -- Event details
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    event_dates DATE[],
    location_id UUID,  -- References tjs_locations
    
    -- Visibility
    is_open_to_members BOOLEAN DEFAULT FALSE,
    
    -- Source tracking (if created from PAG request)
    source TEXT DEFAULT 'TJS' CHECK (source IN ('TJS', 'PAG')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TJS EVENT ARTISTS (Junction)
-- ============================================
CREATE TABLE tjs_event_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES tjs_events(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES tjs_artists(id),
    role TEXT DEFAULT 'primary' CHECK (role IN ('primary', 'invited', 'accompanist')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, artist_id)
);

-- ============================================
-- TJS LOCATIONS
-- ============================================
CREATE TABLE tjs_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    department TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    
    created_by UUID REFERENCES auth.users(id),
    host_id UUID REFERENCES tjs_hosts(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TJS BOOKINGS (For Members)
-- ============================================
CREATE TABLE tjs_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES tjs_events(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES tjs_profiles(id),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, profile_id)
);

-- ============================================
-- TJS REQUESTS (Event Requests from Artists)
-- ============================================
CREATE TABLE tjs_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    
    -- Proposed dates and locations
    proposed_dates DATE[],
    proposed_location_id UUID REFERENCES tjs_locations(id),
    department TEXT,
    city TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected')),
    
    -- Source
    source TEXT DEFAULT 'TJS' CHECK (source IN ('TJS', 'PAG')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TJS REQUEST ARTISTS
-- ============================================
CREATE TABLE tjs_request_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES tjs_requests(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES tjs_artists(id),
    is_primary BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
