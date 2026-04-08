# TJS Portal — Project Context Document

> **Purpose**: Comprehensive reference document for AI agents and developers working on the TJS Portal.
> **Last Updated**: 2026-04-08
> **Project Root**: `c:/tjs/tjs-portal`

---

## 1. Project Overview

### What is TJS Portal?

TJS Portal is an Angular 21 web application for **Trempline (TJS)** — an arts/events organization. The platform manages:

- **Hosts**: Venue owners who can organize events
- **Artists**: TJS artists and invited artists who perform at events
- **Events**: Concerts and performances organized at host venues
- **Members**: Paid members who can book events
- **Committee Members**: Users who can invite artists and access dashboards

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend Framework** | Angular | 21.1.4 |
| **Language** | TypeScript | 5.9.2 |
| **Styling** | Tailwind CSS + SCSS | 4.1.17 |
| **Backend** | Supabase (BaaS) | Latest |
| **Database** | PostgreSQL (via Supabase) | Latest |
| **Auth** | Supabase Auth | Latest |
| **Package Manager** | npm | Latest |

### Key Dependencies

```json
{
  "@angular/core": "^21.1.4",
  "@supabase/supabase-js": "^2.81.0",
  "rxjs": "~7.8.0",
  "tailwindcss": "^4.1.17"
}
```

---

## 2. Project Structure

```
c:/tjs/tjs-portal/
├── src/
│   ├── app/
│   │   ├── services/              # Core services
│   │   │   ├── supabase.service.ts
│   │   │   ├── auth.service.ts
│   │   │   └── host-management.service.ts
│   │   ├── guards/                # Route guards
│   │   │   └── auth.guard.ts
│   │   ├── shared/                # Shared components
│   │   │   ├── header/
│   │   │   └── footer/
│   │   ├── home/                  # Homepage
│   │   ├── about/                 # About page
│   │   ├── nous/                  # Support/donation page
│   │   ├── entreprises/           # Enterprise page
│   │   ├── admin-login/           # Admin login
│   │   ├── auth-callback/         # Supabase auth callback
│   │   ├── backoffice/            # Admin backoffice
│   │   │   ├── backoffice-layout/
│   │   │   ├── dashboard/
│   │   │   ├── event-requests/
│   │   │   ├── artists/
│   │   │   ├── hosts/
│   │   │   ├── my-hosts/
│   │   │   ├── events/
│   │   │   ├── user-management/
│   │   │   ├── committee-members/
│   │   │   ├── membership/
│   │   │   ├── locations/
│   │   │   └── settings/
│   │   ├── test-host-creation/    # Test component
│   │   ├── app.ts                 # Root component
│   │   ├── app.routes.ts          # Route configuration
│   │   └── app.config.ts          # App configuration
│   ├── environments/
│   │   ├── environment.ts         # Development config
│   │   └── environment.prod.ts    # Production config
│   ├── assets/
│   ├── styles.scss
│   ├── main.ts
│   └── index.html
├── db/                            # Database migrations
│   ├── database-schema.sql        # Main schema
│   ├── refined-schema.sql
│   ├── row-level-security.sql
│   ├── fix-rls-missing-policies.sql
│   ├── fix-invite-permissions.sql
│   ├── helper-function.sql
│   ├── seed-missing-roles.sql
│   ├── tjs_host_members.sql
│   └── user-case-event.sql
├── documents/                     # Documentation
│   ├── SUPABASE_SETUP.md
│   ├── SUPABASE_QUICK_START.md
│   ├── SERVICE_ROLE_KEY_SETUP.md
│   └── CHANGELOG_CHECKPOINTS.md
├── scripts/
│   └── set-env.js                 # Environment setup script
├── public/
│   └── favicon.ico
├── package.json
├── angular.json
├── tsconfig.json
├── tailwind.config.js
└── HOST_ACCOUNT_MANAGEMENT.md
```

---

## 3. Database Schema

See `db/database-schema.sql` for full schema. All tables use `tjs_` prefix.

### Core Tables

| Table | Purpose |
|---|---|
| `tjs_roles` | Role definitions (Admin, Host, Artist, Member, etc.) |
| `tjs_user_roles` | User-role junction table (many-to-many) |
| `tjs_profiles` | User profiles extending auth.users |
| `tjs_artists` | Artist profiles |
| `tjs_hosts` | Host venue information |
| `tjs_events` | Events organized at host venues |
| `tjs_event_artists` | Event-artist junction table |
| `tjs_locations` | Venue locations |
| `tjs_bookings` | Member event bookings |
| `tjs_requests` | Event requests from artists |
| `tjs_request_artists` | Request-artist junction table |
| `tjs_messages` | Contact form submissions |
| `tjs_host_members` | Host-member relationships |
| `tjs_host_locations` | Host-venue assignments |
| `tjs_event_hosts` | Event-host assignments with status |
| `sys_host_types` | Host type lookup table |

### Predefined Roles

| Role | Description |
|---|---|
| Admin | All rights on TJS website |
| Host | Can select events, manage locations |
| Host Manager | Can manage assigned hosts |
| Host+ | Host with website integration |
| Committee Member | Can invite artists, access dashboard |
| Artist | Can update profile, propose events |
| Artist Invited | Invited artist for events |
| Member | Paid member, can book events |

---

## 4. Authentication & Authorization

### Auth Flow
1. Login via Supabase Auth (email/password or magic link)
2. JWT token stored in browser, auto-refreshed
3. `AuthService` loads user profile and roles on login
4. `authGuard` protects backoffice routes

### Role-Based Access
```typescript
hasRole(roleName: string): boolean {
  return this.authState$.getValue().roles.some(
    r => r.name.toLowerCase() === roleName.toLowerCase()
  );
}
```

### Post-Login Routing
- Host/Host+/Host Manager → `/backoffice/my-hosts`
- Others → `/backoffice/dashboard`

---

## 5. Application Routes

```typescript
export const routes: Routes = [
  { path: '', component: Home },
  { path: 'nous-soutenir', component: Nous },
  { path: 'enterprises', component: Entreprises },
  { path: 'about', component: About },
  { path: 'admin', component: AdminLogin },
  { path: 'auth/callback', component: AuthCallback },
  { path: 'test-host-creation', component: TestHostCreationComponent },
  {
    path: 'backoffice',
    component: BackofficeLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'event-requests', component: EventRequests },
      { path: 'artists', component: Artists },
      { path: 'artists/tjs', component: Artists },
      { path: 'artists/invited', component: Artists },
      { path: 'hosts', component: Hosts },
      { path: 'my-hosts', component: MyHosts },
      { path: 'events', component: Events },
      { path: 'user-management', component: UserManagement },
      { path: 'committee-members', component: CommitteeMembers },
    ],
  },
];
```

---

## 6. Core Services

### SupabaseService (`src/app/services/supabase.service.ts`)
Main service for all database operations. Key method groups:
- **Auth**: signIn, signOut, getSession, getCurrentUser, onAuthStateChange
- **Profile**: getProfile, upsertProfile, updateProfile
- **Roles**: getUserRoles, getAllRoles, assignRole, removeRole
- **User Management**: listAllUsersWithRoles, inviteUser, resendInvite, deactivateUser, reactivateUser
- **Hosts**: getHosts, createHost, updateHost, deleteHost, getMyHosts, getManagedHosts
- **Host Members**: getHostMembers, assignHostMember, removeHostMember
- **Events**: getAdminEventOverview
- **Other**: submitMessage, getInviteRedirectUrl, getAdminSupabase

### AuthService (`src/app/services/auth.service.ts`)
Manages authentication state with BehaviorSubject. Key properties:
- state$, currentState, isAuthenticated, currentUser, currentProfile, currentRoles
- hasRole(), isAdmin, displayName, avatarLetter
- signIn(), signOut(), waitForAuthReady(), getPostLoginRoute()

### HostManagementService (`src/app/services/host-management.service.ts`)
Creates complete host accounts with roles, members, and venues via `createHostAccount(request)`.

---

## 7. Key Interfaces

```typescript
interface TjsProfile {
  id: string; email: string; full_name: string | null;
  phone: string | null; bio: string | null; avatar_url: string | null;
  is_member: boolean; member_since: string | null; member_until: string | null;
  is_pag_artist: boolean; created_at: string; updated_at: string;
}

interface TjsRole {
  id: string; name: string; description: string | null;
  permissions: Record<string, any>;
}

interface TjsUserWithRoles extends TjsProfile {
  roles: TjsRole[]; account_status: 'active' | 'inactive';
  invited_at: string | null; email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

interface TjsHost {
  id: number; name: string | null; address: string | null;
  city: string | null; proviance: string | null; zip: string | null;
  country: string | null; capacity: number | null; is_host_plus: boolean;
  contact_fname: string | null; contact_lname: string | null;
  contact_email: string | null; web_url: string | null;
  host_type?: SysHostType | null; members?: TjsHostMember[];
}

interface AdminEventOverviewItem {
  id: string; title: string; description: string | null;
  event_type: 'REQUEST' | 'EVENT_INSTANCE'; status: string;
  origin_website: string; visibility_scope: string[];
  creator_name: string; host_names: string[]; selected_dates: string[];
}
```

---

## 7b. Artist Featured Flag Management (TJS-7)

### Overview
The `is_featured` flag on `tjs_artists` controls an artist's **public visibility** without affecting their backoffice record.

| Flag State | Public Visibility | Backoffice Visibility |
|---|---|---|
| `is_featured = false` | **Visible** (if also `is_tjs_artist = true` OR `is_invited_artist = true`) | Full access |
| `is_featured = true` | **Hidden** from all public directories, listings, and search | Full access preserved |

### Public Query Logic
For an artist to appear on public-facing pages, the compound condition must be satisfied:
```
(is_tjs_artist = true OR is_invited_artist = true) AND is_featured = false
```

### Governance Model
- **Admin**: Global override — can toggle `is_featured` on any artist across the entire platform.
- **Committee Member**: Can toggle `is_featured` for all artists (scope restriction can be added later).

### Audit Trail
Every flag change is logged in `tjs_artist_audit_log`:
- `performed_by` — user who made the change
- `previous_featured` — previous state
- `new_featured` — new state
- `performed_at` — timestamp
- `reason` — optional description

### Database Migration
File: `db/013_artist_featured_flag.sql`
- Adds `is_featured` column to `tjs_artists`
- Creates `tjs_artist_audit_log` table with RLS
- Creates `tjs_toggle_artist_featured()` PostgreSQL function (SECURITY DEFINER)
- RLS policies for Admin and Committee Member access

### Service Layer
`SupabaseService` methods:
- `getArtists()` — fetch all artists with profile data
- `getTjsArtists()` — fetch TJS artists only
- `getInvitedArtists()` — fetch invited artists only
- `toggleArtistFeatured(artistId, isFeatured, performedBy, reason)` — toggle flag via RPC
- `getArtistAuditLog(artistId)` — fetch audit entries for an artist
- `getAllArtistAuditLogs()` — fetch all audit entries

### UI Components
- **Artists** (`/backoffice/artists`) — Full artist listing with TJS/Invited tabs, visibility toggle button, and audit log modal.
- **Committee Members** (`/backoffice/committee-members`) — Added "Visibilité des artistes" section with search, toggle buttons, and audit log modal.

### Interfaces
```typescript
interface TjsArtist {
  id: string; profile_id: string; artist_name: string;
  is_tjs_artist: boolean; is_invited_artist: boolean; is_featured: boolean;
  pag_artist_id: string | null; external_artist_id: string | null;
  availability_calendar: Record<string, any> | null;
  created_at: string; updated_at: string;
  profile?: TjsProfile | null;
}

interface TjsArtistAuditLog {
  id: string; artist_id: string; performed_by: string;
  previous_featured: boolean; new_featured: boolean;
  performed_at: string; reason: string | null;
  performer_name?: string | null; performer_email?: string | null;
}
```

---

## 8. Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  appUrl: '',
  supabase: {
    url: 'https://iuvbnejalukjapgnpzzz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};
```

### Build Commands
```bash
npm start          # Start dev server (ng serve)
npm run build      # Production build
npm run build:dev  # Development build
npm test           # Run unit tests
```

---

## 9. Coding Conventions

- **Standalone components** (Angular 17+)
- **OnPush change detection** recommended
- **Separate template/style files** (.html, .scss)
- **New control flow syntax** (@if, @for, @switch)
- **PascalCase** for components, services, interfaces
- **camelCase** for variables, methods
- **kebab-case** for file names
- **snake_case + tjs_ prefix** for database tables
- **async pipe** for observables in templates
- **switchMap** for HTTP calls in RxJS chains

---

## 10. Security

- All `tjs_` tables MUST have RLS enabled
- Service-role key bypasses RLS (admin only)
- Never expose service-role key in production client code
- Always validate inputs before DB operations
- Check roles before sensitive operations

---

## 11. MCP Server Configuration

Supabase MCP server configured at:
`c:\Users\saura\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

Provides tools for: execute_sql, list_tables, apply_migration, search_docs, list_projects, generate_typescript_types

---

## 12. Git Information

- **Remote**: `origin: https://github.com/trempline/tjs-portal.git`
- **Latest Commit**: `a9eeeedccc239098ffcfc9a2a5705020d4b8bd21`

---

*This document should be updated whenever significant changes are made to the project architecture, database schema, or core services.*