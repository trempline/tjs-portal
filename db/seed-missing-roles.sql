-- ============================================================
-- Seed any missing TJS roles
-- Uses INSERT ... ON CONFLICT DO NOTHING so it's safe to re-run.
-- Run this in your Supabase SQL Editor if some roles are missing.
-- ============================================================

INSERT INTO tjs_roles (name, description, permissions) VALUES
    ('Admin',            'All rights on TJS website',                              '{"all": true}'),
    ('Host',             'Can select events created by TJS artists',               '{"events": "select", "locations": "manage"}'),
    ('Host+',            'Host with website integration (e.g., PAG)',              '{"events": "select", "locations": "manage", "website_integration": true}'),
    ('Committee Member', 'Can invite TJS and Invited artists, access dashboard',   '{"artists": "invite", "dashboard": true, "events": "read"}'),
    ('Artist',           'Can update profile and propose events',                  '{"profile": "write", "events": "create"}'),
    ('Artist Invited',   'Artist invited by TJS artist for events',                '{"profile": "read", "events": "view"}'),
    ('Member',           'Paid member, can book events',                           '{"bookings": "create", "events": "view"}')
ON CONFLICT (name) DO NOTHING;

-- Verify:
SELECT name, description FROM tjs_roles ORDER BY name;
