import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { SupabaseService, TjsProfile, TjsRole } from './supabase.service';

export interface AuthState {
  user: User | null;
  profile: TjsProfile | null;
  roles: TjsRole[];
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private membershipRefreshHandle?: number;

  private authState$ = new BehaviorSubject<AuthState>({
    user: null,
    profile: null,
    roles: [],
    isLoading: true,
  });

  constructor() {
    this.init();

    if (typeof window !== 'undefined') {
      this.membershipRefreshHandle = window.setInterval(() => {
        void this.refreshCurrentUserData();
      }, 60 * 60 * 1000);
    }
  }

  private async init() {
    // Restore session on page load
    const session = await this.supabaseService.getSession();
    if (session?.user) {
      await this.loadUserData(session.user);
    } else {
      this.authState$.next({ user: null, profile: null, roles: [], isLoading: false });
    }

    // Keep state in sync with Supabase auth changes
    this.supabaseService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.authState$.next({ user: null, profile: null, roles: [], isLoading: false });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // silently refresh — no need to re-fetch profile
        const current = this.authState$.getValue();
        this.authState$.next({ ...current, user: session.user });
      }
    });
  }

  private async loadUserData(user: User) {
    await this.supabaseService.syncExpiredMemberships();
    this.authState$.next({ user, profile: null, roles: [], isLoading: true });

    const [profile, roles] = await Promise.all([
      this.supabaseService.getProfile(user.id),
      this.supabaseService.getUserRoles(user.id),
    ]);

    this.authState$.next({ user, profile, roles, isLoading: false });
  }

  // ── Public API ──────────────────────────────────────────────────────────

  get state$(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  get currentState(): AuthState {
    return this.authState$.getValue();
  }

  get isAuthenticated(): boolean {
    return !!this.authState$.getValue().user;
  }

  get currentUser(): User | null {
    return this.authState$.getValue().user;
  }

  get currentProfile(): TjsProfile | null {
    return this.authState$.getValue().profile;
  }

  get currentRoles(): TjsRole[] {
    return this.authState$.getValue().roles;
  }

  hasRole(roleName: string): boolean {
    return this.authState$.getValue().roles.some(
      r => r.name.toLowerCase() === roleName.toLowerCase()
    );
  }

  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some((roleName) => this.hasRole(roleName));
  }

  get isAdmin(): boolean {
    return this.hasRole('admin');
  }

  get isCommitteeMember(): boolean {
    return this.hasRole('Committee Member');
  }

  get isHostManager(): boolean {
    return this.hasRole('Host Manager');
  }

  get isArtist(): boolean {
    return this.hasAnyRole(['Artist', 'Artist Invited']);
  }

  get isPublicMember(): boolean {
    return this.hasAnyRole(['Public Member', 'Member']);
  }

  get isInvitedArtist(): boolean {
    return this.hasRole('Artist Invited') && !this.hasRole('Artist');
  }

  get hasValidMembership(): boolean {
    const profile = this.currentProfile;
    if (!profile?.is_member) {
      return false;
    }

    if (!profile.member_until) {
      return true;
    }

    return new Date(`${profile.member_until}T00:00:00`).getTime() >= new Date().setHours(0, 0, 0, 0);
  }

  get requiresMembershipForWorkspace(): boolean {
    return this.hasRole('Member') && !this.isAdmin && !this.isCommitteeMember;
  }

  get isMembershipGated(): boolean {
    return this.requiresMembershipForWorkspace && !this.hasValidMembership;
  }

  get membershipStatus(): 'active' | 'expired' | 'non-member' {
    const profile = this.currentProfile;
    if (!profile?.is_member) {
      return 'non-member';
    }

    return this.hasValidMembership ? 'active' : 'expired';
  }

  async refreshCurrentUserData(): Promise<void> {
    const user = this.currentUser;
    if (!user) {
      return;
    }

    await this.loadUserData(user);
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error: string | null }> {
    const result = await this.supabaseService.signIn(email, password);
    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.user) {
      await this.loadUserData(result.user);
    }

    return { success: true, error: null };
  }

  async signOut(): Promise<void> {
    const logoutRoute = this.isCommitteeMember
      ? '/committee-login'
      : this.isPublicMember
        ? '/member-login'
      : this.isHostManager
        ? '/host-manager-login'
        : this.hasAnyRole(['Host', 'Host+'])
          ? '/host-login'
          : this.isArtist
            ? '/artist-login'
            : '/admin';

    await this.supabaseService.signOut();
    this.router.navigate([logoutRoute]);
  }

  async waitForAuthReady(maxAttempts = 50, delayMs = 100): Promise<void> {
    let attempts = 0;
    while (this.authState$.getValue().isLoading && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempts++;
    }
  }

  getPostLoginRoute(): string {
    const roleNames = this.currentRoles.map((role) => role.name.toLowerCase());

    // Committee Member gets their own dedicated dashboard
    if (roleNames.includes('committee member')) {
      return '/backoffice/committee-dashboard';
    }

    // Host Manager gets their own dedicated dashboard
    if (roleNames.includes('host manager')) {
      return '/backoffice/host-manager';
    }

    if (roleNames.includes('host') || roleNames.includes('host+')) {
      return '/backoffice/host/dashboard';
    }

    if (roleNames.includes('artist') || roleNames.includes('artist invited')) {
      return '/backoffice/artist-dashboard';
    }

    return '/backoffice/dashboard';
  }

  /** Handy display name: full_name → email prefix → 'Admin' */
  get displayName(): string {
    const state = this.authState$.getValue();
    if (state.profile?.full_name) return state.profile.full_name;
    if (state.user?.email) return state.user.email.split('@')[0];
    return 'Admin';
  }

  /** First letter for the avatar circle */
  get avatarLetter(): string {
    return this.displayName.charAt(0).toUpperCase();
  }
}
