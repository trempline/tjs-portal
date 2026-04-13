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
  teaser: string | null;
  event_domain_name: string | null;
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
  host_ids: number[];
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

export interface LocationLookupOption {
  id: number;
  name: string;
}

export interface TjsLocationImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface TjsLocation {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  long: number | null;
  description: string | null;
  is_public: boolean;
  is_private: boolean;
  public_description: string | null;
  restricted_description: string | null;
  capacity: string | null;
  city: string | null;
  country: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_active: boolean;
  access_info: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  images: TjsLocationImage[];
  amenities: LocationLookupOption[];
  specs: LocationLookupOption[];
  location_type: LocationLookupOption | null;
}

export interface SaveTjsLocationInput {
  name: string;
  address?: string | null;
  lat?: number | null;
  long?: number | null;
  description?: string | null;
  is_public: boolean;
  is_private: boolean;
  public_description?: string | null;
  restricted_description?: string | null;
  capacity?: string | null;
  city?: string | null;
  country?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  is_active: boolean;
  access_info?: string | null;
  created_by: string;
  updated_by?: string | null;
  image_urls: string[];
  amenity_ids: number[];
  spec_ids: number[];
  location_type_id?: number | null;
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

export interface ArtistPerformanceType {
  id: number;
  name: string;
}

export interface ArtistInstrumentOption {
  id: number;
  name: string;
}

export interface ArtistEducationEntry {
  id?: string;
  school_name: string;
  course_name: string;
  year: number | null;
}

export interface ArtistAwardEntry {
  id?: string;
  award: string;
  description: string;
  year: number | null;
}

export interface ArtistWorkspaceProfile {
  profile_id: string;
  banner_url: string | null;
  profile_picture_url: string | null;
  first_name: string;
  last_name: string;
  tagline: string;
  short_biography: string;
  long_biography: string;
  email: string;
  phone: string;
  website: string;
  city: string;
  country: string;
  performance_types: ArtistPerformanceType[];
  educations: ArtistEducationEntry[];
  awards: ArtistAwardEntry[];
}

export interface ArtistWorkspaceRequirements {
  profile_id: string;
  rib_number: string;
  guso_number: string;
  security_number: string;
  allergies: string;
  food_restriction: string;
  additional_requirements: string;
}

export type ArtistMediaType = 'video' | 'cd';

export interface ArtistMediaEntry {
  id?: string;
  media_type: ArtistMediaType;
  image_url: string | null;
  name: string;
  description: string;
  urls: string[];
}

export interface ArtistAvailabilityEntry {
  id?: string;
  start_date: string;
  end_date: string;
  note: string;
}

export interface ArtistNotificationItem {
  id: string;
  subject: string;
  body: string;
  expires_at: string | null;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_role: string;
  sender_avatar_url: string | null;
  recipient_role_id?: string | null;
  recipient_role_name?: string | null;
  sender_profile_id?: string | null;
}

export interface CreateRoleNotificationInput {
  recipient_role_id: string;
  sender_profile_id: string;
  sender_role: string;
  subject: string;
  body: string;
  expires_at?: string | null;
}

export interface ArtistMessageDirectoryUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: TjsRole[];
}

export interface ArtistConversationSummary {
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  other_user_avatar_url: string | null;
  other_user_role: string;
  subject: string;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
  is_archived: boolean;
  is_deleted: boolean;
}

export interface ArtistConversationMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_avatar_url: string | null;
}

export interface ArtistRequestListItem {
  id: string;
  event_title: string;
  status: 'pending' | 'approved' | 'rejected';
  date_summary: string;
  created_at: string;
  event_domain_name: string | null;
  comment_count: number;
  latest_comment_at: string | null;
  latest_comment_author_profile_id: string | null;
}

export interface ArtistRequestDateEntry {
  id?: string;
  request_type: 'day_show' | 'period';
  start_date: string;
  end_date: string;
  event_time: string;
}

export interface ArtistRequestMediaEntry {
  id?: string;
  media_type: 'CD' | 'Video';
  image_url: string | null;
  name: string;
  description: string;
  url: string;
}

export interface ArtistRequestArtistEntry {
  id?: string;
  artist_id: string | null;
  invited_artist_id: string | null;
  invited_email: string;
  display_name: string;
  invited_full_name?: string;
  is_primary?: boolean;
}

export interface ArtistRequestCommentEntry {
  id: string;
  author_profile_id: string;
  author_name: string;
  author_role: string | null;
  author_avatar_url: string | null;
  body: string;
  created_at: string;
}

export interface ArtistRequestDetail {
  id?: string;
  event_domain_id: number | null;
  event_title: string;
  teaser: string;
  long_teaser: string;
  description: string;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  dates: ArtistRequestDateEntry[];
  media: ArtistRequestMediaEntry[];
  artists: ArtistRequestArtistEntry[];
  comments: ArtistRequestCommentEntry[];
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

export interface PagArtistProfile {
  id: number;
  id_profile: string | null;
  fname: string | null;
  lname: string | null;
  title: string | null;
  teaser: string | null;
  short_bio: string | null;
  long_bio: string | null;
  dob: string | null;
  pob: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  gender: string | null;
  photo: string | null;
  credit_photo: string | null;
  cover: string | null;
  credit_cover: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  created_on: string | null;
  performances: ArtistPerformanceType[];
  educations: ArtistEducationEntry[];
  awards: ArtistAwardEntry[];
  instruments: ArtistInstrumentOption[];
  media: ArtistMediaEntry[];
  availability: ArtistAvailabilityEntry[];
  requirements: ArtistWorkspaceRequirements | null;
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

  async listArtistPerformanceTypes(): Promise<ArtistPerformanceType[]> {
    const { data, error } = await this.adminSupabase
      .from('sys_artist_performance')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('listArtistPerformanceTypes error:', error.message);
      return [];
    }

    return (data ?? []) as ArtistPerformanceType[];
  }

  async listArtistInstrumentOptions(): Promise<ArtistInstrumentOption[]> {
    const { data, error } = await this.adminSupabase
      .from('sys_instruments')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('listArtistInstrumentOptions error:', error.message);
      return [];
    }

    return (data ?? []) as ArtistInstrumentOption[];
  }

  private isMissingSchemaError(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
    if (!error) {
      return false;
    }

    return error.code === '42P01'
      || error.code === 'PGRST205'
      || error.message?.toLowerCase().includes('does not exist') === true
      || error.message?.toLowerCase().includes('could not find the table') === true;
  }

  async getArtistWorkspaceProfile(profileId: string): Promise<ArtistWorkspaceProfile | null> {
    const [profileResult, workspaceResult, performancesResult, educationsResult, awardsResult] = await Promise.all([
      this.adminSupabase
        .from('tjs_profiles')
        .select('id, email, full_name, phone, bio, avatar_url')
        .eq('id', profileId)
        .maybeSingle(),
      this.adminSupabase
        .from('tjs_artist_profiles')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle(),
      this.adminSupabase
        .from('tjs_artist_profile_performances')
        .select('performance_id, performance:sys_artist_performance(id, name)')
        .eq('profile_id', profileId),
      this.adminSupabase
        .from('tjs_artist_educations')
        .select('id, school_name, course_name, year')
        .eq('profile_id', profileId)
        .order('year', { ascending: false }),
      this.adminSupabase
        .from('tjs_artist_awards')
        .select('id, award, description, year')
        .eq('profile_id', profileId)
        .order('year', { ascending: false }),
    ]);

    if (profileResult.error) {
      console.error('getArtistWorkspaceProfile profile error:', profileResult.error.message);
      return null;
    }

    const baseProfile = profileResult.data as Partial<TjsProfile> | null;
    if (!baseProfile?.id) {
      return null;
    }

    if (workspaceResult.error && !this.isMissingSchemaError(workspaceResult.error)) {
      console.error('getArtistWorkspaceProfile workspace error:', workspaceResult.error.message);
    }

    if (performancesResult.error && !this.isMissingSchemaError(performancesResult.error)) {
      console.error('getArtistWorkspaceProfile performances error:', performancesResult.error.message);
    }

    if (educationsResult.error && !this.isMissingSchemaError(educationsResult.error)) {
      console.error('getArtistWorkspaceProfile educations error:', educationsResult.error.message);
    }

    if (awardsResult.error && !this.isMissingSchemaError(awardsResult.error)) {
      console.error('getArtistWorkspaceProfile awards error:', awardsResult.error.message);
    }

    const workspaceProfile = (workspaceResult.data ?? {}) as any;
    const fullName = baseProfile.full_name ?? '';
    const [fallbackFirstName, ...fallbackRest] = fullName.trim().split(/\s+/).filter(Boolean);

    const performanceTypes = ((performancesResult.data ?? []) as any[])
      .map((row) => row.performance)
      .filter((item): item is ArtistPerformanceType => !!item?.id && !!item?.name);

    const educations = ((educationsResult.data ?? []) as any[]).map((row) => ({
      id: row.id,
      school_name: row.school_name ?? '',
      course_name: row.course_name ?? '',
      year: row.year ?? null,
    }));

    const awards = ((awardsResult.data ?? []) as any[]).map((row) => ({
      id: row.id,
      award: row.award ?? '',
      description: row.description ?? '',
      year: row.year ?? null,
    }));

    return {
      profile_id: baseProfile.id,
      banner_url: workspaceProfile.banner_url ?? null,
      profile_picture_url: baseProfile.avatar_url ?? null,
      first_name: workspaceProfile.first_name ?? fallbackFirstName ?? '',
      last_name: workspaceProfile.last_name ?? fallbackRest.join(' '),
      tagline: workspaceProfile.tagline ?? '',
      short_biography: workspaceProfile.short_biography ?? '',
      long_biography: workspaceProfile.long_biography ?? '',
      email: baseProfile.email ?? '',
      phone: baseProfile.phone ?? '',
      website: workspaceProfile.website ?? '',
      city: workspaceProfile.city ?? '',
      country: workspaceProfile.country ?? '',
      performance_types: performanceTypes,
      educations,
      awards,
    };
  }

  async saveArtistWorkspaceProfile(profile: ArtistWorkspaceProfile): Promise<string | null> {
    const profileError = await this.upsertProfile({
      id: profile.profile_id,
      email: profile.email,
      full_name: `${profile.first_name} ${profile.last_name}`.trim(),
      phone: profile.phone || null,
      bio: profile.long_biography || profile.short_biography || null,
      avatar_url: profile.profile_picture_url || null,
    } as Partial<TjsProfile> & { id: string });

    if (profileError) {
      return profileError;
    }

    const { error: workspaceError } = await this.adminSupabase
      .from('tjs_artist_profiles')
      .upsert({
        profile_id: profile.profile_id,
        banner_url: profile.banner_url || null,
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        tagline: profile.tagline || null,
        short_biography: profile.short_biography || null,
        long_biography: profile.long_biography || null,
        website: profile.website || null,
        city: profile.city || null,
        country: profile.country || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });

    if (workspaceError) {
      if (this.isMissingSchemaError(workspaceError)) {
        console.error('saveArtistWorkspaceProfile workspace table missing:', workspaceError.message);
        return 'Artist profile tables are missing in the database. Run db/014_artist_workspace_profile.sql and try again.';
      }

      console.error('saveArtistWorkspaceProfile workspace error:', workspaceError.message);
      return workspaceError.message;
    }

    const { error: performanceDeleteError } = await this.adminSupabase
      .from('tjs_artist_profile_performances')
      .delete()
      .eq('profile_id', profile.profile_id);

    if (performanceDeleteError) {
      if (this.isMissingSchemaError(performanceDeleteError)) {
        return 'Artist profile tables are missing in the database. Run db/014_artist_workspace_profile.sql and try again.';
      }

      console.error('saveArtistWorkspaceProfile performance delete error:', performanceDeleteError.message);
      return performanceDeleteError.message;
    }

    if (profile.performance_types.length > 0) {
      const { error: performanceInsertError } = await this.adminSupabase
        .from('tjs_artist_profile_performances')
        .insert(profile.performance_types.map((item) => ({
          profile_id: profile.profile_id,
          performance_id: item.id,
        })));

      if (performanceInsertError) {
        if (this.isMissingSchemaError(performanceInsertError)) {
          return 'Artist profile tables are missing in the database. Run db/014_artist_workspace_profile.sql and try again.';
        }

        console.error('saveArtistWorkspaceProfile performance insert error:', performanceInsertError.message);
        return performanceInsertError.message;
      }
    }

    const { error: educationDeleteError } = await this.adminSupabase
      .from('tjs_artist_educations')
      .delete()
      .eq('profile_id', profile.profile_id);

    if (educationDeleteError) {
      if (this.isMissingSchemaError(educationDeleteError)) {
        return 'Artist profile tables are missing in the database. Run db/014_artist_workspace_profile.sql and try again.';
      }

      console.error('saveArtistWorkspaceProfile education delete error:', educationDeleteError.message);
      return educationDeleteError.message;
    }

    const educationPayload = profile.educations
      .filter((item) => item.school_name.trim() || item.course_name.trim())
      .map((item) => ({
        profile_id: profile.profile_id,
        school_name: item.school_name.trim(),
        course_name: item.course_name.trim(),
        year: item.year ?? null,
      }));

    if (educationPayload.length > 0) {
      const { error: educationInsertError } = await this.adminSupabase
        .from('tjs_artist_educations')
        .insert(educationPayload);

      if (educationInsertError) {
        if (this.isMissingSchemaError(educationInsertError)) {
          return 'Artist profile tables are missing in the database. Run db/014_artist_workspace_profile.sql and try again.';
        }

        console.error('saveArtistWorkspaceProfile education insert error:', educationInsertError.message);
        return educationInsertError.message;
      }
    }

    const { error: awardsDeleteError } = await this.adminSupabase
      .from('tjs_artist_awards')
      .delete()
      .eq('profile_id', profile.profile_id);

    if (awardsDeleteError) {
      if (this.isMissingSchemaError(awardsDeleteError)) {
        return 'Artist profile tables are missing in the database. Run db/014_artist_workspace_profile.sql and try again.';
      }

      console.error('saveArtistWorkspaceProfile awards delete error:', awardsDeleteError.message);
      return awardsDeleteError.message;
    }

    const awardsPayload = profile.awards
      .filter((item) => item.award.trim())
      .map((item) => ({
        profile_id: profile.profile_id,
        award: item.award.trim(),
        description: item.description.trim() || null,
        year: item.year ?? null,
      }));

    if (awardsPayload.length > 0) {
      const { error: awardsInsertError } = await this.adminSupabase
        .from('tjs_artist_awards')
        .insert(awardsPayload);

      if (awardsInsertError) {
        if (this.isMissingSchemaError(awardsInsertError)) {
          return 'Artist profile tables are missing in the database. Run db/014_artist_workspace_profile.sql and try again.';
        }

        console.error('saveArtistWorkspaceProfile awards insert error:', awardsInsertError.message);
        return awardsInsertError.message;
      }
    }

    return null;
  }

  async uploadArtistWorkspaceImage(profileId: string, file: File, kind: 'banner' | 'avatar'): Promise<{ url: string | null; error: string | null }> {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `artist-workspace/${profileId}/${kind}-${Date.now()}.${extension}`;

    const { error } = await this.adminSupabase.storage
      .from('tjs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('uploadArtistWorkspaceImage error:', error.message);
      return { url: null, error: error.message };
    }

    const { data } = this.adminSupabase.storage.from('tjs').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  }

  async getArtistWorkspaceInstruments(profileId: string): Promise<ArtistInstrumentOption[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artist_instruments')
      .select('instrument_id, instrument:sys_instruments(id, name)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getArtistWorkspaceInstruments error:', error.message);
      }
      return [];
    }

    return ((data ?? []) as any[])
      .map((row) => row.instrument)
      .filter((item): item is ArtistInstrumentOption => !!item?.id && !!item?.name);
  }

  async saveArtistWorkspaceInstruments(profileId: string, instruments: ArtistInstrumentOption[]): Promise<string | null> {
    const { error: deleteError } = await this.adminSupabase
      .from('tjs_artist_instruments')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) {
      if (this.isMissingSchemaError(deleteError)) {
        return 'Artist instrument table is missing in the database. Run db/015_artist_workspace_instruments.sql and try again.';
      }

      console.error('saveArtistWorkspaceInstruments delete error:', deleteError.message);
      return deleteError.message;
    }

    if (instruments.length === 0) {
      return null;
    }

    const { error: insertError } = await this.adminSupabase
      .from('tjs_artist_instruments')
      .insert(instruments.map((instrument) => ({
        profile_id: profileId,
        instrument_id: instrument.id,
      })));

    if (insertError) {
      if (this.isMissingSchemaError(insertError)) {
        return 'Artist instrument table is missing in the database. Run db/015_artist_workspace_instruments.sql and try again.';
      }

      console.error('saveArtistWorkspaceInstruments insert error:', insertError.message);
      return insertError.message;
    }

    return null;
  }

  async getArtistWorkspaceRequirements(profileId: string): Promise<ArtistWorkspaceRequirements | null> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artist_requirements')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getArtistWorkspaceRequirements error:', error.message);
      }
      return null;
    }

    return {
      profile_id: profileId,
      rib_number: data?.rib_number ?? '',
      guso_number: data?.guso_number ?? '',
      security_number: data?.security_number ?? '',
      allergies: data?.allergies ?? '',
      food_restriction: data?.food_restriction ?? '',
      additional_requirements: data?.additional_requirements ?? '',
    };
  }

  async saveArtistWorkspaceRequirements(requirements: ArtistWorkspaceRequirements): Promise<string | null> {
    const normalizedRibNumber = requirements.rib_number.replace(/\s+/g, '').trim();
    const normalizedGusoNumber = requirements.guso_number.replace(/\s+/g, '').trim();
    const normalizedSecurityNumber = requirements.security_number.replace(/\s+/g, '').trim();

    const { error } = await this.adminSupabase
      .from('tjs_artist_requirements')
      .upsert({
        profile_id: requirements.profile_id,
        rib_number: normalizedRibNumber,
        guso_number: normalizedGusoNumber,
        security_number: normalizedSecurityNumber,
        allergies: requirements.allergies.trim() || null,
        food_restriction: requirements.food_restriction.trim() || null,
        additional_requirements: requirements.additional_requirements.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist requirements table is missing in the database. Run db/016_artist_workspace_requirements.sql and try again.';
      }

      console.error('saveArtistWorkspaceRequirements error:', error.message);
      return error.message;
    }

    return null;
  }

  async getArtistWorkspaceMedia(profileId: string): Promise<ArtistMediaEntry[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artist_media')
      .select('id, media_type, image_url, name, description, urls')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getArtistWorkspaceMedia error:', error.message);
      }
      return [];
    }

    return ((data ?? []) as any[]).map((row) => ({
      id: row.id,
      media_type: row.media_type as ArtistMediaType,
      image_url: row.image_url ?? null,
      name: row.name ?? '',
      description: row.description ?? '',
      urls: Array.isArray(row.urls) ? row.urls.filter((value: unknown): value is string => typeof value === 'string') : [],
    }));
  }

  async saveArtistWorkspaceMedia(profileId: string, mediaEntries: ArtistMediaEntry[]): Promise<string | null> {
    const { error: deleteError } = await this.adminSupabase
      .from('tjs_artist_media')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) {
      if (this.isMissingSchemaError(deleteError)) {
        return 'Artist media table is missing in the database. Run db/017_artist_workspace_media.sql and try again.';
      }

      console.error('saveArtistWorkspaceMedia delete error:', deleteError.message);
      return deleteError.message;
    }

    const payload = mediaEntries
      .filter((entry) => entry.name.trim())
      .map((entry) => ({
        profile_id: profileId,
        media_type: entry.media_type,
        image_url: entry.image_url || null,
        name: entry.name.trim(),
        description: entry.description.trim() || null,
        urls: entry.urls.map((url) => url.trim()).filter(Boolean),
        updated_at: new Date().toISOString(),
      }));

    if (payload.length === 0) {
      return null;
    }

    const { error: insertError } = await this.adminSupabase
      .from('tjs_artist_media')
      .insert(payload);

    if (insertError) {
      if (this.isMissingSchemaError(insertError)) {
        return 'Artist media table is missing in the database. Run db/017_artist_workspace_media.sql and try again.';
      }

      console.error('saveArtistWorkspaceMedia insert error:', insertError.message);
      return insertError.message;
    }

    return null;
  }

  async uploadArtistWorkspaceMediaImage(profileId: string, file: File): Promise<{ url: string | null; error: string | null }> {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `artist-workspace/${profileId}/media/${Date.now()}.${extension}`;

    const { error } = await this.adminSupabase.storage
      .from('tjs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('uploadArtistWorkspaceMediaImage error:', error.message);
      return { url: null, error: error.message };
    }

    const { data } = this.adminSupabase.storage.from('tjs').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  }

  async getArtistWorkspaceAvailability(profileId: string): Promise<ArtistAvailabilityEntry[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artist_availability')
      .select('id, start_date, end_date, note')
      .eq('profile_id', profileId)
      .order('start_date', { ascending: true });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getArtistWorkspaceAvailability error:', error.message);
      }
      return [];
    }

    return ((data ?? []) as any[]).map((row) => ({
      id: row.id,
      start_date: row.start_date ?? '',
      end_date: row.end_date ?? '',
      note: row.note ?? '',
    }));
  }

  async saveArtistWorkspaceAvailability(profileId: string, entries: ArtistAvailabilityEntry[]): Promise<string | null> {
    const { error: deleteError } = await this.adminSupabase
      .from('tjs_artist_availability')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) {
      if (this.isMissingSchemaError(deleteError)) {
        return 'Artist availability table is missing in the database. Run db/018_artist_workspace_availability.sql and try again.';
      }

      console.error('saveArtistWorkspaceAvailability delete error:', deleteError.message);
      return deleteError.message;
    }

    const payload = entries
      .filter((entry) => entry.start_date && entry.end_date)
      .map((entry) => ({
        profile_id: profileId,
        start_date: entry.start_date,
        end_date: entry.end_date,
        note: entry.note.trim() || null,
        updated_at: new Date().toISOString(),
      }));

    if (payload.length === 0) {
      return null;
    }

    const { error: insertError } = await this.adminSupabase
      .from('tjs_artist_availability')
      .insert(payload);

    if (insertError) {
      if (this.isMissingSchemaError(insertError)) {
        return 'Artist availability table is missing in the database. Run db/018_artist_workspace_availability.sql and try again.';
      }

      console.error('saveArtistWorkspaceAvailability insert error:', insertError.message);
      return insertError.message;
    }

    return null;
  }

  async getArtistWorkspaceNotifications(profileId: string, roleIds: string[]): Promise<ArtistNotificationItem[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const { data, error } = await this.adminSupabase
      .from('tjs_artist_notifications')
      .select(`
        id,
        subject,
        body,
        expires_at,
        recipient_role_id,
        created_at,
        sender_role,
        sender:tjs_profiles!tjs_artist_notifications_sender_profile_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .in('recipient_role_id', roleIds)
      .order('created_at', { ascending: false });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getArtistWorkspaceNotifications error:', error.message);
      }
      return [];
    }

    const rows = (data ?? []) as any[];
    const senderIds = Array.from(new Set(
      rows
        .map((row) => row.sender?.id as string | undefined)
        .filter((value): value is string => !!value)
    ));

    const notificationIds = rows
      .map((row) => row.id as string | undefined)
      .filter((value): value is string => !!value);

    const rolesResult = senderIds.length > 0
      ? await this.adminSupabase
          .from('tjs_user_roles')
          .select(`
            user_id,
            is_active,
            role:tjs_roles (
              name
            )
          `)
          .in('user_id', senderIds)
          .eq('is_active', true)
      : { data: [], error: null };

    if (rolesResult.error) {
      console.error('getArtistWorkspaceNotifications roles error:', rolesResult.error.message);
    }

    const readsResult = notificationIds.length > 0
      ? await this.adminSupabase
          .from('tjs_artist_notification_reads')
          .select('notification_id')
          .eq('profile_id', profileId)
          .in('notification_id', notificationIds)
      : { data: [], error: null };

    if (readsResult.error) {
      console.error('getArtistWorkspaceNotifications reads error:', readsResult.error.message);
    }

    const rolesByUserId = new Map<string, string>();
    for (const row of ((rolesResult.data ?? []) as any[])) {
      const userId = typeof row.user_id === 'string' ? row.user_id : null;
      const roleName = typeof row.role?.name === 'string' ? row.role.name : null;
      if (userId && roleName && !rolesByUserId.has(userId)) {
        rolesByUserId.set(userId, roleName);
      }
    }

    const readIds = new Set(
      ((readsResult.data ?? []) as any[])
        .map((row) => row.notification_id as string | undefined)
        .filter((value): value is string => !!value)
    );

    return rows.map((row) => {
      const sender = row.sender;
      const senderId = sender?.id as string | undefined;
      const fallbackName = sender?.full_name || sender?.email || 'Unknown sender';

      return {
        id: row.id,
        subject: row.subject ?? 'Notification',
        body: row.body ?? '',
        expires_at: row.expires_at ?? null,
        is_read: readIds.has(row.id),
        created_at: row.created_at,
        sender_name: fallbackName,
        sender_role: row.sender_role || (senderId ? rolesByUserId.get(senderId) : null) || 'System',
        sender_avatar_url: sender?.avatar_url ?? null,
        recipient_role_id: row.recipient_role_id ?? null,
        recipient_role_name: null,
        sender_profile_id: senderId ?? null,
      };
    });
  }

  async getSentArtistWorkspaceNotifications(senderProfileId: string): Promise<ArtistNotificationItem[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artist_notifications')
      .select(`
        id,
        subject,
        body,
        expires_at,
        recipient_role_id,
        created_at,
        sender_profile_id,
        sender_role,
        recipient_role:tjs_roles!tjs_artist_notifications_recipient_role_id_fkey (
          name
        ),
        sender:tjs_profiles!tjs_artist_notifications_sender_profile_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('sender_profile_id', senderProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getSentArtistWorkspaceNotifications error:', error.message);
      }
      return [];
    }

    const rows = (data ?? []) as any[];

    return rows.map((row) => {
      const sender = row.sender;
      const fallbackName = sender?.full_name || sender?.email || 'Unknown sender';

      return {
        id: row.id,
        subject: row.subject ?? 'Notification',
        body: row.body ?? '',
        expires_at: row.expires_at ?? null,
        is_read: false,
        created_at: row.created_at,
        sender_name: fallbackName,
        sender_role: row.sender_role || 'Committee Member',
        sender_avatar_url: sender?.avatar_url ?? null,
        recipient_role_id: row.recipient_role_id ?? null,
        recipient_role_name: row.recipient_role?.name ?? null,
        sender_profile_id: row.sender_profile_id ?? null,
      };
    });
  }

  async markArtistNotificationRead(notificationId: string, profileId: string): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_artist_notification_reads')
      .upsert({
        notification_id: notificationId,
        profile_id: profileId,
        read_at: new Date().toISOString(),
      }, { onConflict: 'notification_id,profile_id' });

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist notifications table is missing in the database. Run db/019_artist_workspace_notifications.sql and try again.';
      }

      console.error('markArtistNotificationRead error:', error.message);
      return error.message;
    }

    return null;
  }

  async createRoleNotification(input: CreateRoleNotificationInput): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_artist_notifications')
      .insert({
        recipient_role_id: input.recipient_role_id,
        sender_profile_id: input.sender_profile_id,
        sender_role: input.sender_role,
        subject: input.subject.trim(),
        body: input.body.trim(),
        expires_at: input.expires_at || null,
      });

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist notifications table is missing in the database. Run db/019_artist_workspace_notifications.sql and try again.';
      }

      console.error('createRoleNotification error:', error.message);
      return error.message;
    }

    return null;
  }

  async deleteSentArtistNotification(notificationId: string, senderProfileId: string): Promise<string | null> {
    const { data: existing, error: fetchError } = await this.adminSupabase
      .from('tjs_artist_notifications')
      .select('id, expires_at')
      .eq('id', notificationId)
      .eq('sender_profile_id', senderProfileId)
      .maybeSingle();

    if (fetchError) {
      if (this.isMissingSchemaError(fetchError)) {
        return 'Artist notifications table is missing in the database. Run db/019_artist_workspace_notifications.sql and try again.';
      }

      console.error('deleteSentArtistNotification fetch error:', fetchError.message);
      return fetchError.message;
    }

    if (!existing) {
      return 'Notification not found or cannot be deleted.';
    }

    const expiresAt = existing.expires_at ? new Date(existing.expires_at).getTime() : null;
    if (expiresAt !== null && !Number.isNaN(expiresAt) && expiresAt < Date.now()) {
      return 'Expired notifications can no longer be deleted.';
    }

    const { error } = await this.adminSupabase
      .from('tjs_artist_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('sender_profile_id', senderProfileId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist notifications table is missing in the database. Run db/019_artist_workspace_notifications.sql and try again.';
      }

      console.error('deleteSentArtistNotification error:', error.message);
      return error.message;
    }

    return null;
  }

  async getArtistMessageDirectory(): Promise<ArtistMessageDirectoryUser[]> {
    const users = await this.listAllUsersWithRoles();

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      roles: user.roles,
    }));
  }

  async getArtistConversations(currentUserId: string): Promise<ArtistConversationSummary[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_internal_messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        subject,
        body,
        is_read,
        created_at
      `)
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (error) {
      if (this.isMissingSchemaError(error)) {
        throw new Error('Messaging tables are missing in the database. Run db/011_tjs_internal_messages.sql and db/020_artist_message_conversation_state.sql.');
      }
      console.error('getArtistConversations error:', error.message);
      return [];
    }

    const stateResult = await this.adminSupabase
      .from('tjs_internal_message_conversation_state')
      .select('other_user_id, subject, is_archived, is_deleted')
      .eq('user_id', currentUserId);

    if (stateResult.error && !this.isMissingSchemaError(stateResult.error)) {
      console.error('getArtistConversations state error:', stateResult.error.message);
    }

    const stateMap = new Map<string, { is_archived: boolean; is_deleted: boolean }>();
    for (const row of ((stateResult.data ?? []) as any[])) {
      const key = `${row.other_user_id}::${row.subject ?? ''}`;
      stateMap.set(key, {
        is_archived: !!row.is_archived,
        is_deleted: !!row.is_deleted,
      });
    }

    const participantIds = new Set<string>();
    for (const row of ((data ?? []) as any[])) {
      const otherUserId = row.sender_id === currentUserId ? row.recipient_id : row.sender_id;
      if (otherUserId) {
        participantIds.add(otherUserId);
      }
    }

    const profilesResult = participantIds.size > 0
      ? await this.adminSupabase
          .from('tjs_profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', Array.from(participantIds))
      : { data: [], error: null };

    if (profilesResult.error) {
      console.error('getArtistConversations profiles error:', profilesResult.error.message);
    }

    const profileByUserId = new Map<string, Partial<TjsProfile>>();
    for (const row of ((profilesResult.data ?? []) as Partial<TjsProfile>[])) {
      if (row.id) {
        profileByUserId.set(row.id, row);
      }
    }

    const rolesResult = participantIds.size > 0
      ? await this.adminSupabase
          .from('tjs_user_roles')
          .select(`
            user_id,
            is_active,
            role:tjs_roles (
              id,
              name,
              description,
              permissions
            )
          `)
          .in('user_id', Array.from(participantIds))
          .eq('is_active', true)
      : { data: [], error: null };

    if (rolesResult.error) {
      console.error('getArtistConversations roles error:', rolesResult.error.message);
    }

    const roleNameByUserId = new Map<string, string>();
    for (const row of ((rolesResult.data ?? []) as any[])) {
      const userId = typeof row.user_id === 'string' ? row.user_id : null;
      const roleName = typeof row.role?.name === 'string' ? row.role.name : null;
      if (userId && roleName && !roleNameByUserId.has(userId)) {
        roleNameByUserId.set(userId, roleName);
      }
    }

    const conversationMap = new Map<string, ArtistConversationSummary>();
    for (const row of ((data ?? []) as any[])) {
      const isSender = row.sender_id === currentUserId;
      const otherUserId = isSender ? row.recipient_id : row.sender_id;
      const otherProfile = otherUserId ? profileByUserId.get(otherUserId) : null;
      const subject = (row.subject ?? '').trim();
      const key = `${otherUserId}::${subject}`;

      if (!otherUserId || conversationMap.has(key)) {
        continue;
      }

      const state = stateMap.get(key) ?? { is_archived: false, is_deleted: false };
      if (state.is_deleted) {
        continue;
      }

      conversationMap.set(key, {
        other_user_id: otherUserId,
        other_user_name: otherProfile?.full_name || otherProfile?.email || 'Unknown user',
        other_user_email: otherProfile?.email || '',
        other_user_avatar_url: otherProfile?.avatar_url ?? null,
        other_user_role: roleNameByUserId.get(otherUserId) || 'User',
        subject,
        last_message_at: row.created_at,
        last_message_preview: row.body ?? '',
        unread_count: 0,
        is_archived: state.is_archived,
        is_deleted: state.is_deleted,
      });
    }

    for (const row of ((data ?? []) as any[])) {
      const isSender = row.sender_id === currentUserId;
      const otherUserId = isSender ? row.recipient_id : row.sender_id;
      const subject = (row.subject ?? '').trim();
      const key = `${otherUserId}::${subject}`;
      const conversation = conversationMap.get(key);
      if (!conversation) {
        continue;
      }

      if (!isSender && !row.is_read) {
        conversation.unread_count += 1;
      }
    }

    return Array.from(conversationMap.values()).sort((a, b) =>
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  }

  async getArtistConversationMessages(currentUserId: string, otherUserId: string, subject: string): Promise<ArtistConversationMessage[]> {
    const normalizedSubject = subject.trim();
    let query = this.adminSupabase
      .from('tjs_internal_messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        subject,
        body,
        is_read,
        created_at
      `)
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    query = normalizedSubject
      ? query.eq('subject', normalizedSubject)
      : query.or('subject.is.null,subject.eq.');

    const { data, error } = await query;
    if (error) {
      if (this.isMissingSchemaError(error)) {
        throw new Error('Messaging tables are missing in the database. Run db/011_tjs_internal_messages.sql and db/020_artist_message_conversation_state.sql.');
      }
      console.error('getArtistConversationMessages error:', error.message);
      return [];
    }

    const senderIds = Array.from(new Set(
      ((data ?? []) as any[])
        .map((row) => row.sender_id as string | undefined)
        .filter((value): value is string => !!value)
    ));

    const profilesResult = senderIds.length > 0
      ? await this.adminSupabase
          .from('tjs_profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', senderIds)
      : { data: [], error: null };

    if (profilesResult.error) {
      console.error('getArtistConversationMessages profiles error:', profilesResult.error.message);
    }

    const profileByUserId = new Map<string, Partial<TjsProfile>>();
    for (const row of ((profilesResult.data ?? []) as Partial<TjsProfile>[])) {
      if (row.id) {
        profileByUserId.set(row.id, row);
      }
    }

    return ((data ?? []) as any[]).map((row) => ({
      id: row.id,
      sender_id: row.sender_id,
      recipient_id: row.recipient_id,
      subject: (row.subject ?? '').trim(),
      body: row.body ?? '',
      is_read: !!row.is_read,
      created_at: row.created_at,
      sender_name: profileByUserId.get(row.sender_id)?.full_name || profileByUserId.get(row.sender_id)?.email || 'Unknown sender',
      sender_avatar_url: profileByUserId.get(row.sender_id)?.avatar_url ?? null,
    }));
  }

  async sendArtistMessage(senderId: string, recipientId: string, subject: string, body: string): Promise<string | null> {
    const normalizedSubject = subject.trim();
    const normalizedBody = body.trim();

    const { error } = await this.adminSupabase
      .from('tjs_internal_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        subject: normalizedSubject,
        body: normalizedBody,
      });

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Messaging tables are missing in the database. Run db/011_tjs_internal_messages.sql and db/020_artist_message_conversation_state.sql.';
      }
      console.error('sendArtistMessage error:', error.message);
      return error.message;
    }

    await this.setArtistConversationState(senderId, recipientId, normalizedSubject, {
      is_archived: false,
      is_deleted: false,
    });

    return null;
  }

  async markArtistConversationRead(currentUserId: string, otherUserId: string, subject: string): Promise<string | null> {
    const normalizedSubject = subject.trim();
    let query = this.adminSupabase
      .from('tjs_internal_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', currentUserId)
      .eq('is_read', false);

    query = normalizedSubject
      ? query.eq('subject', normalizedSubject)
      : query.or('subject.is.null,subject.eq.');

    const { error } = await query;
    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Messaging tables are missing in the database. Run db/011_tjs_internal_messages.sql and db/020_artist_message_conversation_state.sql.';
      }
      console.error('markArtistConversationRead error:', error.message);
      return error.message;
    }

    return null;
  }

  async setArtistConversationState(
    currentUserId: string,
    otherUserId: string,
    subject: string,
    updates: { is_archived?: boolean; is_deleted?: boolean }
  ): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_internal_message_conversation_state')
      .upsert({
        user_id: currentUserId,
        other_user_id: otherUserId,
        subject: subject.trim(),
        is_archived: updates.is_archived ?? false,
        is_deleted: updates.is_deleted ?? false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,other_user_id,subject' });

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Conversation state table is missing in the database. Run db/020_artist_message_conversation_state.sql and try again.';
      }

      console.error('setArtistConversationState error:', error.message);
      return error.message;
    }

    return null;
  }

  async listEventDomains(): Promise<Array<{ id: number; name: string }>> {
    const { data, error } = await this.adminSupabase
      .from('sys_event_domain')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('listEventDomains error:', error.message);
      return [];
    }

    return (data ?? []) as Array<{ id: number; name: string }>;
  }

  async getArtistWorkspaceRequests(profileId: string): Promise<ArtistRequestListItem[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artist_requests')
      .select(`
        id,
        event_title,
        status,
        request_type,
        start_date,
        end_date,
        event_time,
        created_at,
        event_domain:sys_event_domain(name)
      `)
      .eq('created_by', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      if (this.isMissingSchemaError(error)) {
        throw new Error('Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.');
      }
      console.error('getArtistWorkspaceRequests error:', error.message);
      return [];
    }

    const requestRows = (data ?? []) as any[];
    const requestIds = requestRows.map((row) => row.id);

    let datesByRequestId = new Map<string, any[]>();
    if (requestIds.length > 0) {
      const { data: datesData, error: datesError } = await this.adminSupabase
        .from('tjs_artist_request_dates')
        .select('request_id, request_type, start_date, end_date, event_time')
        .in('request_id', requestIds)
        .order('start_date', { ascending: true });

      if (datesError) {
        if (this.isMissingSchemaError(datesError)) {
          throw new Error('Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.');
        }
        console.error('getArtistWorkspaceRequests dates error:', datesError.message);
      } else {
        datesByRequestId = (datesData ?? []).reduce((map, row: any) => {
          const items = map.get(row.request_id) ?? [];
          items.push(row);
          map.set(row.request_id, items);
          return map;
        }, new Map<string, any[]>());
      }
    }

    let commentSummaryByRequestId = new Map<string, { count: number; latestAt: string | null; latestAuthorProfileId: string | null }>();
    if (requestIds.length > 0) {
      const { data: commentData, error: commentError } = await this.adminSupabase
        .from('tjs_artist_request_comments')
        .select('request_id, author_profile_id, created_at')
        .in('request_id', requestIds)
        .order('created_at', { ascending: true });

      if (commentError) {
        if (this.isMissingSchemaError(commentError)) {
          throw new Error('Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.');
        }
        console.error('getArtistWorkspaceRequests comments error:', commentError.message);
      } else {
        commentSummaryByRequestId = (commentData ?? []).reduce((map, row: any) => {
          const current = map.get(row.request_id) ?? {
            count: 0,
            latestAt: null,
            latestAuthorProfileId: null,
          };
          current.count += 1;
          current.latestAt = row.created_at ?? current.latestAt;
          current.latestAuthorProfileId = row.author_profile_id ?? current.latestAuthorProfileId;
          map.set(row.request_id, current);
          return map;
        }, new Map<string, { count: number; latestAt: string | null; latestAuthorProfileId: string | null }>());
      }
    }

    return requestRows.map((row) => ({
      ...(commentSummaryByRequestId.get(row.id)
        ? {
            comment_count: commentSummaryByRequestId.get(row.id)!.count,
            latest_comment_at: commentSummaryByRequestId.get(row.id)!.latestAt,
            latest_comment_author_profile_id: commentSummaryByRequestId.get(row.id)!.latestAuthorProfileId,
          }
        : {
            comment_count: 0,
            latest_comment_at: null,
            latest_comment_author_profile_id: null,
          }),
      id: row.id,
      event_title: row.event_title ?? '',
      status: row.status ?? 'pending',
      date_summary: this.summarizeArtistRequestDates(
        (datesByRequestId.get(row.id) ?? []).length > 0
          ? datesByRequestId.get(row.id) ?? []
          : [{
              request_type: row.request_type,
              start_date: row.start_date,
              end_date: row.end_date,
              event_time: row.event_time,
            }].filter((item) => item.start_date)
      ),
      created_at: row.created_at,
      event_domain_name: row.event_domain?.name ?? null,
    }));
  }

  async getArtistWorkspaceRequestDetail(requestId: string): Promise<ArtistRequestDetail | null> {
    const [requestResult, datesResult, mediaResult, artistsResult, commentsResult] = await Promise.all([
      this.adminSupabase
        .from('tjs_artist_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle(),
      this.adminSupabase
        .from('tjs_artist_request_dates')
        .select('*')
        .eq('request_id', requestId)
        .order('start_date', { ascending: true }),
      this.adminSupabase
        .from('tjs_artist_request_media')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true }),
      this.adminSupabase
        .from('tjs_artist_request_artists')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true }),
      this.adminSupabase
        .from('tjs_artist_request_comments')
        .select(`
          *,
          author:tjs_profiles(full_name, email, avatar_url)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true }),
    ]);

    if (requestResult.error) {
      if (this.isMissingSchemaError(requestResult.error)) {
        throw new Error('Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.');
      }
      console.error('getArtistWorkspaceRequestDetail request error:', requestResult.error.message);
      return null;
    }

    if (!requestResult.data) {
      return null;
    }

    const artistRows = (artistsResult.data ?? []) as any[];
    const linkedArtistIds = Array.from(
      new Set(
        artistRows
          .flatMap((row) => [row.artist_id, row.invited_artist_id])
          .filter((value): value is string => !!value)
      )
    );

    const artistsById = new Map<string, any>();
    const profilesById = new Map<string, any>();
    const authorRolesByProfileId = new Map<string, string>();

    if (linkedArtistIds.length > 0) {
      const { data: linkedArtists, error: linkedArtistsError } = await this.adminSupabase
        .from('tjs_artists')
        .select('id, artist_name, profile_id')
        .in('id', linkedArtistIds);

      if (linkedArtistsError) {
        console.error('getArtistWorkspaceRequestDetail linked artists error:', linkedArtistsError.message);
      } else {
        for (const artist of linkedArtists ?? []) {
          artistsById.set(artist.id, artist);
        }

        const linkedProfileIds = Array.from(
          new Set(
            (linkedArtists ?? [])
              .map((artist: any) => artist.profile_id as string | null)
              .filter((value): value is string => !!value)
          )
        );

        if (linkedProfileIds.length > 0) {
          const { data: linkedProfiles, error: linkedProfilesError } = await this.adminSupabase
            .from('tjs_profiles')
            .select('id, full_name, email')
            .in('id', linkedProfileIds);

          if (linkedProfilesError) {
            console.error('getArtistWorkspaceRequestDetail linked profiles error:', linkedProfilesError.message);
          } else {
            for (const profile of linkedProfiles ?? []) {
              profilesById.set(profile.id, profile);
            }
          }
        }
      }
    }

    const commentAuthorIds = Array.from(
      new Set(
        ((commentsResult.data ?? []) as any[])
          .map((row) => row.author_profile_id as string | null)
          .filter((value): value is string => !!value)
      )
    );

    if (commentAuthorIds.length > 0) {
      const { data: authorRoles, error: authorRolesError } = await this.adminSupabase
        .from('tjs_user_roles')
        .select('user_id, role:tjs_roles(name)')
        .in('user_id', commentAuthorIds)
        .eq('is_active', true);

      if (authorRolesError) {
        console.error('getArtistWorkspaceRequestDetail author roles error:', authorRolesError.message);
      } else {
        const collectedRoles = new Map<string, string[]>();

        for (const row of authorRoles ?? []) {
          const roleName = Array.isArray((row as any).role)
            ? (row as any).role[0]?.name
            : (row as any).role?.name;

          if (!row.user_id || !roleName) {
            continue;
          }

          const roles = collectedRoles.get(row.user_id) ?? [];
          if (!roles.includes(roleName)) {
            roles.push(roleName);
          }
          collectedRoles.set(row.user_id, roles);
        }

        for (const [userId, roles] of collectedRoles.entries()) {
          authorRolesByProfileId.set(userId, roles.join(', '));
        }
      }
    }

    return {
      id: requestResult.data.id,
      event_domain_id: requestResult.data.event_domain_id ?? null,
      event_title: requestResult.data.event_title ?? '',
      teaser: requestResult.data.teaser ?? '',
      long_teaser: requestResult.data.long_teaser ?? '',
      description: requestResult.data.description ?? '',
      image_url: requestResult.data.image_url ?? null,
      status: requestResult.data.status ?? 'pending',
      dates: (((datesResult.data ?? []) as any[]).length > 0
        ? (datesResult.data ?? []) as any[]
        : [{
            request_type: requestResult.data.request_type ?? 'day_show',
            start_date: requestResult.data.start_date ?? '',
            end_date: requestResult.data.end_date ?? '',
            event_time: requestResult.data.event_time ?? '',
          }].filter((item) => item.start_date)
      ).map((row) => ({
        id: row.id,
        request_type: row.request_type ?? 'day_show',
        start_date: row.start_date ?? '',
        end_date: row.end_date ?? '',
        event_time: row.event_time ?? '',
      })),
      media: ((mediaResult.data ?? []) as any[]).map((row) => ({
        id: row.id,
        media_type: row.media_type ?? 'Video',
        image_url: row.image_url ?? null,
        name: row.name ?? '',
        description: row.description ?? '',
        url: row.url ?? '',
      })),
      artists: artistRows.map((row) => {
        const selectedArtist = row.artist_id ? artistsById.get(row.artist_id) : null;
        const invitedArtist = row.invited_artist_id ? artistsById.get(row.invited_artist_id) : null;
        const invitedProfile = invitedArtist?.profile_id ? profilesById.get(invitedArtist.profile_id) : null;

        return {
          id: row.id,
          artist_id: row.artist_id ?? null,
          invited_artist_id: row.invited_artist_id ?? null,
          invited_email: row.invited_email ?? invitedProfile?.email ?? '',
          display_name: selectedArtist?.artist_name || invitedProfile?.full_name || invitedArtist?.artist_name || row.invited_email || '',
          invited_full_name: invitedProfile?.full_name || invitedArtist?.artist_name || '',
        };
      }),
      comments: ((commentsResult.data ?? []) as any[]).map((row) => ({
        id: row.id,
        author_profile_id: row.author_profile_id,
        author_name: row.author?.full_name || row.author?.email || 'Unknown user',
        author_role: authorRolesByProfileId.get(row.author_profile_id) ?? null,
        author_avatar_url: row.author?.avatar_url ?? null,
        body: row.body ?? '',
        created_at: row.created_at,
      })),
    };
  }

  async uploadArtistWorkspaceRequestImage(profileId: string, file: File, folder: 'request-image' | 'request-media'): Promise<{ url: string | null; error: string | null }> {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `artist-workspace/${profileId}/${folder}/${Date.now()}.${extension}`;

    const { error } = await this.adminSupabase.storage
      .from('tjs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('uploadArtistWorkspaceRequestImage error:', error.message);
      return { url: null, error: error.message };
    }

    const { data } = this.adminSupabase.storage.from('tjs').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  }

  async saveArtistWorkspaceRequest(profileId: string, request: ArtistRequestDetail): Promise<{ requestId: string | null; error: string | null }> {
    const normalizedTeaser = request.teaser.trim().slice(0, 200);
    const primaryDate = request.dates.find((item) => item.start_date) ?? null;
    const payload = {
      created_by: profileId,
      event_domain_id: request.event_domain_id,
      event_title: request.event_title.trim(),
      teaser: normalizedTeaser || null,
      long_teaser: request.long_teaser.trim() || null,
      description: request.description.trim() || null,
      request_type: primaryDate?.request_type ?? 'day_show',
      start_date: primaryDate?.start_date ?? null,
      end_date: primaryDate?.request_type === 'period' ? (primaryDate.end_date || null) : null,
      event_time: null,
      image_url: request.image_url || null,
      status: request.status || 'pending',
      updated_at: new Date().toISOString(),
    };

    const requestResult = request.id
      ? await this.adminSupabase
          .from('tjs_artist_requests')
          .update(payload)
          .eq('id', request.id)
          .select('id')
          .single()
      : await this.adminSupabase
          .from('tjs_artist_requests')
          .insert(payload)
          .select('id')
          .single();

    if (requestResult.error || !requestResult.data?.id) {
      if (requestResult.error && this.isMissingSchemaError(requestResult.error)) {
        return { requestId: null, error: 'Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.' };
      }
      return { requestId: null, error: requestResult.error?.message ?? 'Failed to save request.' };
    }

    const requestId = requestResult.data.id;

    const { error: datesDeleteError } = await this.adminSupabase
      .from('tjs_artist_request_dates')
      .delete()
      .eq('request_id', requestId);
    if (datesDeleteError) {
      return { requestId: null, error: datesDeleteError.message };
    }

    const datePayload = request.dates
      .filter((item) => item.start_date)
      .map((item) => ({
        request_id: requestId,
        request_type: item.request_type,
        start_date: item.start_date,
        end_date: item.request_type === 'period' ? (item.end_date || null) : null,
        event_time: null,
        updated_at: new Date().toISOString(),
      }));

    if (datePayload.length > 0) {
      const { error: datesInsertError } = await this.adminSupabase
        .from('tjs_artist_request_dates')
        .insert(datePayload);
      if (datesInsertError) {
        return { requestId: null, error: datesInsertError.message };
      }
    }

    const { error: mediaDeleteError } = await this.adminSupabase
      .from('tjs_artist_request_media')
      .delete()
      .eq('request_id', requestId);
    if (mediaDeleteError) {
      return { requestId: null, error: mediaDeleteError.message };
    }

    const mediaPayload = request.media
      .filter((item) => item.name.trim())
      .map((item) => ({
        request_id: requestId,
        media_type: item.media_type,
        image_url: item.image_url || null,
        name: item.name.trim(),
        description: item.description.trim() || null,
        url: item.url.trim() || null,
        updated_at: new Date().toISOString(),
      }));

    if (mediaPayload.length > 0) {
      const { error: mediaInsertError } = await this.adminSupabase
        .from('tjs_artist_request_media')
        .insert(mediaPayload);
      if (mediaInsertError) {
        return { requestId: null, error: mediaInsertError.message };
      }
    }

    const { error: artistDeleteError } = await this.adminSupabase
      .from('tjs_artist_request_artists')
      .delete()
      .eq('request_id', requestId);
    if (artistDeleteError) {
      return { requestId: null, error: artistDeleteError.message };
    }

    const artistPayload = request.artists
      .filter((item) => item.artist_id || item.invited_artist_id)
      .map((item) => ({
        request_id: requestId,
        artist_id: item.artist_id,
        invited_artist_id: item.invited_artist_id,
        invited_email: item.invited_email.trim() || null,
        updated_at: new Date().toISOString(),
      }));

    if (artistPayload.length > 0) {
      const { error: artistInsertError } = await this.adminSupabase
        .from('tjs_artist_request_artists')
        .insert(artistPayload);
      if (artistInsertError) {
        return { requestId: null, error: artistInsertError.message };
      }
    }

    return { requestId, error: null };
  }

  async deleteArtistWorkspaceRequest(
    profileId: string,
    requestId: string
  ): Promise<string | null> {
    const { data: existing, error: fetchError } = await this.adminSupabase
      .from('tjs_artist_requests')
      .select('id, status, created_by')
      .eq('id', requestId)
      .eq('created_by', profileId)
      .maybeSingle();

    if (fetchError) {
      if (this.isMissingSchemaError(fetchError)) {
        return 'Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.';
      }
      return fetchError.message;
    }

    if (!existing) {
      return 'Request not found.';
    }

    if (existing.status === 'approved') {
      return 'Approved requests cannot be deleted.';
    }

    const { error } = await this.adminSupabase
      .from('tjs_artist_requests')
      .delete()
      .eq('id', requestId)
      .eq('created_by', profileId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.';
      }
      return error.message;
    }

    return null;
  }

  async addArtistWorkspaceRequestComment(requestId: string, authorProfileId: string, body: string): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_artist_request_comments')
      .insert({
        request_id: requestId,
        author_profile_id: authorProfileId,
        body: body.trim(),
      });

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.';
      }
      console.error('addArtistWorkspaceRequestComment error:', error.message);
      return error.message;
    }

    return null;
  }

  async listTjsArtistsForRequestSelection(): Promise<Array<{ id: string; artist_name: string; profile_id: string }>> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artists')
      .select('id, artist_name, profile_id')
      .eq('is_tjs_artist', true)
      .order('artist_name', { ascending: true });

    if (error) {
      console.error('listTjsArtistsForRequestSelection error:', error.message);
      return [];
    }

    return (data ?? []) as Array<{ id: string; artist_name: string; profile_id: string }>;
  }

  async inviteArtistForRequest(
    assignedBy: string,
    requestId: string,
    email: string,
    fullName: string
  ): Promise<{ artistId: string | null; error: string | null }> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.findExistingUserByEmail(normalizedEmail);

    if (existingUser) {
      let existingArtistId: string | null = null;
      let resolvedName = existingUser.full_name?.trim() || fullName.trim() || normalizedEmail;

      const { data: existingArtist } = await this.adminSupabase
        .from('tjs_artists')
        .select('id, artist_name')
        .eq('profile_id', existingUser.id)
        .maybeSingle();

      if (existingArtist?.id) {
        existingArtistId = existingArtist.id;
        resolvedName = existingUser.full_name?.trim() || existingArtist.artist_name?.trim() || resolvedName;
      } else {
        const artistRoleId = await this.getRoleIdByName('Artist Invited');
        if (!artistRoleId) {
          return { artistId: null, error: 'Artist Invited role not found.' };
        }

        const roleError = await this.assignRole(existingUser.id, artistRoleId, assignedBy);
        if (roleError) {
          return { artistId: null, error: roleError };
        }

        const { data: createdArtist, error: createdArtistError } = await this.adminSupabase
          .from('tjs_artists')
          .select('id, artist_name')
          .eq('profile_id', existingUser.id)
          .maybeSingle();

        if (createdArtistError || !createdArtist?.id) {
          return { artistId: null, error: createdArtistError?.message ?? 'Artist record was not created.' };
        }

        existingArtistId = createdArtist.id;
        resolvedName = existingUser.full_name?.trim() || createdArtist.artist_name?.trim() || resolvedName;
      }

      const { error: updateError } = await this.adminSupabase
        .from('tjs_artists')
        .update({
          artist_name: resolvedName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingArtistId);

      if (updateError) {
        return { artistId: null, error: updateError.message };
      }

      const { error: insertExistingError } = await this.adminSupabase
        .from('tjs_artist_request_artists')
        .insert({
          request_id: requestId,
          invited_artist_id: existingArtistId,
          invited_email: normalizedEmail,
        });

      if (insertExistingError) {
        return { artistId: null, error: insertExistingError.message };
      }

      return { artistId: existingArtistId, error: null };
    }

    const inviteResult = await this.inviteArtist({
      email: normalizedEmail,
      full_name: fullName,
      assigned_by: assignedBy,
      role_name: 'Artist Invited',
    });

    if (inviteResult.error || !inviteResult.artist) {
      return { artistId: null, error: inviteResult.error ?? 'Failed to invite artist.' };
    }

    const { error } = await this.adminSupabase
      .from('tjs_artist_request_artists')
      .insert({
        request_id: requestId,
        invited_artist_id: inviteResult.artist.id,
        invited_email: normalizedEmail,
      });

    if (error) {
      return { artistId: null, error: error.message };
    }

    return { artistId: inviteResult.artist.id, error: null };
  }

  private summarizeArtistRequestDates(rows: any[]): string {
    if (!rows.length) {
      return 'No dates added';
    }

    const formatDate = (value: string | null | undefined) =>
      value
        ? new Intl.DateTimeFormat(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).format(new Date(`${value}T00:00:00`))
        : '';

    const parts = rows.map((row) => {
      const start = formatDate(row.start_date);
      const end = formatDate(row.end_date);
      if (row.request_type === 'period' && end) {
        return `${start} - ${end}`;
      }

      return `${start}`;
    });

    if (parts.length === 1) {
      return parts[0];
    }

    return `${parts[0]} +${parts.length - 1} more`;
  }

  async getAdminEventOverview(): Promise<AdminEventOverviewItem[]> {
    const [eventsResult, artistRequestsResult] = await Promise.all([
      this.adminSupabase
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
        .order('created_at', { ascending: false }),
      this.adminSupabase
        .from('tjs_artist_requests')
        .select(`
          id,
          event_domain:sys_event_domain(name),
          event_title,
          teaser,
          description,
          status,
          created_by,
          created_at,
          updated_at,
          start_date
        `)
        .order('created_at', { ascending: false }),
    ]);

    if (eventsResult.error && !this.isMissingSchemaError(eventsResult.error)) {
      console.error('getAdminEventOverview events error:', eventsResult.error.message);
      return [];
    }

    if (artistRequestsResult.error && !this.isMissingSchemaError(artistRequestsResult.error)) {
      console.error('getAdminEventOverview artist requests error:', artistRequestsResult.error.message);
    }

    const eventRows = this.isMissingSchemaError(eventsResult.error)
      ? []
      : ((eventsResult.data ?? []) as any[]);
    const existingEventIds = new Set(eventRows.map((event) => event.id as string));
    const artistRequestRows = ((artistRequestsResult.data ?? []) as any[])
      .filter((request) => !existingEventIds.has(request.id as string));

    const creatorIds = Array.from(
      new Set(
        [...eventRows, ...artistRequestRows]
          .map((row) => row.created_by as string | null)
          .filter((value): value is string => !!value)
      )
    );

    const eventIds = eventRows.map((event) => event.id as string);
    const artistRequestIds = artistRequestRows.map((request) => request.id as string);

    const [profilesResult, hostAssignmentsResult, eventArtistsResult, artistRequestDatesResult, artistRequestArtistsResult] = await Promise.all([
      creatorIds.length > 0
        ? this.adminSupabase
            .from('tjs_profiles')
            .select('id, email, full_name')
            .in('id', creatorIds)
        : Promise.resolve({ data: [], error: null }),
      eventIds.length > 0
        ? this.adminSupabase
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
            .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null }),
      eventIds.length > 0
        ? this.adminSupabase
            .from('tjs_event_artists')
            .select(`
              event_id,
              role,
              artist:tjs_artists (
                id,
                artist_name
              )
            `)
            .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null }),
      artistRequestIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_request_dates')
            .select('request_id, start_date')
            .in('request_id', artistRequestIds)
            .order('start_date', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      artistRequestIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_request_artists')
            .select(`
              request_id,
              artist_id,
              invited_artist_id,
              artist:tjs_artists!tjs_artist_request_artists_artist_id_fkey (
                id,
                artist_name
              ),
              invited_artist:tjs_artists!tjs_artist_request_artists_invited_artist_id_fkey (
                id,
                artist_name
              )
            `)
            .in('request_id', artistRequestIds)
        : Promise.resolve({ data: [], error: null }),
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

    if (artistRequestDatesResult.error && !this.isMissingSchemaError(artistRequestDatesResult.error)) {
      console.error('getAdminEventOverview artist request dates error:', artistRequestDatesResult.error.message);
    }

    if (artistRequestArtistsResult.error && !this.isMissingSchemaError(artistRequestArtistsResult.error)) {
      console.error('getAdminEventOverview artist request artists error:', artistRequestArtistsResult.error.message);
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

    const requestDatesById = new Map<string, string[]>();
    for (const entry of ((artistRequestDatesResult.data ?? []) as any[])) {
      const requestId = entry.request_id as string;
      const existing = requestDatesById.get(requestId) ?? [];
      if (entry.start_date) {
        existing.push(entry.start_date as string);
      }
      requestDatesById.set(requestId, existing);
    }

    const requestArtistsById = new Map<string, any[]>();
    for (const assignment of ((artistRequestArtistsResult.data ?? []) as any[])) {
      const requestId = assignment.request_id as string;
      const existing = requestArtistsById.get(requestId) ?? [];
      existing.push(assignment);
      requestArtistsById.set(requestId, existing);
    }

    const eventItems = eventRows.map((event) => {
      const profile = event.created_by ? profilesById.get(event.created_by) : null;
      const assignments = hostsByEventId.get(event.id) ?? [];
      const artistAssignments = artistsByEventId.get(event.id) ?? [];

      return {
        id: event.id,
        title: event.title,
        description: event.description ?? null,
        teaser: null,
        event_domain_name: null,
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
        host_ids: assignments
          .map((assignment) => assignment.host?.id as number | null | undefined)
          .filter((value: number | null | undefined): value is number => value !== null && value !== undefined),
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

    const artistRequestItems = artistRequestRows.map((request) => {
      const profile = request.created_by ? profilesById.get(request.created_by) : null;
      const artistAssignments = requestArtistsById.get(request.id) ?? [];
      const explicitDates = requestDatesById.get(request.id) ?? [];
      const fallbackDates = request.start_date ? [request.start_date as string] : [];
      const artistIds = Array.from(
        new Set(
          artistAssignments.flatMap((assignment) => [
            assignment.artist?.id as string | null | undefined,
            assignment.invited_artist?.id as string | null | undefined,
            assignment.artist_id as string | null | undefined,
            assignment.invited_artist_id as string | null | undefined,
          ]).filter((value): value is string => !!value)
        )
      );
      const artistNames = Array.from(
        new Set(
          artistAssignments.flatMap((assignment) => [
            assignment.artist?.artist_name as string | null | undefined,
            assignment.invited_artist?.artist_name as string | null | undefined,
          ]).filter((value): value is string => !!value)
        )
      );

      return {
        id: request.id as string,
        title: (request.event_title as string | null) ?? 'Untitled Request',
        description: (request.description as string | null) ?? (request.teaser as string | null) ?? null,
        teaser: (request.teaser as string | null) ?? null,
        event_domain_name: (request.event_domain?.name as string | null | undefined) ?? null,
        event_type: 'REQUEST' as const,
        status: this.normalizeArtistRequestStatus(request.status as string | null),
        origin_website: 'TJS',
        visibility_scope: ['TJS'],
        parent_event_id: null,
        created_by: (request.created_by as string | null) ?? null,
        created_at: request.created_at as string,
        updated_at: (request.updated_at as string | null) ?? (request.created_at as string),
        proposed_dates: explicitDates.length > 0 ? explicitDates : fallbackDates,
        department: null,
        city: null,
        creator_name: profile?.full_name || profile?.email || 'Utilisateur inconnu',
        creator_email: profile?.email || '',
        host_ids: [],
        host_names: [],
        host_statuses: [],
        selected_dates: [],
        artist_ids: artistIds,
        artist_names: artistNames,
        artist_roles: artistIds.map((_, index) => index === 0 ? 'PRIMARY' : 'INVITED'),
      };
    });

    return [...eventItems, ...artistRequestItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  // Location management

  async listLocationAmenities(): Promise<LocationLookupOption[]> {
    const { data, error } = await this.adminSupabase
      .from('sys_location_amenity')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('listLocationAmenities error:', error.message);
      return [];
    }

    return (data ?? []) as LocationLookupOption[];
  }

  async listLocationSpecs(): Promise<LocationLookupOption[]> {
    const { data, error } = await this.adminSupabase
      .from('sys_location_specs')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('listLocationSpecs error:', error.message);
      return [];
    }

    return (data ?? []) as LocationLookupOption[];
  }

  async listLocationTypes(): Promise<LocationLookupOption[]> {
    const { data, error } = await this.adminSupabase
      .from('sys_location_types')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('listLocationTypes error:', error.message);
      return [];
    }

    return (data ?? []) as LocationLookupOption[];
  }

  async getPublicLocations(createdBy?: string): Promise<TjsLocation[]> {
    let query = this.adminSupabase
      .from('tjs_locations')
      .select(`
        *,
        images:tjs_location_images(id, image_url, sort_order),
        amenity_links:tjs_location_amenities(amenity:sys_location_amenity(id, name)),
        spec_links:tjs_location_specs(spec:sys_location_specs(id, name)),
        type_links:tjs_location_types(location_type:sys_location_types(id, name))
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    const { data, error } = await query;

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getPublicLocations error:', error.message);
      }
      return [];
    }

    return ((data ?? []) as any[]).map((row) => this.mapLocationRow(row));
  }

  async getPublicLocationById(locationId: string, createdBy?: string): Promise<TjsLocation | null> {
    let query = this.adminSupabase
      .from('tjs_locations')
      .select(`
        *,
        images:tjs_location_images(id, image_url, sort_order),
        amenity_links:tjs_location_amenities(amenity:sys_location_amenity(id, name)),
        spec_links:tjs_location_specs(spec:sys_location_specs(id, name)),
        type_links:tjs_location_types(location_type:sys_location_types(id, name))
      `)
      .eq('id', locationId)
      .eq('is_public', true);

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getPublicLocationById error:', error.message);
      }
      return null;
    }

    return data ? this.mapLocationRow(data) : null;
  }

  async getPrivateLocations(createdBy?: string): Promise<TjsLocation[]> {
    let query = this.adminSupabase
      .from('tjs_locations')
      .select(`
        *,
        images:tjs_location_images(id, image_url, sort_order),
        amenity_links:tjs_location_amenities(amenity:sys_location_amenity(id, name)),
        spec_links:tjs_location_specs(spec:sys_location_specs(id, name)),
        type_links:tjs_location_types(location_type:sys_location_types(id, name))
      `)
      .eq('is_private', true)
      .order('created_at', { ascending: false });

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    const { data, error } = await query;

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getPrivateLocations error:', error.message);
      }
      return [];
    }

    return ((data ?? []) as any[]).map((row) => this.mapLocationRow(row));
  }

  async getPrivateLocationById(locationId: string, createdBy?: string): Promise<TjsLocation | null> {
    let query = this.adminSupabase
      .from('tjs_locations')
      .select(`
        *,
        images:tjs_location_images(id, image_url, sort_order),
        amenity_links:tjs_location_amenities(amenity:sys_location_amenity(id, name)),
        spec_links:tjs_location_specs(spec:sys_location_specs(id, name)),
        type_links:tjs_location_types(location_type:sys_location_types(id, name))
      `)
      .eq('id', locationId)
      .eq('is_private', true);

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getPrivateLocationById error:', error.message);
      }
      return null;
    }

    return data ? this.mapLocationRow(data) : null;
  }

  async createLocation(location: SaveTjsLocationInput): Promise<{ id: string | null; error: string | null }> {
    const { data, error } = await this.adminSupabase
      .from('tjs_locations')
      .insert(this.buildLocationPayload(location, false))
      .select('id')
      .single();

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return { id: null, error: 'Location tables are missing in the database. Run db/022_tjs_locations.sql and try again.' };
      }

      console.error('createLocation error:', error.message);
      return { id: null, error: error.message };
    }

    const relationError = await this.syncLocationRelations(data.id, location);
    if (relationError) {
      return { id: data.id, error: relationError };
    }

    return { id: data.id, error: null };
  }

  async updateLocation(locationId: string, location: SaveTjsLocationInput): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_locations')
      .update(this.buildLocationPayload(location, true))
      .eq('id', locationId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Location tables are missing in the database. Run db/022_tjs_locations.sql and try again.';
      }

      console.error('updateLocation error:', error.message);
      return error.message;
    }

    return this.syncLocationRelations(locationId, location);
  }

  async deleteLocation(locationId: string): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_locations')
      .delete()
      .eq('id', locationId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Location tables are missing in the database. Run db/022_tjs_locations.sql and try again.';
      }

      console.error('deleteLocation error:', error.message);
      return error.message;
    }

    return null;
  }

  async uploadLocationImage(profileId: string, file: File): Promise<{ url: string | null; error: string | null }> {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `locations/${profileId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await this.adminSupabase.storage
      .from('tjs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('uploadLocationImage error:', error.message);
      return { url: null, error: error.message };
    }

    const { data } = this.adminSupabase.storage.from('tjs').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
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

  private mapLocationRow(row: any): TjsLocation {
    const amenityLinks = Array.isArray(row.amenity_links) ? row.amenity_links : [];
    const specLinks = Array.isArray(row.spec_links) ? row.spec_links : [];
    const typeLinks = Array.isArray(row.type_links) ? row.type_links : [];
    const images = Array.isArray(row.images) ? row.images : [];

    return {
      id: row.id,
      name: row.name ?? '',
      address: row.address ?? null,
      lat: row.lat ?? null,
      long: row.long ?? null,
      description: row.description ?? null,
      is_public: !!row.is_public,
      is_private: !!row.is_private,
      public_description: row.public_description ?? null,
      restricted_description: row.restricted_description ?? null,
      capacity: row.capacity ?? null,
      city: row.city ?? null,
      country: row.country ?? null,
      zip: row.zip ?? null,
      phone: row.phone ?? null,
      email: row.email ?? null,
      website: row.website ?? null,
      is_active: !!row.is_active,
      access_info: row.access_info ?? null,
      created_by: row.created_by ?? null,
      updated_by: row.updated_by ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      images: images
        .map((image: any) => ({
          id: image.id,
          image_url: image.image_url,
          sort_order: image.sort_order ?? 0,
        }))
        .sort((a: TjsLocationImage, b: TjsLocationImage) => a.sort_order - b.sort_order),
      amenities: amenityLinks
        .map((link: any) => link.amenity)
        .filter((item: any): item is LocationLookupOption => !!item?.id && !!item?.name),
      specs: specLinks
        .map((link: any) => link.spec)
        .filter((item: any): item is LocationLookupOption => !!item?.id && !!item?.name),
      location_type: typeLinks[0]?.location_type?.id ? typeLinks[0].location_type as LocationLookupOption : null,
    };
  }

  private buildLocationPayload(location: SaveTjsLocationInput, isUpdate: boolean) {
    return {
      name: location.name.trim(),
      address: location.address?.trim() || null,
      lat: location.lat ?? null,
      long: location.long ?? null,
      description: location.description?.trim() || null,
      is_public: location.is_public,
      is_private: location.is_private,
      public_description: location.public_description?.trim() || null,
      restricted_description: location.restricted_description?.trim() || null,
      capacity: location.capacity?.trim() || null,
      city: location.city?.trim() || null,
      country: location.country?.trim() || null,
      zip: location.zip?.trim() || null,
      phone: location.phone?.trim() || null,
      email: location.email?.trim() || null,
      website: location.website?.trim() || null,
      is_active: location.is_active,
      access_info: location.access_info?.trim() || null,
      created_by: location.created_by,
      updated_by: isUpdate ? location.updated_by ?? location.created_by : location.updated_by ?? null,
      updated_at: new Date().toISOString(),
    };
  }

  private async syncLocationRelations(locationId: string, location: SaveTjsLocationInput): Promise<string | null> {
    const relationTables = ['tjs_location_images', 'tjs_location_amenities', 'tjs_location_specs', 'tjs_location_types'] as const;

    for (const table of relationTables) {
      const { error } = await this.adminSupabase
        .from(table)
        .delete()
        .eq('location_id', locationId);

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Location tables are missing in the database. Run db/022_tjs_locations.sql and try again.';
        }

        console.error(`syncLocationRelations delete ${table} error:`, error.message);
        return error.message;
      }
    }

    if (location.image_urls.length > 0) {
      const { error } = await this.adminSupabase
        .from('tjs_location_images')
        .insert(location.image_urls.slice(0, 5).map((imageUrl, index) => ({
          location_id: locationId,
          image_url: imageUrl,
          sort_order: index,
        })));

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Location tables are missing in the database. Run db/022_tjs_locations.sql and try again.';
        }

        console.error('syncLocationRelations insert images error:', error.message);
        return error.message;
      }
    }

    if (location.amenity_ids.length > 0) {
      const { error } = await this.adminSupabase
        .from('tjs_location_amenities')
        .insert(location.amenity_ids.map((amenityId) => ({
          location_id: locationId,
          amenity_id: amenityId,
        })));

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Location tables are missing in the database. Run db/022_tjs_locations.sql and try again.';
        }

        console.error('syncLocationRelations insert amenities error:', error.message);
        return error.message;
      }
    }

    if (location.spec_ids.length > 0) {
      const { error } = await this.adminSupabase
        .from('tjs_location_specs')
        .insert(location.spec_ids.map((specId) => ({
          location_id: locationId,
          spec_id: specId,
        })));

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Location tables are missing in the database. Run db/022_tjs_locations.sql and try again.';
        }

        console.error('syncLocationRelations insert specs error:', error.message);
        return error.message;
      }
    }

    if (location.location_type_id) {
      const { error } = await this.adminSupabase
        .from('tjs_location_types')
        .insert({
          location_id: locationId,
          location_type_id: location.location_type_id,
        });

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Location tables are missing in the database. Run db/022_tjs_locations.sql and try again.';
        }

        console.error('syncLocationRelations insert type error:', error.message);
        return error.message;
      }
    }

    return null;
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

  async getArtistById(artistId: string): Promise<TjsArtist | null> {
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
      .eq('id', artistId)
      .maybeSingle();

    if (error) {
      console.error('getArtistById error:', error);
      throw new Error(`Failed to fetch artist: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const artists = await this.mapArtistsWithAssignments([data as any]);
    return artists[0] ?? null;
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

  async acceptEventRequestForHost(eventId: string, hostId: number, selectedBy?: string): Promise<string | null> {
    const timestamp = new Date().toISOString();
    const ensureEventError = await this.ensureEventExistsForHostRequest(eventId, selectedBy, timestamp);
    if (ensureEventError) {
      return ensureEventError;
    }

    const { error: hostError } = await this.adminSupabase
      .from('tjs_event_hosts')
      .upsert({
        event_id: eventId,
        host_id: hostId,
        host_status: 'PENDING',
        selected_at: timestamp,
      }, { onConflict: 'event_id,host_id' });

    if (hostError) {
      console.error('acceptEventRequestForHost host assignment error:', hostError.message);
      return hostError.message;
    }

    const { error: eventError } = await this.adminSupabase
      .from('tjs_events')
      .update({
        status: 'SELECTED',
        updated_at: timestamp,
      })
      .eq('id', eventId);

    if (eventError) {
      console.error('acceptEventRequestForHost event update error:', eventError.message);
      return eventError.message;
    }

    return null;
  }

  private normalizeArtistRequestStatus(status: string | null): string {
    switch ((status ?? '').toLowerCase()) {
      case 'approved':
        return 'APPROVED';
      case 'rejected':
        return 'CANCELLED';
      case 'accepted':
      case 'selected':
        return 'SELECTED';
      case 'available':
        return 'AVAILABLE';
      case 'pending':
      default:
        return 'PENDING';
    }
  }

  private async ensureEventExistsForHostRequest(eventId: string, selectedBy: string | undefined, timestamp: string): Promise<string | null> {
    const { data: existingEvent, error: existingEventError } = await this.adminSupabase
      .from('tjs_events')
      .select('id')
      .eq('id', eventId)
      .maybeSingle();

    if (existingEventError) {
      console.error('ensureEventExistsForHostRequest existing event lookup error:', existingEventError.message);
      return existingEventError.message;
    }

    if (existingEvent?.id) {
      return null;
    }

    const [requestResult, datesResult, artistsResult] = await Promise.all([
      this.adminSupabase
        .from('tjs_artist_requests')
        .select('id, event_title, description, teaser, created_by, created_at, updated_at, start_date')
        .eq('id', eventId)
        .maybeSingle(),
      this.adminSupabase
        .from('tjs_artist_request_dates')
        .select('start_date')
        .eq('request_id', eventId)
        .order('start_date', { ascending: true }),
      this.adminSupabase
        .from('tjs_artist_request_artists')
        .select('artist_id, invited_artist_id')
        .eq('request_id', eventId),
    ]);

    if (requestResult.error) {
      console.error('ensureEventExistsForHostRequest request lookup error:', requestResult.error.message);
      return requestResult.error.message;
    }

    if (!requestResult.data) {
      return 'Request not found.';
    }

    if (datesResult.error && !this.isMissingSchemaError(datesResult.error)) {
      console.error('ensureEventExistsForHostRequest dates lookup error:', datesResult.error.message);
      return datesResult.error.message;
    }

    if (artistsResult.error && !this.isMissingSchemaError(artistsResult.error)) {
      console.error('ensureEventExistsForHostRequest artists lookup error:', artistsResult.error.message);
      return artistsResult.error.message;
    }

    const proposedDates = ((datesResult.data ?? []) as Array<{ start_date: string | null }>)
      .map((entry) => entry.start_date)
      .filter((value): value is string => !!value);

    if (proposedDates.length === 0 && requestResult.data.start_date) {
      proposedDates.push(requestResult.data.start_date);
    }

    const { error: insertEventError } = await this.adminSupabase
      .from('tjs_events')
      .insert({
        id: requestResult.data.id,
        title: requestResult.data.event_title ?? 'Untitled Request',
        description: requestResult.data.description ?? requestResult.data.teaser ?? null,
        event_type: 'REQUEST',
        status: 'SELECTED',
        origin_website: 'TJS',
        visibility_scope: ['TJS'],
        parent_event_id: null,
        created_by: requestResult.data.created_by ?? selectedBy ?? null,
        proposed_dates: proposedDates,
        department: null,
        city: null,
        source: 'TJS',
        created_at: requestResult.data.created_at ?? timestamp,
        updated_at: timestamp,
      });

    if (insertEventError) {
      console.error('ensureEventExistsForHostRequest event insert error:', insertEventError.message);
      return insertEventError.message;
    }

    const uniqueArtistIds = Array.from(
      new Set(
        ((artistsResult.data ?? []) as Array<{ artist_id: string | null; invited_artist_id: string | null }>)
          .flatMap((artist) => [artist.artist_id, artist.invited_artist_id])
          .filter((value): value is string => !!value)
      )
    );

    if (uniqueArtistIds.length === 0) {
      return null;
    }

    const { error: insertArtistsError } = await this.adminSupabase
      .from('tjs_event_artists')
      .upsert(
        uniqueArtistIds.map((artistId, index) => ({
          event_id: eventId,
          artist_id: artistId,
          role: index === 0 ? 'PRIMARY' : 'INVITED',
        })),
        { onConflict: 'event_id,artist_id,role' }
      );

    if (insertArtistsError) {
      console.error('ensureEventExistsForHostRequest event artists insert error:', insertArtistsError.message);
      return insertArtistsError.message;
    }

    return null;
  }

  async getPagArtistProfile(pagArtistId: string): Promise<PagArtistProfile | null> {
    const normalizedId = Number(pagArtistId);
    if (!Number.isFinite(normalizedId)) {
      return null;
    }

    const [
      artistResult,
      performancesResult,
      educationsResult,
      awardsResult,
      instrumentsResult,
      mediaResult,
      availabilityResult,
      requirementsResult,
    ] = await Promise.all([
      this.adminSupabase
        .from('artists')
        .select(`
          id,
          id_profile,
          fname,
          lname,
          title,
          teaser,
          short_bio,
          long_bio,
          dob,
          pob,
          email,
          phone,
          website,
          address,
          city,
          country,
          gender,
          photo,
          credit_photo,
          cover,
          credit_cover,
          is_featured,
          is_active,
          created_on
        `)
        .eq('id', normalizedId)
        .maybeSingle(),
      this.adminSupabase
        .from('vw_artist_performance')
        .select('id_performance, performance_type')
        .eq('id_artist', normalizedId),
      this.adminSupabase
        .from('artist_education')
        .select('id, school, course, year')
        .eq('id_artist', normalizedId)
        .order('year', { ascending: false }),
      this.adminSupabase
        .from('artist_awards')
        .select('id, award, description, year')
        .eq('id_artist', normalizedId)
        .order('year', { ascending: false }),
      this.adminSupabase
        .from('vw_artist_instruments')
        .select('id_instrument, instrument')
        .eq('id_artist', normalizedId),
      this.adminSupabase
        .from('artist_media')
        .select('id, title, image, description, url, id_media')
        .eq('id_artist', normalizedId)
        .order('created_on', { ascending: true }),
      this.adminSupabase
        .from('artist_availability')
        .select('id, start_date, end_date, notes')
        .eq('id_artist', normalizedId)
        .order('start_date', { ascending: true }),
      this.adminSupabase
        .from('artist_requirement')
        .select('id_artist, rib, guso_nb, security_nb, arlergies, food_restriction, requirement')
        .eq('id_artist', normalizedId)
        .maybeSingle(),
    ]);

    if (artistResult.error) {
      console.error('getPagArtistProfile artist error:', artistResult.error.message);
      return null;
    }

    if (!artistResult.data) {
      return null;
    }

    if (performancesResult.error) {
      console.error('getPagArtistProfile performances error:', performancesResult.error.message);
    }

    if (educationsResult.error) {
      console.error('getPagArtistProfile educations error:', educationsResult.error.message);
    }

    if (awardsResult.error) {
      console.error('getPagArtistProfile awards error:', awardsResult.error.message);
    }

    if (instrumentsResult.error) {
      console.error('getPagArtistProfile instruments error:', instrumentsResult.error.message);
    }

    if (mediaResult.error) {
      console.error('getPagArtistProfile media error:', mediaResult.error.message);
    }

    if (availabilityResult.error) {
      console.error('getPagArtistProfile availability error:', availabilityResult.error.message);
    }

    if (requirementsResult.error) {
      console.error('getPagArtistProfile requirements error:', requirementsResult.error.message);
    }

    const artist = artistResult.data as any;

    return {
      id: artist.id,
      id_profile: artist.id_profile ?? null,
      fname: artist.fname ?? null,
      lname: artist.lname ?? null,
      title: artist.title ?? null,
      teaser: artist.teaser ?? null,
      short_bio: artist.short_bio ?? null,
      long_bio: artist.long_bio ?? null,
      dob: artist.dob ?? null,
      pob: artist.pob ?? null,
      email: artist.email ?? null,
      phone: artist.phone ?? null,
      website: artist.website ?? null,
      address: artist.address ?? null,
      city: artist.city ?? null,
      country: artist.country ?? null,
      gender: artist.gender ?? null,
      photo: artist.photo ?? null,
      credit_photo: artist.credit_photo ?? null,
      cover: artist.cover ?? null,
      credit_cover: artist.credit_cover ?? null,
      is_featured: artist.is_featured ?? null,
      is_active: artist.is_active ?? null,
      created_on: artist.created_on ?? null,
      performances: ((performancesResult.data ?? []) as any[])
        .filter((row) => typeof row.id_performance === 'number' && typeof row.performance_type === 'string')
        .map((row) => ({
          id: row.id_performance,
          name: row.performance_type,
        })),
      educations: ((educationsResult.data ?? []) as any[]).map((row) => ({
        id: String(row.id),
        school_name: row.school ?? '',
        course_name: row.course ?? '',
        year: row.year ? Number(row.year) || null : null,
      })),
      awards: ((awardsResult.data ?? []) as any[]).map((row) => ({
        id: String(row.id),
        award: row.award ?? '',
        description: row.description ?? '',
        year: row.year ? Number(row.year) || null : null,
      })),
      instruments: ((instrumentsResult.data ?? []) as any[])
        .filter((row) => typeof row.id_instrument === 'number' && typeof row.instrument === 'string')
        .map((row) => ({
          id: row.id_instrument,
          name: row.instrument,
        })),
      media: ((mediaResult.data ?? []) as any[]).map((row) => ({
        id: String(row.id),
        media_type: Number(row.id_media) === 2 ? 'cd' : 'video',
        image_url: row.image ?? null,
        name: row.title ?? '',
        description: row.description ?? '',
        urls: row.url ? [row.url] : [],
      })),
      availability: ((availabilityResult.data ?? []) as any[]).map((row) => ({
        id: String(row.id),
        start_date: row.start_date ?? '',
        end_date: row.end_date ?? '',
        note: row.notes ?? '',
      })),
      requirements: requirementsResult.data
        ? {
            profile_id: String(normalizedId),
            rib_number: requirementsResult.data.rib ?? '',
            guso_number: requirementsResult.data.guso_nb ?? '',
            security_number: requirementsResult.data.security_nb ?? '',
            allergies: requirementsResult.data.arlergies ?? '',
            food_restriction: requirementsResult.data.food_restriction ?? '',
            additional_requirements: requirementsResult.data.requirement ?? '',
          }
        : null,
    };
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
