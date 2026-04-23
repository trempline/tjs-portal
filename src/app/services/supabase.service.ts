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
  tier: string | null;
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
  edition?: string | null;
  event_type_name?: string | null;
  event_type: 'REQUEST' | 'EVENT_INSTANCE';
  status: string;
  origin_website: string;
  visibility_scope: string[];
  parent_event_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
  is_member_only?: boolean;
  proposed_dates: string[] | null;
  department: string | null;
  city: string | null;
  creator_name: string;
  creator_email: string;
  accepted_host_profile_ids: string[];
  host_ids: number[];
  host_names: string[];
  host_statuses: string[];
  selected_dates: string[];
  artist_ids: string[];
  artist_names: string[];
  artist_roles: string[];
}

export interface HostWorkspaceEventItem extends AdminEventOverviewItem {
  event_domain_id: number | null;
  edition: string | null;
  event_type_name: string | null;
  instruments: string[];
  primary_upcoming_date: string | null;
  is_featured: boolean;
}

export interface EventLocationSummary {
  event_id: string;
  labels: string[];
  display_label: string | null;
}

export interface HostVenueScheduleConflict {
  event_id: string;
  event_title: string;
  event_status: string;
  location_id: string;
  location_label: string;
  conflicting_schedule_lines: string[];
}

export interface HostWorkspaceEventDetail extends HostWorkspaceEventItem {
  host_notes: string | null;
  all_dates: string[];
  show_time: string | null;
  call_to_action_url: string | null;
  location_id?: string | null;
  location_name: string | null;
  schedule_entries?: Array<{ mode: 'day_show' | 'period'; start_date: string; end_date: string }>;
  request_detail: ArtistRequestDetail | null;
}

export interface HostPrivateLocationBookingItem {
  event_id: string;
  title: string;
  status: string;
  artist_names: string[];
  instruments: string[];
  primary_upcoming_date: string | null;
  show_time: string | null;
  location_id: string;
  location_name: string | null;
  schedule_entries: Array<{ mode: 'day_show' | 'period'; start_date: string; end_date: string }>;
  booked_dates: string[];
}

export interface PublicWebsiteEventItem {
  id: string;
  title: string;
  teaser: string;
  image_url: string | null;
  event_domain_name: string | null;
  instruments: string[];
  event_type_name: string | null;
  artist_names: string[];
  primary_date: string | null;
  last_date: string | null;
  schedule_lines: string[];
  is_member_only: boolean;
}

export interface PublicEventDetail {
  id: string;
  title: string;
  teaser: string;
  description: string;
  image_url: string | null;
  event_domain_name: string | null;
  edition: string | null;
  event_type_name: string | null;
  call_to_action_url: string | null;
  instruments: string[];
  artist_names: string[];
  schedule_lines: string[];
  is_member_only: boolean;
  media: Array<{
    id?: string;
    media_type: string;
    image_url: string | null;
    name: string;
    description: string;
    url: string;
  }>;
  artists: Array<{
    id?: string;
    display_name: string;
    tagline: string | null;
    image_url: string | null;
    instruments: string[];
  }>;
}

export interface UpdateHostWorkspaceEventDetailPayload {
  title: string;
  eventDomainId: number | null;
  editionId: number | null;
  eventTypeId: number | null;
  teaser: string;
  description: string;
  callToActionUrl: string;
  isMemberOnly: boolean;
  hostNotes: string;
}

export interface UpdateHostWorkspaceEventSchedulePayload {
  entries: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string }>;
  showTime: string;
  locationId: string | null;
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

export interface MemberTier {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
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

export interface TjsPrivateLocation extends TjsLocation {
  id_host: number | null;
}

export interface SaveTjsPrivateLocationInput {
  id_host: number | null;
  name: string;
  address?: string | null;
  lat?: number | null;
  long?: number | null;
  description?: string | null;
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

export interface EventEditionOption {
  id: number;
  name: string;
  year?: string | null;
  label?: string;
}

export interface EventTypeOption {
  id: number;
  name: string;
}

export interface CreateHostEventFromRequestPayload {
  hostId: number;
  title: string;
  eventDomainId: number | null;
  teaser: string;
  longTeaser: string;
  description: string;
  editionId: number | null;
  eventTypeId: number | null;
  entries: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string }>;
  showTime: string;
  callToActionUrl: string;
  locationId: string | null;
  isActive: boolean;
  isOpenToMembers: boolean;
  notes: string;
}

export interface CreateStandaloneHostEventPayload {
  hostId: number;
  title: string;
  eventDomainId: number | null;
  teaser: string;
  description: string;
  imageUrl: string | null;
  editionId: number | null;
  eventTypeId: number | null;
  entries: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string; showTime: string; locationId: string | null; locationLabel: string }>;
  callToActionUrl: string;
  isPublished: boolean;
  isMemberOnly: boolean;
  artistIds: string[];
  additionalInstruments: string[];
  mediaEntries: ArtistRequestMediaEntry[];
  notes: string;
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
  status: 'new_request' | 'accepted_by_host' | 'host_proposed' | 'artist_proposed' | 'artist_accepted' | 'approved' | 'published' | 'rejected';
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
  profile_id?: string | null;
  invited_email: string;
  display_name: string;
  invited_full_name?: string;
  is_primary?: boolean;
  tagline?: string | null;
  image_url?: string | null;
  instruments?: string[];
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
  event_domain_name?: string | null;
  event_title: string;
  teaser: string;
  long_teaser: string;
  description: string;
  image_url: string | null;
  status: 'new_request' | 'accepted_by_host' | 'host_proposed' | 'artist_proposed' | 'artist_accepted' | 'approved' | 'published' | 'rejected';
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

export interface CreatePublicMemberInput {
  email: string;
  full_name: string;
  phone?: string | null;
  assigned_by: string;
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

  async listEventEditionOptions(): Promise<EventEditionOption[]> {
    const { data, error } = await this.adminSupabase
      .from('sys_event_edition')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('listEventEditionOptions error:', error.message);
      }
      return [];
    }

    return (data ?? []) as EventEditionOption[];
  }

  async listConcreteEventEditionOptions(): Promise<EventEditionOption[]> {
    const { data, error } = await this.adminSupabase
      .from('event_edition')
      .select('id, name, year')
      .order('year', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('listConcreteEventEditionOptions error:', error.message);
      }

      const fallback = await this.listEventEditionOptions();
      return fallback.map((item) => ({
        ...item,
        label: item.name,
      }));
    }

    return ((data ?? []) as Array<{ id: number; name: string | null; year: string | null }>).map((item) => {
      const name = item.name?.trim() || `Edition #${item.id}`;
      const year = item.year?.trim() || null;
      return {
        id: item.id,
        name,
        year,
        label: year ? `${name} ${year}` : name,
      };
    });
  }

  async listEventTypeOptions(): Promise<EventTypeOption[]> {
    const { data, error } = await this.adminSupabase
      .from('sys_event_type')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('listEventTypeOptions error:', error.message);
      }
      return [];
    }

    return (data ?? []) as EventTypeOption[];
  }

  async createEventDomain(name: string): Promise<{ item: { id: number; name: string } | null; error: string | null }> {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { item: null, error: 'Domain name is required.' };
    }

    const { data, error } = await this.adminSupabase
      .from('sys_event_domain')
      .insert({ name: normalizedName })
      .select('id, name')
      .single();

    if (error) {
      console.error('createEventDomain error:', error.message);
      return { item: null, error: error.message };
    }

    return { item: data as { id: number; name: string }, error: null };
  }

  async updateEventDomain(id: number, name: string): Promise<string | null> {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return 'Domain name is required.';
    }

    const { error } = await this.adminSupabase
      .from('sys_event_domain')
      .update({ name: normalizedName })
      .eq('id', id);

    if (error) {
      console.error('updateEventDomain error:', error.message);
      return error.message;
    }

    return null;
  }

  async deleteEventDomain(id: number): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('sys_event_domain')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('deleteEventDomain error:', error.message);
      return error.message;
    }

    return null;
  }

  async createEventType(name: string): Promise<{ item: EventTypeOption | null; error: string | null }> {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { item: null, error: 'Event type name is required.' };
    }

    const { data, error } = await this.adminSupabase
      .from('sys_event_type')
      .insert({ name: normalizedName })
      .select('id, name')
      .single();

    if (error) {
      console.error('createEventType error:', error.message);
      return { item: null, error: error.message };
    }

    return { item: data as EventTypeOption, error: null };
  }

  async updateEventType(id: number, name: string): Promise<string | null> {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return 'Event type name is required.';
    }

    const { error } = await this.adminSupabase
      .from('sys_event_type')
      .update({ name: normalizedName })
      .eq('id', id);

    if (error) {
      console.error('updateEventType error:', error.message);
      return error.message;
    }

    return null;
  }

  async deleteEventType(id: number): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('sys_event_type')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('deleteEventType error:', error.message);
      return error.message;
    }

    return null;
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
    const workflowStatusByRequestId = new Map<string, ArtistRequestListItem['status']>();
    if (requestIds.length > 0) {
      const { data: commentData, error: commentError } = await this.adminSupabase
        .from('tjs_artist_request_comments')
        .select('request_id, author_profile_id, created_at, body')
        .in('request_id', requestIds)
        .order('created_at', { ascending: true });

      if (commentError) {
        if (this.isMissingSchemaError(commentError)) {
          throw new Error('Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.');
        }
        console.error('getArtistWorkspaceRequests comments error:', commentError.message);
      } else {
        for (const row of (commentData ?? []) as any[]) {
          if (typeof row.request_id !== 'string' || typeof row.body !== 'string') {
            continue;
          }

          if (row.body.startsWith('[HOST_PROPOSED]')) {
            workflowStatusByRequestId.set(row.request_id, 'host_proposed');
          } else if (row.body.startsWith('[HOST_ACCEPTED]')) {
            workflowStatusByRequestId.set(row.request_id, 'accepted_by_host');
          } else if (row.body.startsWith('[HOST_RELEASED]')) {
            workflowStatusByRequestId.set(row.request_id, 'new_request');
          } else if (row.body.startsWith('[ARTIST_PROPOSED]')) {
            workflowStatusByRequestId.set(row.request_id, 'artist_proposed');
          } else if (row.body.startsWith('[ARTIST_APPROVED]')) {
            workflowStatusByRequestId.set(row.request_id, 'artist_accepted');
          } else if (row.body.startsWith('[EVENT_CREATED]')) {
            workflowStatusByRequestId.set(row.request_id, 'published');
          }
        }

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

    return requestRows.map((row) => {
      const baseStatus = this.mapBaseRequestStatus(row.status ?? 'pending');
      const workflowStatus = workflowStatusByRequestId.get(row.id);

      return {
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
        status: baseStatus === 'accepted_by_host' && workflowStatus === 'host_proposed'
          ? 'accepted_by_host'
          : (workflowStatus ?? baseStatus),
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
      };
    });
  }

  async getArtistWorkspaceRequestDetail(requestId: string): Promise<ArtistRequestDetail | null> {
    const [requestResult, datesResult, mediaResult, artistsResult, commentsResult] = await Promise.all([
      this.adminSupabase
        .from('tjs_artist_requests')
        .select(`
          *,
          event_domain:sys_event_domain(name)
        `)
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
    const artistProfilesById = new Map<string, any>();
    const instrumentsByProfileId = new Map<string, string[]>();
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
          const [linkedProfilesResult, linkedArtistProfilesResult, linkedArtistInstrumentsResult] = await Promise.all([
            this.adminSupabase
              .from('tjs_profiles')
              .select('id, full_name, email, avatar_url')
              .in('id', linkedProfileIds),
            this.adminSupabase
              .from('tjs_artist_profiles')
              .select('profile_id, tagline')
              .in('profile_id', linkedProfileIds),
            this.adminSupabase
              .from('tjs_artist_instruments')
              .select('profile_id, instrument:sys_instruments(name)')
              .in('profile_id', linkedProfileIds),
          ]);

          if (linkedProfilesResult.error) {
            console.error('getArtistWorkspaceRequestDetail linked profiles error:', linkedProfilesResult.error.message);
          } else {
            for (const profile of linkedProfilesResult.data ?? []) {
              profilesById.set(profile.id, profile);
            }
          }

          if (linkedArtistProfilesResult.error && !this.isMissingSchemaError(linkedArtistProfilesResult.error)) {
            console.error('getArtistWorkspaceRequestDetail linked artist profiles error:', linkedArtistProfilesResult.error.message);
          } else {
            for (const profile of linkedArtistProfilesResult.data ?? []) {
              artistProfilesById.set(profile.profile_id, profile);
            }
          }

          if (linkedArtistInstrumentsResult.error && !this.isMissingSchemaError(linkedArtistInstrumentsResult.error)) {
            console.error('getArtistWorkspaceRequestDetail linked artist instruments error:', linkedArtistInstrumentsResult.error.message);
          } else {
            for (const row of linkedArtistInstrumentsResult.data ?? []) {
              const profileId = row.profile_id as string | null;
              const instrumentName = Array.isArray((row as any).instrument)
                ? (row as any).instrument[0]?.name as string | null | undefined
                : (row as any).instrument?.name as string | null | undefined;
              if (!profileId || !instrumentName) {
                continue;
              }

              const existing = instrumentsByProfileId.get(profileId) ?? [];
              if (!existing.includes(instrumentName)) {
                existing.push(instrumentName);
              }
              instrumentsByProfileId.set(profileId, existing);
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

    const rawComments = (commentsResult.data ?? []) as any[];
    let derivedStatus: ArtistRequestDetail['status'] = this.mapBaseRequestStatus(requestResult.data.status ?? 'pending');
    for (const row of rawComments) {
      if (typeof row.body !== 'string') {
        continue;
      }

      if (row.body.startsWith('[HOST_PROPOSED]')) {
        if (derivedStatus !== 'accepted_by_host') {
          derivedStatus = 'host_proposed';
        }
      } else if (row.body.startsWith('[HOST_ACCEPTED]')) {
        derivedStatus = 'accepted_by_host';
      } else if (row.body.startsWith('[HOST_RELEASED]')) {
        derivedStatus = 'new_request';
      } else if (row.body.startsWith('[ARTIST_PROPOSED]')) {
        derivedStatus = 'artist_proposed';
      } else if (row.body.startsWith('[ARTIST_APPROVED]')) {
        derivedStatus = 'artist_accepted';
      } else if (row.body.startsWith('[EVENT_CREATED]')) {
        derivedStatus = 'published';
      }
    }

    return {
      id: requestResult.data.id,
      event_domain_id: requestResult.data.event_domain_id ?? null,
      event_domain_name: requestResult.data.event_domain?.name ?? null,
      event_title: requestResult.data.event_title ?? '',
      teaser: requestResult.data.teaser ?? '',
      long_teaser: requestResult.data.long_teaser ?? '',
      description: requestResult.data.description ?? '',
      image_url: requestResult.data.image_url ?? null,
      status: derivedStatus,
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
        const selectedProfile = selectedArtist?.profile_id ? profilesById.get(selectedArtist.profile_id) : null;
        const invitedProfile = invitedArtist?.profile_id ? profilesById.get(invitedArtist.profile_id) : null;

        const artistProfileId = selectedArtist?.profile_id ?? invitedArtist?.profile_id ?? '';

        return {
          id: row.id,
          artist_id: row.artist_id ?? null,
          invited_artist_id: row.invited_artist_id ?? null,
          profile_id: selectedArtist?.profile_id ?? invitedArtist?.profile_id ?? null,
          invited_email: row.invited_email ?? invitedProfile?.email ?? '',
          display_name: selectedArtist?.artist_name || invitedProfile?.full_name || invitedArtist?.artist_name || row.invited_email || '',
          invited_full_name: invitedProfile?.full_name || invitedArtist?.artist_name || '',
          tagline: artistProfilesById.get(artistProfileId)?.tagline ?? null,
          image_url: selectedProfile?.avatar_url ?? invitedProfile?.avatar_url ?? null,
          instruments: instrumentsByProfileId.get(artistProfileId) ?? [],
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
    const basePayload = {
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
      status: this.mapArtistWorkflowStatusToDb(request.status),
      updated_at: new Date().toISOString(),
    };

    const requestResult = request.id
      ? await this.adminSupabase
          .from('tjs_artist_requests')
          .update(basePayload)
          .eq('id', request.id)
          .select('id')
          .single()
      : await this.adminSupabase
          .from('tjs_artist_requests')
          .insert({
            created_by: profileId,
            ...basePayload,
          })
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

  async listTjsArtistsForRequestSelection(): Promise<Array<{ id: string; artist_name: string; profile_id: string; instruments: string[] }>> {
    const { data, error } = await this.adminSupabase
      .from('tjs_artists')
      .select('id, artist_name, profile_id')
      .eq('is_tjs_artist', true)
      .order('artist_name', { ascending: true });

    if (error) {
      console.error('listTjsArtistsForRequestSelection error:', error.message);
      return [];
    }

    const artists = (data ?? []) as Array<{ id: string; artist_name: string; profile_id: string }>;
    const profileIds = artists
      .map((artist) => artist.profile_id)
      .filter((profileId): profileId is string => !!profileId);

    if (profileIds.length === 0) {
      return artists.map((artist) => ({ ...artist, instruments: [] }));
    }

    const { data: instrumentRows, error: instrumentsError } = await this.adminSupabase
      .from('tjs_artist_instruments')
      .select('profile_id, instrument:sys_instruments(name)')
      .in('profile_id', profileIds);

    if (instrumentsError && !this.isMissingSchemaError(instrumentsError)) {
      console.error('listTjsArtistsForRequestSelection instruments error:', instrumentsError.message);
    }

    const instrumentsByProfileId = new Map<string, string[]>();
    for (const row of ((instrumentRows ?? []) as any[])) {
      const profileId = row.profile_id as string | null | undefined;
      const instrumentName = Array.isArray(row.instrument)
        ? row.instrument[0]?.name as string | null | undefined
        : row.instrument?.name as string | null | undefined;

      if (!profileId || !instrumentName) {
        continue;
      }

      const existing = instrumentsByProfileId.get(profileId) ?? [];
      if (!existing.includes(instrumentName)) {
        existing.push(instrumentName);
      }
      instrumentsByProfileId.set(profileId, existing);
    }

    return artists.map((artist) => ({
      ...artist,
      instruments: instrumentsByProfileId.get(artist.profile_id) ?? [],
    }));
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
          is_featured,
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
    const parentRequestIds = Array.from(
      new Set(
        eventRows
          .map((event) => event.parent_event_id as string | null)
          .filter((value): value is string => !!value)
      )
    );
    const artistRequestIds = artistRequestRows.map((request) => request.id as string);

    const [profilesResult, requestDomainsResult, hostAssignmentsResult, eventArtistsResult, artistRequestDatesResult, artistRequestArtistsResult, artistRequestCommentsResult, hostsResult] = await Promise.all([
      creatorIds.length > 0
        ? this.adminSupabase
            .from('tjs_profiles')
            .select('id, email, full_name')
            .in('id', creatorIds)
        : Promise.resolve({ data: [], error: null }),
      parentRequestIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_requests')
            .select('id, teaser, event_domain:sys_event_domain(name)')
            .in('id', parentRequestIds)
        : Promise.resolve({ data: [], error: null }),
      eventIds.length > 0
        ? this.adminSupabase
            .from('tjs_event_hosts')
            .select(`
              event_id,
              host_status,
              notes,
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
      artistRequestIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_request_comments')
            .select('request_id, author_profile_id, body')
            .in('request_id', artistRequestIds)
        : Promise.resolve({ data: [], error: null }),
      artistRequestIds.length > 0
        ? this.adminSupabase
            .from('tjs_hosts')
            .select('id, name, public_name, city')
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesResult.error) {
      console.error('getAdminEventOverview profiles error:', profilesResult.error.message);
    }

    if (requestDomainsResult.error && !this.isMissingSchemaError(requestDomainsResult.error)) {
      console.error('getAdminEventOverview request domains error:', requestDomainsResult.error.message);
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

    if (artistRequestCommentsResult.error && !this.isMissingSchemaError(artistRequestCommentsResult.error)) {
      console.error('getAdminEventOverview artist request comments error:', artistRequestCommentsResult.error.message);
    }

    if (hostsResult.error && !this.isMissingSchemaError(hostsResult.error)) {
      console.error('getAdminEventOverview hosts error:', hostsResult.error.message);
    }

    const profilesById = new Map<string, Partial<TjsProfile>>();
    for (const profile of ((profilesResult.data ?? []) as Partial<TjsProfile>[])) {
      if (profile.id) {
        profilesById.set(profile.id, profile);
      }
    }

    const requestById = new Map<string, { teaser: string | null; event_domain_name: string | null }>();
    for (const row of ((requestDomainsResult.data ?? []) as any[])) {
      requestById.set(row.id as string, {
        teaser: (row.teaser as string | null | undefined) ?? null,
        event_domain_name: (row.event_domain?.name as string | null | undefined) ?? null,
      });
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

    const hostNamesById = new Map<number, string>();
    for (const host of ((hostsResult.data ?? []) as any[])) {
      const hostId = host.id as number | null | undefined;
      const hostLabel = (host.public_name as string | null | undefined)
        || (host.name as string | null | undefined)
        || (host.city as string | null | undefined)
        || null;

      if (hostId && hostLabel) {
        hostNamesById.set(hostId, hostLabel);
      }
    }

    const acceptedHostProfileIdsByRequestId = new Map<string, string[]>();
    const assignedHostIdsByRequestId = new Map<string, number[]>();
    const workflowStatusByRequestId = new Map<string, string>();
    for (const comment of ((artistRequestCommentsResult.data ?? []) as any[])) {
      const requestId = comment.request_id as string;
      const authorProfileId = comment.author_profile_id as string | null;
      const body = comment.body as string | null;

      if (!body) {
        continue;
      }

      const assignedHostId = this.extractTaggedNumberValue(body, 'Assigned Host ID:');
      if (assignedHostId !== null) {
        const existingAssignedHostIds = assignedHostIdsByRequestId.get(requestId) ?? [];
        if (!existingAssignedHostIds.includes(assignedHostId)) {
          existingAssignedHostIds.push(assignedHostId);
        }
        assignedHostIdsByRequestId.set(requestId, existingAssignedHostIds);
      }

      if (body.startsWith('[HOST_PROPOSED]')) {
        if (this.mapBaseRequestStatus((artistRequestRows.find((request) => (request.id as string) === requestId)?.status as string | null) ?? 'pending') !== 'accepted_by_host') {
          workflowStatusByRequestId.set(requestId, 'host_proposed');
        }
        if (authorProfileId) {
          const existing = acceptedHostProfileIdsByRequestId.get(requestId) ?? [];
          if (!existing.includes(authorProfileId)) {
            existing.push(authorProfileId);
          }
          acceptedHostProfileIdsByRequestId.set(requestId, existing);
        }
      } else if (body.startsWith('[HOST_ACCEPTED]')) {
        workflowStatusByRequestId.set(requestId, 'accepted_by_host');
        if (authorProfileId) {
          const existing = acceptedHostProfileIdsByRequestId.get(requestId) ?? [];
          if (!existing.includes(authorProfileId)) {
            existing.push(authorProfileId);
          }
          acceptedHostProfileIdsByRequestId.set(requestId, existing);
        }
      } else if (body.startsWith('[HOST_RELEASED]')) {
        workflowStatusByRequestId.set(requestId, 'new_request');
        acceptedHostProfileIdsByRequestId.set(requestId, []);
      } else if (body.startsWith('[ARTIST_PROPOSED]')) {
        workflowStatusByRequestId.set(requestId, 'artist_proposed');
      } else if (body.startsWith('[ARTIST_APPROVED]')) {
        workflowStatusByRequestId.set(requestId, 'artist_accepted');
      } else if (body.startsWith('[EVENT_CREATED]')) {
        workflowStatusByRequestId.set(requestId, 'published');
      }
    }

    const eventItems = eventRows.map((event) => {
      const profile = event.created_by ? profilesById.get(event.created_by) : null;
      const requestMeta = event.parent_event_id ? requestById.get(event.parent_event_id as string) : null;
      const assignments = hostsByEventId.get(event.id) ?? [];
      const artistAssignments = artistsByEventId.get(event.id) ?? [];
      const primaryAssignment = assignments[0] ?? null;
      const notes = (primaryAssignment?.notes as string | null | undefined) ?? '';

      return {
        id: event.id,
        title: event.title,
        description: event.description ?? null,
        teaser: requestMeta?.teaser ?? null,
        event_domain_name: requestMeta?.event_domain_name ?? this.extractNoteValue(notes, 'Event Domain:') ?? null,
        edition: this.extractNoteValue(notes, 'Edition:'),
        event_type_name: this.extractNoteValue(notes, 'Event Type:'),
        event_type: event.event_type,
        status: event.event_type === 'REQUEST'
          ? this.mapBaseRequestStatus(event.status)
          : event.status,
        origin_website: event.origin_website,
        visibility_scope: event.visibility_scope ?? [],
        parent_event_id: event.parent_event_id ?? null,
        created_by: event.created_by ?? null,
        created_at: event.created_at,
        updated_at: event.updated_at,
        is_member_only: Array.isArray(event.visibility_scope) && event.visibility_scope.includes('MEMBER_ONLY'),
        proposed_dates: event.proposed_dates ?? null,
        department: event.department ?? null,
        city: event.city ?? null,
        creator_name: profile?.full_name || profile?.email || 'Utilisateur inconnu',
        creator_email: profile?.email || '',
        accepted_host_profile_ids: [],
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
        is_featured: !!event.is_featured,
      };
    });

    const artistRequestItems = artistRequestRows.map((request) => {
      const profile = request.created_by ? profilesById.get(request.created_by) : null;
      const artistAssignments = requestArtistsById.get(request.id) ?? [];
      const acceptedHostProfileIds = acceptedHostProfileIdsByRequestId.get(request.id as string) ?? [];
      const assignedHostIds = assignedHostIdsByRequestId.get(request.id as string) ?? [];
      const workflowStatus = workflowStatusByRequestId.get(request.id as string);
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
        edition: null,
        event_type_name: null,
        event_type: 'REQUEST' as const,
        status: workflowStatus ?? this.normalizeArtistRequestStatus(request.status as string | null),
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
        accepted_host_profile_ids: acceptedHostProfileIds,
        host_ids: assignedHostIds,
        host_names: assignedHostIds
          .map((hostId) => hostNamesById.get(hostId) ?? null)
          .filter((value): value is string => !!value),
        host_statuses: [],
        selected_dates: [],
        artist_ids: artistIds,
        artist_names: artistNames,
        artist_roles: artistIds.map((_, index) => index === 0 ? 'PRIMARY' : 'INVITED'),
        is_featured: false,
      };
    });

    return [...eventItems, ...artistRequestItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getHostWorkspaceEvents(profileId: string): Promise<HostWorkspaceEventItem[]> {
    const [hosts, overview] = await Promise.all([
      this.getAccessibleHosts(profileId),
      this.getAdminEventOverview(),
    ]);

    const hostIds = new Set(hosts.map((host) => host.id));
    const events = overview.filter((item) =>
      item.event_type === 'EVENT_INSTANCE' && item.host_ids.some((hostId) => hostIds.has(hostId))
    );

    if (events.length === 0) {
      return [];
    }

    const eventIds = events.map((event) => event.id);
    const parentRequestIds = Array.from(
      new Set(
        events
          .map((event) => event.parent_event_id)
          .filter((value): value is string => !!value)
      )
    );

    const [requestDomainsResult, hostNotesResult, eventArtistsResult] = await Promise.all([
      parentRequestIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_requests')
            .select('id, event_domain_id, event_domain:sys_event_domain(name)')
            .in('id', parentRequestIds)
        : Promise.resolve({ data: [], error: null }),
      eventIds.length > 0
        ? this.adminSupabase
            .from('tjs_event_hosts')
            .select('event_id, host_id, notes')
            .in('event_id', eventIds)
            .in('host_id', Array.from(hostIds))
        : Promise.resolve({ data: [], error: null }),
      eventIds.length > 0
        ? this.adminSupabase
            .from('tjs_event_artists')
            .select('event_id, artist:tjs_artists(id, profile_id)')
            .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (requestDomainsResult.error && !this.isMissingSchemaError(requestDomainsResult.error)) {
      console.error('getHostWorkspaceEvents request domains error:', requestDomainsResult.error.message);
    }

    if (hostNotesResult.error && !this.isMissingSchemaError(hostNotesResult.error)) {
      console.error('getHostWorkspaceEvents host notes error:', hostNotesResult.error.message);
    }

    if (eventArtistsResult.error && !this.isMissingSchemaError(eventArtistsResult.error)) {
      console.error('getHostWorkspaceEvents event artists error:', eventArtistsResult.error.message);
    }

    const requestById = new Map<string, { event_domain_id: number | null; event_domain_name: string | null }>();
    for (const row of ((requestDomainsResult.data ?? []) as any[])) {
      requestById.set(row.id as string, {
        event_domain_id: (row.event_domain_id as number | null) ?? null,
        event_domain_name: (row.event_domain?.name as string | null | undefined) ?? null,
      });
    }

    const notesByEventId = new Map<string, string>();
    for (const row of ((hostNotesResult.data ?? []) as any[])) {
      const eventId = row.event_id as string | null;
      if (eventId && !notesByEventId.has(eventId)) {
        notesByEventId.set(eventId, (row.notes as string | null) ?? '');
      }
    }

    const profileIdsByEventId = new Map<string, string[]>();
    const allArtistProfileIds = new Set<string>();
    for (const row of ((eventArtistsResult.data ?? []) as any[])) {
      const eventId = row.event_id as string | null;
      const profileId = row.artist?.profile_id as string | null | undefined;
      if (!eventId || !profileId) {
        continue;
      }

      const existing = profileIdsByEventId.get(eventId) ?? [];
      if (!existing.includes(profileId)) {
        existing.push(profileId);
      }
      profileIdsByEventId.set(eventId, existing);
      allArtistProfileIds.add(profileId);
    }

    const instrumentsResult = allArtistProfileIds.size > 0
      ? await this.adminSupabase
          .from('tjs_artist_instruments')
          .select('profile_id, instrument:sys_instruments(name)')
          .in('profile_id', Array.from(allArtistProfileIds))
      : { data: [], error: null };

    if (instrumentsResult.error && !this.isMissingSchemaError(instrumentsResult.error)) {
      console.error('getHostWorkspaceEvents instruments error:', instrumentsResult.error.message);
    }

    const instrumentsByProfileId = new Map<string, string[]>();
    for (const row of ((instrumentsResult.data ?? []) as any[])) {
      const profileId = row.profile_id as string | null;
      const instrumentName = row.instrument?.name as string | null | undefined;
      if (!profileId || !instrumentName) {
        continue;
      }

      const existing = instrumentsByProfileId.get(profileId) ?? [];
      if (!existing.includes(instrumentName)) {
        existing.push(instrumentName);
      }
      instrumentsByProfileId.set(profileId, existing);
    }

    return events.map((event) => {
      const requestMeta = event.parent_event_id ? requestById.get(event.parent_event_id) : null;
      const notes = notesByEventId.get(event.id) ?? '';
      const profileIds = profileIdsByEventId.get(event.id) ?? [];
      const instruments = Array.from(
        new Set([
          ...profileIds.flatMap((profileId) => instrumentsByProfileId.get(profileId) ?? []),
          ...this.extractAdditionalInstruments(notes),
        ])
      );

      return {
        ...event,
        event_domain_id: requestMeta?.event_domain_id ?? null,
        event_domain_name: requestMeta?.event_domain_name ?? this.extractNoteValue(notes, 'Event Domain:') ?? event.event_domain_name,
        edition: this.extractNoteValue(notes, 'Edition:'),
        event_type_name: this.extractNoteValue(notes, 'Event Type:'),
        instruments,
        primary_upcoming_date: this.pickPrimaryUpcomingDate(event.selected_dates),
        is_featured: !!event.is_featured,
        city: event.city ?? this.extractPrimaryScheduleLocationLabel(notes),
      };
    });
  }

  async getArtistWorkspaceUpcomingEvents(profileId: string): Promise<AdminEventOverviewItem[]> {
    const overview = await this.getArtistWorkspaceEvents(profileId);
    const today = this.todayDateString();

    return overview
      .filter((item) =>
        item.event_type === 'EVENT_INSTANCE'
        && item.selected_dates.some((date) => date >= today)
      )
      .sort((a, b) => {
        const aDate = this.pickPrimaryUpcomingDate(a.selected_dates) ?? '9999-12-31';
        const bDate = this.pickPrimaryUpcomingDate(b.selected_dates) ?? '9999-12-31';
        return aDate.localeCompare(bDate);
      });
  }

  async getArtistWorkspaceEvents(profileId: string): Promise<HostWorkspaceEventItem[]> {
    const { data: artistRow, error: artistError } = await this.adminSupabase
      .from('tjs_artists')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (artistError && !this.isMissingSchemaError(artistError)) {
      console.error('getArtistWorkspaceEvents artist lookup error:', artistError.message);
      return [];
    }

    const artistId = artistRow?.id as string | undefined;
    if (!artistId) {
      return [];
    }

    const overview = await this.getAdminEventOverview();
    const events = overview.filter((item) =>
      item.event_type === 'EVENT_INSTANCE' && item.artist_ids.includes(artistId)
    );

    if (events.length === 0) {
      return [];
    }

    const eventIds = events.map((event) => event.id);
    const parentRequestIds = Array.from(
      new Set(
        events
          .map((event) => event.parent_event_id)
          .filter((value): value is string => !!value)
      )
    );

    const [requestDomainsResult, hostNotesResult, eventArtistsResult] = await Promise.all([
      parentRequestIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_requests')
            .select('id, event_domain_id, event_domain:sys_event_domain(name)')
            .in('id', parentRequestIds)
        : Promise.resolve({ data: [], error: null }),
      eventIds.length > 0
        ? this.adminSupabase
            .from('tjs_event_hosts')
            .select('event_id, notes')
            .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null }),
      eventIds.length > 0
        ? this.adminSupabase
            .from('tjs_event_artists')
            .select('event_id, artist:tjs_artists(id, profile_id)')
            .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (requestDomainsResult.error && !this.isMissingSchemaError(requestDomainsResult.error)) {
      console.error('getArtistWorkspaceEvents request domains error:', requestDomainsResult.error.message);
    }

    if (hostNotesResult.error && !this.isMissingSchemaError(hostNotesResult.error)) {
      console.error('getArtistWorkspaceEvents host notes error:', hostNotesResult.error.message);
    }

    if (eventArtistsResult.error && !this.isMissingSchemaError(eventArtistsResult.error)) {
      console.error('getArtistWorkspaceEvents event artists error:', eventArtistsResult.error.message);
    }

    const requestById = new Map<string, { event_domain_id: number | null; event_domain_name: string | null }>();
    for (const row of ((requestDomainsResult.data ?? []) as any[])) {
      requestById.set(row.id as string, {
        event_domain_id: (row.event_domain_id as number | null) ?? null,
        event_domain_name: (row.event_domain?.name as string | null | undefined) ?? null,
      });
    }

    const notesByEventId = new Map<string, string>();
    for (const row of ((hostNotesResult.data ?? []) as any[])) {
      const eventId = row.event_id as string | null;
      if (eventId && !notesByEventId.has(eventId)) {
        notesByEventId.set(eventId, (row.notes as string | null) ?? '');
      }
    }

    const profileIdsByEventId = new Map<string, string[]>();
    const allArtistProfileIds = new Set<string>();
    for (const row of ((eventArtistsResult.data ?? []) as any[])) {
      const eventId = row.event_id as string | null;
      const artistProfileId = row.artist?.profile_id as string | null | undefined;
      if (!eventId || !artistProfileId) {
        continue;
      }

      const existing = profileIdsByEventId.get(eventId) ?? [];
      if (!existing.includes(artistProfileId)) {
        existing.push(artistProfileId);
      }
      profileIdsByEventId.set(eventId, existing);
      allArtistProfileIds.add(artistProfileId);
    }

    const instrumentsResult = allArtistProfileIds.size > 0
      ? await this.adminSupabase
          .from('tjs_artist_instruments')
          .select('profile_id, instrument:sys_instruments(name)')
          .in('profile_id', Array.from(allArtistProfileIds))
      : { data: [], error: null };

    if (instrumentsResult.error && !this.isMissingSchemaError(instrumentsResult.error)) {
      console.error('getArtistWorkspaceEvents instruments error:', instrumentsResult.error.message);
    }

    const instrumentsByProfileId = new Map<string, string[]>();
    for (const row of ((instrumentsResult.data ?? []) as any[])) {
      const artistProfileId = row.profile_id as string | null;
      const instrumentName = row.instrument?.name as string | null | undefined;
      if (!artistProfileId || !instrumentName) {
        continue;
      }

      const existing = instrumentsByProfileId.get(artistProfileId) ?? [];
      if (!existing.includes(instrumentName)) {
        existing.push(instrumentName);
      }
      instrumentsByProfileId.set(artistProfileId, existing);
    }

    return events.map((event) => {
      const requestMeta = event.parent_event_id ? requestById.get(event.parent_event_id) : null;
      const notes = notesByEventId.get(event.id) ?? '';
      const profileIds = profileIdsByEventId.get(event.id) ?? [];
      const instruments = Array.from(
        new Set([
          ...profileIds.flatMap((artistProfileId) => instrumentsByProfileId.get(artistProfileId) ?? []),
          ...this.extractAdditionalInstruments(notes),
        ])
      );

      return {
        ...event,
        event_domain_id: requestMeta?.event_domain_id ?? null,
        event_domain_name: requestMeta?.event_domain_name ?? event.event_domain_name,
        edition: this.extractNoteValue(notes, 'Edition:'),
        event_type_name: this.extractNoteValue(notes, 'Event Type:'),
        instruments,
        primary_upcoming_date: this.pickPrimaryUpcomingDate(event.selected_dates),
        is_featured: !!event.is_featured,
        city: event.city ?? this.extractPrimaryScheduleLocationLabel(notes),
      };
      });
  }

  async getPublicWebsiteEvents(): Promise<PublicWebsiteEventItem[]> {
    const eventsResult = await this.adminSupabase
      .from('tjs_events')
      .select(`
        id,
        title,
        status,
        event_type,
        parent_event_id,
        visibility_scope,
        created_at
      `)
      .eq('event_type', 'EVENT_INSTANCE')
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });

    if (eventsResult.error && !this.isMissingSchemaError(eventsResult.error)) {
      console.error('getPublicWebsiteEvents events error:', eventsResult.error.message);
      return [];
    }

    const eventRows = this.isMissingSchemaError(eventsResult.error)
      ? []
      : ((eventsResult.data ?? []) as any[]);

    if (eventRows.length === 0) {
      return [];
    }

    const eventIds = eventRows.map((row) => row.id as string);
    const requestIds = Array.from(
      new Set(
        eventRows
          .map((row) => row.parent_event_id as string | null)
          .filter((value): value is string => !!value)
      )
    );

    const [hostAssignmentsResult, eventArtistsResult, requestDetailsResult, requestArtistsResult, instrumentsResult] = await Promise.all([
      this.adminSupabase
        .from('tjs_event_hosts')
        .select('event_id, selected_dates, notes')
        .in('event_id', eventIds),
      this.adminSupabase
        .from('tjs_event_artists')
        .select(`
          event_id,
          artist:tjs_artists (
            artist_name
          )
        `)
        .in('event_id', eventIds),
      requestIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_requests')
            .select('id, teaser, image_url, event_domain:sys_event_domain(name)')
            .in('id', requestIds)
        : Promise.resolve({ data: [], error: null }),
      requestIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_request_artists')
            .select(`
              request_id,
              artist:tjs_artists!tjs_artist_request_artists_artist_id_fkey (
                artist_name
              ),
              invited_artist:tjs_artists!tjs_artist_request_artists_invited_artist_id_fkey (
                artist_name
              )
            `)
            .in('request_id', requestIds)
        : Promise.resolve({ data: [], error: null }),
      eventIds.length > 0
        ? this.adminSupabase
            .from('tjs_event_artists')
            .select(`
              event_id,
              artist_id,
              artist:tjs_artists (
                profile_id
              )
            `)
            .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (hostAssignmentsResult.error && !this.isMissingSchemaError(hostAssignmentsResult.error)) {
      console.error('getPublicWebsiteEvents host assignments error:', hostAssignmentsResult.error.message);
    }

    if (eventArtistsResult.error && !this.isMissingSchemaError(eventArtistsResult.error)) {
      console.error('getPublicWebsiteEvents event artists error:', eventArtistsResult.error.message);
    }

    if (requestDetailsResult.error && !this.isMissingSchemaError(requestDetailsResult.error)) {
      console.error('getPublicWebsiteEvents request details error:', requestDetailsResult.error.message);
    }

    if (requestArtistsResult.error && !this.isMissingSchemaError(requestArtistsResult.error)) {
      console.error('getPublicWebsiteEvents request artists error:', requestArtistsResult.error.message);
    }

    if (instrumentsResult.error && !this.isMissingSchemaError(instrumentsResult.error)) {
      console.error('getPublicWebsiteEvents instruments error:', instrumentsResult.error.message);
    }

    const hostAssignmentsByEventId = new Map<string, any[]>();
    for (const assignment of ((hostAssignmentsResult.data ?? []) as any[])) {
      const eventId = assignment.event_id as string;
      const existing = hostAssignmentsByEventId.get(eventId) ?? [];
      existing.push(assignment);
      hostAssignmentsByEventId.set(eventId, existing);
    }

    const eventArtistNamesByEventId = new Map<string, string[]>();
    for (const assignment of ((eventArtistsResult.data ?? []) as any[])) {
      const eventId = assignment.event_id as string;
      const artistName = (assignment.artist?.artist_name as string | null | undefined)?.trim();
      if (!artistName) {
        continue;
      }

      const existing = eventArtistNamesByEventId.get(eventId) ?? [];
      if (!existing.includes(artistName)) {
        existing.push(artistName);
      }
      eventArtistNamesByEventId.set(eventId, existing);
    }

    const requestDetailsById = new Map<string, { teaser: string; image_url: string | null; event_domain_name: string | null }>();
    for (const row of ((requestDetailsResult.data ?? []) as any[])) {
      const requestId = row.id as string;
      requestDetailsById.set(requestId, {
        teaser: (row.teaser as string | null | undefined)?.trim() || '',
        image_url: (row.image_url as string | null | undefined) ?? null,
        event_domain_name: (row.event_domain?.name as string | null | undefined) ?? null,
      });
    }

    const requestArtistNamesByRequestId = new Map<string, string[]>();
    for (const assignment of ((requestArtistsResult.data ?? []) as any[])) {
      const requestId = assignment.request_id as string;
      const artistName = (
        (assignment.artist?.artist_name as string | null | undefined)
        || (assignment.invited_artist?.artist_name as string | null | undefined)
      )?.trim();

      if (!artistName) {
        continue;
      }

      const existing = requestArtistNamesByRequestId.get(requestId) ?? [];
      if (!existing.includes(artistName)) {
        existing.push(artistName);
      }
      requestArtistNamesByRequestId.set(requestId, existing);
    }

    const artistProfileIdsByEventId = new Map<string, string[]>();
    for (const assignment of ((instrumentsResult.data ?? []) as any[])) {
      const eventId = assignment.event_id as string;
      const profileId = (assignment.artist?.profile_id as string | null | undefined)?.trim();
      if (!profileId) {
        continue;
      }

      const existing = artistProfileIdsByEventId.get(eventId) ?? [];
      if (!existing.includes(profileId)) {
        existing.push(profileId);
      }
      artistProfileIdsByEventId.set(eventId, existing);
    }

    const artistProfileIds = Array.from(
      new Set(
        Array.from(artistProfileIdsByEventId.values()).flat()
      )
    );

    const instrumentNamesByProfileId = new Map<string, string[]>();
    if (artistProfileIds.length > 0) {
      const instrumentAssignmentsResult = await this.adminSupabase
        .from('tjs_artist_instruments')
        .select(`
          profile_id,
          instrument:sys_instruments (
            name
          )
        `)
        .in('profile_id', artistProfileIds);

      if (instrumentAssignmentsResult.error && !this.isMissingSchemaError(instrumentAssignmentsResult.error)) {
        console.error('getPublicWebsiteEvents instrument assignments error:', instrumentAssignmentsResult.error.message);
      } else {
        for (const assignment of ((instrumentAssignmentsResult.data ?? []) as any[])) {
          const profileId = assignment.profile_id as string;
          const instrumentName = (assignment.instrument?.name as string | null | undefined)?.trim();
          if (!instrumentName) {
            continue;
          }

          const existing = instrumentNamesByProfileId.get(profileId) ?? [];
          if (!existing.includes(instrumentName)) {
            existing.push(instrumentName);
          }
          instrumentNamesByProfileId.set(profileId, existing);
        }
      }
    }

    return eventRows
      .map((event) => {
        const eventId = event.id as string;
        const requestId = (event.parent_event_id as string | null | undefined) ?? null;
        const requestDetail = requestId ? requestDetailsById.get(requestId) : undefined;
        const artistNames = eventArtistNamesByEventId.get(eventId)
          ?? (requestId ? requestArtistNamesByRequestId.get(requestId) : undefined)
          ?? [];
        const primaryAssignment = (hostAssignmentsByEventId.get(eventId) ?? [])[0];
        const notes = (primaryAssignment?.notes as string | null | undefined) ?? '';
        const instruments = Array.from(new Set([
          ...(artistProfileIdsByEventId.get(eventId) ?? [])
            .flatMap((profileId) => instrumentNamesByProfileId.get(profileId) ?? []),
          ...this.extractAdditionalInstruments(notes),
        ]));
        const scheduleEntries = this.extractScheduleEntries(
          notes,
          Array.isArray(primaryAssignment?.selected_dates)
            ? (primaryAssignment.selected_dates as string[])
            : [],
        );
        const scheduleLines = this.extractEventScheduleLines(notes, scheduleEntries);
        const sortedScheduleEntries = [...scheduleEntries].sort((left, right) => {
          const leftDate = left.end_date || left.start_date || '9999-12-31';
          const rightDate = right.end_date || right.start_date || '9999-12-31';
          return leftDate.localeCompare(rightDate);
        });

        return {
          id: eventId,
          title: (event.title as string | null | undefined)?.trim() || 'Untitled event',
          teaser: requestDetail?.teaser || '',
          image_url: requestDetail?.image_url ?? this.extractNoteValue(notes, 'Event Image:') ?? null,
          event_domain_name: requestDetail?.event_domain_name ?? null,
          instruments,
          event_type_name: this.extractNoteValue(notes, 'Event Type:'),
          artist_names: artistNames,
          primary_date: scheduleEntries[0]?.start_date ?? null,
          last_date: sortedScheduleEntries.at(-1)?.end_date || sortedScheduleEntries.at(-1)?.start_date || null,
          schedule_lines: scheduleLines,
          is_member_only: this.isEventMemberOnly(event.visibility_scope),
        } satisfies PublicWebsiteEventItem;
      })
      .sort((a, b) => {
        const aDate = a.primary_date ?? '9999-12-31';
        const bDate = b.primary_date ?? '9999-12-31';
        if (aDate !== bDate) {
          return aDate.localeCompare(bDate);
        }

        return a.title.localeCompare(b.title);
      });
  }

  async getPublicEventDetail(eventId: string): Promise<PublicEventDetail | null> {
    const eventsResult = await this.adminSupabase
      .from('tjs_events')
      .select('id, title, status, event_type, parent_event_id, visibility_scope')
      .eq('id', eventId)
      .eq('event_type', 'EVENT_INSTANCE')
      .eq('status', 'APPROVED')
      .maybeSingle();

    if (eventsResult.error || !eventsResult.data) {
      return null;
    }

    const event = eventsResult.data as any;
    const requestId = event.parent_event_id as string | null;

    const [hostAssignmentsResult, eventArtistsResult, requestDetailsResult, requestArtistsResult, requestMediaResult] = await Promise.all([
      this.adminSupabase
        .from('tjs_event_hosts')
        .select('selected_dates, notes')
        .eq('event_id', eventId),
      this.adminSupabase
        .from('tjs_event_artists')
        .select('artist:tjs_artists(id, artist_name, profile_id)')
        .eq('event_id', eventId),
      requestId
        ? this.adminSupabase
            .from('tjs_artist_requests')
            .select('teaser, description, image_url, event_domain:sys_event_domain(name)')
            .eq('id', requestId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      requestId
        ? this.adminSupabase
            .from('tjs_artist_request_artists')
            .select('artist:tjs_artists!tjs_artist_request_artists_artist_id_fkey(artist_name), invited_artist:tjs_artists!tjs_artist_request_artists_invited_artist_id_fkey(artist_name)')
            .eq('request_id', requestId)
        : Promise.resolve({ data: [], error: null }),
      requestId
        ? this.adminSupabase
            .from('tjs_artist_request_media')
            .select('id, media_type, image_url, name, description, url')
            .eq('request_id', requestId)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const primaryAssignment = (hostAssignmentsResult.data ?? [])[0] as any;
    const notes = primaryAssignment?.notes ?? '';
    const scheduleEntries = this.extractScheduleEntries(
      notes,
      Array.isArray(primaryAssignment?.selected_dates) ? primaryAssignment.selected_dates : []
    );
    const scheduleLines = this.extractEventScheduleLines(notes, scheduleEntries);

    const eventArtists = (eventArtistsResult.data ?? []) as any[];
    const requestArtists = (requestArtistsResult.data ?? []) as any[];
    const artistNames = Array.from(
      new Set([
        ...eventArtists.map((a) => a.artist?.artist_name).filter(Boolean),
        ...requestArtists.map((a) => a.artist?.artist_name || a.invited_artist?.artist_name).filter(Boolean),
      ])
    );

    const artistProfileIds = eventArtists
      .map((a) => a.artist?.profile_id)
      .filter((id): id is string => !!id);

    const [instrumentsResult, artistProfilesResult] = await Promise.all([
      artistProfileIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_instruments')
            .select('profile_id, instrument:sys_instruments(name)')
            .in('profile_id', artistProfileIds)
        : Promise.resolve({ data: [], error: null }),
      artistProfileIds.length > 0
        ? this.adminSupabase
            .from('tjs_artist_profiles')
            .select('profile_id, tagline')
            .in('profile_id', artistProfileIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const instrumentsByProfileId = new Map<string, string[]>();
    for (const row of ((instrumentsResult.data ?? []) as any[])) {
      const profileId = row.profile_id as string;
      const instrumentName = row.instrument?.name as string | null;
      if (instrumentName) {
        const existing = instrumentsByProfileId.get(profileId) ?? [];
        if (!existing.includes(instrumentName)) {
          existing.push(instrumentName);
        }
        instrumentsByProfileId.set(profileId, existing);
      }
    }

    const taglineByProfileId = new Map<string, string>();
    for (const row of ((artistProfilesResult.data ?? []) as any[])) {
      if (row.profile_id && row.tagline) {
        taglineByProfileId.set(row.profile_id, row.tagline);
      }
    }

    const profilesResult = artistProfileIds.length > 0
      ? await this.adminSupabase
          .from('tjs_profiles')
          .select('id, full_name, avatar_url')
          .in('id', artistProfileIds)
      : { data: [], error: null };

    const profilesById = new Map<string, any>();
    for (const profile of ((profilesResult.data ?? []) as any[])) {
      profilesById.set(profile.id, profile);
    }

    const instruments = Array.from(
      new Set([
        ...artistProfileIds.flatMap((id) => instrumentsByProfileId.get(id) ?? []),
        ...this.extractAdditionalInstruments(notes),
      ])
    );

    const requestDetail = requestDetailsResult.data as any;
    const edition = this.extractNoteValue(notes, 'Edition:');

    return {
      id: eventId,
      title: event.title?.trim() || 'Untitled event',
      teaser: requestDetail?.teaser || '',
      description: requestDetail?.description || '',
      image_url: requestDetail?.image_url ?? this.extractNoteValue(notes, 'Event Image:') ?? null,
      event_domain_name: requestDetail?.event_domain?.name ?? null,
      edition,
      event_type_name: this.extractNoteValue(notes, 'Event Type:'),
      call_to_action_url: this.extractNoteValue(notes, 'Call to Action URL:'),
      instruments,
      artist_names: artistNames,
      schedule_lines: scheduleLines,
      is_member_only: this.isEventMemberOnly(event.visibility_scope),
      media: ((requestMediaResult.data ?? []) as any[]).length > 0
        ? ((requestMediaResult.data ?? []) as any[]).map((m) => ({
            id: m.id,
            media_type: m.media_type,
            image_url: m.image_url,
            name: m.name,
            description: m.description,
            url: m.url,
          }))
        : this.extractMediaEntriesFromNotes(notes),
      artists: eventArtists.map((a) => {
        const profileId = a.artist?.profile_id;
        const profile = profileId ? profilesById.get(profileId) : null;
        return {
          id: a.artist?.id,
          display_name: a.artist?.artist_name || 'Unknown',
          tagline: profileId ? taglineByProfileId.get(profileId) ?? null : null,
          image_url: profile?.avatar_url ?? null,
          instruments: profileId ? instrumentsByProfileId.get(profileId) ?? [] : [],
        };
      }),
    };
  }

  async getEventLocationSummaries(eventIds: string[], hostIds?: number[]): Promise<Map<string, EventLocationSummary>> {
    const summaries = new Map<string, EventLocationSummary>();
    if (eventIds.length === 0) {
      return summaries;
    }

    let assignmentsQuery = this.adminSupabase
      .from('tjs_event_hosts')
      .select('event_id, host_id, location_id, selected_dates')
      .in('event_id', eventIds);

    if (hostIds && hostIds.length > 0) {
      assignmentsQuery = assignmentsQuery.in('host_id', hostIds);
    }

    const { data: assignmentData, error: assignmentError } = await assignmentsQuery;
    if (assignmentError) {
      if (!this.isMissingSchemaError(assignmentError)) {
        console.error('getEventLocationSummaries assignments error:', assignmentError.message);
      }
      return summaries;
    }

    const assignments = ((assignmentData ?? []) as Array<{
      event_id?: string | null;
      location_id?: string | null;
      selected_dates?: string[] | null;
    }>).filter((row) => !!row.event_id && !!row.location_id);

    const locationIds = Array.from(new Set(
      assignments
        .map((row) => row.location_id)
        .filter((value): value is string => !!value)
    ));

    const [publicLocationsResult, privateLocationsResult] = await Promise.all([
      locationIds.length > 0
        ? this.adminSupabase
            .from('tjs_locations')
            .select('id, name, city, address')
            .in('id', locationIds)
        : Promise.resolve({ data: [], error: null }),
      locationIds.length > 0
        ? this.adminSupabase
            .from('tjs_private_locations')
            .select('id, name, city, address')
            .in('id', locationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (publicLocationsResult.error && !this.isMissingSchemaError(publicLocationsResult.error)) {
      console.error('getEventLocationSummaries public locations error:', publicLocationsResult.error.message);
    }

    if (privateLocationsResult.error && !this.isMissingSchemaError(privateLocationsResult.error)) {
      console.error('getEventLocationSummaries private locations error:', privateLocationsResult.error.message);
    }

    const locationLabelById = new Map<string, string>();
    for (const row of (publicLocationsResult.data ?? []) as Array<{ id?: string | null; name?: string | null; city?: string | null; address?: string | null }>) {
      if (row.id) {
        locationLabelById.set(row.id, row.name || row.city || row.address || 'Unknown');
      }
    }

    for (const row of (privateLocationsResult.data ?? []) as Array<{ id?: string | null; name?: string | null; city?: string | null; address?: string | null }>) {
      if (row.id && !locationLabelById.has(row.id)) {
        locationLabelById.set(row.id, row.name || row.city || row.address || 'Unknown');
      }
    }

    const entriesByEventId = new Map<string, Array<{ label: string; latestDate: string }>>();
    for (const assignment of assignments) {
      const eventId = assignment.event_id as string;
      const locationId = assignment.location_id as string;
      const label = locationLabelById.get(locationId) ?? 'Unknown';
      const latestDate = Array.isArray(assignment.selected_dates) && assignment.selected_dates.length > 0
        ? [...assignment.selected_dates].sort().at(-1) ?? ''
        : '';

      const existing = entriesByEventId.get(eventId) ?? [];
      const current = existing.find((entry) => entry.label === label);
      if (current) {
        if (latestDate > current.latestDate) {
          current.latestDate = latestDate;
        }
      } else {
        existing.push({ label, latestDate });
      }
      entriesByEventId.set(eventId, existing);
    }

    for (const [eventId, entries] of entriesByEventId.entries()) {
      const sortedEntries = [...entries].sort((left, right) => {
        if (left.latestDate !== right.latestDate) {
          return right.latestDate.localeCompare(left.latestDate);
        }
        return left.label.localeCompare(right.label);
      });

      const labels = sortedEntries.map((entry) => entry.label);
      summaries.set(eventId, {
        event_id: eventId,
        labels,
        display_label: labels.length > 1 ? `${labels[0]} +${labels.length - 1}` : (labels[0] ?? null),
      });
    }

    return summaries;
  }

  async getHostVenueScheduleConflicts(
    entries: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string; locationId: string | null }>,
  ): Promise<HostVenueScheduleConflict[]> {
    const normalizedEntries = entries
      .filter((entry) => !!entry.locationId && !!entry.startDate)
      .map((entry) => ({
        mode: entry.mode,
        startDate: entry.startDate,
        endDate: entry.mode === 'period' ? (entry.endDate || entry.startDate) : entry.startDate,
        locationId: entry.locationId as string,
      }));

    if (normalizedEntries.length === 0) {
      return [];
    }

    const locationIds = Array.from(new Set(normalizedEntries.map((entry) => entry.locationId)));
    const [publicLocationsResult, privateLocationsResult] = await Promise.all([
      this.adminSupabase
        .from('tjs_locations')
        .select('id, name, city, address')
        .in('id', locationIds),
      this.adminSupabase
        .from('tjs_private_locations')
        .select('id, name, city, address')
        .in('id', locationIds),
    ]);

    if (publicLocationsResult.error && !this.isMissingSchemaError(publicLocationsResult.error)) {
      console.error('getHostVenueScheduleConflicts public locations error:', publicLocationsResult.error.message);
    }

    if (privateLocationsResult.error && !this.isMissingSchemaError(privateLocationsResult.error)) {
      console.error('getHostVenueScheduleConflicts private locations error:', privateLocationsResult.error.message);
    }

    const locationLabelById = new Map<string, string>();
    for (const row of (publicLocationsResult.data ?? []) as Array<{ id?: string | null; name?: string | null; city?: string | null; address?: string | null }>) {
      if (row.id) {
        locationLabelById.set(row.id, row.name || row.city || row.address || 'Unknown venue');
      }
    }

    for (const row of (privateLocationsResult.data ?? []) as Array<{ id?: string | null; name?: string | null; city?: string | null; address?: string | null }>) {
      if (row.id && !locationLabelById.has(row.id)) {
        locationLabelById.set(row.id, row.name || row.city || row.address || 'Unknown venue');
      }
    }

    const selectedEntries = normalizedEntries
      .map((entry) => ({
        ...entry,
        locationLabel: locationLabelById.get(entry.locationId) ?? null,
      }))
      .filter((entry) => !!entry.locationLabel);

    if (selectedEntries.length === 0) {
      return [];
    }

    const assignmentsResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select(`
        event_id,
        location_id,
        selected_dates,
        notes,
        event:tjs_events (
          title,
          status,
          event_type
        )
      `);

    if (assignmentsResult.error) {
      if (this.isMissingSchemaError(assignmentsResult.error)) {
        return [];
      }
      console.error('getHostVenueScheduleConflicts assignments error:', assignmentsResult.error.message);
      return [];
    }

    const conflicts = new Map<string, HostVenueScheduleConflict>();
    for (const row of ((assignmentsResult.data ?? []) as any[])) {
      const eventType = row.event?.event_type as string | null | undefined;
      const locationId = row.location_id as string | null | undefined;
      if (eventType !== 'EVENT_INSTANCE') {
        continue;
      }

      const existingEntries = this.extractScheduleEntries(
        (row.notes as string | null | undefined) ?? '',
        Array.isArray(row.selected_dates) ? (row.selected_dates as string[]) : [],
      );

      if (existingEntries.length === 0) {
        continue;
      }

      const existingScheduleLines = this.extractEventScheduleLines(
        (row.notes as string | null | undefined) ?? '',
        existingEntries,
      );

      const conflictingLines = this.extractEventScheduleLines(
        (row.notes as string | null | undefined) ?? '',
        existingEntries,
      ).filter((_, index) => {
        const existing = existingEntries[index];
        const existingEnd = existing.mode === 'period' ? (existing.end_date || existing.start_date) : existing.start_date;
        const existingLineLocationLabel = this.extractScheduleLineLocationLabel(existingScheduleLines[index] ?? null);
        const normalizedExistingLineLocationLabel = this.normalizeLocationComparisonValue(existingLineLocationLabel);

        return selectedEntries.some((entry) =>
          (
            (locationId && entry.locationId === locationId)
            || (
              this.normalizeLocationComparisonValue(entry.locationLabel)
              && this.normalizeLocationComparisonValue(entry.locationLabel) === normalizedExistingLineLocationLabel
            )
          )
          && entry.startDate <= existingEnd
          && existing.start_date <= entry.endDate
        );
      });

      if (conflictingLines.length === 0) {
        continue;
      }

      const conflictKey = `${row.event_id}:${locationId}`;
      conflicts.set(conflictKey, {
        event_id: row.event_id as string,
        event_title: (row.event?.title as string | null | undefined)?.trim() || 'Untitled event',
        event_status: (row.event?.status as string | null | undefined)?.trim() || 'Unknown',
        location_id: locationId ?? '',
        location_label: locationId
          ? (locationLabelById.get(locationId) ?? this.extractScheduleLineLocationLabel(conflictingLines[0] ?? null) ?? 'Unknown venue')
          : (this.extractScheduleLineLocationLabel(conflictingLines[0] ?? null) ?? 'Unknown venue'),
        conflicting_schedule_lines: Array.from(new Set(conflictingLines)),
      });
    }

    return Array.from(conflicts.values());
  }

  async getHostWorkspaceEventDetail(profileId: string, eventId: string): Promise<HostWorkspaceEventDetail | null> {
    const events = await this.getHostWorkspaceEvents(profileId);
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      return null;
    }

    const hostIds = new Set((await this.getAccessibleHosts(profileId)).map((host) => host.id));
    const hostNotesResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes, selected_dates, location_id, location:tjs_locations(name, city, address)')
      .eq('event_id', eventId);

    if (hostNotesResult.error && !this.isMissingSchemaError(hostNotesResult.error)) {
      console.error('getHostWorkspaceEventDetail host notes error:', hostNotesResult.error.message);
    }

    const hostRow = ((hostNotesResult.data ?? []) as any[])
      .find((row) => hostIds.has(row.host_id as number));

    const requestDetail = event.parent_event_id
      ? await this.getArtistWorkspaceRequestDetail(event.parent_event_id)
      : null;

    const scheduleEntries = this.extractScheduleEntries(
      (hostRow?.notes as string | null | undefined) ?? '',
      Array.isArray(hostRow?.selected_dates)
        ? (hostRow.selected_dates as string[])
        : (event.selected_dates ?? []),
    );

    return {
      ...event,
      host_notes: (hostRow?.notes as string | null | undefined) ?? null,
      all_dates: scheduleEntries.flatMap((entry) =>
        entry.mode === 'period' ? [entry.start_date, entry.end_date].filter(Boolean) : [entry.start_date].filter(Boolean)
      ),
      show_time: this.extractNoteValue((hostRow?.notes as string | null | undefined) ?? '', 'Show Time:'),
      call_to_action_url: this.extractNoteValue((hostRow?.notes as string | null | undefined) ?? '', 'Call to Action URL:'),
      location_id: (hostRow?.location_id as string | null | undefined) ?? null,
      location_name: (hostRow?.location?.name as string | null | undefined)
        || (hostRow?.location?.city as string | null | undefined)
        || (hostRow?.location?.address as string | null | undefined)
        || this.extractPrimaryScheduleLocationLabel((hostRow?.notes as string | null | undefined) ?? '')
        || null,
      instruments: Array.from(new Set([
        ...(event.instruments ?? []),
        ...this.extractAdditionalInstruments((hostRow?.notes as string | null | undefined) ?? ''),
      ])),
      schedule_entries: scheduleEntries,
      request_detail: requestDetail,
    };
  }

  async getCommitteeWorkspaceEventDetail(eventId: string): Promise<HostWorkspaceEventDetail | null> {
    const overview = await this.getAdminEventOverview();
    const event = overview.find((item) => item.id === eventId && item.event_type === 'EVENT_INSTANCE');
    if (!event) {
      return null;
    }

    const hostNotesResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes, selected_dates, location_id, location:tjs_locations(name, city, address)')
      .eq('event_id', eventId);

    if (hostNotesResult.error && !this.isMissingSchemaError(hostNotesResult.error)) {
      console.error('getCommitteeWorkspaceEventDetail host notes error:', hostNotesResult.error.message);
    }

    const hostRow = ((hostNotesResult.data ?? []) as any[])[0] ?? null;
    const requestDetail = event.parent_event_id
      ? await this.getArtistWorkspaceRequestDetail(event.parent_event_id)
      : null;
    const hostNotes = (hostRow?.notes as string | null | undefined) ?? '';
    const scheduleEntries = this.extractScheduleEntries(
      hostNotes,
      Array.isArray(hostRow?.selected_dates)
        ? (hostRow.selected_dates as string[])
        : (event.selected_dates ?? []),
    );

    return {
      ...event,
      event_domain_id: requestDetail?.event_domain_id ?? null,
      edition: this.extractNoteValue(hostNotes, 'Edition:') ?? event.edition ?? null,
      event_type_name: this.extractNoteValue(hostNotes, 'Event Type:') ?? event.event_type_name ?? null,
      instruments: Array.from(new Set([
        ...(requestDetail?.artists ?? []).flatMap((artist) => artist.instruments ?? []),
        ...this.extractAdditionalInstruments(hostNotes),
      ])),
      primary_upcoming_date: this.pickPrimaryUpcomingDate(event.selected_dates),
      is_featured: !!event.is_featured,
      host_notes: null,
      all_dates: scheduleEntries.flatMap((entry) =>
        entry.mode === 'period' ? [entry.start_date, entry.end_date].filter(Boolean) : [entry.start_date].filter(Boolean)
      ),
      show_time: this.extractNoteValue(hostNotes, 'Show Time:'),
      call_to_action_url: this.extractNoteValue(hostNotes, 'Call to Action URL:'),
      location_id: (hostRow?.location_id as string | null | undefined) ?? null,
      location_name: (hostRow?.location?.name as string | null | undefined)
        || (hostRow?.location?.city as string | null | undefined)
        || (hostRow?.location?.address as string | null | undefined)
        || this.extractPrimaryScheduleLocationLabel(hostNotes)
        || null,
      schedule_entries: scheduleEntries,
      request_detail: requestDetail,
    };
  }

  async getAdminWorkspaceEventDetail(eventId: string): Promise<HostWorkspaceEventDetail | null> {
    const overview = await this.getAdminEventOverview();
    const event = overview.find((item) => item.id === eventId && item.event_type === 'EVENT_INSTANCE');
    if (!event) {
      return null;
    }

    const hostNotesResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes, selected_dates, location_id, location:tjs_locations(name, city, address)')
      .eq('event_id', eventId);

    if (hostNotesResult.error && !this.isMissingSchemaError(hostNotesResult.error)) {
      console.error('getAdminWorkspaceEventDetail host notes error:', hostNotesResult.error.message);
    }

    const hostRow = ((hostNotesResult.data ?? []) as any[])[0] ?? null;
    const requestDetail = event.parent_event_id
      ? await this.getArtistWorkspaceRequestDetail(event.parent_event_id)
      : null;
    const hostNotes = (hostRow?.notes as string | null | undefined) ?? '';
    const scheduleEntries = this.extractScheduleEntries(
      hostNotes,
      Array.isArray(hostRow?.selected_dates)
        ? (hostRow.selected_dates as string[])
        : (event.selected_dates ?? []),
    );

    return {
      ...event,
      event_domain_id: requestDetail?.event_domain_id ?? null,
      edition: this.extractNoteValue(hostNotes, 'Edition:') ?? event.edition ?? null,
      event_type_name: this.extractNoteValue(hostNotes, 'Event Type:') ?? event.event_type_name ?? null,
      instruments: Array.from(new Set([
        ...(requestDetail?.artists ?? []).flatMap((artist) => artist.instruments ?? []),
        ...this.extractAdditionalInstruments(hostNotes),
      ])),
      primary_upcoming_date: this.pickPrimaryUpcomingDate(event.selected_dates),
      is_featured: !!event.is_featured,
      host_notes: hostNotes || null,
      all_dates: scheduleEntries.flatMap((entry) =>
        entry.mode === 'period' ? [entry.start_date, entry.end_date].filter(Boolean) : [entry.start_date].filter(Boolean)
      ),
      show_time: this.extractNoteValue(hostNotes, 'Show Time:'),
      call_to_action_url: this.extractNoteValue(hostNotes, 'Call to Action URL:'),
      location_id: (hostRow?.location_id as string | null | undefined) ?? null,
      location_name: (hostRow?.location?.name as string | null | undefined)
        || (hostRow?.location?.city as string | null | undefined)
        || (hostRow?.location?.address as string | null | undefined)
        || this.extractPrimaryScheduleLocationLabel(hostNotes)
        || null,
      schedule_entries: scheduleEntries,
      request_detail: requestDetail,
    };
  }

  async updateHostWorkspaceEventStatus(profileId: string, eventId: string, isActive: boolean): Promise<string | null> {
    const hosts = await this.getAccessibleHosts(profileId);
    const hostIds = new Set(hosts.map((host) => host.id));
    const hostAssignmentResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id')
      .eq('event_id', eventId);

    if (hostAssignmentResult.error) {
      if (this.isMissingSchemaError(hostAssignmentResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return hostAssignmentResult.error.message;
    }

    const isOwnedByHost = ((hostAssignmentResult.data ?? []) as any[])
      .some((row) => hostIds.has(row.host_id as number));

    if (!isOwnedByHost) {
      return 'You do not have access to this event.';
    }

    const { error } = await this.adminSupabase
      .from('tjs_events')
      .update({
        status: isActive ? 'APPROVED' : 'SELECTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return error.message;
    }

    return null;
  }

  async updateAdminWorkspaceEventStatus(eventId: string, isActive: boolean): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_events')
      .update({
        status: isActive ? 'APPROVED' : 'SELECTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return error.message;
    }

    return null;
  }

  async updateHostWorkspaceEventFeatured(profileId: string, eventId: string, isFeatured: boolean): Promise<string | null> {
    const hosts = await this.getAccessibleHosts(profileId);
    const hostIds = new Set(hosts.map((host) => host.id));
    const hostAssignmentResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id')
      .eq('event_id', eventId);

    if (hostAssignmentResult.error) {
      if (this.isMissingSchemaError(hostAssignmentResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return hostAssignmentResult.error.message;
    }

    const isOwnedByHost = ((hostAssignmentResult.data ?? []) as any[])
      .some((row) => hostIds.has(row.host_id as number));

    if (!isOwnedByHost) {
      return 'You do not have access to this event.';
    }

    const { error } = await this.adminSupabase
      .from('tjs_events')
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Event featured flag is missing in the database. Run db/024_event_featured_flag.sql and try again.';
      }
      return error.message;
    }

    return null;
  }

  async updateAdminWorkspaceEventFeatured(eventId: string, isFeatured: boolean): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_events')
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Event featured flag is missing in the database. Run db/024_event_featured_flag.sql and try again.';
      }
      return error.message;
    }

    return null;
  }

  async updateHostWorkspaceEventDetail(
    profileId: string,
    eventId: string,
    payload: UpdateHostWorkspaceEventDetailPayload,
  ): Promise<string | null> {
    const hosts = await this.getAccessibleHosts(profileId);
    const hostIds = hosts.map((host) => host.id);

    if (hostIds.length === 0) {
      return 'You do not have access to this event.';
    }

    const hostAssignmentResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes')
      .eq('event_id', eventId)
      .in('host_id', hostIds);

    if (hostAssignmentResult.error) {
      if (this.isMissingSchemaError(hostAssignmentResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return hostAssignmentResult.error.message;
    }

    const hostAssignment = ((hostAssignmentResult.data ?? []) as any[])[0];
    if (!hostAssignment?.host_id) {
      return 'You do not have access to this event.';
    }

    const eventResult = await this.adminSupabase
      .from('tjs_events')
      .select('id, parent_event_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventResult.error) {
      if (this.isMissingSchemaError(eventResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return eventResult.error.message;
    }

    if (!eventResult.data?.id) {
      return 'Event not found.';
    }

    const [editionOptions, eventTypeOptions] = await Promise.all([
      this.listConcreteEventEditionOptions(),
      this.listEventTypeOptions(),
    ]);

    const selectedEdition = editionOptions.find((item) => item.id === payload.editionId) ?? null;
    const selectedEventType = eventTypeOptions.find((item) => item.id === payload.eventTypeId) ?? null;
    const showTime = this.extractNoteValue((hostAssignment.notes as string | null | undefined) ?? '', 'Show Time:');
    const notes = this.mergeStructuredHostNotes((hostAssignment.notes as string | null | undefined) ?? '', {
      edition: selectedEdition?.label ?? selectedEdition?.name ?? null,
      eventType: selectedEventType?.name ?? null,
      showTime,
      callToActionUrl: payload.callToActionUrl.trim() || null,
      hostNotes: payload.hostNotes,
    });
    const visibilityScope = this.buildEventVisibilityScope(payload.isMemberOnly);
    const timestamp = new Date().toISOString();

    if (eventResult.data.parent_event_id) {
      const { error: requestError } = await this.adminSupabase
        .from('tjs_artist_requests')
        .update({
          event_domain_id: payload.eventDomainId,
          teaser: payload.teaser.trim() || null,
          description: payload.description.trim() || null,
          updated_at: timestamp,
        })
        .eq('id', eventResult.data.parent_event_id);

      if (requestError) {
        if (this.isMissingSchemaError(requestError)) {
          return 'Artist request tables are missing in the database. Run the request schema migrations and try again.';
        }
        return requestError.message;
      }
    }

    const { error: eventError } = await this.adminSupabase
      .from('tjs_events')
      .update({
        title: payload.title.trim() || null,
        description: payload.teaser.trim() || payload.description.trim() || null,
        visibility_scope: visibilityScope,
        updated_at: timestamp,
      })
      .eq('id', eventId);

    if (eventError) {
      if (this.isMissingSchemaError(eventError)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return eventError.message;
    }

    const { error: hostNotesError } = await this.adminSupabase
      .from('tjs_event_hosts')
      .update({
        notes: notes || null,
      })
      .eq('event_id', eventId)
      .eq('host_id', hostAssignment.host_id as number);

    if (hostNotesError) {
      if (this.isMissingSchemaError(hostNotesError)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return hostNotesError.message;
    }

    return null;
  }

  async updateAdminWorkspaceEventDetail(
    eventId: string,
    payload: UpdateHostWorkspaceEventDetailPayload,
  ): Promise<string | null> {
    const hostAssignmentResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes')
      .eq('event_id', eventId)
      .limit(1)
      .maybeSingle();

    if (hostAssignmentResult.error) {
      if (this.isMissingSchemaError(hostAssignmentResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return hostAssignmentResult.error.message;
    }

    const eventResult = await this.adminSupabase
      .from('tjs_events')
      .select('id, parent_event_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventResult.error) {
      if (this.isMissingSchemaError(eventResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return eventResult.error.message;
    }

    if (!eventResult.data?.id) {
      return 'Event not found.';
    }

    const [editionOptions, eventTypeOptions] = await Promise.all([
      this.listConcreteEventEditionOptions(),
      this.listEventTypeOptions(),
    ]);

    const selectedEdition = editionOptions.find((item) => item.id === payload.editionId) ?? null;
    const selectedEventType = eventTypeOptions.find((item) => item.id === payload.eventTypeId) ?? null;
    const existingNotes = (hostAssignmentResult.data?.notes as string | null | undefined) ?? '';
    const showTime = this.extractNoteValue(existingNotes, 'Show Time:');
    const notes = this.mergeStructuredHostNotes(existingNotes, {
      edition: selectedEdition?.label ?? selectedEdition?.name ?? null,
      eventType: selectedEventType?.name ?? null,
      showTime,
      callToActionUrl: payload.callToActionUrl.trim() || null,
      hostNotes: payload.hostNotes,
    });
    const visibilityScope = this.buildEventVisibilityScope(payload.isMemberOnly);
    const timestamp = new Date().toISOString();

    if (eventResult.data.parent_event_id) {
      const { error: requestError } = await this.adminSupabase
        .from('tjs_artist_requests')
        .update({
          event_domain_id: payload.eventDomainId,
          teaser: payload.teaser.trim() || null,
          description: payload.description.trim() || null,
          updated_at: timestamp,
        })
        .eq('id', eventResult.data.parent_event_id);

      if (requestError) {
        if (this.isMissingSchemaError(requestError)) {
          return 'Artist request tables are missing in the database. Run the request schema migrations and try again.';
        }
        return requestError.message;
      }
    }

    const { error: eventError } = await this.adminSupabase
      .from('tjs_events')
      .update({
        title: payload.title.trim() || null,
        description: payload.teaser.trim() || payload.description.trim() || null,
        visibility_scope: visibilityScope,
        updated_at: timestamp,
      })
      .eq('id', eventId);

    if (eventError) {
      if (this.isMissingSchemaError(eventError)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return eventError.message;
    }

    if (hostAssignmentResult.data?.host_id) {
      const { error: hostNotesError } = await this.adminSupabase
        .from('tjs_event_hosts')
        .update({
          notes: notes || null,
        })
        .eq('event_id', eventId)
        .eq('host_id', hostAssignmentResult.data.host_id as number);

      if (hostNotesError) {
        if (this.isMissingSchemaError(hostNotesError)) {
          return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
        }
        return hostNotesError.message;
      }
    }

    return null;
  }

  async appendHostWorkspaceEventComment(profileId: string, eventId: string, commentBody: string): Promise<string | null> {
    const hosts = await this.getAccessibleHosts(profileId);
    const hostIds = hosts.map((host) => host.id);

    if (hostIds.length === 0) {
      return 'You do not have access to this event.';
    }

    const hostAssignmentResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes')
      .eq('event_id', eventId)
      .in('host_id', hostIds)
      .maybeSingle();

    if (hostAssignmentResult.error) {
      return hostAssignmentResult.error.message;
    }

    if (!hostAssignmentResult.data?.host_id) {
      return 'You do not have access to this event.';
    }

    const existingNotes = (hostAssignmentResult.data.notes as string | null | undefined) ?? '';
    const freeformNotes = this.extractFreeformHostNotes(existingNotes);
    const nextHostNotes = [freeformNotes, commentBody.trim()].filter(Boolean).join('\n');
    const notes = this.mergeStructuredHostNotes(existingNotes, {
      eventDomain: this.extractNoteValue(existingNotes, 'Event Domain:'),
      edition: this.extractNoteValue(existingNotes, 'Edition:'),
      eventType: this.extractNoteValue(existingNotes, 'Event Type:'),
      showTime: this.extractNoteValue(existingNotes, 'Show Time:'),
      eventImageUrl: this.extractNoteValue(existingNotes, 'Event Image:'),
      callToActionUrl: this.extractNoteValue(existingNotes, 'Call to Action URL:'),
      hostNotes: nextHostNotes,
    });

    const { error } = await this.adminSupabase
      .from('tjs_event_hosts')
      .update({ notes: notes || null })
      .eq('event_id', eventId)
      .eq('host_id', hostAssignmentResult.data.host_id as number);

    return error ? error.message : null;
  }

  async appendAdminWorkspaceEventComment(eventId: string, commentBody: string): Promise<string | null> {
    const hostAssignmentResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes')
      .eq('event_id', eventId)
      .limit(1)
      .maybeSingle();

    if (hostAssignmentResult.error) {
      return hostAssignmentResult.error.message;
    }

    if (!hostAssignmentResult.data?.host_id) {
      return 'The event is missing an assigned host.';
    }

    const existingNotes = (hostAssignmentResult.data.notes as string | null | undefined) ?? '';
    const freeformNotes = this.extractFreeformHostNotes(existingNotes);
    const nextHostNotes = [freeformNotes, commentBody.trim()].filter(Boolean).join('\n');
    const notes = this.mergeStructuredHostNotes(existingNotes, {
      eventDomain: this.extractNoteValue(existingNotes, 'Event Domain:'),
      edition: this.extractNoteValue(existingNotes, 'Edition:'),
      eventType: this.extractNoteValue(existingNotes, 'Event Type:'),
      showTime: this.extractNoteValue(existingNotes, 'Show Time:'),
      eventImageUrl: this.extractNoteValue(existingNotes, 'Event Image:'),
      callToActionUrl: this.extractNoteValue(existingNotes, 'Call to Action URL:'),
      hostNotes: nextHostNotes,
    });

    const { error } = await this.adminSupabase
      .from('tjs_event_hosts')
      .update({ notes: notes || null })
      .eq('event_id', eventId)
      .eq('host_id', hostAssignmentResult.data.host_id as number);

    return error ? error.message : null;
  }

  async updateHostWorkspaceEventImage(profileId: string, eventId: string, imageUrl: string | null): Promise<string | null> {
    const hosts = await this.getAccessibleHosts(profileId);
    const hostIds = hosts.map((host) => host.id);

    if (hostIds.length === 0) {
      return 'You do not have access to this event.';
    }

    const hostAssignmentResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id')
      .eq('event_id', eventId)
      .in('host_id', hostIds);

    if (hostAssignmentResult.error) {
      if (this.isMissingSchemaError(hostAssignmentResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return hostAssignmentResult.error.message;
    }

    const hostAssignment = ((hostAssignmentResult.data ?? []) as any[])[0];
    if (!hostAssignment?.host_id) {
      return 'You do not have access to this event.';
    }

    const eventResult = await this.adminSupabase
      .from('tjs_events')
      .select('id, parent_event_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventResult.error) {
      if (this.isMissingSchemaError(eventResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return eventResult.error.message;
    }

    if (!eventResult.data?.parent_event_id) {
      const hostAssignmentResultWithNotes = await this.adminSupabase
        .from('tjs_event_hosts')
        .select('host_id, notes')
        .eq('event_id', eventId)
        .in('host_id', hostIds)
        .maybeSingle();

      if (hostAssignmentResultWithNotes.error || !hostAssignmentResultWithNotes.data?.host_id) {
        return hostAssignmentResultWithNotes.error?.message ?? 'You do not have access to this event.';
      }

      const notes = this.mergeStructuredHostNotes((hostAssignmentResultWithNotes.data.notes as string | null | undefined) ?? '', {
        edition: this.extractNoteValue((hostAssignmentResultWithNotes.data.notes as string | null | undefined) ?? '', 'Edition:'),
        eventType: this.extractNoteValue((hostAssignmentResultWithNotes.data.notes as string | null | undefined) ?? '', 'Event Type:'),
        showTime: this.extractNoteValue((hostAssignmentResultWithNotes.data.notes as string | null | undefined) ?? '', 'Show Time:'),
        eventImageUrl: imageUrl,
        callToActionUrl: this.extractNoteValue((hostAssignmentResultWithNotes.data.notes as string | null | undefined) ?? '', 'Call to Action URL:'),
        hostNotes: null,
      });

      const { error: hostNotesError } = await this.adminSupabase
        .from('tjs_event_hosts')
        .update({ notes: notes || null })
        .eq('event_id', eventId)
        .eq('host_id', hostAssignmentResultWithNotes.data.host_id as number);

      return hostNotesError ? hostNotesError.message : null;
    }

    const { error } = await this.adminSupabase
      .from('tjs_artist_requests')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventResult.data.parent_event_id);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist request tables are missing in the database. Run the request schema migrations and try again.';
      }
      return error.message;
    }

    return null;
  }

  async updateAdminWorkspaceEventImage(eventId: string, imageUrl: string | null): Promise<string | null> {
    const eventResult = await this.adminSupabase
      .from('tjs_events')
      .select('id, parent_event_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventResult.error) {
      if (this.isMissingSchemaError(eventResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return eventResult.error.message;
    }

    if (!eventResult.data?.parent_event_id) {
      const hostAssignmentResult = await this.adminSupabase
        .from('tjs_event_hosts')
        .select('host_id, notes')
        .eq('event_id', eventId)
        .limit(1)
        .maybeSingle();

      if (hostAssignmentResult.error || !hostAssignmentResult.data?.host_id) {
        return hostAssignmentResult.error?.message ?? 'The event is missing an assigned host.';
      }

      const existingNotes = (hostAssignmentResult.data.notes as string | null | undefined) ?? '';
      const notes = this.mergeStructuredHostNotes(existingNotes, {
        edition: this.extractNoteValue(existingNotes, 'Edition:'),
        eventType: this.extractNoteValue(existingNotes, 'Event Type:'),
        showTime: this.extractNoteValue(existingNotes, 'Show Time:'),
        eventImageUrl: imageUrl,
        callToActionUrl: this.extractNoteValue(existingNotes, 'Call to Action URL:'),
        hostNotes: null,
      });

      const { error: hostNotesError } = await this.adminSupabase
        .from('tjs_event_hosts')
        .update({ notes: notes || null })
        .eq('event_id', eventId)
        .eq('host_id', hostAssignmentResult.data.host_id as number);

      return hostNotesError ? hostNotesError.message : null;
    }

    const { error } = await this.adminSupabase
      .from('tjs_artist_requests')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventResult.data.parent_event_id);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist request tables are missing in the database. Run the request schema migrations and try again.';
      }
      return error.message;
    }

    return null;
  }

  async updateHostWorkspaceEventSchedule(
    profileId: string,
    eventId: string,
    payload: UpdateHostWorkspaceEventSchedulePayload,
  ): Promise<string | null> {
    const hosts = await this.getAccessibleHosts(profileId);
    const hostIds = hosts.map((host) => host.id);

    if (hostIds.length === 0) {
      return 'You do not have access to this event.';
    }

    const hostAssignmentResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes')
      .eq('event_id', eventId)
      .in('host_id', hostIds);

    if (hostAssignmentResult.error) {
      if (this.isMissingSchemaError(hostAssignmentResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return hostAssignmentResult.error.message;
    }

    const hostAssignment = ((hostAssignmentResult.data ?? []) as any[])[0];
    if (!hostAssignment?.host_id) {
      return 'You do not have access to this event.';
    }

    let persistedLocationId: string | null = null;
    if (payload.locationId) {
      const publicLocation = await this.getPublicLocationById(payload.locationId);
      if (publicLocation) {
        persistedLocationId = payload.locationId;
      } else {
        const privateLocation = await this.getPrivateLocationById(payload.locationId, profileId);
        if (!privateLocation) {
          return 'The selected location could not be found. Choose a valid public or private location and try again.';
        }
      }
    }

    const notes = this.mergeStructuredHostNotes((hostAssignment.notes as string | null | undefined) ?? '', {
      edition: this.extractNoteValue((hostAssignment.notes as string | null | undefined) ?? '', 'Edition:'),
      eventType: this.extractNoteValue((hostAssignment.notes as string | null | undefined) ?? '', 'Event Type:'),
      showTime: payload.showTime.trim() || null,
      hostNotes: null,
      scheduleEntries: payload.entries,
    });
    const selectedDates = payload.entries.flatMap((entry) =>
      entry.mode === 'period'
        ? [entry.startDate, entry.endDate].filter(Boolean)
        : [entry.startDate].filter(Boolean)
    );

    const { error } = await this.adminSupabase
      .from('tjs_event_hosts')
      .update({
        selected_dates: selectedDates,
        location_id: persistedLocationId,
        notes: notes || null,
      })
      .eq('event_id', eventId)
      .eq('host_id', hostAssignment.host_id as number);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return error.message;
    }

    return null;
  }

  async updateAdminWorkspaceEventSchedule(
    eventId: string,
    payload: UpdateHostWorkspaceEventSchedulePayload,
  ): Promise<string | null> {
    const hostAssignmentResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes')
      .eq('event_id', eventId)
      .limit(1)
      .maybeSingle();

    if (hostAssignmentResult.error) {
      if (this.isMissingSchemaError(hostAssignmentResult.error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return hostAssignmentResult.error.message;
    }

    if (!hostAssignmentResult.data?.host_id) {
      return 'The event is missing an assigned host.';
    }

    let persistedLocationId: string | null = null;
    if (payload.locationId) {
      const publicLocation = await this.getPublicLocationById(payload.locationId);
      if (publicLocation) {
        persistedLocationId = payload.locationId;
      } else {
        const privateLocations = await this.getPrivateLocationsForHost(hostAssignmentResult.data.host_id as number);
        const privateLocation = privateLocations.find((location) => location.id === payload.locationId) ?? null;
        if (!privateLocation) {
          return 'The selected location could not be found. Choose a valid public or private location and try again.';
        }
      }
    }

    const existingNotes = (hostAssignmentResult.data.notes as string | null | undefined) ?? '';
    const notes = this.mergeStructuredHostNotes(existingNotes, {
      edition: this.extractNoteValue(existingNotes, 'Edition:'),
      eventType: this.extractNoteValue(existingNotes, 'Event Type:'),
      showTime: payload.showTime.trim() || null,
      hostNotes: null,
      scheduleEntries: payload.entries,
    });
    const selectedDates = payload.entries.flatMap((entry) =>
      entry.mode === 'period'
        ? [entry.startDate, entry.endDate].filter(Boolean)
        : [entry.startDate].filter(Boolean)
    );

    const { error } = await this.adminSupabase
      .from('tjs_event_hosts')
      .update({
        selected_dates: selectedDates,
        location_id: persistedLocationId,
        notes: notes || null,
      })
      .eq('event_id', eventId)
      .eq('host_id', hostAssignmentResult.data.host_id as number);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and db/024_event_featured_flag.sql and try again.';
      }
      return error.message;
    }

    return null;
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
      .select('id, profile_id, payment_date, expires_at, is_active, amount, tier, currency, notes, recorded_by, created_at, updated_at')
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
      tier: row.tier ?? null,
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

  async getLatestMembershipPaymentForProfile(profileId: string): Promise<MembershipPaymentRecord | null> {
    const { data, error } = await this.adminSupabase
      .from('tjs_membership_payments')
      .select('id, profile_id, payment_date, expires_at, is_active, amount, tier, currency, notes, recorded_by, created_at, updated_at')
      .eq('profile_id', profileId)
      .order('payment_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error('getLatestMembershipPaymentForProfile error:', error.message);
      }
      return null;
    }

    const lookupIds = [data.profile_id, data.recorded_by].filter((value): value is string => !!value);
    const profileLookupResult = lookupIds.length > 0
      ? await this.adminSupabase
          .from('tjs_profiles')
          .select('id, full_name, email')
          .in('id', lookupIds)
      : { data: [] as any[] };

    const profilesById = new Map<string, { full_name: string | null; email: string | null }>();
    for (const profile of ((profileLookupResult.data ?? []) as any[])) {
      profilesById.set(profile.id, {
        full_name: profile.full_name ?? null,
        email: profile.email ?? null,
      });
    }

    return {
      id: data.id,
      profile_id: data.profile_id,
      payment_date: data.payment_date,
      expires_at: data.expires_at,
      is_active: !!data.is_active,
      amount: data.amount ?? null,
      tier: data.tier ?? null,
      currency: data.currency ?? null,
      notes: data.notes ?? null,
      recorded_by: data.recorded_by ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_name: profilesById.get(data.profile_id)?.full_name ?? null,
      user_email: profilesById.get(data.profile_id)?.email ?? null,
      recorded_by_name: data.recorded_by ? (profilesById.get(data.recorded_by)?.full_name ?? null) : null,
    };
  }

  async recordMembershipPayment(
    userId: string,
    paymentDate: string,
    recordedBy: string,
    options?: {
      amount?: number | null;
      tier?: string | null;
      currency?: string | null;
      durationDays?: number | null;
    }
  ): Promise<{ expiryDate: string | null; error: string | null }> {
    const normalizedPaymentDate = paymentDate.trim();
    if (!normalizedPaymentDate) {
      return { expiryDate: null, error: 'Payment date is required.' };
    }

    const { data: existingProfile, error: existingProfileError } = await this.adminSupabase
      .from('tjs_profiles')
      .select('id, full_name, email, is_member, member_until')
      .eq('id', userId)
      .single();

    if (existingProfileError || !existingProfile) {
      console.error('recordMembershipPayment profile error:', existingProfileError?.message);
      return { expiryDate: null, error: existingProfileError?.message ?? 'User profile not found.' };
    }

    const userRoles = await this.getUserRoles(userId);
    const isPublicMember = userRoles.some((role) => role.name === 'Public Member');
    const durationDays = options?.durationDays ?? null;
    const membershipBaseDate = isPublicMember
      ? this.resolveMembershipExtensionBaseDate(normalizedPaymentDate, existingProfile.member_until ?? null)
      : normalizedPaymentDate;
    const expiryDate = isPublicMember
      ? (
        typeof durationDays === 'number' && Number.isInteger(durationDays) && durationDays > 0
          ? this.addDays(membershipBaseDate, durationDays)
          : this.addOneMonth(membershipBaseDate)
      )
      : this.addTwelveMonths(normalizedPaymentDate);

    const previousState = this.membershipStateFromProfile(existingProfile as Pick<TjsProfile, 'is_member' | 'member_until'>);

    const { error: paymentError } = await this.adminSupabase
      .from('tjs_membership_payments')
      .insert({
        profile_id: userId,
        payment_date: normalizedPaymentDate,
        expires_at: expiryDate,
        is_active: true,
        amount: options?.amount ?? null,
        tier: options?.tier?.trim() || 'TJS Member',
        currency: options?.currency?.trim() || 'EUR',
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

  async deleteMembershipPayment(
    paymentId: string,
    actorUserId: string,
  ): Promise<{ error: string | null }> {
    const { data: payment, error: paymentError } = await this.adminSupabase
      .from('tjs_membership_payments')
      .select('id, profile_id')
      .eq('id', paymentId)
      .maybeSingle();

    if (paymentError) {
      console.error('deleteMembershipPayment lookup error:', paymentError.message);
      return { error: paymentError.message };
    }

    if (!payment?.profile_id) {
      return { error: 'Payment record not found.' };
    }

    const { error: deleteError } = await this.adminSupabase
      .from('tjs_membership_payments')
      .delete()
      .eq('id', paymentId);

    if (deleteError) {
      console.error('deleteMembershipPayment delete error:', deleteError.message);
      return { error: deleteError.message };
    }

    const recalculateError = await this.recalculateMembershipProfile(payment.profile_id, actorUserId);
    if (recalculateError) {
      return { error: recalculateError };
    }

    return { error: null };
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

  async activateInvitedArtistAccount(
    artistId: string,
  ): Promise<{ temporaryPassword: string | null; error: string | null }> {
    const artistResult = await this.adminSupabase
      .from('tjs_artists')
      .select('id, profile_id, artist_name, activation_status, profile:tjs_profiles(email, full_name)')
      .eq('id', artistId)
      .maybeSingle();

    if (artistResult.error) {
      console.error('activateInvitedArtistAccount artist lookup error:', artistResult.error.message);
      return { temporaryPassword: null, error: artistResult.error.message };
    }

    const artist = artistResult.data as any;
    if (!artist?.id || !artist?.profile_id) {
      return { temporaryPassword: null, error: 'This invited artist does not have a linked account yet.' };
    }

    const email = (artist.profile?.email as string | null | undefined)?.trim().toLowerCase() ?? '';
    if (!email) {
      return { temporaryPassword: null, error: 'This invited artist does not have a valid email address.' };
    }

    if ((artist.activation_status as string | null) === 'inactive') {
      const reactivationError = await this.reactivateUser(artist.profile_id as string);
      if (reactivationError) {
        return { temporaryPassword: null, error: reactivationError };
      }
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const { error: authError } = await this.adminSupabase.auth.admin.updateUserById(artist.profile_id as string, {
      password: temporaryPassword,
      email_confirm: true,
      ban_duration: 'none',
      user_metadata: {
        full_name: (artist.profile?.full_name as string | null | undefined)
          ?? (artist.artist_name as string | null | undefined)
          ?? undefined,
      },
    });

    if (authError) {
      console.error('activateInvitedArtistAccount auth update error:', authError.message);
      return { temporaryPassword: null, error: authError.message };
    }

    const { error: updateError } = await this.adminSupabase
      .from('tjs_artists')
      .update({
        activation_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', artistId);

    if (updateError) {
      console.error('activateInvitedArtistAccount artist update error:', updateError.message);
      return { temporaryPassword: null, error: updateError.message };
    }

    return { temporaryPassword, error: null };
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

  async listMemberTiers(): Promise<MemberTier[]> {
    const { data, error } = await this.adminSupabase
      .from('sys_member_tiers')
      .select('id, name, description, created_at')
      .order('name', { ascending: true });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('listMemberTiers error:', error.message);
      }
      return [];
    }

    return (data ?? []) as MemberTier[];
  }

  async createMemberTier(input: { name: string; description?: string | null }): Promise<{ tier: MemberTier | null; error: string | null }> {
    const name = input.name.trim();
    if (!name) {
      return { tier: null, error: 'Tier name is required.' };
    }

    const { data, error } = await this.adminSupabase
      .from('sys_member_tiers')
      .insert({
        name,
        description: input.description?.trim() || null,
      })
      .select('id, name, description, created_at')
      .single();

    if (error) {
      console.error('createMemberTier error:', error.message);
      return { tier: null, error: error.message };
    }

    return { tier: data as MemberTier, error: null };
  }

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

  async getPrivateLocations(profileId?: string): Promise<TjsPrivateLocation[]> {
    if (!profileId) {
      return [];
    }

    const hostIds = await this.resolvePrivateLocationHostIds(profileId);
    if (hostIds.length === 0) {
      return [];
    }

    let query = this.adminSupabase
      .from('tjs_private_locations')
      .select(`
        *,
        images:tjs_private_location_images(id, image_url, sort_order),
        amenity_links:tjs_private_location_amenities(amenity:sys_location_amenity(id, name)),
        spec_links:tjs_private_location_specs(spec:sys_location_specs(id, name)),
        type_links:tjs_private_location_types(location_type:sys_location_types(id, name))
      `)
      .order('created_at', { ascending: false });

    query = query.in('id_host', hostIds);

    const { data, error } = await query;

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getPrivateLocations error:', error.message);
      }
      return [];
    }

    return this.enrichPrivateLocationsWithTypes(((data ?? []) as any[]).map((row) => this.mapPrivateLocationRow(row)));
  }

  async getAllPrivateLocations(): Promise<TjsPrivateLocation[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_private_locations')
      .select(`
        *,
        images:tjs_private_location_images(id, image_url, sort_order),
        amenity_links:tjs_private_location_amenities(amenity:sys_location_amenity(id, name)),
        spec_links:tjs_private_location_specs(spec:sys_location_specs(id, name)),
        type_links:tjs_private_location_types(location_type:sys_location_types(id, name))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getAllPrivateLocations error:', error.message);
      }
      return [];
    }

    return this.enrichPrivateLocationsWithTypes(((data ?? []) as any[]).map((row) => this.mapPrivateLocationRow(row)));
  }

  async getPrivateLocationsForHost(hostId: number): Promise<TjsPrivateLocation[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_private_locations')
      .select(`
        *,
        images:tjs_private_location_images(id, image_url, sort_order),
        amenity_links:tjs_private_location_amenities(amenity:sys_location_amenity(id, name)),
        spec_links:tjs_private_location_specs(spec:sys_location_specs(id, name)),
        type_links:tjs_private_location_types(location_type:sys_location_types(id, name))
      `)
      .eq('id_host', hostId)
      .order('created_at', { ascending: false });

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getPrivateLocationsForHost error:', error.message);
      }
      return [];
    }

    return this.enrichPrivateLocationsWithTypes(((data ?? []) as any[]).map((row) => this.mapPrivateLocationRow(row)));
  }

  async getPrivateLocationById(locationId: string, profileId?: string): Promise<TjsPrivateLocation | null> {
    let query = this.adminSupabase
      .from('tjs_private_locations')
      .select(`
        *,
        images:tjs_private_location_images(id, image_url, sort_order),
        amenity_links:tjs_private_location_amenities(amenity:sys_location_amenity(id, name)),
        spec_links:tjs_private_location_specs(spec:sys_location_specs(id, name)),
        type_links:tjs_private_location_types(location_type:sys_location_types(id, name))
      `)
      .eq('id', locationId);

    const hostIds = await this.resolvePrivateLocationHostIds(profileId);
    if (profileId) {
      if (hostIds.length === 0) {
        return null;
      }
      query = query.in('id_host', hostIds);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getPrivateLocationById error:', error.message);
      }
      return null;
    }

    if (!data) {
      return null;
    }

    const [location] = await this.enrichPrivateLocationsWithTypes([this.mapPrivateLocationRow(data)]);
    return location ?? null;
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

  async createPrivateLocation(location: SaveTjsPrivateLocationInput): Promise<{ id: string | null; error: string | null }> {
    const { data, error } = await this.adminSupabase
      .from('tjs_private_locations')
      .insert(this.buildPrivateLocationPayload(location, false))
      .select('id')
      .single();

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return { id: null, error: 'Private location tables are missing in the database. Run db/025_tjs_private_locations.sql and try again.' };
      }

      console.error('createPrivateLocation error:', error.message);
      return { id: null, error: error.message };
    }

    const relationError = await this.syncPrivateLocationRelations(data.id, location);
    if (relationError) {
      return { id: data.id, error: relationError };
    }

    return { id: data.id, error: null };
  }

  async createPrivateLocationForHost(
    hostId: number,
    location: Omit<SaveTjsPrivateLocationInput, 'id_host'>
  ): Promise<{ id: string | null; error: string | null }> {
    return this.createPrivateLocation({
      ...location,
      id_host: hostId,
    });
  }

  async updatePrivateLocation(locationId: string, location: SaveTjsPrivateLocationInput): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_private_locations')
      .update(this.buildPrivateLocationPayload(location, true))
      .eq('id', locationId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Private location tables are missing in the database. Run db/025_tjs_private_locations.sql and try again.';
      }

      console.error('updatePrivateLocation error:', error.message);
      return error.message;
    }

    return this.syncPrivateLocationRelations(locationId, location);
  }

  async deletePrivateLocation(locationId: string): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_private_locations')
      .delete()
      .eq('id', locationId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Private location tables are missing in the database. Run db/025_tjs_private_locations.sql and try again.';
      }

      console.error('deletePrivateLocation error:', error.message);
      return error.message;
    }

    return null;
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

  async updateArtistWorkspaceRequestStatus(
    profileId: string,
    requestId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_artist_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('created_by', profileId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.';
      }
      console.error('updateArtistWorkspaceRequestStatus error:', error.message);
      return error.message;
    }

    return null;
  }

  async releaseHostArtistRequest(requestId: string): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_artist_requests')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.';
      }
      console.error('releaseHostArtistRequest error:', error.message);
      return error.message;
    }

    return null;
  }

  async getArtistWorkspaceEventDetail(profileId: string, eventId: string): Promise<HostWorkspaceEventDetail | null> {
    const events = await this.getArtistWorkspaceEvents(profileId);
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      return null;
    }

    const hostNotesResult = await this.adminSupabase
      .from('tjs_event_hosts')
      .select('host_id, notes, selected_dates, location_id, location:tjs_locations(name, city, address)')
      .eq('event_id', eventId);

    if (hostNotesResult.error && !this.isMissingSchemaError(hostNotesResult.error)) {
      console.error('getArtistWorkspaceEventDetail host notes error:', hostNotesResult.error.message);
    }

    const hostRow = ((hostNotesResult.data ?? []) as any[])[0];

    const requestDetail = event.parent_event_id
      ? await this.getArtistWorkspaceRequestDetail(event.parent_event_id)
      : null;

    const scheduleEntries = this.extractScheduleEntries(
      (hostRow?.notes as string | null | undefined) ?? '',
      Array.isArray(hostRow?.selected_dates)
        ? (hostRow.selected_dates as string[])
        : (event.selected_dates ?? []),
    );

    return {
      ...event,
      host_notes: (hostRow?.notes as string | null | undefined) ?? null,
      all_dates: scheduleEntries.flatMap((entry) =>
        entry.mode === 'period' ? [entry.start_date, entry.end_date].filter(Boolean) : [entry.start_date].filter(Boolean)
      ),
      show_time: this.extractNoteValue((hostRow?.notes as string | null | undefined) ?? '', 'Show Time:'),
      call_to_action_url: this.extractNoteValue((hostRow?.notes as string | null | undefined) ?? '', 'Call to Action URL:'),
      location_id: (hostRow?.location_id as string | null | undefined) ?? null,
      location_name: (hostRow?.location?.name as string | null | undefined)
        || (hostRow?.location?.city as string | null | undefined)
        || (hostRow?.location?.address as string | null | undefined)
        || this.extractPrimaryScheduleLocationLabel((hostRow?.notes as string | null | undefined) ?? '')
        || null,
      instruments: Array.from(new Set([
        ...(event.instruments ?? []),
        ...this.extractAdditionalInstruments((hostRow?.notes as string | null | undefined) ?? ''),
      ])),
      schedule_entries: scheduleEntries,
      request_detail: requestDetail,
    };
  }

  async getHostPrivateLocationBookings(profileId: string | undefined, locationId: string): Promise<HostPrivateLocationBookingItem[]> {
    const [scopedEvents, hostIds] = profileId
      ? await Promise.all([
          this.getHostWorkspaceEvents(profileId),
          this.getAccessibleHosts(profileId).then((hosts) => hosts.map((host) => host.id)),
        ])
      : await Promise.all([
          this.getAdminEventOverview().then((items) =>
            items
              .filter((item) => item.event_type === 'EVENT_INSTANCE')
              .map((item) => ({
                id: item.id,
                title: item.title,
                status: item.status,
                artist_names: item.artist_names,
                instruments: [] as string[],
                primary_upcoming_date: this.pickPrimaryUpcomingDate(item.selected_dates),
                selected_dates: item.selected_dates,
              }))
          ),
          Promise.resolve([] as number[]),
        ]);

    if (scopedEvents.length === 0) {
      return [];
    }

    const eventIds = scopedEvents.map((event) => event.id);
    let assignmentQuery = this.adminSupabase
      .from('tjs_event_hosts')
      .select('event_id, host_id, notes, selected_dates, location_id')
      .in('event_id', eventIds);

    if (hostIds.length > 0) {
      assignmentQuery = assignmentQuery.in('host_id', hostIds);
    }

    const assignmentResult = await assignmentQuery;

    if (assignmentResult.error) {
      if (this.isMissingSchemaError(assignmentResult.error)) {
        return [];
      }
      console.error('getHostPrivateLocationBookings assignments error:', assignmentResult.error.message);
      return [];
    }

    const [publicLocationResult, privateLocationResult] = await Promise.all([
      this.adminSupabase
        .from('tjs_locations')
        .select('id, name, city, address')
        .eq('id', locationId)
        .maybeSingle(),
      this.adminSupabase
        .from('tjs_private_locations')
        .select('id, name, city, address')
        .eq('id', locationId)
        .maybeSingle(),
    ]);

    const locationLabel =
      (privateLocationResult.data?.name as string | undefined)
      || (privateLocationResult.data?.city as string | undefined)
      || (privateLocationResult.data?.address as string | undefined)
      || (publicLocationResult.data?.name as string | undefined)
      || (publicLocationResult.data?.city as string | undefined)
      || (publicLocationResult.data?.address as string | undefined)
      || null;
    const locationAliases = new Set(
      [
        privateLocationResult.data?.name,
        privateLocationResult.data?.city,
        privateLocationResult.data?.address,
        publicLocationResult.data?.name,
        publicLocationResult.data?.city,
        publicLocationResult.data?.address,
      ]
        .map((value) => this.normalizeLocationComparisonValue(value))
        .filter((value): value is string => !!value),
    );

    const eventsById = new Map(scopedEvents.map((event) => [event.id, event]));

    return ((assignmentResult.data ?? []) as Array<{
      event_id?: string | null;
      notes?: string | null;
      selected_dates?: string[] | null;
      location_id?: string | null;
    }>)
      .filter((assignment) => {
        if ((assignment.location_id ?? null) === locationId) {
          return true;
        }

        if (assignment.location_id) {
          return false;
        }

        const scheduleLocation = this.normalizeLocationComparisonValue(
          this.extractPrimaryScheduleLocationLabel(assignment.notes ?? ''),
        );
        return !!scheduleLocation && locationAliases.has(scheduleLocation);
      })
      .map((assignment) => {
        const eventId = assignment.event_id ?? null;
        if (!eventId) {
          return null;
        }

        const event = eventsById.get(eventId);
        if (!event) {
          return null;
        }

        const scheduleEntries = this.extractScheduleEntries(
          assignment.notes ?? '',
          Array.isArray(assignment.selected_dates) ? assignment.selected_dates : event.selected_dates,
        );
        const bookedDates = scheduleEntries.flatMap((entry) => this.expandScheduleEntryDates(entry));

        return {
          event_id: event.id,
          title: event.title,
          status: event.status,
          artist_names: event.artist_names,
          instruments: event.instruments,
          primary_upcoming_date: event.primary_upcoming_date,
          show_time: this.extractNoteValue(assignment.notes ?? '', 'Show Time:'),
          location_id: locationId,
          location_name: locationLabel,
          schedule_entries: scheduleEntries,
          booked_dates: Array.from(new Set(bookedDates)).sort((left, right) => left.localeCompare(right)),
        } satisfies HostPrivateLocationBookingItem;
      })
      .filter((item): item is HostPrivateLocationBookingItem => !!item)
      .sort((left, right) => {
        const leftDate = left.primary_upcoming_date ?? left.booked_dates[0] ?? '9999-12-31';
        const rightDate = right.primary_upcoming_date ?? right.booked_dates[0] ?? '9999-12-31';
        if (leftDate !== rightDate) {
          return leftDate.localeCompare(rightDate);
        }
        return left.title.localeCompare(right.title);
      });
  }

  async updateArtistRequestStatusById(
    requestId: string,
    status: 'pending' | 'accepted' | 'approved' | 'rejected'
  ): Promise<string | null> {
    const { error } = await this.adminSupabase
      .from('tjs_artist_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      if (this.isMissingSchemaError(error)) {
        return 'Artist request tables are missing in the database. Run db/021_artist_workspace_requests.sql.';
      }
      console.error('updateArtistRequestStatusById error:', error.message);
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

  async uploadPrivateLocationImage(profileId: string, file: File): Promise<{ url: string | null; error: string | null }> {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `private-locations/${profileId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await this.adminSupabase.storage
      .from('tjs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('uploadPrivateLocationImage error:', error.message);
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

  private mapPrivateLocationRow(row: any): TjsPrivateLocation {
    return {
      ...this.mapLocationRow(row),
      id_host: typeof row.id_host === 'number' ? row.id_host : null,
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

  private buildPrivateLocationPayload(location: SaveTjsPrivateLocationInput, isUpdate: boolean) {
    return {
      id_host: location.id_host,
      name: location.name.trim(),
      address: location.address?.trim() || null,
      lat: location.lat ?? null,
      long: location.long ?? null,
      description: location.description?.trim() || null,
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

  private async syncPrivateLocationRelations(locationId: string, location: SaveTjsPrivateLocationInput): Promise<string | null> {
    const relationTables = [
      'tjs_private_location_images',
      'tjs_private_location_amenities',
      'tjs_private_location_specs',
      'tjs_private_location_types',
    ] as const;

    for (const table of relationTables) {
      const { error } = await this.adminSupabase
        .from(table)
        .delete()
        .eq('location_id', locationId);

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Private location tables are missing in the database. Run db/025_tjs_private_locations.sql and try again.';
        }

        console.error(`syncPrivateLocationRelations delete ${table} error:`, error.message);
        return error.message;
      }
    }

    if (location.image_urls.length > 0) {
      const { error } = await this.adminSupabase
        .from('tjs_private_location_images')
        .insert(location.image_urls.slice(0, 5).map((imageUrl, index) => ({
          location_id: locationId,
          image_url: imageUrl,
          sort_order: index,
        })));

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Private location tables are missing in the database. Run db/025_tjs_private_locations.sql and try again.';
        }

        console.error('syncPrivateLocationRelations insert images error:', error.message);
        return error.message;
      }
    }

    if (location.amenity_ids.length > 0) {
      const { error } = await this.adminSupabase
        .from('tjs_private_location_amenities')
        .insert(location.amenity_ids.map((amenityId) => ({
          location_id: locationId,
          amenity_id: amenityId,
        })));

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Private location tables are missing in the database. Run db/025_tjs_private_locations.sql and try again.';
        }

        console.error('syncPrivateLocationRelations insert amenities error:', error.message);
        return error.message;
      }
    }

    if (location.spec_ids.length > 0) {
      const { error } = await this.adminSupabase
        .from('tjs_private_location_specs')
        .insert(location.spec_ids.map((specId) => ({
          location_id: locationId,
          spec_id: specId,
        })));

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Private location tables are missing in the database. Run db/025_tjs_private_locations.sql and try again.';
        }

        console.error('syncPrivateLocationRelations insert specs error:', error.message);
        return error.message;
      }
    }

    const locationTypeId = this.normalizeLookupId(location.location_type_id);
    if (locationTypeId) {
      const { error } = await this.adminSupabase
        .from('tjs_private_location_types')
        .insert({
          location_id: locationId,
          location_type_id: locationTypeId,
        });

      if (error) {
        if (this.isMissingSchemaError(error)) {
          return 'Private location tables are missing in the database. Run db/025_tjs_private_locations.sql and try again.';
        }

        console.error('syncPrivateLocationRelations insert type error:', error.message);
        return error.message;
      }
    }

    return null;
  }

  private async resolvePrivateLocationHostIds(profileId?: string): Promise<number[]> {
    if (!profileId) {
      return [];
    }

    const hosts = await this.getAccessibleHosts(profileId);
    return Array.from(new Set(hosts.map((host) => host.id)));
  }

  private async enrichPrivateLocationsWithTypes(locations: TjsPrivateLocation[]): Promise<TjsPrivateLocation[]> {
    if (locations.length === 0) {
      return locations;
    }

    const locationIds = locations.map((location) => location.id);
    const { data, error } = await this.adminSupabase
      .from('tjs_private_location_types')
      .select('location_id, location_type:sys_location_types(id, name)')
      .in('location_id', locationIds);

    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('enrichPrivateLocationsWithTypes error:', error.message);
      }
      return locations;
    }

    const typeMap = new Map<string, LocationLookupOption>();
    for (const row of (data ?? []) as Array<{ location_id?: string | null; location_type?: Array<LocationLookupOption | null> | LocationLookupOption | null }>) {
      const locationType = Array.isArray(row.location_type) ? row.location_type[0] : row.location_type;
      if (row.location_id && locationType?.id && locationType?.name) {
        typeMap.set(row.location_id, locationType);
      }
    }

    return locations.map((location) => ({
      ...location,
      location_type: typeMap.get(location.id) ?? location.location_type ?? null,
    }));
  }

  private normalizeLookupId(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

  async getAccessibleHosts(profileId: string): Promise<TjsHost[]> {
    const directHosts = await this.getMyHosts(profileId);

    const { data, error } = await this.adminSupabase
      .from('tjs_host_managers')
      .select('host:tjs_hosts(*)')
      .eq('manager_id', profileId)
      .eq('is_active', true);

    let managedHosts: TjsHost[] = [];
    if (error) {
      if (!this.isMissingSchemaError(error)) {
        console.error('getAccessibleHosts host manager lookup error:', error.message);
      }
      managedHosts = await this.getManagedHosts(profileId);
    } else {
      managedHosts = ((data ?? []) as any[])
        .map((row) => row.host as TjsHost | null)
        .filter((host): host is TjsHost => host !== null);

      if (managedHosts.length === 0) {
        managedHosts = await this.getManagedHosts(profileId);
      }
    }

    const hostsById = new Map<number, TjsHost>();
    for (const host of [...directHosts, ...managedHosts]) {
      hostsById.set(host.id, host);
    }

    return Array.from(hostsById.values());
  }

  // ── Host Members ──────────────────────────────────────────────────────

  private buildEventVisibilityScope(isMemberOnly: boolean): string[] {
    return isMemberOnly ? ['TJS', 'MEMBER_ONLY'] : ['TJS'];
  }

  private isEventMemberOnly(visibilityScope: unknown): boolean {
    return Array.isArray(visibilityScope) && visibilityScope.includes('MEMBER_ONLY');
  }

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

  /** Fetch all host members across all hosts. */
  async getAllHostMembers(): Promise<TjsHostMember[]> {
    const { data, error } = await this.adminSupabase
      .from('tjs_host_members')
      .select('*')
      .order('created_on', { ascending: false });
    if (error) {
      console.error('getAllHostMembers error:', error.message);
      return [];
    }
    return data as TjsHostMember[];
  }

  async getHostsForMember(profileId: string): Promise<Array<{ id: number; name: string | null; public_name: string | null }>> {
    const { data, error } = await this.adminSupabase
      .from('tjs_host_members')
      .select('host:tjs_hosts(id, name, public_name)')
      .eq('profile_id', profileId);

    if (error) {
      console.error('getHostsForMember error:', error.message);
      return [];
    }

    return ((data ?? []) as Array<{ host?: { id?: number; name?: string | null; public_name?: string | null } | null }>)
      .map((row) => row.host)
      .filter((host): host is { id: number; name: string | null; public_name: string | null } => typeof host?.id === 'number');
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

  async createHostEventFromRequest(
    requestId: string,
    createdBy: string,
    payload: CreateHostEventFromRequestPayload,
  ): Promise<{ eventId: string | null; error: string | null }> {
    const timestamp = new Date().toISOString();
    const [requestResult, artistsResult, editionOptions, eventTypeOptions] = await Promise.all([
      this.adminSupabase
        .from('tjs_artist_requests')
        .select('id, event_title, event_domain_id, description, teaser, long_teaser')
        .eq('id', requestId)
        .maybeSingle(),
      this.adminSupabase
        .from('tjs_artist_request_artists')
        .select('artist_id, invited_artist_id')
        .eq('request_id', requestId),
      this.listConcreteEventEditionOptions(),
      this.listEventTypeOptions(),
    ]);

    if (requestResult.error) {
      console.error('createHostEventFromRequest request lookup error:', requestResult.error.message);
      return { eventId: null, error: requestResult.error.message };
    }

    if (!requestResult.data) {
      return { eventId: null, error: 'Request not found.' };
    }

    if (artistsResult.error && !this.isMissingSchemaError(artistsResult.error)) {
      console.error('createHostEventFromRequest artists lookup error:', artistsResult.error.message);
      return { eventId: null, error: artistsResult.error.message };
    }

    const selectedEdition = editionOptions.find((item) => item.id === payload.editionId);
    const selectedEventType = eventTypeOptions.find((item) => item.id === payload.eventTypeId);
    const existingEventResult = await this.adminSupabase
      .from('tjs_events')
      .select('id, tjs_event_hosts!inner(host_id)')
      .eq('parent_event_id', requestId)
      .eq('event_type', 'EVENT_INSTANCE');

    if (existingEventResult.error && this.isMissingSchemaError(existingEventResult.error)) {
      return {
        eventId: null,
        error: 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and try again.',
      };
    }

    if (existingEventResult.error && !this.isMissingSchemaError(existingEventResult.error)) {
      console.error('createHostEventFromRequest existing event lookup error:', existingEventResult.error.message);
      return { eventId: null, error: existingEventResult.error.message };
    }

    const existingEventId = ((existingEventResult.data ?? []) as Array<{ id: string; tjs_event_hosts?: Array<{ host_id: number | null }> }>)
      .find((row) => (row.tjs_event_hosts ?? []).some((assignment) => assignment.host_id === payload.hostId))
      ?.id;

    if (existingEventId) {
      return { eventId: existingEventId, error: null };
    }

    let persistedLocationId: string | null = null;
    if (payload.locationId) {
      const publicLocation = await this.getPublicLocationById(payload.locationId);
      if (publicLocation) {
        persistedLocationId = payload.locationId;
      } else {
        const privateLocation = await this.getPrivateLocationById(payload.locationId, createdBy);
        const adminHostPrivateLocation = privateLocation
          ? privateLocation
          : (await this.getPrivateLocationsForHost(payload.hostId)).find((location) => location.id === payload.locationId) ?? null;

        if (!adminHostPrivateLocation) {
          return {
            eventId: null,
            error: 'The selected location could not be found. Choose a valid public or private location and try again.',
          };
        }
      }
    }

    const { error: requestUpdateError } = await this.adminSupabase
      .from('tjs_artist_requests')
      .update({
        event_domain_id: payload.eventDomainId,
        teaser: payload.teaser.trim() || null,
        long_teaser: payload.longTeaser.trim() || null,
        description: payload.description.trim() || null,
        updated_at: timestamp,
      })
      .eq('id', requestId);

    if (requestUpdateError) {
      if (this.isMissingSchemaError(requestUpdateError)) {
        return {
          eventId: null,
          error: 'Artist request tables are missing in the database. Run the request schema migrations and try again.',
        };
      }
      console.error('createHostEventFromRequest request update error:', requestUpdateError.message);
      return { eventId: null, error: requestUpdateError.message };
    }

    const { data: insertedEvent, error: insertEventError } = await this.adminSupabase
      .from('tjs_events')
      .insert({
        title: payload.title.trim() || requestResult.data.event_title || 'Untitled Event',
        description: payload.description.trim()
          || payload.longTeaser.trim()
          || payload.teaser.trim()
          || requestResult.data.description
          || requestResult.data.long_teaser
          || requestResult.data.teaser
          || null,
        event_type: 'EVENT_INSTANCE',
        status: payload.isActive ? 'APPROVED' : 'SELECTED',
        origin_website: 'TJS',
        visibility_scope: this.buildEventVisibilityScope(payload.isOpenToMembers),
        parent_event_id: requestId,
        created_by: createdBy,
        source: 'TJS',
        created_at: timestamp,
        updated_at: timestamp,
      })
      .select('id')
      .single();

    if (insertEventError || !insertedEvent?.id) {
      if (insertEventError && this.isMissingSchemaError(insertEventError)) {
        return {
          eventId: null,
          error: 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and try again.',
        };
      }
      console.error('createHostEventFromRequest event insert error:', insertEventError?.message);
      return { eventId: null, error: insertEventError?.message ?? 'Event could not be created.' };
    }

    const eventNotes = this.mergeStructuredHostNotes('', {
      edition: selectedEdition ? (selectedEdition.label ?? selectedEdition.name) : null,
      eventType: selectedEventType?.name ?? null,
      showTime: payload.showTime.trim() || null,
      callToActionUrl: payload.callToActionUrl.trim() || null,
      hostNotes: payload.notes.trim() || null,
      scheduleEntries: payload.entries,
    });

    const selectedDates = payload.entries.flatMap((entry) =>
      entry.mode === 'period'
        ? [entry.startDate, entry.endDate].filter(Boolean)
        : [entry.startDate].filter(Boolean)
    );

    const { error: hostAssignmentError } = await this.adminSupabase
      .from('tjs_event_hosts')
      .insert({
        event_id: insertedEvent.id,
        host_id: payload.hostId,
        selected_dates: selectedDates,
        location_id: persistedLocationId,
        host_status: 'CONFIRMED',
        selected_at: timestamp,
        notes: eventNotes || null,
      });

    if (hostAssignmentError) {
      if (this.isMissingSchemaError(hostAssignmentError)) {
        return {
          eventId: null,
          error: 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and try again.',
        };
      }
      console.error('createHostEventFromRequest host assignment error:', hostAssignmentError.message);
      return { eventId: null, error: hostAssignmentError.message };
    }

    const uniqueArtistIds = Array.from(
      new Set(
        ((artistsResult.data ?? []) as Array<{ artist_id: string | null; invited_artist_id: string | null }>)
          .flatMap((artist) => [artist.artist_id, artist.invited_artist_id])
          .filter((value): value is string => !!value)
      )
    );

    if (uniqueArtistIds.length > 0) {
      const { error: artistInsertError } = await this.adminSupabase
        .from('tjs_event_artists')
        .upsert(
          uniqueArtistIds.map((artistId, index) => ({
            event_id: insertedEvent.id,
            artist_id: artistId,
            role: index === 0 ? 'PRIMARY' : 'INVITED',
          })),
          { onConflict: 'event_id,artist_id,role' }
        );

      if (artistInsertError) {
        if (this.isMissingSchemaError(artistInsertError)) {
          return {
            eventId: null,
            error: 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and try again.',
          };
        }
        console.error('createHostEventFromRequest artist assignment error:', artistInsertError.message);
        return { eventId: null, error: artistInsertError.message };
      }
    }

    await this.addArtistWorkspaceRequestComment(
      requestId,
      createdBy,
      `[EVENT_CREATED]\nEvent created from request.\nEvent ID: ${insertedEvent.id}`
    );

    return { eventId: insertedEvent.id, error: null };
  }

  async createStandaloneHostEvent(
    createdBy: string,
    payload: CreateStandaloneHostEventPayload,
  ): Promise<{ eventId: string | null; error: string | null }> {
    const timestamp = new Date().toISOString();
    const accessibleHosts = await this.getAccessibleHosts(createdBy);
    const allowedHostIds = new Set(accessibleHosts.map((host) => host.id));

    if (!allowedHostIds.has(payload.hostId)) {
      return { eventId: null, error: 'You do not have access to the selected host.' };
    }

    const [editionOptions, eventTypeOptions] = await Promise.all([
      this.listConcreteEventEditionOptions(),
      this.listEventTypeOptions(),
    ]);
    const eventDomains = await this.listEventDomains();

    const selectedEdition = editionOptions.find((item) => item.id === payload.editionId) ?? null;
    const selectedEventType = eventTypeOptions.find((item) => item.id === payload.eventTypeId) ?? null;
    const selectedEventDomain = eventDomains.find((item) => item.id === payload.eventDomainId) ?? null;
    const selectedHost = accessibleHosts.find((host) => host.id === payload.hostId) ?? null;
    const automaticComment = `Host Manager Comment: Event created on behalf of ${selectedHost?.public_name || selectedHost?.name || `Host #${payload.hostId}`}.`;
    const mergedHostNotes = [payload.notes.trim(), automaticComment].filter(Boolean).join('\n');

    const privateLocations = await this.getPrivateLocationsForHost(payload.hostId);
    let persistedLocationId: string | null = null;
    for (const [index, entry] of payload.entries.entries()) {
      if (!entry.locationId) {
        return {
          eventId: null,
          error: `Schedule entry ${index + 1} requires a location.`,
        };
      }

      const publicLocation = await this.getPublicLocationById(entry.locationId);
      if (publicLocation) {
        if (index === 0) {
          persistedLocationId = entry.locationId;
        }
        continue;
      }

      const privateLocation = privateLocations.find((location) => location.id === entry.locationId) ?? null;
      if (!privateLocation) {
        return {
          eventId: null,
          error: 'The selected location could not be found. Choose a valid public or private location and try again.',
        };
      }
    }

    const { data: insertedEvent, error: insertEventError } = await this.adminSupabase
      .from('tjs_events')
      .insert({
        title: payload.title.trim() || 'Untitled Event',
        description: payload.teaser.trim() || payload.description.trim() || null,
        event_type: 'EVENT_INSTANCE',
        status: payload.isPublished ? 'APPROVED' : 'SELECTED',
        origin_website: 'TJS',
        visibility_scope: this.buildEventVisibilityScope(payload.isMemberOnly),
        parent_event_id: null,
        created_by: createdBy,
        source: 'TJS',
        created_at: timestamp,
        updated_at: timestamp,
      })
      .select('id')
      .single();

    if (insertEventError || !insertedEvent?.id) {
      if (insertEventError && this.isMissingSchemaError(insertEventError)) {
        return {
          eventId: null,
          error: 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and try again.',
        };
      }

      return { eventId: null, error: insertEventError?.message ?? 'Event could not be created.' };
    }

    const baseEventNotes = this.mergeStructuredHostNotes('', {
      eventDomain: selectedEventDomain?.name ?? null,
      edition: selectedEdition?.label ?? selectedEdition?.name ?? null,
      eventType: selectedEventType?.name ?? null,
      showTime: payload.entries[0]?.showTime?.trim() || null,
      eventImageUrl: payload.imageUrl,
      callToActionUrl: payload.callToActionUrl.trim() || null,
      hostNotes: mergedHostNotes || null,
      scheduleEntries: payload.entries,
    });
    const extraLines: string[] = [];
    if (payload.additionalInstruments.length > 0) {
      extraLines.push(`Additional Instruments: ${payload.additionalInstruments.join(', ')}`);
    }
    const mediaLines = payload.mediaEntries
      .filter((item) => item.name.trim() || item.url.trim() || item.image_url)
      .map((item) => `- ${item.media_type} | ${item.name.trim() || 'Untitled media'} | ${item.url.trim() || 'No link'} | ${item.image_url || 'No image'}`);
    if (mediaLines.length > 0) {
      extraLines.push('Media:');
      extraLines.push(...mediaLines);
    }
    const eventNotes = [baseEventNotes, ...extraLines].filter(Boolean).join('\n');

    const selectedDates = payload.entries.flatMap((entry) =>
      entry.mode === 'period'
        ? [entry.startDate, entry.endDate].filter(Boolean)
        : [entry.startDate].filter(Boolean)
    );

    const { error: hostAssignmentError } = await this.adminSupabase
      .from('tjs_event_hosts')
      .insert({
        event_id: insertedEvent.id,
        host_id: payload.hostId,
        selected_dates: selectedDates,
        location_id: persistedLocationId,
        host_status: 'CONFIRMED',
        selected_at: timestamp,
        notes: eventNotes || null,
      });

    if (hostAssignmentError) {
      if (this.isMissingSchemaError(hostAssignmentError)) {
        return {
          eventId: null,
          error: 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and try again.',
        };
      }

      return { eventId: null, error: hostAssignmentError.message };
    }

    const { error: artistInsertError } = await this.adminSupabase
      .from('tjs_event_artists')
      .upsert(
        payload.artistIds.map((artistId, index) => ({
          event_id: insertedEvent.id,
          artist_id: artistId,
          role: index === 0 ? 'PRIMARY' : 'INVITED',
        })),
        { onConflict: 'event_id,artist_id,role' }
      );

    if (artistInsertError) {
      if (this.isMissingSchemaError(artistInsertError)) {
        return {
          eventId: null,
          error: 'Host event tables are missing in the database. Run db/023_host_event_tables.sql and try again.',
        };
      }

      return { eventId: null, error: artistInsertError.message };
    }

    return { eventId: insertedEvent.id, error: null };
  }

  private normalizeArtistRequestStatus(status: string | null): string {
    switch ((status ?? '').toLowerCase()) {
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'accepted':
      case 'selected':
        return 'accepted_by_host';
      case 'available':
        return 'accepted_by_host';
      case 'pending':
      default:
        return 'new_request';
    }
  }

  private mapBaseRequestStatus(status: string | null): ArtistRequestListItem['status'] {
    switch ((status ?? '').toLowerCase()) {
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'selected':
      case 'accepted':
      case 'available':
        return 'accepted_by_host';
      case 'pending':
      default:
        return 'new_request';
    }
  }

  private mapArtistWorkflowStatusToDb(
    status: ArtistRequestDetail['status'] | ArtistRequestListItem['status'] | string | null
  ): 'pending' | 'approved' | 'rejected' {
    switch ((status ?? '').toLowerCase()) {
      case 'approved':
      case 'artist_accepted':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'new_request':
      case 'accepted_by_host':
      case 'host_proposed':
      case 'artist_proposed':
      case 'pending':
      default:
        return 'pending';
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

  async createPublicMember(input: CreatePublicMemberInput): Promise<{ user: TjsUserWithRoles | null; error: string | null }> {
    const email = input.email.trim().toLowerCase();
    const fullName = input.full_name.trim();
    if (!email || !fullName) {
      return { user: null, error: 'Email and full name are required.' };
    }

    const { userId, error: inviteError } = await this.inviteUser(
      email,
      fullName,
      this.getInviteRedirectUrl(),
    );

    if (inviteError || !userId) {
      return { user: null, error: inviteError ?? 'Failed to create public member.' };
    }

    const profileError = await this.upsertProfile({
      id: userId,
      email,
      full_name: fullName,
      phone: input.phone?.trim() || null,
      is_member: false,
      member_since: null,
      member_until: null,
    });

    if (profileError) {
      return { user: null, error: profileError };
    }

    const publicMemberRoleId = await this.getRoleIdByName('Public Member');
    if (!publicMemberRoleId) {
      return { user: null, error: 'Public Member role not found.' };
    }

    const roleError = await this.assignRole(userId, publicMemberRoleId, input.assigned_by);
    if (roleError) {
      return { user: null, error: roleError };
    }

    const users = await this.listAllUsersWithRoles();
    return {
      user: users.find((user) => user.id === userId) ?? null,
      error: null,
    };
  }

  async activatePublicMemberAccount(
    userId: string,
    fullName?: string | null,
  ): Promise<{ temporaryPassword: string | null; error: string | null }> {
    const users = await this.listAllUsersWithRoles();
    const user = users.find((candidate) => candidate.id === userId) ?? null;
    if (!user) {
      return { temporaryPassword: null, error: 'Public member account not found.' };
    }

    if (user.account_status === 'inactive') {
      const reactivationError = await this.reactivateUser(userId);
      if (reactivationError) {
        return { temporaryPassword: null, error: reactivationError };
      }
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const { error } = await this.adminSupabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
      email_confirm: true,
      ban_duration: 'none',
      user_metadata: {
        full_name: fullName?.trim() || undefined,
      },
    });

    if (error) {
      console.error('activatePublicMemberAccount error:', error.message);
      return { temporaryPassword: null, error: error.message };
    }

    return { temporaryPassword, error: null };
  }

  async resetManagedUserPassword(
    userId: string,
    fullName?: string | null,
  ): Promise<{ temporaryPassword: string | null; error: string | null }> {
    const temporaryPassword = this.generateTemporaryPassword();
    const { error } = await this.adminSupabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
      user_metadata: {
        full_name: fullName?.trim() || undefined,
      },
    });

    if (error) {
      console.error('resetManagedUserPassword error:', error.message);
      return { temporaryPassword: null, error: error.message };
    }

    return { temporaryPassword, error: null };
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

  private addOneMonth(paymentDate: string): string {
    const date = this.parseDateOnly(paymentDate);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
  }

  private addDays(paymentDate: string, days: number): string {
    const date = this.parseDateOnly(paymentDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private resolveMembershipExtensionBaseDate(paymentDate: string, currentExpiryDate: string | null): string {
    if (!currentExpiryDate) {
      return paymentDate;
    }

    return this.parseDateOnly(currentExpiryDate).getTime() > this.parseDateOnly(paymentDate).getTime()
      ? currentExpiryDate
      : paymentDate;
  }

  private async recalculateMembershipProfile(userId: string, actorUserId: string): Promise<string | null> {
    const { data: remainingPayments, error: paymentsError } = await this.adminSupabase
      .from('tjs_membership_payments')
      .select('payment_date, expires_at')
      .eq('profile_id', userId)
      .order('payment_date', { ascending: true });

    if (paymentsError) {
      console.error('recalculateMembershipProfile payments error:', paymentsError.message);
      return paymentsError.message;
    }

    const payments = (remainingPayments ?? []) as Array<{ payment_date: string; expires_at: string }>;
    const latestExpiry = payments.reduce<string | null>((latest, payment) => {
      if (!latest) {
        return payment.expires_at;
      }

      return this.parseDateOnly(payment.expires_at).getTime() > this.parseDateOnly(latest).getTime()
        ? payment.expires_at
        : latest;
    }, null);

    const memberSince = payments.length > 0 ? payments[0].payment_date : null;
    const shouldBeActive = latestExpiry !== null
      && this.parseDateOnly(latestExpiry).getTime() >= this.parseDateOnly(this.todayDateString()).getTime();

    const { error: profileError } = await this.adminSupabase
      .from('tjs_profiles')
      .update({
        is_member: shouldBeActive,
        member_since: shouldBeActive ? memberSince : null,
        member_until: latestExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('recalculateMembershipProfile profile error:', profileError.message);
      return profileError.message;
    }

    const roleError = await this.syncMemberRoleState(userId, shouldBeActive, actorUserId);
    if (roleError) {
      return roleError;
    }

    return null;
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
    if (row.activation_status === 'inactive') {
      return 'inactive';
    }

    if (row.activation_status === 'active') {
      return 'active';
    }

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

  private generateTemporaryPassword(length = 16): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.getRandomValues) {
      const fallback = Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
      return `Tjs!${fallback}`;
    }

    const randomValues = new Uint32Array(length);
    cryptoApi.getRandomValues(randomValues);
    const generated = Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join('');
    return `Tjs!${generated}`;
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

  private extractNoteValue(notes: string | null | undefined, prefix: string): string | null {
    if (!notes) {
      return null;
    }

    return notes
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith(prefix))
      ?.replace(prefix, '')
      .trim() ?? null;
  }

  private extractTaggedNumberValue(notes: string | null | undefined, prefix: string): number | null {
    const value = this.extractNoteValue(notes, prefix);
    if (!value) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private extractAdditionalInstruments(notes: string | null | undefined): string[] {
    const value = this.extractNoteValue(notes, 'Additional Instruments:');
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private extractPrimaryScheduleLocationLabel(notes: string | null | undefined): string | null {
    const scheduleLine = (notes ?? '')
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('- Day Show |') || line.startsWith('- Period |'));

    if (!scheduleLine) {
      return null;
    }

    const segments = scheduleLine.replace(/^- /, '').split('|').map((item) => item.trim());
    return segments.length >= 4 ? segments.slice(3).join(' | ') : null;
  }

  private extractScheduleLineLocationLabel(scheduleLine: string | null | undefined): string | null {
    if (!scheduleLine) {
      return null;
    }

    const lastSeparatorIndex = scheduleLine.lastIndexOf('|');
    if (lastSeparatorIndex < 0) {
      return null;
    }

    const label = scheduleLine.slice(lastSeparatorIndex + 1).trim();
    return label || null;
  }

  private extractMediaEntriesFromNotes(notes: string | null | undefined): Array<{
    media_type: string;
    image_url: string | null;
    name: string;
    description: string;
    url: string;
  }> {
    const lines = (notes ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const headerIndex = lines.findIndex((line) => line === 'Media:');
    if (headerIndex < 0) {
      return [];
    }

    return lines
      .slice(headerIndex + 1)
      .filter((line) => line.startsWith('- '))
      .map((line) => line.replace(/^- /, '').trim())
      .map((line) => {
        const [mediaType, name, url, imageUrl] = line.split('|').map((item) => item.trim());
        return {
          media_type: mediaType || 'Video',
          image_url: imageUrl && imageUrl !== 'No image' ? imageUrl : null,
          name: name || 'Untitled media',
          description: '',
          url: url && url !== 'No link' ? url : '',
        };
      });
  }

  private normalizeLocationComparisonValue(value: string | null | undefined): string | null {
    const normalized = value?.trim().toLowerCase() ?? '';
    return normalized || null;
  }

  private extractEventScheduleLines(
    notes: string | null | undefined,
    fallbackEntries: Array<{ mode: 'day_show' | 'period'; start_date: string; end_date: string }>,
  ): string[] {
    const lines = (notes ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const headerIndex = lines.findIndex((line) => line === 'Event Schedule:');

    if (headerIndex >= 0) {
      return lines
        .slice(headerIndex + 1)
        .filter((line) => line.startsWith('- '))
        .map((line) => line.replace(/^- /, '').trim())
        .map((line) => {
          const [typeLabel, dateLabel, timeLabel, ...locationParts] = line.split('|').map((item) => item.trim());
          const locationLabel = locationParts.join(' | ');
          const normalizedDateLabel = typeLabel.toLowerCase() === 'period'
            ? dateLabel.replace(' to ', ' - ')
            : dateLabel;

          return `${normalizedDateLabel} : ${timeLabel || 'Time TBA'} | ${locationLabel || 'Location TBA'}`;
        });
    }

    const showTime = this.extractNoteValue(notes, 'Show Time:') || 'Time TBA';
    const locationLabel = this.extractPrimaryScheduleLocationLabel(notes) || 'Location TBA';

    return fallbackEntries.map((entry) => {
      const entryShowTime = ('show_time' in entry && entry.show_time) ? entry.show_time : showTime;
      const entryLocationLabel = ('location_label' in entry && entry.location_label) ? entry.location_label : locationLabel;
      const dateLabel = entry.mode === 'period'
        ? `${entry.start_date} - ${entry.end_date || 'TBD'}`
        : entry.start_date;

      return `${dateLabel} : ${entryShowTime || 'Time TBA'} | ${entryLocationLabel || 'Location TBA'}`;
    });
  }

  private extractFreeformHostNotes(notes: string | null | undefined): string {
    return (notes ?? '')
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => {
        const trimmed = line.trim();
        return !!trimmed
          && !trimmed.startsWith('Event Domain:')
          && !trimmed.startsWith('Edition:')
          && !trimmed.startsWith('Event Type:')
          && !trimmed.startsWith('Show Time:')
          && !trimmed.startsWith('Event Image:')
          && !trimmed.startsWith('Call to Action URL:')
          && !trimmed.startsWith('Additional Instruments:')
          && !trimmed.startsWith('Media:')
          && !trimmed.startsWith('[COMMENT]')
          && !trimmed.startsWith('[SCHEDULE]')
          && !trimmed.startsWith('- ');
      })
      .join('\n')
      .trim();
  }

  private mergeStructuredHostNotes(
    existingNotes: string | null | undefined,
    values: {
      eventDomain?: string | null;
      edition: string | null;
      eventType: string | null;
      showTime: string | null;
      eventImageUrl?: string | null;
      callToActionUrl?: string | null;
      hostNotes: string | null;
      scheduleEntries?: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string; showTime?: string; locationLabel?: string }> | null;
    },
  ): string {
    const filteredLines = (existingNotes ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line)
      .filter((line) =>
        !line.startsWith('Event Domain:')
        && !line.startsWith('Edition:')
        && !line.startsWith('Event Type:')
        && !line.startsWith('Show Time:')
        && !line.startsWith('Event Image:')
        && !line.startsWith('Call to Action URL:')
        && !line.startsWith('[COMMENT]')
        && (values.scheduleEntries === undefined || !line.startsWith('[SCHEDULE]'))
      );

    const structuredLines = [
      values.eventDomain ? `Event Domain: ${values.eventDomain}` : null,
      values.edition ? `Edition: ${values.edition}` : null,
      values.eventType ? `Event Type: ${values.eventType}` : null,
      values.showTime ? `Show Time: ${values.showTime}` : null,
      values.eventImageUrl ? `Event Image: ${values.eventImageUrl}` : null,
      values.callToActionUrl ? `Call to Action URL: ${values.callToActionUrl}` : null,
      ...((values.scheduleEntries ?? []).map((entry) =>
        `[SCHEDULE] ${entry.mode}|${entry.startDate}|${entry.endDate || ''}|${entry.showTime || ''}|${entry.locationLabel || ''}`
      )),
    ].filter((line): line is string => !!line);

    const hasHostNotesInput = values.hostNotes !== null && values.hostNotes !== undefined;
    const freeformText = values.hostNotes?.trim() ?? '';
    const freeformLines = hasHostNotesInput
      ? (freeformText ? freeformText.split('\n').map((line) => line.trimEnd()) : [])
      : filteredLines;

    return [...structuredLines, ...freeformLines]
      .filter((line) => !!line.trim())
      .join('\n');
  }

  private extractScheduleEntries(
    notes: string | null | undefined,
    fallbackDates: string[] | null | undefined,
  ): Array<{ mode: 'day_show' | 'period'; start_date: string; end_date: string; show_time?: string; location_label?: string }> {
    const noteEntries = (notes ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('[SCHEDULE]'))
      .map((line) => line.replace('[SCHEDULE]', '').trim())
      .map((line) => {
        const [mode, startDate, endDate, showTime, locationLabel] = line.split('|').map((part) => part.trim());
        if (!startDate) {
          return null;
        }

        return {
          mode: mode === 'period' ? 'period' as const : 'day_show' as const,
          start_date: startDate,
          end_date: mode === 'period' ? (endDate || '') : '',
          show_time: showTime || '',
          location_label: locationLabel || '',
        };
      })
      .filter((entry) => entry !== null) as Array<{ mode: 'day_show' | 'period'; start_date: string; end_date: string; show_time?: string; location_label?: string }>;

    if (noteEntries.length > 0) {
      return noteEntries;
    }

    const dates = (fallbackDates ?? []).filter(Boolean);
    if (dates.length === 0) {
      return [];
    }

    if (dates.length > 1) {
      return [{
        mode: 'period',
        start_date: dates[0],
        end_date: dates[1] ?? '',
        show_time: '',
        location_label: '',
      }];
    }

    return [{
      mode: 'day_show',
      start_date: dates[0],
      end_date: '',
      show_time: '',
      location_label: '',
    }];
  }

  private expandScheduleEntryDates(entry: { mode: 'day_show' | 'period'; start_date: string; end_date: string }): string[] {
    if (!entry.start_date) {
      return [];
    }

    const start = new Date(`${entry.start_date}T00:00:00`);
    const endLabel = entry.mode === 'period' ? (entry.end_date || entry.start_date) : entry.start_date;
    const end = new Date(`${endLabel}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return [entry.start_date];
    }

    const dates: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  }

  private pickPrimaryUpcomingDate(selectedDates: string[] | null | undefined): string | null {
    const dates = (selectedDates ?? [])
      .filter((value): value is string => !!value)
      .slice()
      .sort((a, b) => a.localeCompare(b));

    if (dates.length === 0) {
      return null;
    }

    const today = new Date().toISOString().slice(0, 10);
    return dates.find((date) => date >= today) ?? dates[0];
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
