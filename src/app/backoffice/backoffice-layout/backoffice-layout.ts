import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { MembershipNotification, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [RouterModule, NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './backoffice-layout.html',
})
export class BackofficeLayout implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private sub?: Subscription;

  sidebarCollapsed = false;
  displayName = 'Admin';
  avatarLetter = 'A';
  userEmail = '';
  userRoles: string[] = [];
  isAdmin = false;
  isHost = false;
  isHostManager = false;
  isCommitteeMember = false;
  isArtist = false;
  membershipNotification: MembershipNotification | null = null;

  expandedMenus: Set<string> = new Set();

  // Change password
  showChangePasswordModal = false;
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = '';
  isSavingPassword = false;

  private initialRedirectDone = false;

  ngOnInit() {
    this.sub = this.authService.state$.subscribe(state => {
      this.displayName = this.authService.displayName;
      this.avatarLetter = this.authService.avatarLetter;
      this.userEmail = state.user?.email ?? '';
      this.userRoles = state.roles.map(r => r.name);
      this.isAdmin = this.authService.isAdmin;
      this.isCommitteeMember = this.authService.isCommitteeMember;
      this.isArtist = this.authService.isArtist;
      this.isHostManager = state.roles.some(
        r => r.name === 'Host Manager'
      );
      this.isHost = state.roles.some(
        r => r.name === 'Host' || r.name === 'Host+' || r.name === 'Host Manager'
      );

      // Redirect scoped workspaces to their entry points on first load.
      if (!this.initialRedirectDone && !state.isLoading && this.isCommitteeMember && !this.isAdmin) {
        this.initialRedirectDone = true;
        const currentUrl = this.router.url;
        if (currentUrl === '/backoffice' || currentUrl === '/backoffice/dashboard') {
          this.router.navigate(['/backoffice/committee-dashboard']);
        }
      } else if (!this.initialRedirectDone && !state.isLoading && this.isHost && !this.isAdmin) {
        this.initialRedirectDone = true;
        const currentUrl = this.router.url;
        if (currentUrl === '/backoffice' || currentUrl === '/backoffice/dashboard') {
          this.router.navigate(['/backoffice/my-hosts']);
        }
      } else if (!this.initialRedirectDone && !state.isLoading && this.isArtist && !this.isAdmin && !this.isCommitteeMember && !this.isHost) {
        this.initialRedirectDone = true;
        const currentUrl = this.router.url;
        if (currentUrl === '/backoffice' || currentUrl === '/backoffice/dashboard') {
          this.router.navigate(['/backoffice/artist-dashboard']);
        }
      }
      if (!this.initialRedirectDone && !state.isLoading) {
        this.initialRedirectDone = true;
      }

      void this.loadMembershipNotification();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  get workspaceLabel(): string {
    if (this.isAdmin) {
      return 'Admin';
    }

    if (this.isCommitteeMember) {
      return 'Committee Workspace';
    }

    if (this.isArtist) {
      return 'Artist Workspace';
    }

    return 'Host Workspace';
  }

  get workspaceHeaderLabel(): string {
    if (this.isAdmin) {
      return 'Administration';
    }

    if (this.isCommitteeMember) {
      return 'Committee Workspace';
    }

    if (this.isArtist) {
      return 'Artist Workspace';
    }

    return 'Host Workspace';
  }

  toggleSubmenu(label: string) {
    if (this.expandedMenus.has(label)) {
      this.expandedMenus.delete(label);
    } else {
      this.expandedMenus.add(label);
    }
  }

  isExpanded(label: string): boolean {
    return this.expandedMenus.has(label);
  }

  async logout() {
    await this.authService.signOut();
  }

  get isMembershipGated(): boolean {
    return this.authService.isMembershipGated;
  }

  get showMembershipBanner(): boolean {
    return !!this.membershipNotification || this.isMembershipGated;
  }

  get membershipBannerTone(): string {
    return this.isMembershipGated
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-blue-200 bg-blue-50 text-blue-800';
  }

  get membershipBannerTitle(): string {
    if (this.isMembershipGated) {
      return this.authService.membershipStatus === 'expired'
        ? 'Membership expired'
        : 'Membership required';
    }

    return this.membershipNotification?.subject ?? 'Membership update';
  }

  get membershipBannerBody(): string {
    if (this.membershipNotification) {
      return this.membershipNotification.body;
    }

    if (this.authService.membershipStatus === 'expired') {
      return 'Your workspace access is suspended until an admin records your renewal payment.';
    }

    return 'Your workspace access will open as soon as an admin records your first membership payment.';
  }

  async dismissMembershipNotification() {
    if (!this.membershipNotification) {
      return;
    }

    await this.supabase.markMembershipNotificationRead(this.membershipNotification.id);
    this.membershipNotification = null;
  }

  // ── Change password ──────────────────────────────────────────────────

  openChangePasswordModal() {
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.passwordSuccess = '';
    this.showChangePasswordModal = true;
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal = false;
  }

  async submitChangePassword() {
    this.passwordError = '';
    if (!this.newPassword || this.newPassword.length < 6) {
      this.passwordError = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isSavingPassword = true;
    const err = await this.supabase.updateCurrentUserPassword(this.newPassword);
    if (err) {
      this.passwordError = err;
    } else {
      this.passwordSuccess = 'Mot de passe mis à jour avec succès.';
      setTimeout(() => {
        this.showChangePasswordModal = false;
        this.passwordSuccess = '';
      }, 2000);
    }
    this.isSavingPassword = false;
  }

  private async loadMembershipNotification() {
    if (!this.authService.isAuthenticated || this.isAdmin) {
      this.membershipNotification = null;
      return;
    }

    this.membershipNotification = await this.supabase.getLatestMembershipNotification();
  }
}
