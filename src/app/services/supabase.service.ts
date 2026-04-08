import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session, type EmailOtpType } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface NewsletterMessage {
  prenom: string;
  nom: string;
  email: string;
  message: string;
}

export interface TjsProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_member: boolean;
  member_since: string | null;
  member_until: string | null;
  is_pag_artist: boolean;
  created_at: string;
  updated_at: string;
}

export interface TjsRole {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, any>;
}

export interface TjsUserRole {
  id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  role: TjsRole;
}

export interface TjsUserWithRoles extends TjsProfile {
  roles: TjsRole[];
  account_status: 'active' | 'pending' | 'inactive';
  invited_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

export interface ExistingUserLookup {
  id: string;
  email: string;
  full_name: string | null;
  account_status: 'active' | 'pending' | 'inactive';
  invited_at: string | null;
  email_confirmed_at: string | null;
}

export interface MembershipPaymentRecord {
  id: string;
  profile_id: string;
  payment_date: string;
  expires_at: string;
  is_active: boolean;
  amount: number | null;
  currency: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_email: string | null;
  recorded_by_name: string | null;
}

export interface MembershipNotification {
  id: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
  sender_name: string | null;
}

export interface AdminEventOverviewItem {
  id: string;
  title: string;
  description: string | null;
  event_type: 'REQUEST' | 'EVENT_INSTANCE';
  status: string;
  origin_website: string;
  visibility_scope: string[];
  parent_event_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  proposed_dates: string[] | null;
  department: string | null;
  city: string | null;
  creator_name: string;
  creator_email: string;
  host_names: string[];
  host_statuses: string[];
  selected_dates: string[];
  artist_ids: string[];
  artist_names: string[];
  artist_roles: string[];
}

export interface TjsHost {
  id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  proviance: string | null;
  zip: string | null;
  country: string | null;
  host_per_year: string | null;
  public_name: string | null;
  capacity: number | null;
  id_host_type: number | null;
  contact_fname: string | null;
  contact_lname: string | null;
  contact_phone1: string | null;
  contact_phone2: string | null;
  contact_email: string | null;
  comment: string | null;
  web_url: string | null;
  is_host_plus: boolean;
  photo: string | null;
  photo_credit: string | null;
  created_by: string | null;
  created_on: string | null;
  last_update: string | null;
  updated_by: string | null;
  // Joined data
  host_type?: SysHostType | null;
  members?: TjsHostMember[];
}

export interface SysHostType {
  id: number;
  name: string;
}

export interface TjsHostMember {
  id: number;
  host_id: number;
  profile_id: string;
  role: string | null;
  created_on: string | null;
  // Joined profile data
  profile?: TjsProfile | null;
}

export interface TjsArtistUserSummary {
  id: string;
  email: string | null;
  full_name: string | null;
}

export interface TjsArtist {
  id: string;
  profile_id: string;
  artist_name: string;
  is_tjs_artist: boolean;
  is_invited_artist: boolean;
  is_featured: boolean;
  committee_member_id: string | null;
  created_by: string | null;
  activation_status: 'pending' | 'active' | 'inactive';
  pag_artist_id: string | null;
  external_artist_id: string | null;
  availability_calendar: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profile?: TjsProfile | null;
  committee_member?: TjsArtistUserSummary | null;
  created_by_profile?: TjsArtistUserSummary | null;
}

export interface TjsArtistAuditLog {
  id: string;
  artist_id: string;
  performed_by: string;
  previous_featured: boolean;
  new_featured: boolean;
  performed_at: string;
  reason: string | null;
  // Joined performer data
  performer_name?: string | null;
  performer_email?: string | null;
}

export interface PagArtist {
  id: string;
  id_profile: string | null;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phone: string | null;
  photo: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  created_on: string | null;
  tjs_artist_id?: string | null;
}

export interface CreateArtistInput {
  artist_name: string;
  is_tjs_artist: boolean;
  is_invited_artist: boolean;
  committee_member_id?: string | null;
}

export interface InviteArtistInput {
  email: string;
  full_name: string;
  phone?: string | null;
  committee_member_id?: string | null;
  assigned_by: string;
  role_name: 'Artist' | 'Artist Invited';
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  /** Admin client uses the service-role key – only for server-side-like admin ops. */
  private adminSupabase: SupabaseClient;
  private roleIdCache = new Map<string, string>();
  private artistAuditLogAvailable: boolean | null = null;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    );

    // The service-role key bypasses RLS – used only for admin user management.
    // It MUST be present in environment.ts (keep it out of public repos).
    this.adminSupabase = createClient(
      environment.supabase.url,
      (environment.supabase as any).serviceRoleKey || environment.supabase.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  async signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: string | null }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, session: null, error: error.message };
    return { user: data.user, session: data.session, error: null };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async verifyEmailOtpToken(
    tokenHash: string,
    type: EmailOtpType
  ): Promise<{ session: Session | null; error: string | null }> {
    const { data, error } = await this.supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      console.error('verifyEmailOtpToken error:', error.message);
      return { session: null, error: error.message };
    }

    return { session: data.session ?? null, error: null };
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  /** Listen for auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED…) */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  // ── Profile ─────────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<TjsProfile | null> {
    const { data, error } = await this.supabase
      .from('tjs_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('getProfile error:', error.message);
      return null;
    }
    return data as TjsProfile;
  }

  // ── Roles ────────────────────────────────────────────────────────────────

  /** Returns all active roles for a given user, including role details. */
  async getUserRoles(userId: string): Promise<TjsRole[]> {
    const { data, error } = await this.supabase
      .from('tjs_user_roles')
      .select(`
        id,
        user_id,
        role_id,
        is_active,
        role:tjs_roles (
          id,
          name,
          description,
          permissions
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('getUserRoles error:', error.message);
      return [];
    }

    // Filter out nulls — can happen when tjs_roles has no RLS SELECT policy
    return (data as any[])
      .map((ur: any) => ur.role as TjsRole)
      .filter((role): role is TjsRole => role !== null && role !== undefined);
  }

  // ── User Management (Admin only) ────────────────────────────────────────

  /** Fetch all profiles with their assigned roles. */
  async listAllUsersWithRoles(): Promise<TjsUserWithRoles[]> {
    // 1. Fetch all profiles
    const { data: profiles, error: pErr } = await this.adminSupabase
      .from('tjs_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pErr) {
      console.error('listAllUsersWithRoles profiles error:', pErr.message);
      return [];
    }

    // 2. Fetch all user-role assignments with role details
    const { data: userRoles, error: rErr } = await this.adminSupabase
      .from('tjs_user_roles')
      .select(`
        user_id,
        is_active,
        role:tjs_roles ( id, name, description, permissions )
      `)
      .eq('is_active', true);

    if (rErr) {
      console.error('listAllUsersWithRoles roles error:', rErr.message);
    }

    // 3. Fetch auth users to derive activation status
    const authUsersMap = new Map<string, User>();
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: authPage, error: authErr } = await this.adminSupabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (authErr) {
        console.error('listAllUsersWithRoles auth users error:', authErr.message);
        break;
      }

      for (const authUser of authPage.users ?? []) {
        authUsersMap.set(authUser.id, authUser);
      }

      if (!authPage.nextPage) {
        break;
      }

      page = authPage.nextPage;
    }

    // 4. Merge roles and auth state into profiles
    const rolesMap: Record<string, TjsRole[]> = {};
    for (const ur of (userRoles ?? []) as any[]) {
      if (!rolesMap[ur.user_id]) rolesMap[ur.user_id] = [];
      rolesMap[ur.user_id].push(ur.role as TjsRole);
    }

    return (profiles as TjsProfile[]).map(p => ({
      ...p,
      roles: rolesMap[p.id] ?? [],
      account_status: this.deriveAccountStatus(authUsersMap.get(p.id)),
      invited_at: authUsersMap.get(p.id)?.invited_at ?? null,
      email_confirmed_at: authUsersMap.get(p.id)?.email_confirmed_at ?? null,
      last_sign_in_at: authUsersMap.get(p.id)?.last_sign_in_at ?? null,
    }));
  }

  /** Fetch all available roles. */
  async getAllRoles(): Promise<TjsRole[]> {
    const { data, error } = await this.supabase
      .from('tjs_roles')
      .select('*')
      .order('name');
    if (error) {
      console.error('getAllRoles error:', error.message);
      return [];
    }
    return data as TjsRole[];
  }

  async getAdminEventOverview(): Promise<AdminEventOverviewItem[]> {
    const { data: events, error: eventsError } = await this.adminSupabase
      .from('tjs_events')
      .select(`
        id,
        title,
        description,
        event_type,
        status,
        origin_website,
        visibility_scope,
        parent_event_id,
        created_by,
        created_at,
        updated_at,
        proposed_dates,
        department,
        city
      `)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('getAdminEventOverview events error:', eventsError.message);
      return [];
    }

    const eventRows = (events ?? []) as any[];
    if (eventRows.length === 0) {
      return [];
    }

    const creatorIds = Array.from(
      new Set(
        eventRows
          .map((event) => event.created_by as string | null)
          .filter((value): value is string => !!value)
      )
    );

    const eventIds = eventRows.map((event) => event.id as string);

    const [profilesResult, hostAssignmentsResult, eventArtistsResult] = await Promise.all([
      creatorIds.length > 0
        ? this.adminSupabase
            .from('tjs_profiles')
            .select('id, email, full_name')
            .in('id', creatorIds)
        : Promise.resolve({ data: [], error: null }),
      this.adminSupabase
        .from('tjs_event_hosts')
        .select(`
          event_id,
          host_status,
          selected_dates,
          host:tjs_hosts (
            id,
            name,
            public_name,
            city
          )
        `)
        .in('event_id', eventIds),
      this.adminSupabase
        .from('tjs_event_artists')
        .select(`
          event_id,
          role,
          artist:tjs_artists (
            id,
            artist_name
          )
        `)
        .in('event_id', eventIds),
    ]);

    if (profilesResult.error) {
      console.error('getAdminEventOverview profiles error:', profilesResult.error.message);
    }

    if (hostAssignmentsResult.error) {
      console.error('getAdminEventOverview host assignments error:', hostAssignmentsResult.error.message);
    }

    if (eventArtistsResult.error) {
      console.error('getAdminEventOverview event artists error:', eventArtistsResult.error.message);
    }

    const profilesById = new Map<string, Partial<TjsProfile>>();
    for (const profile of ((profilesResult.data ?? []) as Partial<TjsProfile>[])) {
      if (profile.id) {
        profilesById.set(profile.id, profile);
      }
    }

    const hostsByEventId = new Map<string, any[]>();
    for (const assignment of ((hostAssignmentsResult.data ?? []) as any[])) {
      const eventId = assignment.event_id as string;
      const existing = hostsByEventId.get(eventId) ?? [];
      existing.push(assignment);
      hostsByEventId.set(eventId, existing);
    }

    const artistsByEventId = new Map<string, any[]>();
    for (const assignment of ((eventArtistsResult.data ?? []) as any[])) {
      const eventId = assignment.event_id as string;
      const existing = artistsByEventId.get(eventId) ?? [];
      existing.push(assignment);
      artistsByEventId.set(eventId, existing);
    }

    return eventRows.map((event) => {
      const profile = event.created_by ? profilesById.get(event.created_by) : null;
      const assignments = hostsByEventId.get(event.id) ?? [];
      const artistAssignments = artistsByEventId.get(event.id) ?? [];

      return {
        id: event.id,
        title: event.title,
        description: event.description ?? null,
        event_type: event.event_type,
        status: event.status,
        origin_website: event.origin_website,
        visibility_scope: event.visibility_scope ?? [],
        parent_event_id: event.parent_event_id ?? null,
        created_by: event.created_by ?? null,
        created_at: event.created_at,
        updated_at: event.updated_at,
        proposed_dates: event.proposed_dates ?? null,
        department: event.department ?? null,
        city: event.city ?? null,
        creator_name: profile?.full_name || profile?.email || 'Utilisateur inconnu',
        creator_email: profile?.email || '',
        host_names: assignments
          .map((assignment) => assignment.host?.public_name || assignment.host?.name || assignment.host?.city)
          .filter((value: string | null | undefined): value is string => !!value),
        host_statuses: assignments
          .map((assignment) => assignment.host_status as string | null)
          .filter((value: string | null): value is string => !!value),
        selected_dates: assignments.flatMap((assignment) =>
          Array.isArray(assignment.selected_dates) ? assignment.selected_dates : []
        ),
        artist_ids: artistAssignments
          .map((assignment) => assignment.artist?.id as string | null | undefined)
          .filter((value: string | null | undefined): value is string => !!value),
        artist_names: artistAssignments
          .map((assignment) => assignment.artist?.artist_name as string | null | undefined)
          .filter((value: string | null | undefined): value is string => !!value),
        artist_roles: artistAssignments
          .map((assignment) => assignment.role as string | null)
          .filter((value: string | null): value is string => !!value),
      };
    });
  }

  getInviteRedirectUrl(): string {
    const configuredAppUrl = (environment as any).appUrl?.trim();
    const baseUrl = configuredAppUrl || window.location.origin;
    return `${baseUrl.replace(/\/$/, '')}/auth/callback`;
  }

  async findExistingUserByEmail(email: string): Promise<ExistingUserLookup | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;

    const authUsersMap = new Map<string, User>();
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: authPage, error: authErr } = await this.adminSupabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (authErr) {
        console.error('findExistingUserByEmail auth users error:', authErr.message);
        break;
      }

      for (const authUser of authPage.users ?? []) {
        authUsersMap.set(authUser.id, authUser);
        if (authUser.email?.trim().toLowerCase() === normalizedEmail) {
          const { data: profile } = await this.adminSupabase
            .from('tjs_profiles')
            .select('id, email, full_name')
            .eq('id', authUser.id)
            .maybeSingle();

          return {
            id: authUser.id,
            email: authUser.email ?? normalizedEmail,
            full_name: (profile as Partial<TjsProfile> | null)?.full_name ?? null,
            account_status: this.deriveAccountStatus(authUser),
            invited_at: (authUser as any).invited_at ?? null,
            email_confirmed_at: authUser.email_confirmed_at ?? null,
          };
        }
      }

      if (!authPage.nextPage) break;
      page = authPage.nextPage;
    }

    const { data: profileByEmail, error: profileErr } = await this.adminSupabase
      .from('tjs_profiles')
      .select('id, email, full_name')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (profileErr) {
      console.error('findExistingUserByEmail profile lookup error:', profileErr.message);
      return null;
    }

    if (!profileByEmail) {
      return null;
    }

    const authUser = authUsersMap.get(profileByEmail.id);
    return {
      id: profileByEmail.id,
      email: profileByEmail.email,
      full_name: profileByEmail.full_name,
      account_status: this.deriveAccountStatus(authUser),
      invited_at: (authUser as any)?.invited_at ?? null,
      email_confirmed_at: authUser?.email_confirmed_at ?? null,
    };
  }

  /**
   * Invite a new user by email.
   * Supabase sends them a "magic link" email; on click they land on
   * the app's redirectTo URL where they set their password.
   */
  async inviteUser(
    email: string,
    fullName: string,
    redirectTo: string
  ): Promise<{ userId: string | null; error: string | null }> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await this.findExistingUserByEmail(normalizedEmail);
      if (existingUser) {
        return {
          userId: null,
          error: existingUser.account_status === 'active'
            ? 'Un compte existe déjà avec cette adresse email.'
            : 'Un compte invité existe déjà avec cette adresse email. Utilisez le renvoi d’email d’activation.',
        };
      }

      const { data, error } = await this.adminSupabase.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo,
        data: { full_name: fullName },
      });
      
      if (error) {
        console.error('inviteUser error:', error);
        return { userId: null, error: error.message };
      }
      
      return { userId: data.user?.id ?? null, error: null };
    } catch (error) {
      console.error('inviteUser exception:', error);
      return { userId: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Re-send the invitation / activation email to a user who has not yet activated the account.
   */
  async resendInvite(
    email: string,
    fullName: string,
    redirectTo: string
  ): Promise<string | null> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await this.findExistingUserByEmail(normalizedEmail);
      if (!existingUser) {
        return 'Aucun compte n’existe avec cette adresse email.';
      }
      if (existingUser.account_status === 'active') {
        return 'Ce compte est déjà activé.';
      }

      const { error } = await this.adminSupabase.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo,
        data: { full_name: fullName },
      });

      if (error) {
        console.error('resendInvite error:', error);
        return error.message;
      }

      return null;
    } catch (error) {
      console.error('resendInvite exception:', error);
      return error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /** Upsert profile data (used after invitation to pre-fill profile). */
  async upsertProfile(profile: Partial<TjsProfile> & { id: string }): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_profiles')
      .upsert(profile, { onConflict: 'id' });
    if (error) {
      console.error('upsertProfile error:', error.message);
      return error.message;
    }
    return null;
  }

  /** Assign a role to a user. Silently ignores duplicates. */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string
  ): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_user_roles')
      .upsert(
        { user_id: userId, role_id: roleId, assigned_by: assignedBy, is_active: true },
        { onConflict: 'user_id,role_id' }
      );
    if (error) {
      console.error('assignRole error:', error.message);
      return error.message;
    }

    // Check if this is an Artist role and create tjs_artists record if needed
    const roleName = await this.getRoleNameById(roleId);
    if (roleName) {
      const artistError = await this.ensureArtistRecord(userId, roleName, assignedBy);
      if (artistError) {
        console.error('assignRole: failed to create artist record:', artistError);
        // Don't fail the role assignment, just log the error
      }
    }

    return null;
  }

  /** Remove (deactivate) a role from a user. */
  async removeRole(userId: string, roleId: string): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_user_roles')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('role_id', roleId);
    if (error) {
      console.error('removeRole error:', error.message);
      return error.message;
    }
    return null;
  }

  /** Update a user's profile fields. */
  async updateProfile(
    userId: string,
    fields: Partial<Pick<TjsProfile, 'full_name' | 'phone' | 'bio' | 'is_member' | 'member_since' | 'member_until' | 'is_pag_artist'>>
  ): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      console.error('updateProfile error:', error.message);
      return error.message;
    }

    if ('is_member' in fields || 'member_since' in fields || 'member_until' in fields) {
      const { data: profile, error: profileError } = await this.adminSupabase
        .from('tjs_profiles')
        .select('id, is_member, member_until')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('updateProfile membership sync profile error:', profileError.message);
        return profileError.message;
      }

      const shouldHaveMemberRole = this.membershipStateFromProfile(profile as Pick<TjsProfile, 'is_member' | 'member_until'>) === 'active';
      const roleError = await this.syncMemberRoleState(userId, shouldHaveMemberRole, userId);
      if (roleError) {
        return roleError;
      }
    }

    return null;
  }

  async listMembershipPayments(limit: number = 20): Promise<MembershipPaymentRecord[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_membership_payments')
      .select('id, profile_id, payment_date, expires_at, is_active, amount, currency, notes, recorded_by, created_at, updated_at')
      .order('payment_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('listMembershipPayments error:', error.message);
      return [];
    }

    const payments = (data ?? []) as any[];
    const profileIds = Array.from(new Set(payments.map((row) => row.profile_id).filter(Boolean)));
    const recorderIds = Array.from(new Set(payments.map((row) => row.recorded_by).filter(Boolean)));
    const lookupIds = Array.from(new Set([...profileIds, ...recorderIds]));

    const { data: profiles, error: profilesError } = lookupIds.length > 0
      ? await this.adminSupabase
          .from('tjs_profiles')
          .select('id, full_name, email')
          .in('id', lookupIds)
      : { data: [], error: null };

    if (profilesError) {
      console.error('listMembershipPayments profiles error:', profilesError.message);
    }

    const profilesById = new Map<string, { full_name: string | null; email: string | null }>();
    for (const profile of ((profiles ?? []) as any[])) {
      profilesById.set(profile.id, {
        full_name: profile.full_name ?? null,
        email: profile.email ?? null,
      });
    }

    return payments.map((row) => ({
      id: row.id,
      profile_id: row.profile_id,
      payment_date: row.payment_date,
      expires_at: row.expires_at,
      is_active: !!row.is_active,
      amount: row.amount ?? null,
      currency: row.currency ?? null,
      notes: row.notes ?? null,
      recorded_by: row.recorded_by ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: profilesById.get(row.profile_id)?.full_name ?? null,
      user_email: profilesById.get(row.profile_id)?.email ?? null,
      recorded_by_name: row.recorded_by ? (profilesById.get(row.recorded_by)?.full_name ?? null) : null,
    }));
  }

  async recordMembershipPayment(
    userId: string,
    paymentDate: string,
    recordedBy: string
  ): Promise<{ expiryDate: string | null; error: string | null }> {
    const normalizedPaymentDate = paymentDate.trim();
    if (!normalizedPaymentDate) {
      return { expiryDate: null, error: 'Payment date is required.' };
    }

    const expiryDate = this.addTwelveMonths(normalizedPaymentDate);
    const { data: existingProfile, error: existingProfileError } = await this.adminSupabase
      .from('tjs_profiles')
      .select('id, full_name, email, is_member, member_until')
      .eq('id', userId)
      .single();

    if (existingProfileError || !existingProfile) {
      console.error('recordMembershipPayment profile error:', existingProfileError?.message);
      return { expiryDate: null, error: existingProfileError?.message ?? 'User profile not found.' };
    }

    const previousState = this.membershipStateFromProfile(existingProfile as Pick<TjsProfile, 'is_member' | 'member_until'>);

    const { error: paymentError } = await this.adminSupabase
      .from('tjs_membership_payments')
      .insert({
        profile_id: userId,
        payment_date: normalizedPaymentDate,
        expires_at: expiryDate,
        is_active: true,
        recorded_by: recordedBy,
      });

    if (paymentError) {
      console.error('recordMembershipPayment insert error:', paymentError.message);
      return { expiryDate: null, error: paymentError.message };
    }

    const { error: profileError } = await this.adminSupabase
      .from('tjs_profiles')
      .update({
        is_member: true,
        member_since: normalizedPaymentDate,
        member_until: expiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('recordMembershipPayment profile update error:', profileError.message);
      return { expiryDate: null, error: profileError.message };
    }

    const roleError = await this.syncMemberRoleState(userId, true, recordedBy);
    if (roleError) {
      return { expiryDate: null, error: roleError };
    }

    const subject = previousState === 'active'
      ? `Membership: renewed until ${this.formatMembershipDate(expiryDate)}`
      : `Membership: active until ${this.formatMembershipDate(expiryDate)}`;
    const body = previousState === 'active'
      ? `Your TJS membership has been renewed. Access remains active until ${this.formatMembershipDate(expiryDate)}.`
      : `Your TJS membership is now active. You can access members-only features until ${this.formatMembershipDate(expiryDate)}.`;

    await this.sendMembershipNotification(userId, recordedBy, subject, body);

    return { expiryDate, error: null };
  }

  async syncExpiredMemberships(actorUserId?: string): Promise<{ expiredCount: number; error: string | null }> {
    const today = this.todayDateString();
    const { data: expiredProfiles, error: expiredProfilesError } = await this.adminSupabase
      .from('tjs_profiles')
      .select('id, full_name, email, is_member, member_until')
      .eq('is_member', true)
      .lt('member_until', today);

    if (expiredProfilesError) {
      console.error('syncExpiredMemberships profile lookup error:', expiredProfilesError.message);
      return { expiredCount: 0, error: expiredProfilesError.message };
    }

    const profiles = (expiredProfiles ?? []) as Array<Pick<TjsProfile, 'id' | 'full_name' | 'email' | 'is_member' | 'member_until'>>;
    if (profiles.length === 0) {
      return { expiredCount: 0, error: null };
    }

    const userIds = profiles.map((profile) => profile.id);
    const { error: updateError } = await this.adminSupabase
      .from('tjs_profiles')
      .update({
        is_member: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', userIds);

    if (updateError) {
      console.error('syncExpiredMemberships update error:', updateError.message);
      return { expiredCount: 0, error: updateError.message };
    }

    for (const profile of profiles) {
      const roleError = await this.syncMemberRoleState(profile.id, false);
      if (roleError) {
        return { expiredCount: 0, error: roleError };
      }

      if (actorUserId) {
        await this.sendMembershipNotification(
          profile.id,
          actorUserId,
          'Membership: expired',
          `Your TJS membership expired on ${this.formatMembershipDate(profile.member_until ?? today)}. Renew your membership to restore access to members-only features.`
        );
      }
    }

    return { expiredCount: profiles.length, error: null };
  }

  async getLatestMembershipNotification(): Promise<MembershipNotification | null> {
    const user = await this.getCurrentUser();
    if (!user) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('tjs_internal_messages')
      .select('id, subject, body, is_read, created_at, sender_id')
      .eq('recipient_id', user.id)
      .ilike('subject', 'Membership:%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('getLatestMembershipNotification error:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    let senderName: string | null = null;
    if ((data as any).sender_id) {
      const { data: senderProfile } = await this.adminSupabase
        .from('tjs_profiles')
        .select('full_name')
        .eq('id', (data as any).sender_id)
        .maybeSingle();

      senderName = (senderProfile as any)?.full_name ?? null;
    }

    return {
      id: data.id,
      subject: data.subject ?? null,
      body: data.body,
      is_read: !!data.is_read,
      created_at: data.created_at,
      sender_name: senderName,
    };
  }

  async markMembershipNotificationRead(messageId: string): Promise<string | null> {
    const { error } = await this.supabase
      .from('tjs_internal_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      console.error('markMembershipNotificationRead error:', error.message);
      return error.message;
    }

    return null;
  }

  /** Deactivate / ban a user via Supabase admin API. */
  async deactivateUser(userId: string): Promise<string | null> {
    const { error } = await this.adminSupabase.auth.admin.updateUserById(userId, {
      ban_duration: '876600h', // ~100 years = effectively disabled
    });
    if (error) {
      console.error('deactivateUser error:', error.message);
      return error.message;
    }
    return null;
  }

  /** Re-activate a previously banned user. */
  async reactivateUser(userId: string): Promise<string | null> {
    const { error } = await this.adminSupabase.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    });
    if (error) {
      console.error('reactivateUser error:', error.message);
      return error.message;
    }
    return null;
  }

  /** Update the currently-signed-in user's password. */
  async updateCurrentUserPassword(newPassword: string): Promise<string | null> {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('updateCurrentUserPassword error:', error.message);
      return error.message;
    }
    return null;
  }

  async sendPasswordResetEmail(email: string, redirectTo: string): Promise<string | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await this.supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (error) {
      console.error('sendPasswordResetEmail error:', error.message);
      return error.message;
    }

    return null;
  }

  /** Get admin Supabase client for administrative operations */
  getAdminSupabase(): SupabaseClient {
    return this.adminSupabase;
  }

  // ── Hosts ──────────────────────────────────────────────────────────────

  /** Fetch all hosts with their type. */
  async getHosts(): Promise<TjsHost[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_hosts')
      .select('*')
      .order('id', { ascending: false });
    if (error) {
      console.error('getHosts error:', error.message);
      return [];
    }
    return data as TjsHost[];
  }

  /** Fetch host types for the dropdown. */
  async getHostTypes(): Promise<SysHostType[]> {
    const { data, error } = await this.adminSupabase
      .from('sys_host_types')
      .select('*')
      .order('name');
    if (error) {
      console.error('getHostTypes error:', error.message);
      return [];
    }
    return data as SysHostType[];
  }

  /** Create a new host. */
  async createHost(
    host: Omit<TjsHost, 'id' | 'created_on' | 'last_update' | 'host_type' | 'members'>
  ): Promise<{ id: number | null; error: string | null }> {
    const { data, error } = await this.adminSupabase
      .from('tjs_hosts')
      .insert(host)
      .select('id')
      .single();
    if (error) {
      console.error('createHost error:', error.message);
      return { id: null, error: error.message };
    }
    return { id: data.id, error: null };
  }

  /** Update an existing host. */
  async updateHost(
    hostId: number,
    fields: Partial<Omit<TjsHost, 'id' | 'created_on' | 'host_type' | 'members'>>
  ): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_hosts')
      .update({ ...fields, last_update: new Date().toISOString() })
      .eq('id', hostId);
    if (error) {
      console.error('updateHost error:', error.message);
      return error.message;
    }
    return null;
  }

  /** Delete a host. */
  async deleteHost(hostId: number): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_hosts')
      .delete()
      .eq('id', hostId);
    if (error) {
      console.error('deleteHost error:', error.message);
      return error.message;
    }
    return null;
  }

  /** Fetch hosts where the current user is a member (for Host role). */
  async getMyHosts(profileId: string): Promise<TjsHost[]> {
    const { data, error } = await this.supabase
      .from('tjs_host_members')
      .select('host_id, tjs_hosts(*)')
      .eq('profile_id', profileId);
    if (error) {
      console.error('getMyHosts error:', error.message);
      return [];
    }
    return (data as any[])
      .map((row: any) => row.tjs_hosts as TjsHost)
      .filter((h): h is TjsHost => h !== null);
  }

  async getManagedHosts(managerUserId: string): Promise<TjsHost[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_hosts')
      .select('*')
      .eq('created_by', managerUserId)
      .order('id', { ascending: false });
    if (error) {
      console.error('getManagedHosts error:', error.message);
      return [];
    }
    return data as TjsHost[];
  }

  // ── Host Members ──────────────────────────────────────────────────────

  /** Fetch members assigned to a host. */
  async getHostMembers(hostId: number): Promise<TjsHostMember[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_host_members')
      .select(`*, profile:tjs_profiles(id, email, full_name, phone, avatar_url)`)
      .eq('host_id', hostId)
      .order('created_on', { ascending: false });
    if (error) {
      console.error('getHostMembers error:', error.message);
      return [];
    }
    return data as TjsHostMember[];
  }

  /** Assign a profile as a member of a host. */
  async assignHostMember(
    hostId: number,
    profileId: string,
    role: string = 'member'
  ): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_host_members')
      .insert({ host_id: hostId, profile_id: profileId, role });
    if (error) {
      console.error('assignHostMember error:', error.message);
      return error.message;
    }
    return null;
  }

  /** Remove a member from a host. */
  async removeHostMember(hostMemberId: number): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_host_members')
      .delete()
      .eq('id', hostMemberId);
    if (error) {
      console.error('removeHostMember error:', error.message);
      return error.message;
    }
    return null;
  }

  // ── Artists ─────────────────────────────────────────────────────────────

  /** Fetch artists with their profile data. */
  async getArtists(scope?: { committeeMemberId?: string; createdById?: string }): Promise<TjsArtist[]> {
    let query = this.adminSupabase
      .from('tjs_artists')
      .select(`
        *,
        profile:tjs_profiles (
          id, email, full_name, phone, bio, avatar_url,
          is_member, member_since, member_until, is_pag_artist,
          created_at, updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (scope?.committeeMemberId) {
      query = query.eq('committee_member_id', scope.committeeMemberId);
    } else if (scope?.createdById) {
      query = query.eq('created_by', scope.createdById);
    }

    const { data, error } = await query;

    if (error) {
      console.error('getArtists error:', error);
      throw new Error(`Failed to fetch artists: ${error.message}`);
    }

    const artists = await this.mapArtistsWithAssignments((data as any[]) ?? []);
    
    // Log warning if no artists have the required flags set
    const tjsCount = artists.filter(a => a.is_tjs_artist).length;
    const invitedCount = artists.filter(a => a.is_invited_artist).length;
    if (artists.length > 0 && tjsCount === 0 && invitedCount === 0) {
      console.warn('getArtists: Found artists but none have is_tjs_artist or is_invited_artist flags set!');
    }
    
    return artists;
  }

  /** Fetch TJS artists (is_tjs_artist = true). */
  async getTjsArtists(): Promise<TjsArtist[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artists')
      .select(`
        *,
        profile:tjs_profiles (
          id, email, full_name, phone, bio, avatar_url,
          is_member, member_since, member_until, is_pag_artist,
          created_at, updated_at
        )
      `)
      .eq('is_tjs_artist', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getTjsArtists error:', error.message);
      return [];
    }

    return this.mapArtistsWithAssignments((data as any[]) ?? []);
  }

  /** Fetch invited artists (is_invited_artist = true). */
  async getInvitedArtists(): Promise<TjsArtist[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artists')
      .select(`
        *,
        profile:tjs_profiles (
          id, email, full_name, phone, bio, avatar_url,
          is_member, member_since, member_until, is_pag_artist,
          created_at, updated_at
        )
      `)
      .eq('is_invited_artist', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getInvitedArtists error:', error.message);
      return [];
    }

    return this.mapArtistsWithAssignments((data as any[]) ?? []);
  }

  /** Fetch legacy PAG artists from public.artists for non-TJS browsing. */
  async getPagArtists(): Promise<PagArtist[]> {
    const { data, error } = await this.adminSupabase
      .from('artists')
      .select('id, id_profile, fname, lname, email, phone, photo, is_featured, is_active, created_on')
      .order('fname', { ascending: true });

    if (error) {
      console.error('getPagArtists error:', error.message);
      return [];
    }

    const pagArtists = ((data ?? []) as PagArtist[]);

    const { data: tjsArtists, error: tjsError } = await this.adminSupabase
      .from('tjs_artists')
      .select('id, profile_id, artist_name');

    if (tjsError) {
      console.error('getPagArtists tjs lookup error:', tjsError.message);
      return pagArtists.map((artist) => ({ ...artist, tjs_artist_id: null }));
    }

    const tjsRows = (tjsArtists ?? []) as Array<{ id: string; profile_id: string | null; artist_name: string | null }>;
    const tjsByProfileId = new Map<string, string>();
    const tjsByName = new Map<string, string>();

    for (const row of tjsRows) {
      if (row.profile_id) {
        tjsByProfileId.set(row.profile_id, row.id);
      }

      const normalizedName = (row.artist_name ?? '').trim().toLowerCase();
      if (normalizedName) {
        tjsByName.set(normalizedName, row.id);
      }
    }

    return pagArtists.map((artist) => {
      const normalizedName = `${artist.fname ?? ''} ${artist.lname ?? ''}`.trim().toLowerCase();
      const matchedTjsId = (artist.id_profile ? tjsByProfileId.get(artist.id_profile) : null)
        ?? (normalizedName ? tjsByName.get(normalizedName) : null)
        ?? null;

      return {
        ...artist,
        tjs_artist_id: matchedTjsId,
      };
    });
  }

  async promotePagArtistToTjs(
    pagArtist: PagArtist,
    committeeMemberId?: string | null
  ): Promise<{ artist: TjsArtist | null; error: string | null }> {
    if (!pagArtist.is_active) {
      return { artist: null, error: 'Only active non-TJS artists can be converted to TJS artists.' };
    }

    if (pagArtist.tjs_artist_id) {
      const { data, error } = await this.adminSupabase
        .from('tjs_artists')
        .select(`
          *,
          profile:tjs_profiles (
            id, email, full_name, phone, bio, avatar_url,
            is_member, member_since, member_until, is_pag_artist,
            created_at, updated_at
          )
        `)
        .eq('id', pagArtist.tjs_artist_id)
        .maybeSingle();

      if (error) {
        console.error('promotePagArtistToTjs existing fetch error:', error.message);
        return { artist: null, error: error.message };
      }

      const mappedArtists = await this.mapArtistsWithAssignments(data ? [data] : []);
      return { artist: mappedArtists[0] ?? null, error: null };
    }

    const artistName = `${pagArtist.fname ?? ''} ${pagArtist.lname ?? ''}`.trim() || 'Unknown Artist';
    const payload: Record<string, any> = {
      profile_id: pagArtist.id_profile,
      artist_name: artistName,
      is_tjs_artist: true,
      activation_status: 'active',
    };

    if (committeeMemberId) {
      payload['committee_member_id'] = committeeMemberId;
    }

    const { data, error } = await this.adminSupabase
      .from('tjs_artists')
      .insert(payload)
      .select(`
        *,
        profile:tjs_profiles (
          id, email, full_name, phone, bio, avatar_url,
          is_member, member_since, member_until, is_pag_artist,
          created_at, updated_at
        )
      `)
      .single();

    if (error) {
      console.error('promotePagArtistToTjs insert error:', error.message);
      return { artist: null, error: error.message };
    }

    const mappedArtists = await this.mapArtistsWithAssignments(data ? [data] : []);
    return { artist: mappedArtists[0] ?? null, error: null };
  }

  /** Fetch Committee Members that can be assigned to artists. */
  async getCommitteeMembersForAssignment(): Promise<TjsArtistUserSummary[]> {
    const { data: userRoles, error } = await this.adminSupabase
      .from('tjs_user_roles')
      .select(`
        user_id,
        role:tjs_roles (
          name
        )
      `)
      .eq('is_active', true);

    if (error) {
      console.error('getCommitteeMembersForAssignment roles error:', error.message);
      return [];
    }

    const committeeMemberIds = Array.from(
      new Set(
        ((userRoles ?? []) as any[])
          .filter((row) => row.role?.name === 'Committee Member')
          .map((row) => row.user_id as string | null)
          .filter((value): value is string => !!value)
      )
    );

    if (committeeMemberIds.length === 0) {
      return [];
    }

    const { data: profiles, error: profilesError } = await this.adminSupabase
      .from('tjs_profiles')
      .select('id, email, full_name')
      .in('id', committeeMemberIds)
      .order('full_name', { ascending: true });

    if (profilesError) {
      console.error('getCommitteeMembersForAssignment profiles error:', profilesError.message);
      return [];
    }

    return ((profiles ?? []) as Partial<TjsProfile>[])
      .filter((profile): profile is Partial<TjsProfile> & { id: string } => !!profile.id)
      .map((profile) => ({
        id: profile.id,
        email: profile.email ?? null,
        full_name: profile.full_name ?? null,
      }));
  }

  /** Create a lightweight artist record. */
  async createArtist(input: CreateArtistInput): Promise<{ artist: TjsArtist | null; error: string | null }> {
    const payload: Record<string, any> = {
      artist_name: input.artist_name,
      is_tjs_artist: input.is_tjs_artist,
      is_invited_artist: input.is_invited_artist,
      profile_id: null,
    };

    if (input.committee_member_id) {
      payload['committee_member_id'] = input.committee_member_id;
    }

    const { data, error } = await this.adminSupabase
      .from('tjs_artists')
      .insert(payload)
      .select(`
        *,
        profile:tjs_profiles (
          id, email, full_name, phone, bio, avatar_url,
          is_member, member_since, member_until, is_pag_artist,
          created_at, updated_at
        )
      `)
      .single();

    if (error) {
      console.error('createArtist error:', error.message);
      return { artist: null, error: error.message };
    }

    const mappedArtists = await this.mapArtistsWithAssignments(data ? [data] : []);
    return { artist: mappedArtists[0] ?? null, error: null };
  }

  async inviteArtist(input: InviteArtistInput): Promise<{ artist: TjsArtist | null; error: string | null }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const fullName = input.full_name.trim();

    if (!normalizedEmail || !fullName) {
      return { artist: null, error: 'Email and full name are required.' };
    }

    const existingUser = await this.findExistingUserByEmail(normalizedEmail);
    if (existingUser) {
      return {
        artist: null,
        error: existingUser.account_status === 'active'
          ? 'An account already exists with this email.'
          : 'This email has already been invited.',
      };
    }

    const redirectTo = this.getInviteRedirectUrl();
    const { userId, error: inviteError } = await this.inviteUser(normalizedEmail, fullName, redirectTo);
    if (inviteError || !userId) {
      return { artist: null, error: inviteError ?? 'Failed to invite artist.' };
    }

    const profileError = await this.upsertProfile({
      id: userId,
      email: normalizedEmail,
      full_name: fullName,
      phone: input.phone?.trim() || null,
    });

    if (profileError) {
      return { artist: null, error: profileError };
    }

    const artistRoleId = await this.getRoleIdByName(input.role_name);
    if (!artistRoleId) {
      return { artist: null, error: `${input.role_name} role not found.` };
    }

    const roleError = await this.assignRole(userId, artistRoleId, input.assigned_by);
    if (roleError) {
      return { artist: null, error: roleError };
    }

    const updatePayload: Record<string, any> = {
      artist_name: fullName,
      updated_at: new Date().toISOString(),
    };

    if (input.committee_member_id) {
      updatePayload['committee_member_id'] = input.committee_member_id;
    }

    const { data, error } = await this.adminSupabase
      .from('tjs_artists')
      .update(updatePayload)
      .eq('profile_id', userId)
      .select(`
        *,
        profile:tjs_profiles (
          id, email, full_name, phone, bio, avatar_url,
          is_member, member_since, member_until, is_pag_artist,
          created_at, updated_at
        )
      `)
      .maybeSingle();

    if (error) {
      console.error('inviteArtist update error:', error.message);
      return { artist: null, error: error.message };
    }

    if (!data) {
      return { artist: null, error: 'Artist record was not created.' };
    }

    const mappedArtists = await this.mapArtistsWithAssignments([data]);
    return { artist: mappedArtists[0] ?? null, error: null };
  }

  /** Assign or reassign a Committee Member to an artist profile. */
  async assignCommitteeMemberToArtist(
    artistId: string,
    committeeMemberId: string
  ): Promise<string | null> {
    const committeeMembers = await this.getCommitteeMembersForAssignment();
    const isValidCommitteeMember = committeeMembers.some((member) => member.id === committeeMemberId);

    if (!isValidCommitteeMember) {
      return 'Le membre du comite selectionne est introuvable.';
    }

    const { error } = await this.adminSupabase
      .from('tjs_artists')
      .update({
        committee_member_id: committeeMemberId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', artistId);

    if (error) {
      console.error('assignCommitteeMemberToArtist error:', error.message);
      return error.message;
    }

    return null;
  }

  async promoteInvitedArtistToTjs(artistId: string): Promise<{ artist: TjsArtist | null; error: string | null }> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artists')
      .update({
        is_tjs_artist: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', artistId)
      .select(`
        *,
        profile:tjs_profiles (
          id, email, full_name, phone, bio, avatar_url,
          is_member, member_since, member_until, is_pag_artist,
          created_at, updated_at
        )
      `)
      .single();

    if (error) {
      console.error('promoteInvitedArtistToTjs error:', error.message);
      return { artist: null, error: error.message };
    }

    const mappedArtists = await this.mapArtistsWithAssignments(data ? [data] : []);
    return { artist: mappedArtists[0] ?? null, error: null };
  }

  /** Toggle the is_featured flag on an artist and log to audit trail. */
  async toggleArtistFeatured(
    artistId: string,
    isFeatured: boolean,
    performedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error: string | null }> {
    const { data: currentArtist, error: fetchError } = await this.adminSupabase
      .from('tjs_artists')
      .select('is_featured')
      .eq('id', artistId)
      .maybeSingle();

    if (fetchError) {
      console.error('toggleArtistFeatured fetch error:', fetchError.message);
      return { success: false, error: fetchError.message };
    }

    if (!currentArtist) {
      return { success: false, error: 'Artist not found.' };
    }

    const previousFeatured = currentArtist.is_featured;

    const { error: updateError } = await this.adminSupabase
      .from('tjs_artists')
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', artistId);

    if (updateError) {
      console.error('toggleArtistFeatured update error:', updateError.message);
      return { success: false, error: updateError.message };
    }

    if (this.artistAuditLogAvailable !== false) {
      const { error: auditError } = await this.adminSupabase
        .from('tjs_artist_audit_log')
        .insert({
          artist_id: artistId,
          performed_by: performedBy,
          previous_featured: previousFeatured,
          new_featured: isFeatured,
          reason: reason || null,
        });

      if (auditError) {
        if (this.isMissingArtistAuditLogError(auditError)) {
          this.artistAuditLogAvailable = false;
        } else {
          console.warn('toggleArtistFeatured audit log insert failed:', auditError.message);
        }
      } else {
        this.artistAuditLogAvailable = true;
      }
    }

    return { success: true, error: null };
  }

  /** Fetch audit log entries for a specific artist. */
  async getArtistAuditLog(artistId: string): Promise<TjsArtistAuditLog[]> {
    if (this.artistAuditLogAvailable === false) {
      return [];
    }

    const { data, error } = await this.adminSupabase
      .from('tjs_artist_audit_log')
      .select('*')
      .eq('artist_id', artistId)
      .order('performed_at', { ascending: false });

    if (error) {
      if (this.isMissingArtistAuditLogError(error)) {
        this.artistAuditLogAvailable = false;
        return [];
      }

      console.error('getArtistAuditLog error:', error.message);
      return [];
    }

    this.artistAuditLogAvailable = true;

    const logs = (data as any[]) || [];
    if (logs.length === 0) return [];

    const performerIds = Array.from(new Set(logs.map((l) => l.performed_by)));
    const { data: profiles } = await this.adminSupabase
      .from('tjs_profiles')
      .select('id, email, full_name')
      .in('id', performerIds);

    const profilesById = new Map<string, Partial<TjsProfile>>();
    for (const p of (profiles ?? [])) {
      if (p.id) profilesById.set(p.id, p);
    }

    return logs.map((log) => {
      const performer = log.performed_by ? profilesById.get(log.performed_by) : null;
      return {
        ...log,
        performer_name: performer?.full_name ?? performer?.email ?? null,
        performer_email: performer?.email ?? null,
      };
    });
  }

  /** Fetch all audit log entries (for admin overview). */
  async getAllArtistAuditLogs(): Promise<TjsArtistAuditLog[]> {
    if (this.artistAuditLogAvailable === false) {
      return [];
    }

    const { data, error } = await this.adminSupabase
      .from('tjs_artist_audit_log')
      .select('*')
      .order('performed_at', { ascending: false });

    if (error) {
      if (this.isMissingArtistAuditLogError(error)) {
        this.artistAuditLogAvailable = false;
        return [];
      }

      console.error('getAllArtistAuditLogs error:', error.message);
      return [];
    }

    this.artistAuditLogAvailable = true;

    const logs = (data as any[]) || [];
    if (logs.length === 0) return [];

    const performerIds = Array.from(new Set(logs.map((l) => l.performed_by)));
    const { data: profiles } = await this.adminSupabase
      .from('tjs_profiles')
      .select('id, email, full_name')
      .in('id', performerIds);

    const profilesById = new Map<string, Partial<TjsProfile>>();
    for (const p of (profiles ?? [])) {
      if (p.id) profilesById.set(p.id, p);
    }

    return logs.map((log) => {
      const performer = log.performed_by ? profilesById.get(log.performed_by) : null;
      return {
        ...log,
        performer_name: performer?.full_name ?? performer?.email ?? null,
        performer_email: performer?.email ?? null,
      };
    });
  }

  private isMissingArtistAuditLogError(error: { code?: string; message?: string | null }): boolean {
    return error.code === 'PGRST205'
      || error.message?.includes("Could not find the table 'public.tjs_artist_audit_log'") === true;
  }

  // ── Newsletter / messages ────────────────────────────────────────────────

  async submitMessage(data: NewsletterMessage) {
    try {
      const { data: result, error } = await this.supabase
        .from('tjs_messages')
        .insert([
          {
            prenom: data.prenom,
            nom: data.nom,
            email: data.email,
            message: data.message,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('Error inserting data:', error);
        throw error;
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Exception in submitMessage:', error);
      return { success: false, error };
    }
  }

  private async syncMemberRoleState(userId: string, isActive: boolean, assignedBy?: string): Promise<string | null> {
    const memberRoleId = await this.getRoleIdByName('Member');
    if (!memberRoleId) {
      return 'The Member role is missing.';
    }

    if (isActive) {
      const { error } = await this.adminSupabase
        .from('tjs_user_roles')
        .upsert(
          {
            user_id: userId,
            role_id: memberRoleId,
            assigned_by: assignedBy ?? userId,
            is_active: true,
          },
          { onConflict: 'user_id,role_id' }
        );

      if (error) {
        console.error('syncMemberRoleState activate error:', error.message);
        return error.message;
      }

      return null;
    }

    const { error } = await this.adminSupabase
      .from('tjs_user_roles')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('role_id', memberRoleId);

    if (error) {
      console.error('syncMemberRoleState deactivate error:', error.message);
      return error.message;
    }

    return null;
  }

  private async getRoleIdByName(roleName: string): Promise<string | null> {
    const cached = this.roleIdCache.get(roleName);
    if (cached) {
      return cached;
    }

    const { data, error } = await this.adminSupabase
      .from('tjs_roles')
      .select('id')
      .eq('name', roleName)
      .maybeSingle();

    if (error) {
      console.error(`getRoleIdByName(${roleName}) error:`, error.message);
      return null;
    }

    const roleId = data?.id ?? null;
    if (roleId) {
      this.roleIdCache.set(roleName, roleId);
    }

    return roleId;
  }

  private async getRoleNameById(roleId: string): Promise<string | null> {
    const { data, error } = await this.adminSupabase
      .from('tjs_roles')
      .select('name')
      .eq('id', roleId)
      .maybeSingle();

    if (error) {
      console.error(`getRoleNameById(${roleId}) error:`, error.message);
      return null;
    }

    return data?.name ?? null;
  }

  /** Create tjs_artists record when Artist role is assigned */
  private async ensureArtistRecord(userId: string, roleName: string, assignedBy: string): Promise<string | null> {
    const normalizedRoleName = roleName.toLowerCase();
    
    // Only process for Artist or Artist Invited roles
    if (normalizedRoleName !== 'artist' && normalizedRoleName !== 'artist invited') {
      return null;
    }

    // Check if artist record already exists for this profile
    const { data: existingArtist, error: checkError } = await this.adminSupabase
      .from('tjs_artists')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('ensureArtistRecord check error:', checkError.message);
      return checkError.message;
    }

    // If artist record exists, just update the flags
    if (existingArtist) {
      const updateFields: Record<string, any> = { updated_at: new Date().toISOString() };
      
      if (normalizedRoleName === 'artist') {
        updateFields['is_tjs_artist'] = true;
      } else if (normalizedRoleName === 'artist invited') {
        updateFields['is_invited_artist'] = true;
      }

      const { error: updateError } = await this.adminSupabase
        .from('tjs_artists')
        .update(updateFields)
        .eq('id', existingArtist.id);

      if (updateError) {
        console.error('ensureArtistRecord update error:', updateError.message);
        return updateError.message;
      }

      return null;
    }

    // Get the user's profile to get their name
    const { data: profile, error: profileError } = await this.adminSupabase
      .from('tjs_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('ensureArtistRecord profile error:', profileError.message);
      return profileError.message;
    }

    const artistName = (profile as any)?.full_name || 'Unknown Artist';

    // Create new artist record
    const { error: insertError } = await this.adminSupabase
      .from('tjs_artists')
      .insert({
        profile_id: userId,
        artist_name: artistName,
        is_tjs_artist: normalizedRoleName === 'artist',
        is_invited_artist: normalizedRoleName === 'artist invited',
      });

    if (insertError) {
      console.error('ensureArtistRecord insert error:', insertError.message);
      return insertError.message;
    }

    console.log(`ensureArtistRecord: Created tjs_artists record for user ${userId} with role ${roleName}`);
    return null;
  }

  private membershipStateFromProfile(profile: Pick<TjsProfile, 'is_member' | 'member_until'>): 'active' | 'expired' | 'non-member' {
    if (!profile.is_member) {
      return 'non-member';
    }

    if (!profile.member_until) {
      return 'active';
    }

    return this.parseDateOnly(profile.member_until).getTime() >= this.parseDateOnly(this.todayDateString()).getTime()
      ? 'active'
      : 'expired';
  }

  private async sendMembershipNotification(
    recipientId: string,
    senderId: string,
    subject: string,
    body: string
  ): Promise<void> {
    const { error } = await this.adminSupabase
      .from('tjs_internal_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        subject,
        body,
      });

    if (error) {
      console.error('sendMembershipNotification error:', error.message);
    }
  }

  private addTwelveMonths(paymentDate: string): string {
    const date = this.parseDateOnly(paymentDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().slice(0, 10);
  }

  private todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private async getAuthUsersByIds(userIds: string[]): Promise<Map<string, User>> {
    const authUsersById = new Map<string, User>();
    if (userIds.length === 0) {
      return authUsersById;
    }

    const remainingIds = new Set(userIds);
    let page = 1;
    const perPage = 1000;

    while (remainingIds.size > 0) {
      const { data: authPage, error } = await this.adminSupabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error('getAuthUsersByIds error:', error.message);
        break;
      }

      const users = authPage.users ?? [];
      for (const authUser of users) {
        if (remainingIds.has(authUser.id)) {
          authUsersById.set(authUser.id, authUser);
          remainingIds.delete(authUser.id);
        }
      }

      if (!authPage.nextPage) {
        break;
      }

      page = authPage.nextPage;
    }

    return authUsersById;
  }

  private deriveArtistActivationStatus(
    row: any,
    authUsersById: Map<string, User>
  ): 'pending' | 'active' | 'inactive' {
    const profileId = row.profile_id as string | null;
    if (profileId) {
      const authUser = authUsersById.get(profileId);
      if (authUser) {
        return authUser.email_confirmed_at || authUser.last_sign_in_at ? 'active' : 'pending';
      }
    }

    if (row.activation_status === 'active' || row.activation_status === 'inactive' || row.activation_status === 'pending') {
      return row.activation_status;
    }

    return 'pending';
  }

  private deriveAccountStatus(authUser: User | undefined): 'active' | 'pending' | 'inactive' {
    if (!authUser) {
      return 'inactive';
    }

    if (authUser.email_confirmed_at || authUser.last_sign_in_at) {
      return 'active';
    }

    if ((authUser as any).invited_at) {
      return 'pending';
    }

    return 'inactive';
  }

  private async mapArtistsWithAssignments(rows: any[]): Promise<TjsArtist[]> {
    const relatedProfileIds = Array.from(
      new Set(
        rows
          .flatMap((row) => [row.committee_member_id as string | null, row.created_by as string | null])
        .filter((value): value is string => !!value)
      )
    );
    const artistProfileIds = Array.from(
      new Set(
        rows
          .map((row) => row.profile_id as string | null)
          .filter((value): value is string => !!value)
      )
    );

    const profilesById = new Map<string, Partial<TjsProfile>>();
    const authUsersById = await this.getAuthUsersByIds(artistProfileIds);

    if (relatedProfileIds.length > 0) {
      const { data: relatedProfiles, error } = await this.adminSupabase
        .from('tjs_profiles')
        .select('id, email, full_name')
        .in('id', relatedProfileIds);

      if (error) {
        console.error('mapArtistsWithAssignments profiles error:', error.message);
      } else {
        for (const profile of ((relatedProfiles ?? []) as Partial<TjsProfile>[])) {
          if (profile.id) {
            profilesById.set(profile.id, profile);
          }
        }
      }
    }

    return rows.map((row) => ({
      ...row,
      committee_member_id: row.committee_member_id ?? null,
      created_by: row.created_by ?? null,
      activation_status: this.deriveArtistActivationStatus(row, authUsersById),
      profile: row.profile as TjsProfile | null,
      committee_member: this.mapArtistUserSummary(row.committee_member_id, profilesById),
      created_by_profile: this.mapArtistUserSummary(row.created_by, profilesById),
    }));
  }

  private mapArtistUserSummary(
    userId: string | null,
    profilesById: Map<string, Partial<TjsProfile>>
  ): TjsArtistUserSummary | null {
    if (!userId) {
      return null;
    }

    const profile = profilesById.get(userId);

    return {
      id: userId,
      email: profile?.email ?? null,
      full_name: profile?.full_name ?? null,
    };
  }

  private parseDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00`);
  }

  private formatMembershipDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(this.parseDateOnly(value));
  }
}
