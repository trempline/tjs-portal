# Host Account Management System

## Overview

This system provides comprehensive Host account management capabilities for the TJS platform. It allows administrators to create and configure Host accounts with proper roles, relationships, and venue assignments.

## Features

### ✅ Completed Features

- **Host Account Creation**: Create new Host accounts with proper validation
- **Role Assignment**: Automatically assign `HOST_TJS` role to new hosts
- **Managing Member Management**: Create and assign managing members with `HOST_MEMBER` roles
- **Venue Assignment**: Assign venues/locations to hosts for event management
- **Host Manager Assignment**: Link hosts to their managers
- **Input Validation**: Comprehensive validation of all input data
- **Error Handling**: Detailed error reporting with graceful degradation
- **Capabilities Management**: Enable specific capabilities for Host accounts

### 🔄 Core Capabilities Enabled

- **LOGIN**: Hosts can log into the system
- **BROWSE_ARTIST_REQUESTS**: Hosts can browse artist requests
- **MANAGE_EVENTS**: Hosts can organize and manage events
- **ASSIGN_VENUES**: Hosts can manage assigned venues/locations

## Architecture

### Service Structure

```
src/app/services/
├── supabase.service.ts          # Base Supabase service with admin access
└── host-management.service.ts   # Host account management service

src/app/test-host-creation/
├── test-host-creation.component.ts
├── test-host-creation.component.html
└── test-host-creation.component.scss
```

### Database Schema Integration

The system integrates with the existing TJS database schema:

- **tjs_profiles**: User profile management
- **tjs_roles**: Role definitions (`HOST_TJS`, `HOST_MEMBER`)
- **tjs_user_roles**: Role assignments
- **tjs_hosts**: Host entity management
- **tjs_host_members**: Host-member relationships
- **tjs_locations**: Venue/location management
- **tjs_host_locations**: Host-venue assignments

## Usage

### Basic Host Creation

```typescript
import { HostManagementService } from './services/host-management.service';

// Inject the service
constructor(private hostManagementService: HostManagementService) {}

// Create a host account
const request = {
  host_details: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890'
  },
  host_manager_id: 'manager-user-id',
  managing_members: [
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    }
  ],
  assigned_venues: [
    {
      venue_id: 'venue-001',
      location: 'Main Concert Hall'
    }
  ]
};

this.hostManagementService.createHostAccount(request).subscribe(
  response => {
    console.log('Host created:', response);
    if (response.status === 'SUCCESS') {
      console.log('Host ID:', response.host_id);
    }
  },
  error => {
    console.error('Failed to create host:', error);
  }
);
```

### Input Interface

```typescript
interface CreateHostAccountRequest {
  host_details: {
    name: string;      // Required: Host's full name
    email: string;     // Required: Host's email (must be unique)
    phone: string;     // Optional: Host's phone number
  };
  host_manager_id: string;           // Required: Manager's user ID
  managing_members: Array<{          // Optional: Managing members
    name: string;                    // Required: Member's name
    email: string;                   // Required: Member's email
  }>;
  assigned_venues: Array<{          // Required: At least one venue
    venue_id: string;                // Required: Venue ID from tjs_locations
    location: string;                // Optional: Location description
  }>;
}
```

### Response Interface

```typescript
interface CreateHostAccountResponse {
  status: 'SUCCESS' | 'FAILURE';
  host_id: string;                   // Created host's user ID
  assigned_role: string;             // Always 'HOST_TJS'
  host_manager_assigned: boolean;    // Whether manager assignment succeeded
  managing_members: Array<{          // Created/assigned members
    member_id: string;
    status: 'CREATED' | 'EXISTING';
  }>;
  venues_assigned: Array<{          // Successfully assigned venues
    venue_id: string;
    status: 'ASSIGNED';
  }>;
  capabilities_enabled: string[];    // Enabled capabilities
  errors: string[];                  // Any errors encountered
  message: string;                   // Summary message
}
```

## Implementation Details

### Host Creation Process

1. **Input Validation**: Validates all required fields and email formats
2. **User Creation**: Creates or updates the host's user account
3. **Role Assignment**: Assigns the `HOST_TJS` role to the host
4. **Manager Assignment**: Links the host to their manager
5. **Member Creation**: Creates managing members and assigns `HOST_MEMBER` roles
6. **Venue Assignment**: Assigns venues to the host via `tjs_host_locations`
7. **Response Generation**: Returns detailed results with error handling

### Error Handling Strategy

The system uses a **graceful degradation** approach:

- If the host creation fails, the entire process stops
- If individual components fail (members, venues), the system continues
- All errors are collected and returned in the response
- The host account is still created even if some assignments fail
- Detailed error messages help with troubleshooting

### Security Considerations

- Uses Supabase service-role key for administrative operations
- Validates email formats to prevent injection attacks
- Checks for existing users to prevent duplicates
- Role-based access control ensures proper permissions
- All database operations use parameterized queries

## Testing

### Test Component

A test component is provided at `src/app/test-host-creation/` to demonstrate usage:

```typescript
// Test component usage
this.hostManagementService.createHostAccount(this.testRequest).subscribe(
  result => {
    // Handle success/failure
  }
);
```

### Test Data

The test component includes sample data for:
- Host details with valid email and phone
- Multiple managing members
- Multiple venue assignments
- Error handling scenarios

## Integration Points

### Supabase Service Extension

The `SupabaseService` was extended with:

```typescript
// New method to access admin client
getAdminSupabase(): SupabaseClient
```

This allows the HostManagementService to perform administrative operations while maintaining proper access control.

### Role System Integration

The system integrates with the existing TJS role system:

- **HOST_TJS**: Primary host role with event management capabilities
- **HOST_MEMBER**: Supporting role for managing members
- Role assignments are tracked in `tjs_user_roles` table
- RLS (Row Level Security) policies control access

## Future Enhancements

### Potential Improvements

1. **Email Templates**: Custom welcome emails for new hosts
2. **Onboarding Flow**: Guided setup process for new hosts
3. **Bulk Operations**: Create multiple hosts at once
4. **Audit Logging**: Track all host management operations
5. **Webhook Integration**: Notify external systems of host changes
6. **Advanced Validation**: Check venue availability and permissions

### API Endpoint

Consider creating a REST API endpoint for external integrations:

```typescript
// Example API endpoint structure
POST /api/hosts
{
  "host_details": { ... },
  "host_manager_id": "...",
  "managing_members": [...],
  "assigned_venues": [...]
}
```

## Troubleshooting

### Common Issues

1. **Email Already Exists**: The system will use the existing user
2. **Invalid Venue ID**: Venue must exist in `tjs_locations` table
3. **Manager Not Found**: Manager must be a valid user with appropriate role
4. **Role Not Found**: Ensure `HOST_TJS` and `HOST_MEMBER` roles exist

### Debug Information

Enable console logging to see detailed operation steps:

```typescript
console.log('Host account created successfully:', result);
console.warn('Host account creation completed with errors:', result);
console.error('Error creating host account:', error);
```

## Conclusion

This Host account management system provides a robust, scalable solution for creating and managing Host accounts in the TJS platform. It follows best practices for error handling, security, and maintainability while integrating seamlessly with the existing Supabase-based architecture.