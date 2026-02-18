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

  private authState$ = new BehaviorSubject<AuthState>({
    user: null,
    profile: null,
    roles: [],
    isLoading: true,
  });

  constructor() {
    this.init();
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

  get isAdmin(): boolean {
    return this.hasRole('admin');
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error: string | null }> {
    const result = await this.supabaseService.signIn(email, password);
    if (result.error) {
      return { success: false, error: result.error };
    }
    // loadUserData will be triggered by onAuthStateChange SIGNED_IN
    return { success: true, error: null };
  }

  async signOut(): Promise<void> {
    await this.supabaseService.signOut();
    this.router.navigate(['/admin']);
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
