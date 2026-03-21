# CHANGELOG & CHECKPOINT TRACKER

## Legend
- [ ] NOT IMPLEMENTED
- [x] IMPLEMENTED

---

## CHECKPOINTS

### CP-001: Create Checkpoint Changelog File

- Description: Create a structured changelog file to track checkpoints for features, tasks, and verification status
- Files:
  - CHANGELOG_CHECKPOINTS.md
- Status: [x]
- Verification Notes:
  - File created successfully
  - Structure initialized
  - Ready for future checkpoint tracking

### CP-002: Implement Committee Members Admin Section

- Description: Create a complete "Committee Members" section in the TJS admin backoffice for managing committee members and administrators
- Files:
  - src/app/backoffice/backoffice-layout/backoffice-layout.html
  - src/app/backoffice/committee-members/committee-members.ts
  - src/app/backoffice/committee-members/committee-members.html
  - src/app/app.routes.ts
  - db/refined-schema.sql
- Status: [x]
- Verification Notes:
  - Admin menu item "Comité" added to sidebar
  - Complete committee members component created with TypeScript and HTML template
  - Routing configured for /backoffice/committee-members path
  - Database schema enhanced with multi-website support and refined relationships
  - Features include: member listing, invite system, profile management, role assignment
  - Responsive design with consistent styling and accessibility features
  - Integration with existing Supabase service and authentication system

### CP-003: Fix Committee Member Invite Permission Issue

- Description: Fix "User not allowed" error when admin users try to invite new committee members
- Files:
  - src/app/services/supabase.service.ts
  - src/app/backoffice/committee-members/committee-members.ts
  - db/fix-invite-permissions.sql
- Status: [x]
- Verification Notes:
  - Enhanced inviteUser function with better error handling and validation
  - Added email validation to prevent invalid email addresses
  - Created database permissions fix for auth schema access
  - Added helper functions for invite permission checking
  - Improved error messages for better user experience
  - Added try-catch blocks for robust error handling
  - Database policies updated to allow admin users to invite new users

## CP-000: Initial Setup and Basic Structure

**Status:** Ready for Review

- [x] Create project structure
- [x] Set up basic routing
- [x] Implement authentication service
- [x] Create basic layout components
- [x] Set up Supabase integration
- [x] Create admin login page
- [x] Implement authentication guard
- [x] Create dashboard layout
- [x] Add basic styling