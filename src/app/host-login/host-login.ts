import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-host-login',
  imports: [SharedModule, RouterModule, FormsModule, NgIf],
  templateUrl: './host-login.html',
})
export class HostLogin {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);

  credentials = {
    email: '',
    password: '',
  };

  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showForgotPassword = false;
  resetEmail = '';
  resetError = '';
  resetSuccess = '';
  isResetting = false;

  get isHostPlusLogin(): boolean {
    return this.route.snapshot.data['hostPlusLogin'] === true;
  }

  get portalTitle(): string {
    return this.isHostPlusLogin ? 'Host+ Portal' : 'Host Portal';
  }

  get portalSubtitle(): string {
    return this.isHostPlusLogin
      ? 'Sign in to manage your Host+ events and settings'
      : 'Welcome back! Sign in to manage your events';
  }

  get emailPlaceholder(): string {
    return this.isHostPlusLogin ? 'hostplus@example.com' : 'host@example.com';
  }

  get submitLabel(): string {
    return this.isHostPlusLogin ? 'Sign in to Host+ Portal' : 'Sign in to Host Portal';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.credentials.email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const result = await this.authService.signIn(
      this.credentials.email,
      this.credentials.password
    );

    if (result.success) {
      await this.authService.waitForAuthReady();

      const isHost = this.authService.hasAnyRole(['Host', 'Host+']);
      const isHostPlus = this.authService.hasRole('Host+');
      const isHostManager = this.authService.isHostManager;

      if (this.isHostPlusLogin) {
        if (!isHostPlus || isHostManager) {
          await this.authService.signOut();
          this.errorMessage = 'This login is for Host+ users only.';
          this.isLoading = false;
          return;
        }

        this.router.navigate(['/backoffice/host-plus/home']);
        this.isLoading = false;
        return;
      }

      if (!isHost || isHostManager) {
        await this.authService.signOut();
        this.errorMessage = 'This login is for hosts only.';
        this.isLoading = false;
        return;
      }

      this.router.navigate([isHostPlus ? '/backoffice/host-plus/home' : '/backoffice/host/dashboard']);
    } else {
      this.errorMessage = this.mapError(result.error);
    }

    this.isLoading = false;
  }

  async onForgotPassword() {
    if (!this.resetEmail) {
      this.resetError = 'Please enter your email address.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.resetEmail)) {
      this.resetError = 'Please enter a valid email address.';
      return;
    }

    this.isResetting = true;
    this.resetError = '';
    this.resetSuccess = '';

    const redirectTo = `${window.location.origin}/auth/callback`;
    const error = await this.supabase.sendPasswordResetEmail(this.resetEmail, redirectTo);

    if (error) {
      this.resetError = 'Failed to send reset email. Please try again.';
    } else {
      this.resetSuccess = 'Password reset link sent! Check your email.';
      setTimeout(() => {
        this.showForgotPassword = false;
        this.resetEmail = '';
        this.resetError = '';
        this.resetSuccess = '';
      }, 3000);
    }

    this.isResetting = false;
  }

  private mapError(error: string | null): string {
    if (!error) return 'An unexpected error occurred.';
    if (error.toLowerCase().includes('invalid login') || error.toLowerCase().includes('invalid credentials')) {
      return 'Invalid email or password.';
    }
    if (error.toLowerCase().includes('email not confirmed')) {
      return 'Your email address has not been confirmed yet.';
    }
    if (error.toLowerCase().includes('too many requests')) {
      return 'Too many attempts. Please wait a few minutes.';
    }
    return error;
  }
}
