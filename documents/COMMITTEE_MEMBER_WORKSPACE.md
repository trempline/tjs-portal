# Committee Member Workspace (TJS-10)

## Overview

The Committee Member Workspace is a dedicated dashboard for Committee Members that provides scoped access to artist management tools while enforcing strict boundaries that prevent any exposure to admin-level controls or global system settings.

## Features

### 1. Artists (Mine) Panel
- Displays only artists specifically assigned to the Committee Member via `committee_member_id`
- Shows each artist's activation status (active, pending, inactive)
- Toggle `is_featured` flag for artist visibility
- Quick-access management actions for status updates

### 2. Events Panel
- Lists all concerts that involve the Committee Member's assigned artists
- Read-only access to broader platform events (toggle to view all)
- Displays event status, host information, and dates

### 3. Event Requests Panel
- Shows concert proposals submitted by assigned artists
- Monitor pipeline activity with status tracking
- Read-only access to all platform requests (toggle to view all)

### 4. Account Settings
- Profile information display
- Link to edit profile and change password

## Database Schema Changes

### New Columns in `tjs_artists`

| Column | Type | Description |
|--------|------|-------------|
| `committee_member_id` | UUID | References auth.users - the Committee Member assigned to this artist |
| `is_featured` | BOOLEAN | Visibility toggle for featuring artists |
| `activation_status` | TEXT | Status: 'pending', 'active', 'inactive' |

### New Database Functions

- `tjs_fn_committee_member_artist_ids()` - Returns UUIDs of artists assigned to the current Committee Member

### New Database Views

- `tjs_committee_member_artists` - View of all artists with committee member assignments

## Row Level Security (RLS) Policies

### tjs_artists

| Policy | Operation | Description |
|--------|-----------|-------------|
| `tjs_artists_admin_full_access` | ALL | Admin can perform all operations |
| `tjs_artists_committee_member_select_own` | SELECT | Committee Members can only see their assigned artists |
| `tjs_artists_committee_member_update_own` | UPDATE | Committee Members can only update their assigned artists |
| `tjs_artists_artist_select_own` | SELECT | Artists can see their own record |
| `tjs_artists_artist_update_own` | UPDATE | Artists can update their own record |

### tjs_events

| Policy | Operation | Description |
|--------|-----------|-------------|
| `tjs_events_committee_member_select_all` | SELECT | Committee Members have read-only access to all events |

### tjs_requests

| Policy | Operation | Description |
|--------|-----------|-------------|
| `tjs_requests_committee_member_select_all` | SELECT | Committee Members have read-only access to all requests |

## Service Layer

### CommitteeMemberService

The `CommitteeMemberService` provides the following methods:

#### Artists
- `getMyArtists()` - Get all artists assigned to the current Committee Member
- `toggleArtistFeatured(artistId, currentValue)` - Toggle the is_featured flag
- `updateArtistActivationStatus(artistId, status)` - Update artist activation status

#### Events
- `getMyArtistsEvents()` - Get events involving assigned artists
- `getAllEventsReadOnly()` - Get all platform events (read-only)

#### Requests
- `getMyArtistsRequests()` - Get requests from assigned artists
- `getAllRequestsReadOnly()` - Get all platform requests (read-only)

#### Dashboard
- `getDashboardStats()` - Get statistics for the dashboard

## Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/backoffice/committee-dashboard` | CommitteeDashboard | Main Committee Member workspace |
| `/backoffice/committee-members` | CommitteeMembers | Admin view for managing Committee Members |

## Post-Login Routing

When a Committee Member logs in, they are automatically redirected to `/backoffice/committee-dashboard`.

## Admin Assignment Flow

Administrators can assign artists to Committee Members by:

1. Navigate to `/backoffice/committee-members`
2. Select a Committee Member
3. Use the artist assignment interface to link artists

The assignment is stored in the `committee_member_id` field on the `tjs_artists` table.

## Security Considerations

1. **API Layer Scoping**: All artist management endpoints automatically filter by `committee_member_id = current_user.id`
2. **RLS Enforcement**: Database-level Row Level Security ensures Committee Members can never access artists outside their portfolio
3. **Read-Only Global Access**: Committee Members can browse all platform activity but have no write access to data they don't own
4. **Featured Flag Scope**: The `is_featured` toggle only works for artists in the Committee Member's own portfolio

## Migration

To apply the database changes, run the migration:

```bash
supabase migration up --include-all
```

Or manually apply the SQL from `db/013_committee_member_workspace.sql`.

## Testing

Unit tests are provided in `src/app/services/committee-member.service.spec.ts`.

Run tests with:

```bash
npm test