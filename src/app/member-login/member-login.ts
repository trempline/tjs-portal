import { Component, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-member-login',
  imports: [SharedModule, RouterModule, FormsModule, NgIf],
  templateUrl: './member-login.html',
})
export class MemberLogin {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  credentials = {
    email: '',
    password: '',
  };

  isLoading = false;
  errorMessage = '';
  showPassword = false;

  showForgotPassword = false;
  forgotEmail = '';
  forgotLoading = false;
  forgotMessage = '';
  forgotError = '';

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const result = await this.authService.signIn(
      this.credentials.email,
      this.credentials.password
    );

    if (!result.success) {
      this.errorMessage = this.mapError(result.error);
      this.isLoading = false;
      return;
    }

    await this.authService.waitForAuthReady();
    if (!this.authService.isPublicMember && !this.authService.hasValidMembership) {
      await this.supabaseService.signOut();
      this.errorMessage = 'This login is only for TJS members.';
      this.isLoading = false;
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')?.trim();
    await this.router.navigateByUrl(returnUrl || '/events');
    this.isLoading = false;
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    this.forgotEmail = this.credentials.email;
    this.forgotMessage = '';
    this.forgotError = '';
  }

  async onForgotPassword() {
    if (!this.forgotEmail) {
      this.forgotError = 'Please enter your email address.';
      return;
    }

    this.forgotLoading = true;
    this.forgotError = '';
    this.forgotMessage = '';
    const redirectTo = `${window.location.origin}/auth/callback`;
    const error = await this.supabaseService.sendPasswordResetEmail(this.forgotEmail, redirectTo);
    if (error) {
      this.forgotError = error;
    } else {
      this.forgotMessage = 'A reset email has been sent to your inbox.';
    }
    this.forgotLoading = false;
  }

  private mapError(error: string | null): string {
    if (!error) return 'Unable to sign in.';
    if (error.toLowerCase().includes('invalid login') || error.toLowerCase().includes('invalid credentials')) {
      return 'Incorrect email or password.';
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
