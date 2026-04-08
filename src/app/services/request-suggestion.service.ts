import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface RequestSuggestion {
  id: string;
  request_id: string;
  host_id: string;
  suggested_by: string;
  suggested_at: string;
  message: string | null;
  status: 'pending' | 'viewed' | 'accepted' | 'declined' | 'expired';
  viewed_at: string | null;
  responded_at: string | null;
  host_response: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  request_title?: string;
  request_description?: string | null;
  artist_name?: string;
  artist_email?: string;
  host_name?: string;
  host_contact_email?: string;
  suggested_by_name?: string;
}

export interface CreateSuggestionRequest {
  request_id: string;
  host_id: string;
  message?: string;
}

export interface RespondToSuggestionRequest {
  suggestion_id: string;
  status: 'accepted' | 'declined';
  response?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestSuggestionService {
  private supabaseService = inject(SupabaseService);
  private adminSupabase: SupabaseClient;

  constructor() {
    this.adminSupabase = this.supabaseService.getAdminSupabase();
  }

  // ── Create Suggestions ────────────────────────────────────────────────────

  /**
   * Suggest a request to a host (for Host Managers)
   */
  suggestRequestToHost(request: CreateSuggestionRequest): Observable<RequestSuggestion> {
    return from(
      this.adminSupabase
        .rpc('tjs_create_request_suggestion', {
          p_request_id: request.request_id,
          p_host_id: request.host_id,
          p_message: request.message || null
        })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return { id: data as string, ...request } as RequestSuggestion;
      }),
      catchError(error => {
        console.error('suggestRequestToHost error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Get Suggestions ───────────────────────────────────────────────────────

  /**
   * Get all suggestions made by the current user (for Host Managers)
   */
  getMySuggestions(limit: number = 50): Observable<RequestSuggestion[]> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.adminSupabase
        .from('tjs_request_suggestions')
        .select(`
          *,
          request:tjs_requests (
            id,
            title,
            description,
            status,
            created_by,
            tjs_request_artists (
              artist:tjs_artists (
                artist_name
              )
            )
          ),
          host:tjs_hosts (
            id,
            name,
            contact_email
          ),
          suggested_by_profile:tjs_profiles (
            full_name,
            email
          )
        `)
        .eq('suggested_by', currentUserId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as any[]).map(d => this.mapSuggestionData(d));
      }),
      catchError(error => {
        console.error('getMySuggestions error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get suggestions for a specific host (for Host Managers to see their suggestions)
   */
  getSuggestionsForHost(hostId: string): Observable<RequestSuggestion[]> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.adminSupabase
        .from('tjs_request_suggestions')
        .select(`
          *,
          request:tjs_requests (
            id,
            title,
            description,
            status,
            created_by,
            tjs_request_artists (
              artist:tjs_artists (
                artist_name
              )
            )
          ),
          suggested_by_profile:tjs_profiles (
            full_name,
            email
          )
        `)
        .eq('host_id', hostId)
        .eq('suggested_by', currentUserId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as any[]).map(d => this.mapSuggestionData(d));
      }),
      catchError(error => {
        console.error('getSuggestionsForHost error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get suggestions received by a host (for Hosts to see suggestions)
   */
  getReceivedSuggestions(hostId: string): Observable<RequestSuggestion[]> {
    return from(
      this.adminSupabase
        .from('tjs_request_suggestions')
        .select(`
          *,
          request:tjs_requests (
            id,
            title,
            description,
            status,
            created_by,
            tjs_request_artists (
              artist:tjs_artists (
                artist_name
              )
            )
          ),
          suggested_by_profile:tjs_profiles (
            full_name,
            email
          )
        `)
        .eq('host_id', hostId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as any[]).map(d => this.mapSuggestionData(d));
      }),
      catchError(error => {
        console.error('getReceivedSuggestions error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get pending suggestions for hosts managed by a Host Manager
   */
  async getPendingSuggestionsForManagedHosts(managerId: string): Promise<RequestSuggestion[]> {
    // First get the host IDs for this manager
    const { data: managerHosts, error: hostsError } = await this.adminSupabase
      .from('tjs_host_managers')
      .select('host_id')
      .eq('manager_id', managerId)
      .eq('is_active', true);

    if (hostsError || !managerHosts || managerHosts.length === 0) {
      return [];
    }

    const hostIds = managerHosts.map(h => h.host_id);

    // Then get suggestions for those hosts
    const { data, error } = await this.adminSupabase
      .from('tjs_request_suggestions')
      .select(`
        *,
        request:tjs_requests (
          id,
          title,
          description,
          status,
          tjs_request_artists (
            artist:tjs_artists (
              artist_name
            )
          )
        ),
        host:tjs_hosts (
          id,
          name,
          contact_email
        )
      `)
      .in('host_id', hostIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as any[]).map(d => this.mapSuggestionData(d));
  }

  // ── Respond to Suggestions ────────────────────────────────────────────────

  /**
   * Respond to a suggestion (for Hosts)
   */
  respondToSuggestion(request: RespondToSuggestionRequest): Observable<void> {
    return from(
      this.adminSupabase
        .rpc('tjs_respond_to_suggestion', {
          p_suggestion_id: request.suggestion_id,
          p_status: request.status,
          p_response: request.response || null
        })
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
      catchError(error => {
        console.error('respondToSuggestion error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mark a suggestion as viewed (for Hosts)
   */
  markSuggestionAsViewed(suggestionId: string): Observable<void> {
    return from(
      this.adminSupabase
        .from('tjs_request_suggestions')
        .update({ 
          status: 'viewed', 
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId)
        .eq('status', 'pending')
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
      catchError(error => {
        console.error('markSuggestionAsViewed error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Browse Available Requests ─────────────────────────────────────────────

  /**
   * Get all pending requests that can be suggested to hosts
   * (For Host Managers to browse and suggest)
   */
  getBrowsableRequests(limit: number = 50): Observable<any[]> {
    return from(
      this.adminSupabase
        .from('tjs_requests')
        .select(`
          id,
          title,
          description,
          status,
          proposed_dates,
          department,
          city,
          created_at,
          created_by,
          tjs_request_artists (
            artist:tjs_artists (
              id,
              artist_name,
              is_tjs_artist,
              is_invited_artist,
              profile:tjs_profiles (
                full_name,
                email
              )
            )
          ),
          tjs_locations (
            name,
            city,
            department
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as any[]).map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          status: d.status,
          proposed_dates: d.proposed_dates || [],
          department: d.department,
          city: d.city,
          created_at: d.created_at,
          artists: (d.tjs_request_artists as any[] || []).map(ra => ({
            id: ra.artist?.id,
            name: ra.artist?.artist_name,
            is_tjs_artist: ra.artist?.is_tjs_artist,
            is_invited_artist: ra.artist?.is_invited_artist,
            email: ra.artist?.profile?.email,
            full_name: ra.artist?.profile?.full_name,
          })),
          location: d.tjs_locations ? {
            name: d.tjs_locations.name,
            city: d.tjs_locations.city,
            department: d.tjs_locations.department,
          } : null,
        }));
      }),
      catchError(error => {
        console.error('getBrowsableRequests error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getCurrentUserId(): string | null {
    // This would typically come from AuthService
    // For now, we'll need to get it from the Supabase session
    return null; // Will be implemented with proper auth integration
  }

  private mapSuggestionData(data: any): RequestSuggestion {
    const requestArtists = data.request?.tjs_request_artists as any[] || [];
    const primaryArtist = requestArtists.find(ra => ra.artist) || requestArtists[0];

    return {
      id: data.id,
      request_id: data.request_id,
      host_id: data.host_id,
      suggested_by: data.suggested_by,
      suggested_at: data.suggested_at,
      message: data.message || null,
      status: data.status,
      viewed_at: data.viewed_at || null,
      responded_at: data.responded_at || null,
      host_response: data.host_response || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      request_title: data.request?.title,
      request_description: data.request?.description || null,
      artist_name: primaryArtist?.artist?.artist_name || null,
      artist_email: primaryArtist?.artist?.profile?.email || null,
      host_name: data.host?.name || null,
      host_contact_email: data.host?.contact_email || null,
      suggested_by_name: data.suggested_by_profile?.full_name || null,
    };
  }
}