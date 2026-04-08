import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

/**
 * Artist record with extended profile information
 */
export interface CommitteeArtist {
  id: string;
  profile_id: string | null;
  artist_name: string;
  is_tjs_artist: boolean;
  is_invited_artist: boolean;
  pag_artist_id: string | null;
  committee_member_id: string | null;
  is_featured: boolean;
  activation_status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  // Joined profile data
  profile_email?: string | null;
  profile_name?: string | null;
  avatar_url?: string | null;
}

/**
 * Event with artist and host information for Committee Member view
 */
export interface CommitteeEvent {
  id: string;
  title: string;
  description: string | null;
  request_id: string | null;
  created_by: string | null;
  host_id: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  event_dates: string[] | null;
  location_id: string | null;
  is_open_to_members: boolean;
  source: 'TJS' | 'PAG';
  created_at: string;
  updated_at: string;
  // Joined data
  host_name?: string | null;
  host_city?: string | null;
  artist_names?: string[];
}

/**
 * Event Request with artist information for Committee Member view
 */
export interface CommitteeEventRequest {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  proposed_dates: string[] | null;
  proposed_location_id: string | null;
  department: string | null;
  city: string | null;
  status: 'pending' | 'selected' | 'rejected';
  source: 'TJS' | 'PAG';
  created_at: string;
  updated_at: string;
  // Joined data
  creator_name?: string | null;
  creator_email?: string | null;
  artist_names?: string[];
}

/**
 * Statistics for Committee Member dashboard
 */
export interface CommitteeDashboardStats {
  totalArtists: number;
  activeArtists: number;
  pendingArtists: number;
  featuredArtists: number;
  totalEvents: number;
  upcomingEvents: number;
  totalRequests: number;
  pendingRequests: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommitteeMemberService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  private get supabase(): SupabaseClient {
    return this.supabaseService['supabase'];
  }

  /**
   * Check if the current user is a Committee Member
   */
  isCommitteeMember(): boolean {
    return this.authService.hasRole('Committee Member');
  }

  /**
   * Get the current user's ID
   */
  private getCurrentUserId(): string | null {
    return this.authService.currentUser?.id ?? null;
  }

  // ── Artists (Mine) ─────────────────────────────────────────────────────────

  /**
   * Get all artists assigned to the current Committee Member
   */
  getMyArtists(): Observable<CommitteeArtist[]> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('tjs_artists')
        .select(`
          *,
          profile:tjs_profiles (
            email,
            full_name,
            avatar_url
          )
        `)
        .or(`committee_member_id.eq.${userId},created_by.eq.${userId}`)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('getMyArtists error:', error.message);
          throw new Error(error.message);
        }
        return (data ?? []).map(row => this.mapArtistRow(row));
      }),
      catchError(error => {
        console.error('getMyArtists caught error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle the is_featured flag for an artist
   * Only works for artists assigned to the current Committee Member
   */
  toggleArtistFeatured(artistId: string, currentValue: boolean): Observable<void> {
    return from(
      this.supabase
        .from('tjs_artists')
        .update({ 
          is_featured: !currentValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', artistId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('toggleArtistFeatured error:', error.message);
          throw new Error(error.message);
        }
      }),
      catchError(error => {
        console.error('toggleArtistFeatured caught error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update artist activation status
   * Only works for artists assigned to the current Committee Member
   */
  updateArtistActivationStatus(
    artistId: string, 
    status: 'pending' | 'active' | 'inactive'
  ): Observable<void> {
    return from(
      this.supabase
        .from('tjs_artists')
        .update({ 
          activation_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', artistId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('updateArtistActivationStatus error:', error.message);
          throw new Error(error.message);
        }
      }),
      catchError(error => {
        console.error('updateArtistActivationStatus caught error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Events (for assigned artists) ──────────────────────────────────────────

  /**
   * Get all events that involve the Committee Member's assigned artists
   * This is read-only access
   */
  getMyArtistsEvents(): Observable<CommitteeEvent[]> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // First get the artist IDs for this committee member
    return from(
      this.supabase.rpc('tjs_fn_committee_member_artist_ids')
    ).pipe(
      switchMap(({ data: artistIds, error: artistError }) => {
        if (artistError || !artistIds || artistIds.length === 0) {
          return throwError(() => new Error('No artists found for this committee member'));
        }

        // Then get events that involve these artists
        return from(
          this.supabase
            .from('tjs_event_artists')
            .select(`
              event_id,
              event:tjs_events (
                id,
                title,
                description,
                request_id,
                created_by,
                host_id,
                status,
                event_dates,
                location_id,
                is_open_to_members,
                source,
                created_at,
                updated_at,
                host:tjs_hosts (
                  name,
                  city
                )
              )
            `)
            .in('artist_id', artistIds)
        );
      }),
      map(({ data, error }) => {
        if (error) {
          console.error('getMyArtistsEvents error:', error.message);
          throw new Error(error.message);
        }
        // Map the data to CommitteeEvent type
        return ((data as any[]) ?? []).map((row: any) => {
          const event: any = Array.isArray(row.event) ? row.event[0] : row.event;
          return {
            id: event?.id,
            title: event?.title,
            description: event?.description,
            request_id: event?.request_id,
            created_by: event?.created_by,
            host_id: event?.host_id,
            status: event?.status,
            event_dates: event?.event_dates,
            location_id: event?.location_id,
            is_open_to_members: event?.is_open_to_members,
            source: event?.source,
            created_at: event?.created_at,
            updated_at: event?.updated_at,
            host_name: event?.host?.name ?? null,
            host_city: event?.host?.city ?? null,
          } as CommitteeEvent;
        });
      }),
      catchError(error => {
        console.error('getMyArtistsEvents caught error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Event Requests (pipeline monitoring) ───────────────────────────────────

  /**
   * Get all event requests submitted by the Committee Member's assigned artists
   * This is read-only access
   */
  getMyArtistsRequests(): Observable<CommitteeEventRequest[]> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // First get the artist IDs for this committee member
    return from(
      this.supabase.rpc('tjs_fn_committee_member_artist_ids')
    ).pipe(
      switchMap(({ data: artistIds, error: artistError }) => {
        if (artistError || !artistIds || artistIds.length === 0) {
          return throwError(() => new Error('No artists found for this committee member'));
        }

        // Then get requests that involve these artists
        return from(
          this.supabase
            .from('tjs_request_artists')
            .select(`
              request_id,
              request:tjs_requests (
                id,
                title,
                description,
                created_by,
                proposed_dates,
                proposed_location_id,
                department,
                city,
                status,
                source,
                created_at,
                updated_at,
                creator:tjs_profiles (
                  email,
                  full_name
                )
              )
            `)
            .in('artist_id', artistIds)
        );
      }),
      map(({ data, error }) => {
        if (error) {
          console.error('getMyArtistsRequests error:', error.message);
          throw new Error(error.message);
        }
        // Map the data to CommitteeEventRequest type
        return ((data as any[]) ?? []).map((row: any) => {
          const request: any = Array.isArray(row.request) ? row.request[0] : row.request;
          return {
            id: request?.id,
            title: request?.title,
            description: request?.description,
            created_by: request?.created_by,
            proposed_dates: request?.proposed_dates,
            proposed_location_id: request?.proposed_location_id,
            department: request?.department,
            city: request?.city,
            status: request?.status,
            source: request?.source,
            created_at: request?.created_at,
            updated_at: request?.updated_at,
            creator_name: request?.creator?.full_name ?? null,
            creator_email: request?.creator?.email ?? null,
          } as CommitteeEventRequest;
        });
      }),
      catchError(error => {
        console.error('getMyArtistsRequests caught error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Dashboard Statistics ───────────────────────────────────────────────────

  /**
   * Get dashboard statistics for the Committee Member
   */
  getDashboardStats(): Observable<CommitteeDashboardStats> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.getMyArtists().pipe(
      switchMap(artists => {
        const stats: CommitteeDashboardStats = {
          totalArtists: artists.length,
          activeArtists: artists.filter(a => a.activation_status === 'active').length,
          pendingArtists: artists.filter(a => a.activation_status === 'pending').length,
          featuredArtists: artists.filter(a => a.is_featured).length,
          totalEvents: 0,
          upcomingEvents: 0,
          totalRequests: 0,
          pendingRequests: 0,
        };
        return from(
          this.supabase.rpc('tjs_fn_committee_member_artist_ids')
        ).pipe(
          switchMap(({ data: artistIds }) => {
            if (!artistIds || artistIds.length === 0) {
              return from(Promise.resolve({ data: [], error: null }));
            }
            // Get events count
            return from(
              this.supabase
                .from('tjs_event_artists')
                .select('event_id', { count: 'exact', head: true })
                .in('artist_id', artistIds)
            ).pipe(
              switchMap(({ data: eventsData, error: eventsError }) => {
                if (eventsError) {
                  console.error('getDashboardStats events error:', eventsError.message);
                }
                stats.totalEvents = eventsData?.length ?? 0;
                
                // Get requests count
                return from(
                  this.supabase
                    .from('tjs_request_artists')
                    .select('*', { count: 'exact', head: true })
                    .in('artist_id', artistIds)
                );
              })
            );
          }),
          map(({ data, error }) => {
            if (error) {
              console.error('getDashboardStats requests error:', error.message);
            }
            stats.totalRequests = data?.length ?? 0;
            stats.pendingRequests = data?.filter(r => r.status === 'pending').length ?? 0;
            return stats;
          })
        );
      }),
      catchError(error => {
        console.error('getDashboardStats caught error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── All Events (Read-Only) ─────────────────────────────────────────────────

  /**
   * Get all events on the platform (read-only for Committee Members)
   * This allows Committee Members to browse broader platform activity
   */
  getAllEventsReadOnly(): Observable<CommitteeEvent[]> {
    return from(
      this.supabase
        .from('tjs_events')
        .select(`
          *,
          host:tjs_hosts (
            name,
            city
          )
        `)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('getAllEventsReadOnly error:', error.message);
          throw new Error(error.message);
        }
        return (data ?? []).map(row => ({
          id: row.id,
          title: row.title,
          description: row.description,
          request_id: row.request_id,
          created_by: row.created_by,
          host_id: row.host_id,
          status: row.status,
          event_dates: row.event_dates,
          location_id: row.location_id,
          is_open_to_members: row.is_open_to_members,
          source: row.source,
          created_at: row.created_at,
          updated_at: row.updated_at,
          host_name: row.host?.name ?? null,
          host_city: row.host?.city ?? null,
        } as CommitteeEvent));
      }),
      catchError(error => {
        console.error('getAllEventsReadOnly caught error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── All Event Requests (Read-Only) ─────────────────────────────────────────

  /**
   * Get all event requests on the platform (read-only for Committee Members)
   * This allows Committee Members to monitor the broader pipeline
   */
  getAllRequestsReadOnly(): Observable<CommitteeEventRequest[]> {
    return from(
      this.supabase
        .from('tjs_requests')
        .select(`
          *,
          creator:tjs_profiles (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('getAllRequestsReadOnly error:', error.message);
          throw new Error(error.message);
        }
        return (data ?? []).map(row => ({
          id: row.id,
          title: row.title,
          description: row.description,
          created_by: row.created_by,
          proposed_dates: row.proposed_dates,
          proposed_location_id: row.proposed_location_id,
          department: row.department,
          city: row.city,
          status: row.status,
          source: row.source,
          created_at: row.created_at,
          updated_at: row.updated_at,
          creator_name: row.creator?.full_name ?? null,
          creator_email: row.creator?.email ?? null,
        } as CommitteeEventRequest));
      }),
      catchError(error => {
        console.error('getAllRequestsReadOnly caught error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private mapArtistRow(row: any): CommitteeArtist {
    return {
      id: row.id,
      profile_id: row.profile_id,
      artist_name: row.artist_name,
      is_tjs_artist: row.is_tjs_artist,
      is_invited_artist: row.is_invited_artist,
      pag_artist_id: row.pag_artist_id,
      committee_member_id: row.committee_member_id,
      is_featured: row.is_featured,
      activation_status: row.activation_status || 'pending',
      created_at: row.created_at,
      updated_at: row.updated_at,
      profile_email: row.profile?.email ?? null,
      profile_name: row.profile?.full_name ?? null,
      avatar_url: row.profile?.avatar_url ?? null,
    };
  }
}
