import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SupabaseService, TjsProfile, TjsHostMember } from './supabase.service';
import { TjsHost } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface HostManagerAssignment {
  id: string;
  host_id: string;
  manager_id: string;
  assigned_by: string | null;
  assigned_at: string;
  is_active: boolean;
}

export interface HostArtist {
  artist_id: string;
  artist_name: string;
  profile_id: string | null;
  is_tjs_artist: boolean;
  is_invited_artist: boolean;
  event_count: number;
}

export interface HostEvent {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  event_dates: string[] | null;
  created_at: string;
  artist_names: string[];
  location_name: string | null;
}

export interface HostManagerDashboardStats {
  total_hosts: number;
  active_events: number;
  pending_requests: number;
  recent_messages: number;
}

@Injectable({
  providedIn: 'root'
})
export class HostManagerService {
  private supabaseService = inject(SupabaseService);
  private adminSupabase: SupabaseClient;

  constructor() {
    this.adminSupabase = this.supabaseService.getAdminSupabase();
  }

  // ── Host Manager Assignments ──────────────────────────────────────────────

  /**
   * Get all hosts assigned to a specific manager
   */
  getAssignedHosts(managerId: string): Observable<TjsHost[]> {
    return from(
      this.getAssignedHostsInternal(managerId)
    ).pipe(
      catchError(error => {
        console.error('getAssignedHosts error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Assign a host to a manager (Admin only)
   */
  assignHostToManager(
    hostId: string,
    managerId: string,
    assignedBy: string
  ): Observable<HostManagerAssignment> {
    return from(
      this.adminSupabase
        .from('tjs_host_managers')
        .insert({
          host_id: hostId,
          manager_id: managerId,
          assigned_by: assignedBy,
          is_active: true
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return data as HostManagerAssignment;
      }),
      catchError(error => {
        console.error('assignHostToManager error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove a host from a manager's portfolio (Admin only)
   */
  removeHostFromManager(hostId: string, managerId: string): Observable<void> {
    return from(
      this.adminSupabase
        .from('tjs_host_managers')
        .update({ is_active: false })
        .eq('host_id', hostId)
        .eq('manager_id', managerId)
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
      catchError(error => {
        console.error('removeHostFromManager error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if a user is a Host Manager
   */
  isHostManager(userId: string): Observable<boolean> {
    return from(
      this.adminSupabase
        .from('tjs_user_roles')
        .select(`
          id,
          role:tjs_roles (name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
    ).pipe(
      map(({ data }) => {
        return (data as any[]).some(ur => ur.role?.name === 'Host Manager');
      }),
      catchError(error => {
        console.error('isHostManager error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Host Artists ──────────────────────────────────────────────────────────

  /**
   * Get all artists associated with a specific host through events
   */
  getHostArtists(hostId: string): Observable<HostArtist[]> {
    return from(
      this.adminSupabase
        .rpc('tjs_get_host_artists', { p_host_id: hostId })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as HostArtist[]) || [];
      }),
      catchError(error => {
        console.error('getHostArtists error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Host Events ───────────────────────────────────────────────────────────

  /**
   * Get all events for a specific host with status
   */
  getHostEvents(hostId: string): Observable<HostEvent[]> {
    return from(
      this.adminSupabase
        .from('tjs_events')
        .select(`
          id,
          title,
          description,
          status,
          event_dates,
          created_at,
          host_id,
          tjs_event_artists (
            artist:tjs_artists (
              artist_name
            )
          ),
          tjs_locations (
            name
          )
        `)
        .eq('host_id', hostId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as any[]).map(event => ({
          id: event.id,
          title: event.title,
          description: event.description || null,
          status: event.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
          event_dates: event.event_dates || [],
          created_at: event.created_at,
          artist_names: (event.tjs_event_artists as any[] || [])
            .map(ea => ea.artist?.artist_name)
            .filter(Boolean),
          location_name: (event.tjs_locations as any)?.name || null
        }));
      }),
      catchError(error => {
        console.error('getHostEvents error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Dashboard Stats ───────────────────────────────────────────────────────

  /**
   * Get dashboard statistics for a Host Manager
   */
  getDashboardStats(managerId: string): Observable<HostManagerDashboardStats> {
    return this.getAssignedHosts(managerId).pipe(
      map(hosts => ({
        total_hosts: hosts.length,
        active_events: 0, // Simplified - would need separate query
        pending_requests: 0, // Simplified
        recent_messages: 0 // Simplified
      })),
      catchError(error => {
        console.error('getDashboardStats error:', error);
        return throwError(() => error);
      })
    );
  }

  private getPendingRequestsCount(managerId: string): Observable<number> {
    return from(
      this.adminSupabase
        .from('tjs_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
    ).pipe(
      map(({ count }) => count || 0),
      catchError(() => from(Promise.resolve(0)))
    );
  }

  private getRecentMessagesCount(managerId: string): Observable<number> {
    return from(
      this.adminSupabase
        .from('tjs_internal_messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', managerId)
        .eq('is_read', false)
    ).pipe(
      map(({ count }) => count || 0),
      catchError(() => from(Promise.resolve(0)))
    );
  }

  // ── Host Detail with Relations ────────────────────────────────────────────

  /**
   * Get complete host details including members, events, and artists
   */
  getHostDetails(hostId: string): Observable<{
    host: TjsHost | null;
    members: TjsHostMember[];
    events: HostEvent[];
    artists: HostArtist[];
  }> {
    return forkJoin({
      host: this.getHostById(hostId),
      members: this.supabaseService.getHostMembers(hostId as any),
      events: this.getHostEvents(hostId),
      artists: this.getHostArtists(hostId)
    }).pipe(
      catchError(error => {
        console.error('getHostDetails error:', error);
        return throwError(() => error);
      })
    );
  }

  private getHostById(hostId: string): Observable<TjsHost | null> {
    return from(
      this.adminSupabase
        .from('tjs_hosts')
        .select('*')
        .eq('id', hostId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return null;
        return data as TjsHost;
      }),
      catchError(() => from(Promise.resolve(null)))
    );
  }

  private async getAssignedHostsInternal(managerId: string): Promise<TjsHost[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_host_managers')
      .select(`
        host_id,
        host:tjs_hosts (*)
      `)
      .eq('manager_id', managerId)
      .eq('is_active', true);

    if (error) {
      if (this.isMissingHostManagerTableError(error)) {
        return this.supabaseService.getManagedHosts(managerId);
      }

      throw new Error(error.message);
    }

    const assignedHosts = ((data as any[]) ?? [])
      .map((row) => row.host as TjsHost | null)
      .filter((host): host is TjsHost => host !== null);

    if (assignedHosts.length > 0) {
      return assignedHosts;
    }

    // Backward compatibility: older admin flows stored the host manager on tjs_hosts.created_by.
    return this.supabaseService.getManagedHosts(managerId);
  }

  private isMissingHostManagerTableError(error: { code?: string; message?: string | null }): boolean {
    return error.code === 'PGRST205'
      || error.message?.includes("Could not find the table 'public.tjs_host_managers'") === true;
  }
}
