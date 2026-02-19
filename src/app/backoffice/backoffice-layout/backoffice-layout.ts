import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [RouterModule, NgIf, NgFor, FormsModule],
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
      this.isHost = state.roles.some(
        r => r.name === 'Host' || r.name === 'Host+'
      );

      // Redirect host users to my-hosts on first load
      if (!this.initialRedirectDone && !state.isLoading && this.isHost && !this.isAdmin) {
        this.initialRedirectDone = true;
        const currentUrl = this.router.url;
        if (currentUrl === '/backoffice' || currentUrl === '/backoffice/dashboard') {
          this.router.navigate(['/backoffice/my-hosts']);
        }
      }
      if (!this.initialRedirectDone && !state.isLoading) {
        this.initialRedirectDone = true;
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
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
}
