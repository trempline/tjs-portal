-- ============================================
-- USE CASE: Committee Member creates a TJS artist
-- ============================================
-- Step 1: Create auth user via Supabase Auth API (client-side)
-- Step 2: Call function to create profile and assign role

SELECT tjs_create_user_with_role(
    'artist@example.com',
    'John Doe',
    'Artist',
    auth.uid()  -- Current user (must be Admin or Committee Member)
);

-- ============================================
-- USE CASE: Committee Member creates an Invited Artist
-- ============================================
SELECT tjs_create_user_with_role(
    'invited@example.com',
    'Jane Smith',
    'Artist Invited',
    auth.uid()
);

-- ============================================
-- USE CASE: Convert PAG artist to TJS artist
-- ============================================
SELECT tjs_sync_from_pag(
    'pag-artist-uuid',      -- ID from your PAG artists table
    'profile-uuid',         -- The auth.users UUID
    'Artist Name'
);

-- ============================================
-- USE CASE: Artist creates an event request
-- ============================================
INSERT INTO tjs_requests (
    title, 
    description, 
    created_by, 
    proposed_dates, 
    department, 
    city
)
VALUES (
    'Concert in Rennes',
    'Jazz concert with quartet',
    auth.uid(),
    ARRAY['2025-03-15', '2025-03-16'],
    'Ille-et-Vilaine',
    'Rennes'
);

-- ============================================
-- USE CASE: Host selects a request for specific date
-- ============================================
-- Step 1: Create event from request
INSERT INTO tjs_events (
    title, 
    description, 
    created_by, 
    host_id, 
    event_dates, 
    request_id,
    status
)
SELECT 
    r.title,
    r.description,
    r.created_by,
    (SELECT id FROM tjs_hosts WHERE profile_id = auth.uid()),
    ARRAY['2025-03-15'],
    r.id,
    'confirmed'
FROM tjs_requests r
WHERE r.id = 'request-uuid';

-- Step 2: Mark request as selected
UPDATE tjs_requests 
SET status = 'selected', updated_at = NOW()
WHERE id = 'request-uuid';

-- ============================================
-- USE CASE: Member books an event
-- ============================================
INSERT INTO tjs_bookings (event_id, profile_id)
VALUES ('event-uuid', auth.uid());

-- ============================================
-- USE CASE: Check user permissions
-- ============================================
SELECT tjs_can(auth.uid(), 'events');  -- Can manage events?
SELECT tjs_can(auth.uid(), 'artists'); -- Can manage artists?