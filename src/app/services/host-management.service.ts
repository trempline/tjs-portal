import { Injectable } from '@angular/core';
import { SupabaseService, TjsProfile, TjsRole, TjsUserRole, TjsHost, TjsHostMember } from './supabase.service';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface HostDetails {
  name: string;
  email: string;
  phone: string;
}

export interface HostManager {
  id: string;
}

export interface ManagingMember {
  name: string;
  email: string;
}

export interface AssignedVenue {
  venue_id: string;
  location: string;
}

export interface CreateHostAccountRequest {
  host_details: HostDetails;
  host_manager_id: string;
  managing_members: ManagingMember[];
  assigned_venues: AssignedVenue[];
}

export interface CreateHostAccountResponse {
  status: 'SUCCESS' | 'FAILURE';
  host_id: string;
  assigned_role: string;
  host_manager_assigned: boolean;
  managing_members: Array<{
    member_id: string;
    status: 'CREATED' | 'EXISTING';
  }>;
  venues_assigned: Array<{
    venue_id: string;
    status: 'ASSIGNED';
  }>;
  capabilities_enabled: string[];
  errors: string[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class HostManagementService {
  private readonly HOST_ROLE_NAME = 'HOST_TJS';
  private readonly HOST_MEMBER_ROLE_NAME = 'HOST_MEMBER';

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Create and configure a Host account with proper roles and relationships
   */
  createHostAccount(request: CreateHostAccountRequest): Observable<CreateHostAccountResponse> {
    return from(this.createHostAccountInternal(request)).pipe(
      map(result => result),
      catchError(error => {
        console.error('Error creating host account:', error);
        return throwError(() => new Error(`Failed to create host account: ${error.message}`));
      })
    );
  }

  private async createHostAccountInternal(request: CreateHostAccountRequest): Promise<CreateHostAccountResponse> {
    const errors: string[] = [];
    const managingMembers: Array<{ member_id: string; status: 'CREATED' | 'EXISTING' }> = [];
    const venuesAssigned: Array<{ venue_id: string; status: 'ASSIGNED' }> = [];

    try {
      // 1. Validate inputs
      const validationError = this.validateInputs(request);
      if (validationError) {
        return {
          status: 'FAILURE',
          host_id: '',
          assigned_role: '',
          host_manager_assigned: false,
          managing_members: [],
          venues_assigned: [],
          capabilities_enabled: [],
          errors: [validationError],
          message: 'Input validation failed'
        };
      }

      // 2. Create Host account
      const hostProfile = await this.createHostProfile(request.host_details);
      if (!hostProfile) {
        throw new Error('Failed to create host profile');
      }

      // 3. Assign HOST_TJS role to the host
      const roleAssignmentError = await this.assignHostRole(hostProfile.id);
      if (roleAssignmentError) {
        errors.push(roleAssignmentError);
      }

      // 4. Assign Host Manager
      const managerAssignmentSuccess = await this.assignHostManager(hostProfile.id, request.host_manager_id);
      if (!managerAssignmentSuccess) {
        errors.push('Failed to assign host manager');
      }

      // 5. Create and assign managing members
      for (const member of request.managing_members) {
        try {
          const memberResult = await this.createManagingMember(member, hostProfile.id);
          managingMembers.push(memberResult);
        } catch (error) {
          errors.push(`Failed to create managing member ${member.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 6. Assign venues/locations
      for (const venue of request.assigned_venues) {
        try {
          const venueResult = await this.assignVenue(hostProfile.id, venue);
          venuesAssigned.push(venueResult);
        } catch (error) {
          errors.push(`Failed to assign venue ${venue.venue_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 7. Determine capabilities
      const capabilities = this.getEnabledCapabilities();

      const success = errors.length === 0;
      
      return {
        status: success ? 'SUCCESS' : 'FAILURE',
        host_id: hostProfile.id,
        assigned_role: this.HOST_ROLE_NAME,
        host_manager_assigned: managerAssignmentSuccess,
        managing_members: managingMembers,
        venues_assigned: venuesAssigned,
        capabilities_enabled: capabilities,
        errors,
        message: success ? 'Host account created successfully' : `Host account created with ${errors.length} error(s)`
      };

    } catch (error) {
      console.error('Error in createHostAccountInternal:', error);
      return {
        status: 'FAILURE',
        host_id: '',
        assigned_role: '',
        host_manager_assigned: false,
        managing_members: [],
        venues_assigned: [],
        capabilities_enabled: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        message: 'Failed to create host account'
      };
    }
  }

  private validateInputs(request: CreateHostAccountRequest): string | null {
    if (!request.host_details?.name || !request.host_details?.email) {
      return 'Host name and email are required';
    }

    if (!request.host_manager_id) {
      return 'Host manager ID is required';
    }

    if (!request.assigned_venues || request.assigned_venues.length === 0) {
      return 'At least one venue must be assigned';
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.host_details.email)) {
      return 'Invalid host email format';
    }

    for (const member of request.managing_members) {
      if (!member.name || !member.email) {
        return 'All managing members must have name and email';
      }
      if (!emailRegex.test(member.email)) {
        return `Invalid email format for managing member: ${member.name}`;
      }
    }

    return null;
  }

  private async createHostProfile(hostDetails: HostDetails): Promise<TjsProfile | null> {
    try {
      // Check if user already exists
      const existingUser = await this.supabaseService.getAdminSupabase()
        .from('auth.users')
        .select('id')
        .eq('email', hostDetails.email)
        .single();

      let userId: string;

      if (existingUser.data) {
        // User exists, use existing ID
        userId = existingUser.data.id;
      } else {
        // Create new user
        const { data: newUser, error: inviteError } = await this.supabaseService.getAdminSupabase().auth.admin.inviteUserByEmail(
          hostDetails.email,
          {
            redirectTo: `${window.location.origin}/auth/callback`,
            data: { 
              full_name: hostDetails.name,
              phone: hostDetails.phone 
            }
          }
        );

        if (inviteError) {
          throw new Error(`Failed to invite user: ${inviteError.message}`);
        }

        userId = newUser.user?.id ?? '';
      }

      // Create or update profile
      const profileData: Partial<TjsProfile> & { id: string } = {
        id: userId,
        email: hostDetails.email,
        full_name: hostDetails.name,
        phone: hostDetails.phone,
        bio: null,
        avatar_url: null,
        is_member: false,
        member_since: null,
        member_until: null,
        is_pag_artist: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      return profileData as TjsProfile;
    } catch (error) {
      console.error('Error creating host profile:', error);
      return null;
    }
  }

  private async assignHostRole(userId: string): Promise<string | null> {
    try {
      // Get HOST_TJS role
      const { data: hostRole, error: roleError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_roles')
        .select('id')
        .eq('name', this.HOST_ROLE_NAME)
        .single();

      if (roleError || !hostRole) {
        return `Host role '${this.HOST_ROLE_NAME}' not found`;
      }

      // Assign role to user
      const { error: assignmentError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_user_roles')
        .upsert({
          user_id: userId,
          role_id: hostRole.id,
          is_active: true,
          assigned_by: userId // Self-assignment for now
        }, { onConflict: 'user_id,role_id' });

      if (assignmentError) {
        return `Failed to assign role: ${assignmentError.message}`;
      }

      return null;
    } catch (error) {
      return `Error assigning host role: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async assignHostManager(hostId: string, managerId: string): Promise<boolean> {
    try {
      // Validate that manager exists and has appropriate role
      const { data: managerProfile, error: managerError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_profiles')
        .select('id')
        .eq('id', managerId)
        .single();

      if (managerError || !managerProfile) {
        console.error('Manager not found:', managerError);
        return false;
      }

      // Update host profile to link to manager
      // Note: This assumes there's a field to store manager relationship
      // If not, we might need to create a separate table for host-manager relationships
      const { error: updateError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_hosts')
        .update({ 
          // Add manager_id field if it exists, otherwise this is just for logging
          created_by: managerId 
        })
        .eq('profile_id', hostId);

      if (updateError && updateError.code !== '42703') { // Ignore if column doesn't exist
        console.error('Error updating host with manager:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error assigning host manager:', error);
      return false;
    }
  }

  private async createManagingMember(member: ManagingMember, hostProfileId: string): Promise<{ member_id: string; status: 'CREATED' | 'EXISTING' }> {
    try {
      // Check if member already exists
      const existingUser = await this.supabaseService.getAdminSupabase()
        .from('auth.users')
        .select('id')
        .eq('email', member.email)
        .single();

      let memberId: string;
      let status: 'CREATED' | 'EXISTING';

      if (existingUser.data) {
        memberId = existingUser.data.id;
        status = 'EXISTING';
      } else {
        // Create new user
        const { data: newUser, error: inviteError } = await this.supabaseService.getAdminSupabase().auth.admin.inviteUserByEmail(
          member.email,
          {
            redirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: member.name }
          }
        );

        if (inviteError) {
          throw new Error(`Failed to invite member: ${inviteError.message}`);
        }

        memberId = newUser.user?.id ?? '';
        status = 'CREATED';
      }

      // Create or update profile
      const profileData: Partial<TjsProfile> & { id: string } = {
        id: memberId,
        email: member.email,
        full_name: member.name,
        phone: null,
        bio: null,
        avatar_url: null,
        is_member: false,
        member_since: null,
        member_until: null,
        is_pag_artist: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        throw new Error(`Failed to create member profile: ${profileError.message}`);
      }

      // Assign HOST_MEMBER role
      const roleError = await this.assignHostMemberRole(memberId);
      if (roleError) {
        throw new Error(roleError);
      }

      // Add member to host
      const memberError = await this.addHostMember(hostProfileId, memberId);
      if (memberError) {
        throw new Error(memberError);
      }

      return { member_id: memberId, status };
    } catch (error) {
      throw error;
    }
  }

  private async assignVenue(hostProfileId: string, venue: AssignedVenue): Promise<{ venue_id: string; status: 'ASSIGNED' }> {
    try {
      // Check if venue exists
      const { data: venueData, error: venueError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_locations')
        .select('id')
        .eq('id', venue.venue_id)
        .single();

      if (venueError || !venueData) {
        throw new Error(`Venue ${venue.venue_id} not found`);
      }

      // Get host ID from profile
      const { data: hostData, error: hostError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_hosts')
        .select('id')
        .eq('profile_id', hostProfileId)
        .single();

      if (hostError || !hostData) {
        throw new Error('Host not found');
      }

      // Assign venue to host (assuming tjs_host_locations table exists)
      const { error: assignmentError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_host_locations')
        .insert({
          host_id: hostData.id,
          location_id: venue.venue_id,
          is_primary: false,
          is_public: true
        });

      if (assignmentError) {
        throw new Error(`Failed to assign venue: ${assignmentError.message}`);
      }

      return { venue_id: venue.venue_id, status: 'ASSIGNED' };
    } catch (error) {
      throw error;
    }
  }

  private async assignHostMemberRole(userId: string): Promise<string | null> {
    try {
      // Get HOST_MEMBER role
      const { data: memberRole, error: roleError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_roles')
        .select('id')
        .eq('name', this.HOST_MEMBER_ROLE_NAME)
        .single();

      if (roleError || !memberRole) {
        return `Host Member role '${this.HOST_MEMBER_ROLE_NAME}' not found`;
      }

      // Assign role to user
      const { error: assignmentError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_user_roles')
        .upsert({
          user_id: userId,
          role_id: memberRole.id,
          is_active: true,
          assigned_by: userId // Self-assignment for now
        }, { onConflict: 'user_id,role_id' });

      if (assignmentError) {
        return `Failed to assign Host Member role: ${assignmentError.message}`;
      }

      return null;
    } catch (error) {
      return `Error assigning Host Member role: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async addHostMember(hostProfileId: string, memberProfileId: string): Promise<string | null> {
    try {
      // Get host ID
      const { data: hostData, error: hostError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_hosts')
        .select('id')
        .eq('profile_id', hostProfileId)
        .single();

      if (hostError || !hostData) {
        return 'Host not found';
      }

      // Add member to host
      const { error: memberError } = await this.supabaseService.getAdminSupabase()
        .from('tjs_host_members')
        .insert({
          host_id: hostData.id,
          profile_id: memberProfileId,
          role: 'member'
        });

      if (memberError) {
        return `Failed to add member to host: ${memberError.message}`;
      }

      return null;
    } catch (error) {
      return `Error adding host member: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private getEnabledCapabilities(): string[] {
    return [
      'LOGIN',
      'BROWSE_ARTIST_REQUESTS', 
      'MANAGE_EVENTS',
      'ASSIGN_VENUES'
    ];
  }
}