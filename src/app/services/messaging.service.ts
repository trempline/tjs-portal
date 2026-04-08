import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface InternalMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  related_host_id: string | null;
  related_request_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  sender_name?: string | null;
  sender_email?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  host_name?: string | null;
}

export interface MessageConversation {
  participant: {
    id: string;
    name: string | null;
    email: string | null;
  };
  messages: InternalMessage[];
  unread_count: number;
  last_message_at: string;
}

export interface SendMessageRequest {
  recipient_id: string;
  subject?: string;
  body: string;
  related_host_id?: string;
  related_request_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private supabaseService = inject(SupabaseService);
  private adminSupabase: SupabaseClient;

  constructor() {
    this.adminSupabase = this.supabaseService.getAdminSupabase();
  }

  // ── Send Messages ─────────────────────────────────────────────────────────

  /**
   * Send a message to another user
   */
  sendMessage(request: SendMessageRequest): Observable<InternalMessage> {
    return from(
      this.adminSupabase
        .from('tjs_internal_messages')
        .insert({
          sender_id: request.recipient_id, // Will be set by RLS
          recipient_id: request.recipient_id,
          subject: request.subject || null,
          body: request.body,
          related_host_id: request.related_host_id || null,
          related_request_id: request.related_request_id || null
        })
        .select(`
          *,
          sender:tjs_profiles (full_name, email),
          recipient:tjs_profiles (full_name, email)
        `)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return this.mapMessageData(data as any);
      }),
      catchError(error => {
        console.error('sendMessage error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Send a message to a specific host (for Host Managers)
   */
  async sendMessageToHost(hostId: string, subject: string, body: string): Promise<InternalMessage> {
    const { data: hostData, error: hostError } = await this.adminSupabase
      .from('tjs_hosts')
      .select('profile_id')
      .eq('id', hostId)
      .single();

    if (hostError || !hostData) throw new Error(hostError?.message || 'Host not found');
    
    const profileId = hostData.profile_id;
    const result = await this.sendMessage({
      recipient_id: profileId,
      subject,
      body,
      related_host_id: hostId
    }).toPromise();
    
    if (!result) throw new Error('Failed to send message');
    return result;
  }

  // ── Get Messages ──────────────────────────────────────────────────────────

  /**
   * Get all messages for the current user (inbox)
   */
  getInbox(limit: number = 50): Observable<InternalMessage[]> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.adminSupabase
        .from('tjs_internal_messages')
        .select(`
          *,
          sender:tjs_profiles (full_name, email),
          recipient:tjs_profiles (full_name, email)
        `)
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as any[]).map(d => this.mapMessageData(d));
      }),
      catchError(error => {
        console.error('getInbox error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get sent messages for the current user
   */
  getSentMessages(limit: number = 50): Observable<InternalMessage[]> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.adminSupabase
        .from('tjs_internal_messages')
        .select(`
          *,
          sender:tjs_profiles (full_name, email),
          recipient:tjs_profiles (full_name, email)
        `)
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as any[]).map(d => this.mapMessageData(d));
      }),
      catchError(error => {
        console.error('getSentMessages error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get conversation with a specific user
   */
  getConversationWithUser(otherUserId: string, limit: number = 100): Observable<InternalMessage[]> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.adminSupabase
        .from('tjs_internal_messages')
        .select(`
          *,
          sender:tjs_profiles (full_name, email),
          recipient:tjs_profiles (full_name, email)
        `)
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as any[]).map(d => this.mapMessageData(d));
      }),
      catchError(error => {
        console.error('getConversationWithUser error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get conversation with a specific host (for Host Managers)
   */
  getConversationWithHost(hostId: string): Observable<InternalMessage[]> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.adminSupabase
        .rpc('tjs_get_conversation_with_host', { p_host_id: hostId })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return (data as any[]).map(d => this.mapMessageData(d));
      }),
      catchError(error => {
        console.error('getConversationWithHost error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all conversations for the current user
   */
  getConversations(): Observable<MessageConversation[]> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Get all messages involving current user
    return from(
      this.adminSupabase
        .from('tjs_internal_messages')
        .select(`
          *,
          sender:tjs_profiles (full_name, email),
          recipient:tjs_profiles (full_name, email)
        `)
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        
        // Group messages by conversation partner
        const conversations = new Map<string, MessageConversation>();
        
        for (const msg of (data as any[])) {
          const isSender = msg.sender_id === currentUserId;
          const partnerId = isSender ? msg.recipient_id : msg.sender_id;
          const partnerProfile = isSender ? msg.recipient : msg.sender;
          
          if (!conversations.has(partnerId)) {
            conversations.set(partnerId, {
              participant: {
                id: partnerId,
                name: partnerProfile?.full_name || null,
                email: partnerProfile?.email || null,
              },
              messages: [],
              unread_count: 0,
              last_message_at: msg.created_at,
            });
          }
          
          const conv = conversations.get(partnerId)!;
          conv.messages.push(this.mapMessageData(msg));
          if (!msg.is_read && msg.recipient_id === currentUserId) {
            conv.unread_count++;
          }
        }
        
        return Array.from(conversations.values());
      }),
      catchError(error => {
        console.error('getConversations error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── Message Actions ───────────────────────────────────────────────────────

  /**
   * Mark a message as read
   */
  markAsRead(messageId: string): Observable<void> {
    return from(
      this.adminSupabase
        .rpc('tjs_mark_message_as_read', { p_message_id: messageId })
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
      catchError(error => {
        console.error('markAsRead error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mark all messages from a conversation as read
   */
  markConversationAsRead(otherUserId: string): Observable<void> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.adminSupabase
        .from('tjs_internal_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', currentUserId)
        .eq('is_read', false)
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
      catchError(error => {
        console.error('markConversationAsRead error:', error);
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

  private mapMessageData(data: any): InternalMessage {
    return {
      id: data.id,
      sender_id: data.sender_id,
      recipient_id: data.recipient_id,
      subject: data.subject || null,
      body: data.body,
      related_host_id: data.related_host_id || null,
      related_request_id: data.related_request_id || null,
      is_read: data.is_read,
      read_at: data.read_at || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      sender_name: data.sender?.full_name || null,
      sender_email: data.sender?.email || null,
      recipient_name: data.recipient?.full_name || null,
      recipient_email: data.recipient?.email || null,
      host_name: data.host?.name || null,
    };
  }
}