import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-host-login',
  imports: [SharedModule, RouterModule, FormsModule, NgIf],
  templateUrl: './host-login.html',
})
export class HostLogin {
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials = {
    email: '',
    password: '',
  };

  isLoading = false;
  errorMessage = '';
  showPassword = false;

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
      const isHostManager = this.authService.isHostManager;

      if (!isHost || isHostManager) {
        await this.authService.signOut();
        this.errorMessage = 'This login is for hosts only.';
        this.isLoading = false;
        return;
      }

      this.router.navigate(['/backoffice/host/dashboard']);
    } else {
      this.errorMessage = this.mapError(result.error);
    }

    this.isLoading = false;
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
