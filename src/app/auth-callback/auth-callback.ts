import { Component, OnInit, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { type EmailOtpType } from '@supabase/supabase-js';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

type PageState = 'loading' | 'set-password' | 'success' | 'error';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [NgIf, NgClass, NgFor, FormsModule],
  templateUrl: './auth-callback.html',
})
export class AuthCallback implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  state: PageState = 'loading';
  errorMessage = '';
  isSaving = false;
  showPassword = false;
  showConfirm = false;

  newPassword = '';
  confirmPassword = '';

  get loginRoute(): string {
    return this.route.snapshot.data['loginRoute'] ?? '/admin';
  }

  get successRoute(): string | null {
    return this.route.snapshot.data['successRoute'] ?? null;
  }

  get activationTitle(): string {
    return this.route.snapshot.data['activationTitle'] ?? 'Activate Account';
  }

  get activationDescription(): string {
    return this.successRoute === '/backoffice/artist-dashboard'
      ? 'Choose a secure password to activate your artist workspace.'
      : 'Choose a secure password to activate your TJS account.';
  }

  get successDescription(): string {
    return this.successRoute === '/backoffice/artist-dashboard'
      ? 'Your artist account is active. Redirecting to your workspace...'
      : this.authService.isPublicMember || this.authService.hasValidMembership
        ? 'Your account is active. Redirecting to the visitor home page...'
        : 'Your account is active. Redirecting to your dashboard...';
  }

  async ngOnInit() {
    await this.initializeCallback();
    await this.waitForSession();
  }

  private async initializeCallback(): Promise<void> {
    const tokenHash = this.route.snapshot.queryParamMap.get('token_hash');
    const type = this.route.snapshot.queryParamMap.get('type');

    if (!tokenHash || !this.isSupportedOtpType(type)) {
      return;
    }

    const { error } = await this.supabaseService.verifyEmailOtpToken(tokenHash, type);
    if (error) {
      this.errorMessage = 'Le lien d invitation a expire ou est invalide. Veuillez contacter un administrateur.';
      this.state = 'error';
    }
  }

  private async waitForSession(attempts = 0): Promise<void> {
    if (this.state === 'error') {
      return;
    }

    const session = await this.supabaseService.getSession();
    if (session?.user) {
      this.state = 'set-password';
      return;
    }

    if (attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return this.waitForSession(attempts + 1);
    }

    this.errorMessage = 'Le lien d invitation a expire ou est invalide. Veuillez contacter un administrateur.';
    this.state = 'error';
  }

  private isSupportedOtpType(type: string | null): type is EmailOtpType {
    return (
      type === 'invite' ||
      type === 'recovery' ||
      type === 'signup' ||
      type === 'magiclink' ||
      type === 'email' ||
      type === 'email_change'
    );
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  get passwordStrength(): { score: number; label: string; color: string } {
    const password = this.newPassword;
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Faible', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Moyen', color: 'bg-yellow-400' };
    if (score === 3) return { score, label: 'Bien', color: 'bg-blue-500' };
    return { score, label: 'Fort', color: 'bg-green-500' };
  }

  async submitPassword() {
    this.errorMessage = '';

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isSaving = true;

    const err = await this.supabaseService.updateCurrentUserPassword(this.newPassword);
    if (err) {
      this.errorMessage = err;
      this.isSaving = false;
      return;
    }

    await this.authService.refreshCurrentUserData();
    await this.authService.waitForAuthReady();

    this.state = 'success';
    this.isSaving = false;

    setTimeout(() => this.router.navigate([this.redirectAfterPasswordUpdate()]), 2000);
  }

  goToLogin() {
    this.router.navigate([this.loginRoute]);
  }

  private redirectAfterPasswordUpdate(): string {
    if (this.successRoute) {
      return this.successRoute;
    }

    if (this.authService.isPublicMember || this.authService.hasValidMembership) {
      return '/';
    }

    return this.authService.getPostLoginRoute();
  }
}
