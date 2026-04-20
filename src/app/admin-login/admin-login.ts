import { Component, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-admin-login',
  imports: [SharedModule, RouterModule, FormsModule, NgIf],
  templateUrl: './admin-login.html',
})
export class AdminLogin {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

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
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.credentials.email)) {
      this.errorMessage = 'Veuillez entrer une adresse email valide.';
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
      this.router.navigate([this.authService.getPostLoginRoute()]);
    } else {
      this.errorMessage = this.mapError(result.error);
    }

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
      this.forgotError = 'Veuillez entrer votre adresse email.';
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
      this.forgotMessage = 'Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.';
    }
    this.forgotLoading = false;
  }

  private mapError(error: string | null): string {
    if (!error) return 'Une erreur est survenue.';
    if (error.toLowerCase().includes('invalid login') || error.toLowerCase().includes('invalid credentials')) {
      return 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.';
    }
    if (error.toLowerCase().includes('email not confirmed')) {
      return 'Votre adresse email n\'a pas encore été confirmée.';
    }
    if (error.toLowerCase().includes('too many requests')) {
      return 'Trop de tentatives. Veuillez patienter quelques minutes.';
    }
    return error;
  }
}
